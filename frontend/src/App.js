import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App font-sans text-gray-900 bg-gray-50 flex flex-col min-h-screen">
        <Routes>
          <Route path="/" element={<Landing />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
