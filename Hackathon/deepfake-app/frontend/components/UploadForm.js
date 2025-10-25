import { useState } from 'react'

export default function UploadForm({ onResult }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null)

  // Use local Next.js serverless API by default (works on Vercel when deployed)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    setFile(selectedFile)
    
    if (selectedFile) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!file) return setError('Please select an image file')

    // Send a base64 data URL to the Next.js API route to avoid multipart parsing
    try {
      setLoading(true)
      const body = JSON.stringify({ image: preview })
      const res = await fetch(`${apiUrl}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'API error')
      }
      const json = await res.json()
      onResult(json)
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-2 border-dashed border-gray-400 rounded-xl p-8 text-center hover:border-purple-400 transition">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          {preview ? (
            <div className="space-y-4">
              <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-lg" />
              <p className="text-white">Click to change image</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-6xl">📷</div>
              <div>
                <p className="text-white text-lg font-semibold">Click to upload an image</p>
                <p className="text-gray-300 text-sm">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          )}
        </label>
      </div>

      {error && (
        <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !file}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-xl text-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition duration-300 shadow-xl"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analyzing...
          </span>
        ) : (
          'Detect Deepfake'
        )}
      </button>
    </form>
  )
}
