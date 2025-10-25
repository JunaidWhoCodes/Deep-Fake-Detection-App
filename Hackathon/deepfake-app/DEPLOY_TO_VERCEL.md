Deploying this project to Vercel

Goal
----
Deploy the Next.js frontend and serverless API (/api/predict) to Vercel directly from this repository with minimal setup.

What I changed to make this work
--------------------------------
- Implemented a Next.js API route at `frontend/pages/api/predict.js` that provides the demo deepfake heuristics in Node using `jimp`.
- Updated `frontend/components/UploadForm.js` to POST the image as a base64 data URL to `/api/predict`.
- Added `jimp` to `frontend/package.json`.
- Added `vercel.json` at repo root to help Vercel build the Next.js app in the `frontend` subfolder.

How to deploy (minimal clicks)
------------------------------
1. Push this repository to GitHub (or a Git provider supported by Vercel).
2. Visit https://vercel.com/new and import the repository.
3. During the import, set the "Root Directory" (Project Settings) to `frontend` if prompted. If the import UI does not expose a root-dir field, use the "Framework" detection — it should detect a Next.js project from `frontend/package.json`.
4. No special environment variables are required for the serverless demo. (If you plan to use the Python backend instead, you'll need to host it elsewhere and set NEXT_PUBLIC_API_URL accordingly.)
5. Click Deploy.

Notes and caveats
-----------------
- The serverless API uses `jimp` for image processing. It's intentionally lightweight to be compatible with Vercel serverless functions. It is a demo heuristic and not a production-grade ML model.
- If you prefer the Python FastAPI backend (in `backend/`), Vercel is not a good fit for heavy Python + OpenCV + numpy workloads. Instead, deploy the Python backend to Render, Fly, or a VM, then set `NEXT_PUBLIC_API_URL` in Vercel to point the frontend to that backend.
- If you want me to (a) push to GitHub, or (b) actually perform the Vercel deployment for you, I will need credentials/access tokens, which you must supply (not recommended in chat). Alternatively, you can grant me access via a GitHub repository or provide a Vercel project invite — I cannot deploy without network access and proper auth from you.

Troubleshooting
---------------
- If the API returns `Unsupported image format`, ensure the frontend is sending `preview` (a data URL) to the API. The UploadForm already sends a data URL by default.
- If you hit function timeouts for large images, add client-side resizing before upload or set serverless memory/time adjustments in Vercel project settings (may require a Pro plan).

If you'd like, I can:
- Create a GitHub-compatible remote (prepare a push command and exact steps) so you can click-to-deploy.
- Create a tiny GitHub Action/CI that pushes to Vercel automatically when you push to main (requires Vercel token).

Tell me which of the above you want next (I can prepare files / instructions).