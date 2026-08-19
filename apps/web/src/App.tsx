import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import ProblemDetailPage from './pages/ProblemDetailPage';
import NewProblemPage from './pages/NewProblemPage';
import { ProtectedRoute } from './auth/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FeedPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/problems/new"
          element={
            <ProtectedRoute>
              <NewProblemPage />
            </ProtectedRoute>
          }
        />
        <Route path="/problems/:id" element={<ProblemDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
