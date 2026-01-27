import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import Home from './Home';
import Profile from './Profile';
import Goals from './Goals';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function App() {
  return (
    <Router>
      <div className="App">
        <nav style={{
          backgroundColor: '#282c34',
          padding: '15px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'center',
          gap: '20px'
        }}>
          <Link
            to="/"
            style={{
              color: 'white',
              textDecoration: 'none',
              padding: '10px 20px',
              backgroundColor: '#61dafb',
              borderRadius: '5px',
              fontWeight: 'bold'
            }}
          >
            Home
          </Link>
          <Link
            to="/profile"
            style={{
              color: 'white',
              textDecoration: 'none',
              padding: '10px 20px',
              backgroundColor: '#61dafb',
              borderRadius: '5px',
              fontWeight: 'bold'
            }}
          >
            Profile
          </Link>
          <Link
            to="/goals"
            style={{
              color: 'white',
              textDecoration: 'none',
              padding: '10px 20px',
              backgroundColor: '#61dafb',
              borderRadius: '5px',
              fontWeight: 'bold'
            }}
          >
            Goals
          </Link>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/goals" element={<Goals />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;