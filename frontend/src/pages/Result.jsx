import { useLocation, useNavigate } from 'react-router-dom';

export default function Result() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) {
    navigate('/upload', { replace: true });
    return null;
  }

  const { imageUrl, disease, confidence, description, suggestions } = state;

  return (
    <div className="card">
      <h1 className="mb-4 text-2xl font-semibold">Prediction Result</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <img
            src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${imageUrl}`}
            alt="Leaf"
            className="w-full rounded object-cover shadow"
          />
        </div>
        <div className="space-y-3">
          <p className="text-lg">
            Disease: <span className="font-semibold text-green-700">{disease}</span>
          </p>
          <p className="text-lg">
            Confidence: <span className="font-semibold">{Math.round(confidence * 100)}%</span>
          </p>
          <div>
            <p className="mb-1 font-semibold">Description</p>
            <p className="text-sm text-gray-700">{description}</p>
          </div>
          <div>
            <p className="mb-1 font-semibold">Suggested Actions</p>
            <ul className="list-inside list-disc text-sm text-gray-700">
              {Array.isArray(suggestions) &&
                suggestions.map((s, i) => (
                  <li key={i} className="mb-0.5">
                    {s}
                  </li>
                ))}
            </ul>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/upload')}>
            Analyze another image
          </button>
        </div>
      </div>
    </div>
  );
}