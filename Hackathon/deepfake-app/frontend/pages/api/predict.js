import Jimp from 'jimp'

// Simple heuristic deepfake detection implemented in Node/Javascript
// This is a lightweight replacement for the Python backend so the app can
// be deployed to Vercel as a single repository (frontend + serverless API).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { image } = req.body || {}
    if (!image) return res.status(400).json({ error: 'No image provided' })

    // image expected as data URL (data:image/png;base64,...)
    const matches = image.match(/^data:(image\/(png|jpeg|jpg));base64,(.+)$/)
    let buffer
    if (matches) {
      buffer = Buffer.from(matches[3], 'base64')
    } else if (/^[A-Za-z0-9+/=]+$/.test(image)) {
      // if raw base64 provided
      buffer = Buffer.from(image, 'base64')
    } else {
      return res.status(400).json({ error: 'Unsupported image format' })
    }

    const img = await Jimp.read(buffer)
    const { width, height, data } = img.bitmap // data is RGBA
    const numPixels = width * height

    // Helper: get grayscale value
    const getGray = (idx) => {
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      return 0.299 * r + 0.587 * g + 0.114 * b
    }

    // 1) compression_score: mean absolute diff between neighbors
    let diffSumH = 0
    let diffSumV = 0
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const gray = getGray(i)
        if (x + 1 < width) {
          const i2 = (y * width + (x + 1)) * 4
          diffSumH += Math.abs(gray - getGray(i2))
        }
        if (y + 1 < height) {
          const i3 = ((y + 1) * width + x) * 4
          diffSumV += Math.abs(gray - getGray(i3))
        }
      }
    }
    const avgDiffH = diffSumH / (numPixels || 1)
    const avgDiffV = diffSumV / (numPixels || 1)
    const compressionScore = (avgDiffH + avgDiffV) / 2

    // 2) noise: std dev of (pixel - local mean)
    // compute local mean using simple 3x3 box filter
    let deviations = []
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0
        let count = 0
        for (let oy = -1; oy <= 1; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            const nx = x + ox
            const ny = y + oy
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const ni = (ny * width + nx) * 4
              sum += getGray(ni)
              count++
            }
          }
        }
        const i = (y * width + x) * 4
        const gray = getGray(i)
        const localMean = sum / count
        deviations.push(gray - localMean)
      }
    }
    const meanDev = deviations.reduce((a, b) => a + b, 0) / deviations.length
    const variance = deviations.reduce((a, b) => a + Math.pow(b - meanDev, 2), 0) / deviations.length
    const noise = Math.sqrt(variance)

    // 3) color histogram std
    const histR = new Array(256).fill(0)
    const histG = new Array(256).fill(0)
    const histB = new Array(256).fill(0)
    for (let i = 0; i < data.length; i += 4) {
      histR[data[i]]++
      histG[data[i + 1]]++
      histB[data[i + 2]]++
    }
    const std = (arr) => {
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length
      return Math.sqrt(arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length)
    }
    const histStd = (std(histR) + std(histG) + std(histB)) / 3

    // 4) edge density approximate via simple gradient
    let edgeCount = 0
    for (let y = 0; y < height - 1; y++) {
      for (let x = 0; x < width - 1; x++) {
        const i = (y * width + x) * 4
        const gx = getGray(i) - getGray((y * width + (x + 1)) * 4)
        const gy = getGray(i) - getGray(((y + 1) * width + x) * 4)
        const mag = Math.sqrt(gx * gx + gy * gy)
        if (mag > 25) edgeCount++
      }
    }
    const edgeDensity = edgeCount / (numPixels || 1)

    // 5) resolution check
    const pow2 = [256, 512, 1024, 2048]
    const resolutionIndicator = (pow2.includes(width) || pow2.includes(height))

    // Scoring (mirrors the python heuristics in spirit)
    let realIndicators = 0
    let fakeIndicators = 0

    // compression (high -> real)
    if (compressionScore > 12) realIndicators += 1.5
    else if (compressionScore < 4) fakeIndicators += 0.8

    // noise
    if (noise > 7 && noise < 30) realIndicators += 1
    else if (noise < 5) fakeIndicators += 0.8

    // color hist
    if (histStd > 90) realIndicators += 0.4
    else if (histStd < 25) fakeIndicators += 0.4

    // edge density
    if (edgeDensity > 0.015 && edgeDensity < 0.18) realIndicators += 1
    else if (edgeDensity < 0.008 || edgeDensity > 0.22) fakeIndicators += 0.5

    // resolution
    if (resolutionIndicator) fakeIndicators += 0.4
    else realIndicators += 0.6

    const total = realIndicators + fakeIndicators
    let prediction = 'Real'
    let confidence = 0.5
    if (total === 0) {
      prediction = 'Real'
      confidence = 0.5
    } else {
      const realScore = realIndicators / total
      if (realScore > 0.52) {
        prediction = 'Real'
        confidence = Math.min(0.58 + (realScore - 0.52) * 0.9, 0.9)
      } else if (realScore < 0.48) {
        prediction = 'Fake'
        confidence = Math.min(0.58 + (0.48 - realScore) * 0.9, 0.9)
      } else {
        prediction = 'Real'
        confidence = 0.56
      }
      confidence = Math.round(confidence * 100) / 100
    }

    return res.status(200).json({ prediction, confidence, note: 'Serverless demo heuristics (not ML)' })
  } catch (err) {
    console.error('predict error', err)
    return res.status(500).json({ error: String(err) })
  }
}
