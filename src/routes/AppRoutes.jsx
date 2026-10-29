import { Routes, Route, Navigate } from 'react-router-dom'
import { PrivateRoute } from './PrivateRoute'
import { AppLayout } from '../layouts/AppLayout'
import Dashboard from '../pages/Dashboard'
import FinanceIA from '../pages/FinanceIA'
import PossoComprar from '../pages/PossoComprar'
import Receitas from '../pages/Receitas'
import Despesas from '../pages/Despesas'
import Cartoes from '../pages/Cartoes'
import Compras from '../pages/Compras'
import Recorrentes from '../pages/Recorrentes'
import Orcamentos from '../pages/Orcamentos'
import Metas from '../pages/Metas'
import Relatorios from '../pages/Relatorios'
import Importar from '../pages/Importar' // <-- IMPORTADO AQUI
import Configuracoes from '../pages/Configuracoes'
import Login from '../pages/auth/Login'
import Cadastro from '../pages/auth/Cadastro'
import RecuperarSenha from '../pages/auth/RecuperarSenha'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/recuperar-senha" element={<RecuperarSenha />} />

      <Route path="/" element={<PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>} />
      <Route path="/finance-ia" element={<PrivateRoute><AppLayout><FinanceIA /></AppLayout></PrivateRoute>} />
      <Route path="/posso-comprar" element={<PrivateRoute><AppLayout><PossoComprar /></AppLayout></PrivateRoute>} />
      <Route path="/receitas" element={<PrivateRoute><AppLayout><Receitas /></AppLayout></PrivateRoute>} />
      <Route path="/despesas" element={<PrivateRoute><AppLayout><Despesas /></AppLayout></PrivateRoute>} />
      <Route path="/cartoes" element={<PrivateRoute><AppLayout><Cartoes /></AppLayout></PrivateRoute>} />
      <Route path="/compras" element={<PrivateRoute><AppLayout><Compras /></AppLayout></PrivateRoute>} />
      <Route path="/recorrentes" element={<PrivateRoute><AppLayout><Recorrentes /></AppLayout></PrivateRoute>} />
      <Route path="/orcamentos" element={<PrivateRoute><AppLayout><Orcamentos /></AppLayout></PrivateRoute>} />
      <Route path="/metas" element={<PrivateRoute><AppLayout><Metas /></AppLayout></PrivateRoute>} />
      <Route path="/relatorios" element={<PrivateRoute><AppLayout><Relatorios /></AppLayout></PrivateRoute>} />
      <Route path="/importar" element={<PrivateRoute><AppLayout><Importar /></AppLayout></PrivateRoute>} />
      <Route path="/configuracoes" element={<PrivateRoute><AppLayout><Configuracoes /></AppLayout></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
