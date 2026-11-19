import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { DateProvider } from './contexts/DateContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import { AppRoutes } from './routes/AppRoutes'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <DateProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </DateProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
