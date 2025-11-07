import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Loader from '../components/Loader.jsx';

export default function Upload() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [preview, setPreview] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingPredict, setLoadingPredict] = useState(false);
  const [err, setErr] = useState('');

  const onFileChange = async (e) => {
    setErr('');
    setImageUrl('');
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    const form = new FormData();
    form.append('image', file);
    setLoadingUpload(true);
    try {
      // FIXED: Removed Content-Type header - let browser handle it automatically
      const { data } = await api.post('/api/upload', form);
      setImageUrl(data.imageUrl);
    } catch (e) {
      setErr(e?.response?.data?.message || 'Upload failed');
      setPreview('');
    } finally {
      setLoadingUpload(false);
    }
  };

  const onPredict = async () => {
    if (!imageUrl) {
      setErr('Please upload an image first.');
      return;
    }
    setErr('');
    setLoadingPredict(true);
    try {
      const { data } = await api.post('/api/predict', { imageUrl });
      navigate('/result', { state: { ...data } });
    } catch (e) {
      setErr(e?.response?.data?.message || 'Prediction failed');
    } finally {
      setLoadingPredict(false);
    }
  };

  return (
    <div className="card">
      <h1 className="mb-4 text-2xl font-semibold">Upload Plant Leaf Image</h1>

      <div className="space-y-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg"
          onChange={onFileChange}
          className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-green-600 file:px-4 file:py-2 file:text-white hover:file:bg-green-700"
        />

        {loadingUpload && <Loader label="Uploading image..." />}

        {preview && (
          <div className="flex items-start gap-6">
            <img src={preview} alt="Preview" className="h-48 w-48 rounded object-cover shadow" />
            <div className="flex flex-col gap-3">
              <button
                className="btn btn-primary w-48 disabled:opacity-50"
                onClick={onPredict}
                disabled={loadingPredict}
              >
                {loadingPredict ? <Loader label="Detecting..." /> : 'Detect Disease'}
              </button>
              {imageUrl && <p className="text-xs text-gray-500">Uploaded: {imageUrl}</p>}
            </div>
          </div>
        )}

        {err && <p className="text-sm text-red-600">{err}</p>}
      </div>
    </div>
  );
}