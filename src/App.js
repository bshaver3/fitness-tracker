import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { AuthProvider, useAuth } from './AuthContext';
import { ToastProvider } from './ToastContext';
import ProtectedRoute from './ProtectedRoute';
import Home from './Home';
import Profile from './Profile';
import Goals from './Goals';
import Insights from './Insights';
import Login from './Login';
import Signup from './Signup';
import { IconFlame } from './Icons';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/goals', label: 'Goals' },
  { to: '/insights', label: 'Insights' },
  { to: '/profile', label: 'Profile' },
];

function NavBar() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-brand-mark"><IconFlame /></span>
        <span>FitTrack</span>
      </div>
      {user && (
        <div className="navbar-links">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-link${location.pathname === item.to ? ' active' : ''}`}
              aria-current={location.pathname === item.to ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
          <button type="button" className="nav-signout" onClick={signOut}>
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}

function AppContent() {
  return (
    <Router>
      <div className="App">
        <NavBar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/goals" element={
            <ProtectedRoute>
              <Goals />
            </ProtectedRoute>
          } />
          <Route path="/insights" element={
            <ProtectedRoute>
              <Insights />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
