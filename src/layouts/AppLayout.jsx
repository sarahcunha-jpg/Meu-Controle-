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
  { to: '/cofrinho', label: 'Reserva de Contas' },
  { to: '/orcamentos', label: 'Orçamentos' },
  { to: '/metas', label: 'Cofrinho' },
  { to: '/relatorios', label: 'Relatórios' },
  { to: '/importar', label: 'Importar Extrato' },
  { to: '/ajuda', label: '💡 Guia de Uso' },
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors duration-300 relative">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 shadow-sm w-full">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-2xl text-slate-700 dark:text-slate-300" onClick={() => setOpen(!open)}>☰</button>
            <span className="font-black text-xl text-blue-600 dark:text-blue-400 tracking-tight">Meu Controle+</span>
            
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-xl p-1 ml-4">
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
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors bg-slate-100 dark:bg-slate-700 rounded-lg">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <span className="hidden lg:block">{user?.displayName || user?.email}</span>
            <button onClick={handleLogout} className="text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg">Sair</button>
          </div>
        </div>
      </header>

      <div className="flex-1 w-full max-w-7xl mx-auto flex relative">
        {open && <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setOpen(false)}></div>}

        <aside className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-800 md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:bg-transparent md:dark:bg-transparent md:z-0 transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} overflow-y-auto flex-shrink-0 border-r border-slate-200 dark:border-slate-700 md:border-none p-4`}>
          <div className="bg-white dark:bg-slate-800 md:rounded-2xl md:shadow-sm md:border md:border-slate-200 md:dark:border-slate-700 p-3 transition-colors">
            <nav className="flex flex-col gap-1">
              {links.map(l => (
                <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} end={l.to === '/'}
                  className={({ isActive }) => `px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}>
                  {l.label}
                </NavLink>
              ))}
              <div className="md:hidden border-t border-slate-200 dark:border-slate-700 mt-2 pt-2">
                <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50">Sair da Conta</button>
              </div>
            </nav>
          </div>
        </aside>

        <main className="flex-1 min-w-0 p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* BOTÃO FLUTUANTE (FAB) PARA NOVA DESPESA RÁPIDA */}
      <button 
        onClick={() => navigate('/despesas?novo=true')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center text-3xl font-light hover:bg-blue-700 hover:scale-105 transition-all z-40 print:hidden"
        title="Nova Despesa Rápida"
      >
        +
      </button>
    </div>
  )
}
