#!/usr/bin/env python3
import argparse
import json
import os
import sys

# Print Python version for debugging
print(f"DEBUG: Python version: {sys.version}", file=sys.stderr)
print(f"DEBUG: Script started", file=sys.stderr)

# Suppress TensorFlow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

try:
    import numpy as np
    print(f"DEBUG: numpy imported successfully", file=sys.stderr)
except Exception as e:
    print(json.dumps({"error": f"Failed to import numpy: {str(e)}"}))
    sys.exit(2)

try:
    from tensorflow import keras
    print(f"DEBUG: tensorflow.keras imported successfully", file=sys.stderr)
except Exception as e:
    print(json.dumps({"error": f"Failed to import tensorflow: {str(e)}"}))
    sys.exit(2)

try:
    from PIL import Image
    print(f"DEBUG: PIL imported successfully", file=sys.stderr)
except Exception as e:
    print(json.dumps({"error": f"Failed to import PIL: {str(e)}"}))
    sys.exit(2)

# -------------------------------
# CLASS NAMES (Must match training order)
# -------------------------------
CLASS_NAMES = [
    'Apple___Apple_scab',
    'Apple___Black_rot',
    'Apple___Cedar_apple_rust',
    'Apple___healthy',
    'Blueberry___healthy',
    'Cherry_(including_sour)___Powdery_mildew',
    'Cherry_(including_sour)___healthy',
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot',
    'Corn_(maize)___Common_rust_',
    'Corn_(maize)___Northern_Leaf_Blight',
    'Corn_(maize)___healthy',
    'Grape___Black_rot',
    'Grape___Esca_(Black_Measles)',
    'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)',
    'Grape___healthy',
    'Orange___Haunglongbing_(Citrus_greening)',
    'Peach___Bacterial_spot',
    'Peach___healthy',
    'Pepper,_bell___Bacterial_spot',
    'Pepper,_bell___healthy',
    'Potato___Early_blight',
    'Potato___Late_blight',
    'Potato___healthy',
    'Raspberry___healthy',
    'Soybean___healthy',
    'Squash___Powdery_mildew',
    'Strawberry___Leaf_scorch',
    'Strawberry___healthy',
    'Tomato___Bacterial_spot',
    'Tomato___Early_blight',
    'Tomato___Late_blight',
    'Tomato___Leaf_Mold',
    'Tomato___Septoria_leaf_spot',
    'Tomato___Spider_mites Two-spotted_spider_mite',
    'Tomato___Target_Spot',
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
    'Tomato___Tomato_mosaic_virus',
    'Tomato___healthy'
]

# -------------------------------
# MODEL PATH (Use only .h5)
# -------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, 'trained_model.h5')

print(f"DEBUG: Script directory: {SCRIPT_DIR}", file=sys.stderr)
print(f"DEBUG: Looking for model at: {MODEL_PATH}", file=sys.stderr)
print(f"DEBUG: Model exists: {os.path.exists(MODEL_PATH)}", file=sys.stderr)

_model = None

def load_model():
    """Load trained model once."""
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            error_msg = f"Model file not found at: {MODEL_PATH}"
            print(json.dumps({"error": error_msg}))
            sys.exit(2)
        try:
            print(f"DEBUG: Loading model from {MODEL_PATH}", file=sys.stderr)
            _model = keras.models.load_model(MODEL_PATH)
            print(f"DEBUG: Model loaded successfully", file=sys.stderr)
        except Exception as e:
            error_msg = f"Failed to load model: {str(e)}"
            print(json.dumps({"error": error_msg}))
            sys.exit(2)
    return _model


def preprocess_image(image_path, target_size=(128, 128)):
    """Preprocess image: resize, normalize, expand dims."""
    try:
        print(f"DEBUG: Opening image: {image_path}", file=sys.stderr)
        img = Image.open(image_path).convert('RGB')
        img = img.resize(target_size)
        arr = np.asarray(img, dtype=np.float32) / 255.0
        arr = np.expand_dims(arr, axis=0)
        print(f"DEBUG: Image preprocessed successfully", file=sys.stderr)
        return arr
    except Exception as e:
        error_msg = f"Failed to preprocess image: {str(e)}"
        print(json.dumps({"error": error_msg}))
        sys.exit(3)


def main():
    parser = argparse.ArgumentParser(description="Plant disease predictor")
    parser.add_argument("--image", type=str, required=True, help="Path to image file")
    args = parser.parse_args()

    image_path = args.image
    print(f"DEBUG: Image path argument: {image_path}", file=sys.stderr)

    if not os.path.exists(image_path):
        error_msg = f"Image not found: {image_path}"
        print(json.dumps({"error": error_msg}))
        sys.exit(1)

    try:
        model = load_model()
        inp = preprocess_image(image_path, target_size=(128, 128))  

        print(f"DEBUG: Making prediction...", file=sys.stderr)
        preds = model.predict(inp, verbose=0)

        if preds.ndim == 2:
            probs = preds[0]
        else:
            probs = np.array(preds).ravel()

        idx = int(np.argmax(probs))
        confidence = float(round(float(probs[idx]), 4))
        disease = CLASS_NAMES[idx] if idx < len(CLASS_NAMES) else f"class_{idx}"

        result = {
            "disease": disease,
            "confidence": confidence
        }
        print(f"DEBUG: Prediction complete: {disease} ({confidence})", file=sys.stderr)
        print(json.dumps(result))
        sys.exit(0)

    except Exception as e:
        error_msg = f"Prediction error: {str(e)}"
        print(json.dumps({"error": error_msg}))
        print(f"DEBUG: Exception details: {repr(e)}", file=sys.stderr)
        sys.exit(3)


if __name__ == "__main__":
    main()
