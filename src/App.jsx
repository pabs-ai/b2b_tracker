import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import MemberJournal from './pages/MemberJournal'
import InstructorLogin from './pages/InstructorLogin'
import './index.css'

export default function App() {
  return (
    <BrowserRouter basename="/b2b_tracker">
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<InstructorLogin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/member/:token" element={<MemberJournal />} />
      </Routes>
    </BrowserRouter>
  )
}
