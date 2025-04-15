import { useAuth } from '../../contexts/AuthContext'
import { Navigate, Outlet } from 'react-router-dom'

const AdminRoute = () => {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default AdminRoute