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
  { to: '/cofrinho', label: 'Cofrinho de Contas' },
  { to: '/orcamentos', label: 'Orçamentos' },
  { to: '/metas', label: 'Metas' },
  { to: '/relatorios', label: 'Relatórios' },
  { to: '/importar', label: 'Importar Extrato' },
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
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-2xl text-slate-700" onClick={() => setOpen(!open)}>☰</button>
            <span className="font-black text-xl text-blue-600 tracking-tight">Meu Controle+</span>
            
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1 ml-4">
              <select value={mes} onChange={e => setMes(Number(e.target.value))} className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer px-2">
                {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <span className="text-slate-300">|</span>
              <select value={ano} onChange={e => setAno(Number(e.target.value))} className="bg-transparent text-sm font-bold text-blue-600 outline-none cursor-pointer pl-2 pr-2">
                {[ano - 1, ano, ano + 1, ano + 2].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-600">
            <span>{user?.displayName || user?.email}</span>
            <button onClick={handleLogout} className="text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg transition-colors">Sair</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        <aside className={`${open ? 'block' : 'hidden'} md:block fixed md:static inset-0 md:inset-auto bg-white md:bg-transparent z-30 md:z-auto pt-16 md:pt-0 overflow-y-auto`}>
          <div className="bg-white md:rounded-2xl md:shadow-sm md:border md:border-slate-200 p-3 w-60 sticky top-24">
            <nav className="flex flex-col gap-1">
              {links.map(l => (
                <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} end={l.to === '/'}
                  className={({ isActive }) => `px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}>
                  {l.label}
                </NavLink>
              ))}
              <button onClick={handleLogout} className="md:hidden text-left px-4 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 mt-2">Sair</button>
            </nav>
          </div>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
