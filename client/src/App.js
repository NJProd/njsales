import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import CRM from './CRM';
import SpreadsheetPage from './SpreadsheetPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/crm" element={<CRM />} />
        <Route path="/sheet" element={<SpreadsheetPage />} />
      </Routes>
    </Router>
  );
}

export default App;
