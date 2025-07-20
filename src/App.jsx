import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Timeline from './components/Timeline/Timeline'
import AdminPanel from './components/Admin/AdminPanel'
import './App.css'

function App() {
  return (
    <div className="App">
      <Router basename="/life-v-log">
        <Routes>
          <Route path="/" element={<Timeline />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
