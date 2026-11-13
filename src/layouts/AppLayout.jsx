import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../services/authService'
import { useAuth } from '../hooks/useAuth'
import { useDate } from '../contexts/DateContext'
import { useTheme } from '../contexts/ThemeContext'
import { NotificationBell } from '../components/ui/NotificationBell'

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
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  async function handleLogout() { await logout(); navigate('/login') }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors duration-300">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 shadow-sm w-full transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-2xl text-slate-700 dark:text-slate-300" onClick={() => setOpen(!open)}>☰</button>
            <span className="font-black text-xl text-blue-600 dark:text-blue-400 tracking-tight">Meu Controle+</span>
            
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-xl p-1 ml-4 transition-colors">
              <select value={mes} onChange={e => setMes(Number(e.target.value))} className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer px-2">
                {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <span className="text-slate-300 dark:text-slate-500">|</span>
              <select value={ano} onChange={e => setAno(Number(e.target.value))} className="bg-transparent text-sm font-bold text-blue-600 dark:text-blue-400 outline-none cursor-pointer pl-2 pr-2">
                {[ano - 1, ano, ano + 1, ano + 2].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-300">
            <NotificationBell />
            
            {/* BOTÃO DE TEMA COM ÍCONE SVG */}
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors bg-slate-100 dark:bg-slate-700 rounded-lg" title="Alternar Tema">
              {theme === 'dark' ? (
                // Ícone de Sol (SVG)
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                // Ícone de Lua (SVG)
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            
            <span className="hidden lg:block">{user?.displayName || user?.email}</span>
            <button onClick={handleLogout} className="text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/20 dark:hover:bg-red-900/40 px-3 py-1.5 rounded-lg transition-colors">Sair</button>
          </div>
        </div>
      </header>

      <div className="flex-1 w-full max-w-7xl mx-auto flex">
        <aside className={`
          ${open ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 fixed md:sticky top-16 md:top-16 left-0 z-30 
          w-64 h-[calc(100vh-4rem)] bg-white dark:bg-slate-800 md:bg-transparent md:dark:bg-transparent border-r md:border-none border-slate-200 dark:border-slate-700
          transition-transform duration-300 ease-in-out p-4 overflow-y-auto flex-shrink-0
        `}>
          <div className="bg-white dark:bg-slate-800 md:rounded-2xl md:shadow-sm md:border md:border-slate-200 md:dark:border-slate-700 p-3 transition-colors">
            <nav className="flex flex-col gap-1">
              {links.map(l => (
                <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} end={l.to === '/'}
                  className={({ isActive }) => `px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}>
                  {l.label}
                </NavLink>
              ))}
              <button onClick={handleLogout} className="md:hidden text-left px-4 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 mt-2">Sair</button>
            </nav>
          </div>
        </aside>

        <main className="flex-1 min-w-0 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
