# Plant Disease Recognition System (MERN + Python)

Full‑stack web app to detect plant leaf diseases using an AI model (dummy predictor included for testing).

## Tech Stack

- Frontend: React + Vite, React Router, Axios, Tailwind CSS
- Backend: Node.js, Express.js, MongoDB (Mongoose), JWT Auth, Multer for uploads
- AI: Python script `backend/model/predict.py` (dummy), integrated via Node child_process

## Features

- Register/Login (JWT)
- Upload plant leaf image
- Detect disease (calls Python model)
- Displays disease, confidence, description, suggestions
- Stores predictions per user in MongoDB
- Serves uploaded images from `/uploads`

## Project Structure

```
plant-disease-detection/
├── backend/
│   ├── server.js
│   ├── config/db.js
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── model/predict.py
│   ├── uploads/.gitkeep
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── state/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   └── src/index.css
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.8+
- MongoDB running locally (or Atlas URI)
- pnpm/npm/yarn

### Backend Setup

1. Copy env file:
   ```
   cp backend/.env.example backend/.env
   ```
   Update `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL` if needed.

2. Install deps and run:
   ```
   cd backend
   npm install
   npm run dev
   ```
   Backend runs at `http://localhost:5000`.

### Frontend Setup

1. Create `.env` in frontend (optional):
   ```
   echo "VITE_API_URL=http://localhost:5000" > frontend/.env
   ```

2. Install deps and run:
   ```
   cd frontend
   npm install
   npm run dev
   ```
   Frontend runs at `http://localhost:5173`.

### Usage

1. Register a user at `/register`.
2. Login at `/login`.
3. Go to `/upload`, choose an image (JPEG/PNG).
4. Click "Detect Disease" to run prediction.
5. View result page with disease, confidence, description, and suggestions.

### Notes

- Current model is a dummy predictor returning random diseases. Replace `backend/model/predict.py` with a real model:
  - Load your TensorFlow/PyTorch model
  - Preprocess input image
  - Run inference and print JSON to stdout: `{"disease": "...", "confidence": 0.94}`

- Uploaded images are stored under `backend/uploads` and served via `http://localhost:5000/uploads/<filename>`.

- Protected routes require a valid JWT (`Authorization: Bearer <token>`). Frontend stores token in `localStorage`.

### API Endpoints

- POST `/api/auth/register` — { name, email, password }
- POST `/api/auth/login` — { email, password } ⇒ { token, user }
- POST `/api/upload` — multipart/form-data `image` ⇒ { imageUrl }
- POST `/api/predict` — { imageUrl } ⇒ { id, imageUrl, disease, confidence, description, suggestions }

### Security & Production

- Set strong `JWT_SECRET`
- Serve frontend via a production build and reverse proxy API
- Consider object storage (S3) for uploads
- Validate image content (MIME & magic bytes)
- Add rate limiting, request size limits, and helmet

### License

MIT