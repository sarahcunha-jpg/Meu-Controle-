import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { DateProvider } from './contexts/DateContext'
import { AppRoutes } from './routes/AppRoutes'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DateProvider>
          <AppRoutes />
        </DateProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
