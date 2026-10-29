import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-6 text-center text-gray-500">Carregando...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}
