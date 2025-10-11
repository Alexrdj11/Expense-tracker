import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import RequireAuth from './auth/RequireAuth'
import Login from './pages/Login'
import Register from './pages/Register'
import XP from './pages/XP'
import Expenses from './pages/Expenses'
import Import from './pages/Import'
import { JSX } from 'react'

export default function App(): JSX.Element {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<RequireAuth><XP /></RequireAuth>} />
          <Route path="/app" element={<RequireAuth><Expenses /></RequireAuth>} />
          <Route path="/import" element={<RequireAuth><Import /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}