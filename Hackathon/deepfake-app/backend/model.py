"""
Simple placeholder detector module.

This provides two functions:
- load_model(): returns a model-like object (here a placeholder)
- predict_image(img): accepts a PIL.Image and returns (label, confidence)

Replace these with real model loading and inference when ready.
"""
from typing import Tuple
import numpy as np
from PIL import Image, ImageStat


class PlaceholderModel:
    """A tiny heuristic-based detector for demo/testing only."""

    def predict(self, img: Image.Image) -> Tuple[str, float]:
        # Convert to grayscale and get variance of pixels.
        gray = img.convert("L")
        arr = np.asarray(gray).astype(np.float32) / 255.0
        var = float(np.var(arr))

        # Heuristic: very low variance (blurry / synthetic) => likely Fake
        # This is just a demo. Real models should be used in production.
        confidence = min(max((0.5 - var) * 2.0, 0.0), 1.0)
        label = "Fake" if var < 0.5 else "Real"
        # Tweak confidence mapping for realism
        confidence = round(confidence * 0.95 + 0.05, 4)
        return label, confidence


_model = None


def load_model():
    """Load or return the model. Replace with real model loading code.

    Example replacement (pseudo):
      import torch
      model = torch.load('xception_deepfake.pth')
      model.eval()
      return model
    """
    global _model
    if _model is None:
        _model = PlaceholderModel()
    return _model


def predict_image(img: Image.Image) -> Tuple[str, float]:
    model = load_model()
    return model.predict(img)
