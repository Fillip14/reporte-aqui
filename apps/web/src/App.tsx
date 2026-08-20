import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import ProblemDetailPage from './pages/ProblemDetailPage';
import NewProblemPage from './pages/NewProblemPage';
import { ProtectedRoute } from './auth/ProtectedRoute';
import NavBar from './components/NavBar';

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 py-8">
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
      </main>
    </BrowserRouter>
  );
}
