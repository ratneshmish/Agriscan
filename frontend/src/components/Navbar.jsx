import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow">
      <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
        <Link to="/" className="text-lg font-bold text-green-700">
          Plant Disease Recognition
        </Link>
        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-gray-600">Hi, {user?.name}</span>
              <Link to="/upload" className="text-sm text-green-700 hover:underline">
                Upload
              </Link>
              <button onClick={onLogout} className="btn btn-primary bg-red-600 hover:bg-red-700">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-green-700 hover:underline">
                Login
              </Link>
              <Link to="/register" className="text-sm text-green-700 hover:underline">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}