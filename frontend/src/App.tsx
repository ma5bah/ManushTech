import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import Login from '@/pages/Login';
import RetailerList from '@/pages/RetailerList';
import RetailerDetail from '@/pages/RetailerDetail';
import Admin from '@/pages/Admin';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={user?.role === 'Admin' ? '/admin' : '/retailers'} replace /> : <Login />} />
      <Route
        path="/retailers"
        element={
          <ProtectedRoute>
            <RetailerList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/retailers/:id"
        element={
          <ProtectedRoute>
            <RetailerDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="Admin">
            <Admin />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
