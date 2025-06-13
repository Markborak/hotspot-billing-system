import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CaptivePortal from './components/CaptivePortal';
import AdminPanel from './components/admin/AdminPanel';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Routes>
          <Route path="/" element={<CaptivePortal />} />
          <Route path="/admin/*" element={<AdminPanel />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;