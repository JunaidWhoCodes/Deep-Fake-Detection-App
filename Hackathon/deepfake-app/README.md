# Deepfake Image Detection Web App

This repo contains a minimal scaffold for a Deepfake Image Detection Web App:

- `frontend/` — Next.js + Tailwind app that lets users upload an image and shows prediction.
- `backend/` — FastAPI app exposing POST `/predict` that returns `{ prediction, confidence }`.

This scaffold uses a placeholder detector (simple heuristic) in `backend/model.py`. See the backend README to swap in a real pre-trained model (Xception or a Hugging Face model).

## Quick start (local)

1. Backend

   ```powershell
   cd backend
   python -m venv .venv; .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. Frontend

   ```powershell
   cd frontend
   npm install
   # Set NEXT_PUBLIC_API_URL to backend URL, e.g. http://localhost:8000
   $env:NEXT_PUBLIC_API_URL = 'http://localhost:8000'
   npm run dev
   ```

Open http://localhost:3000 to test.

## Next steps
- Replace the placeholder detector in `backend/model.py` with a real deepfake detection model (instructions in `backend/README.md`).
- Deploy frontend to Vercel and backend to Render or Hugging Face Spaces.

## Repository size and pushing

This repository intentionally avoids committing large build artifacts and environment folders. If you've cleaned the repository to reduce size, recreate the environments locally before running the app.

Restore steps (from `deepfake-app`):

1. Recreate backend venv and install Python deps:

   ```powershell
   cd backend
   python -m venv .venv; .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

2. Install frontend dependencies and run dev server:

   ```powershell
   cd frontend
   npm install
   $env:NEXT_PUBLIC_API_URL = 'http://localhost:8000'
   npm run dev
   ```

Or run the included setup helper from the repo root to walk through these steps interactively:

```powershell
cd deepfake-app
.\scripts\setup.ps1
```

If you use model weights that are large (for example `*.pt`, `*.h5`, `*.onnx`), keep them out of the repo and add a small downloader script or store them in cloud storage. This keeps the git repository small and pushable.
