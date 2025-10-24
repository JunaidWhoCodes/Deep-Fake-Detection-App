# Backend (FastAPI)

This folder contains a minimal FastAPI app that exposes POST `/predict` expecting multipart/form-data with field `file` (image). The endpoint returns JSON:

```json
{
  "prediction": "Fake",
  "confidence": 0.92
}
```

The included `model.py` uses a simple heuristic for demo/testing. To use a real model:

1. Install PyTorch or TensorFlow (depending on the model) and any required libs.
2. Replace `load_model()` and `predict_image()` in `model.py` to load your trained model (e.g., Xception) or a Hugging Face model.
3. Ensure model inference returns a label and a confidence score.

Deployment notes:
- Render: Deploy using the provided `Dockerfile` or using a Python environment and `uvicorn` command.
- Hugging Face Spaces: You can port the FastAPI logic into a Space using `gradio`/`fastapi` and their deployment guide.
