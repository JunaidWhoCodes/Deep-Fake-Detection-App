from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import os
import numpy as np
import cv2
import httpx

app = FastAPI(title="Deepfake Detection API")

# Configure CORS to support Vercel/Render
raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
)
allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
allow_credentials = False if "*" in allowed_origins else True

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

def analyze_image_balanced(img: Image.Image) -> tuple:
    """
    Balanced deepfake detection using computer vision.
    NOTE: This is a demonstration. Production systems require trained deep learning models.
    """
    # Convert to RGB
    img = img.convert('RGB')
    img_array = np.array(img)
    gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    
    # Initialize scores
    real_indicators = 0
    fake_indicators = 0
    
    # 1. Face Detection
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    
    has_face = len(faces) > 0
    
    if has_face:
        # Analyze face region
        (x, y, w, h) = faces[0]
        face_region = img_array[y:y+h, x:x+w]
        face_gray = cv2.cvtColor(face_region, cv2.COLOR_RGB2GRAY)
        
        # Check face sharpness (blurry = likely deepfake)
        laplacian_var = cv2.Laplacian(face_gray, cv2.CV_64F).var()
        # Calibrated thresholds
        if laplacian_var < 80:
            fake_indicators += 0.8
        elif laplacian_var > 150:
            real_indicators += 1
        else:
            real_indicators += 0.4
    
    # 2. JPEG Compression Artifacts (Real photos have these)
    # Calculate difference gradients
    diff_h = np.abs(np.diff(img_array.astype(float), axis=0)).mean()
    diff_v = np.abs(np.diff(img_array.astype(float), axis=1)).mean()
    compression_score = (diff_h + diff_v) / 2
    
    if compression_score > 12:  # Has natural compression
        real_indicators += 1.5  # Strong indicator of real photo
    elif compression_score < 4:  # Too smooth
        fake_indicators += 0.8
    
    # 3. Noise Pattern Analysis
    blur = cv2.GaussianBlur(img_array, (5,5), 0)
    noise = np.std(img_array.astype(float) - blur.astype(float))
    
    if 7 < noise < 30:  # Natural noise range (wider)
        real_indicators += 1
    elif noise < 5:  # Too perfect
        fake_indicators += 0.8
    
    # 4. Color Distribution
    for channel in range(3):
        hist = cv2.calcHist([img_array], [channel], None, [256], [0, 256])
        hist_std = np.std(hist)
        if hist_std > 90:  # Natural color variation
            real_indicators += 0.4
        elif hist_std < 25:  # Unnatural uniformity
            fake_indicators += 0.4
    
    # 5. Edge Analysis
    edges = cv2.Canny(gray, 100, 200)
    edge_density = np.sum(edges > 0) / edges.size
    
    if 0.015 < edge_density < 0.18:  # Natural edge density
        real_indicators += 1
    elif edge_density < 0.008 or edge_density > 0.22:
        fake_indicators += 0.5
    
    # 6. Resolution Check (GANs love powers of 2)
    width, height = img.size
    if width in [256, 512, 1024, 2048] or height in [256, 512, 1024, 2048]:
        fake_indicators += 0.4
    else:
        real_indicators += 0.6
    
    # Calculate final score
    total = real_indicators + fake_indicators
    if total == 0:
        return "Real", 0.50  # Neutral if uncertain
    
    real_score = real_indicators / total
    
    # Determine prediction
    if real_score > 0.52:
        prediction = "Real"
        confidence = min(0.58 + (real_score - 0.52) * 0.9, 0.9)
    elif real_score < 0.48:
        prediction = "Fake"
        confidence = min(0.58 + (0.48 - real_score) * 0.9, 0.9)
    else:
        # Very close - slight bias to Real for natural photos
        prediction = "Real"
        confidence = 0.56
    
    return prediction, round(confidence, 2)

async def _predict_local(contents: bytes):
    img = Image.open(io.BytesIO(contents))
    prediction, confidence = analyze_image_balanced(img)
    return {"prediction": prediction, "confidence": confidence, "note": "Demo tool - Production requires trained models"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Analyze uploaded image for deepfake detection.
    Uses computer vision heuristics - not a trained ML model.
    """
    try:
        contents = await file.read()
        # If a remote model URL is configured, try it first
        remote_url = os.getenv("BACKEND_REMOTE_MODEL_URL")
        if remote_url:
            try:
                async with httpx.AsyncClient(timeout=20.0) as client:
                    files = {"file": (file.filename or "image.jpg", contents, file.content_type or "image/jpeg")}
                    r = await client.post(remote_url, files=files)
                    if r.status_code == 200:
                        data = r.json()
                        # Expecting {prediction, confidence}
                        if isinstance(data, dict) and "prediction" in data and "confidence" in data:
                            return JSONResponse(data)
            except Exception:
                # Fallback to local if remote fails
                pass

        # Local prediction fallback
        data = await _predict_local(contents)
        return JSONResponse(data)
    except Exception as e:
        return JSONResponse(
            {"error": f"Failed to process image: {str(e)}"},
            status_code=400
        )

@app.get("/")
async def root():
    return {"message": "Deepfake Detection API - Send POST to /predict with image file"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
