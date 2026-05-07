import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './utils/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import Today from './pages/Today';
import Week from './pages/Week';
import Analytics from './pages/Analytics';
import Notes from './pages/Notes';
import Trackers from './pages/Trackers';
import TaskDetail from './pages/TaskDetail';
import AdminPanel from './pages/AdminPanel';
import Completed from './pages/Completed';
import Layout from './components/Layout';

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return null;

  if (!user) {
    return (
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*"         element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const isAdmin = user.role === 'admin' || user.role === 'parent';

  return (
    <Layout>
      <ErrorBoundary>
        <Routes>
          <Route path="/"           element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"  element={<Today />} />
          <Route path="/today"      element={<Navigate to="/dashboard" replace />} />
          <Route path="/week"       element={<Week />} />
          <Route path="/analytics"  element={<Analytics />} />
          <Route path="/notes"      element={<Notes />} />
          <Route path="/trackers"   element={<Trackers />} />
          <Route path="/completed"  element={<Completed />} />
          <Route path="/tasks/:id"  element={<TaskDetail />} />
          <Route path="/feedback"   element={<Navigate to="/notes" replace />} />
          <Route path="/balance"    element={<Navigate to="/analytics" replace />} />
          <Route path="/calendar"   element={<Navigate to="/week" replace />} />
          <Route path="/colleges"   element={<Navigate to="/trackers" replace />} />
          <Route path="/quarter"    element={<Navigate to="/dashboard" replace />} />
          <Route path="/master-plan" element={<Navigate to="/dashboard" replace />} />
          <Route path="/inventory"  element={<Navigate to="/week" replace />} />
          <Route
            path="/admin"
            element={isAdmin ? <AdminPanel /> : <Navigate to="/dashboard" replace />}
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ErrorBoundary>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
