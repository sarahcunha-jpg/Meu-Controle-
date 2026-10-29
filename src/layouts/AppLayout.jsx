import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../services/authService'
import { useAuth } from '../hooks/useAuth'
import { useDate } from '../contexts/DateContext'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/finance-ia', label: '🤖 Finance IA' },
  { to: '/posso-comprar', label: '🛒 Posso Comprar?' },
  { to: '/receitas', label: 'Receitas' },
  { to: '/despesas', label: 'Despesas' },
  { to: '/cartoes', label: 'Cartões' },
  { to: '/compras', label: 'Compras e Parcelas' },
  { to: '/recorrentes', label: 'Contas Recorrentes' },
  { to: '/orcamentos', label: 'Orçamentos' },
  { to: '/metas', label: 'Metas' },
  { to: '/relatorios', label: 'Relatórios' },
  { to: '/importar', label: 'Importar Extrato' }, // <-- ADICIONADO
  { to: '/configuracoes', label: 'Configurações' }
]

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export function AppLayout({ children }) {
  const { user } = useAuth()
  const { mes, setMes, ano, setAno } = useDate()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  async function handleLogout() { await logout(); navigate('/login') }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-2xl text-gray-700" onClick={() => setOpen(!open)}>☰</button>
            <span className="font-bold text-primary-700 hidden sm:block">Meu Controle+</span>
            
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <select value={mes} onChange={e => setMes(Number(e.target.value))} className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer">
                {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select value={ano} onChange={e => setAno(Number(e.target.value))} className="bg-transparent text-sm font-bold text-primary-700 outline-none cursor-pointer border-l border-gray-300 pl-2">
                {[ano - 1, ano, ano + 1, ano + 2].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4 text-sm text-gray-600">
            <span>{user?.displayName || user?.email}</span>
            <button onClick={handleLogout} className="text-red-600 hover:underline">Sair</button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-4 flex gap-4">
        <aside className={`${open ? 'block' : 'hidden'} md:block fixed md:static inset-0 md:inset-auto bg-white md:bg-transparent z-30 md:z-auto pt-14 md:pt-0 overflow-y-auto`}>
          <div className="bg-white md:rounded-xl md:shadow-sm md:border md:border-gray-100 p-2 w-56">
            <nav className="flex flex-col gap-1">
              {links.map(l => (
                <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} end={l.to === '/'}
                  className={({ isActive }) => `px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                  {l.label}
                </NavLink>
              ))}
              <button onClick={handleLogout} className="md:hidden text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50">Sair</button>
            </nav>
          </div>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
