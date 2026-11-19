import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useDate } from '../../contexts/DateContext'
import { observarOrcamentos } from '../../services/orcamentosService'
import { observarCartoes } from '../../services/cartoesService'
import { observarParcelas } from '../../services/comprasService'
import { observarDespesas } from '../../services/despesasService'
import { limiteUsadoCartao, filtrarMes, gastosPorCategoria } from '../../utils/calculos'
import { formatCurrency } from '../../utils/formatCurrency'

export function NotificationBell() {
  const { user } = useAuth()
  const { dataReferencia } = useDate()
  const [open, setOpen] = useState(false)
  
  const [cartoes, setCartoes] = useState([])
  const [parcelas, setParcelas] = useState([])
  const [orcamentos, setOrcamentos] = useState([])
  const [despesas, setDespesas] = useState([])

  useEffect(() => {
    if (!user) return
    const u1 = observarCartoes(user.uid, setCartoes)
    const u2 = observarParcelas(user.uid, setParcelas)
    const u3 = observarOrcamentos(user.uid, setOrcamentos)
    const u4 = observarDespesas(user.uid, setDespesas)
    return () => { u1(); u2(); u3(); u4() }
  }, [user])

  const alertas = []
  const hoje = new Date()

  // 1. Cartões (Limite e Fechamento)
  cartoes.forEach(c => {
    const usado = limiteUsadoCartao(parcelas, c.id)
    if (usado / c.limite >= 0.8) {
      alertas.push({ id: `cartao-${c.id}`, tipo: 'danger', msg: `Cartão ${c.nome} está com ${((usado/c.limite)*100).toFixed(0)}% do limite usado.` })
    }

    // Lembrete de Fechamento
    const diaFech = Number(c.diaFechamento)
    const diffDias = diaFech - hoje.getDate()
    if (diffDias >= 0 && diffDias <= 3) {
      alertas.push({ id: `fech-${c.id}`, tipo: 'warning', msg: `A fatura do cartão ${c.nome} fecha em ${diffDias === 0 ? 'hoje' : diffDias + ' dias'}. Evite novas compras!` })
    }
  })

  // 2. Orçamentos
  const despesasMes = filtrarMes(despesas, dataReferencia)
  const gastosCat = gastosPorCategoria(despesasMes)
  orcamentos.forEach(o => {
    const gasto = gastosCat.find(g => g.categoria === o.categoria)?.valor || 0
    if (gasto > o.limite) {
      alertas.push({ id: `orc-${o.id}`, tipo: 'danger', msg: `Orçamento de ${o.categoria} estourado.` })
    }
  })

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
        {alertas.length > 0 && <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></span>}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 z-50 overflow-hidden">
            <div className="p-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-gray-800 dark:text-white">Notificações</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {alertas.length === 0 ? (
                <p className="p-4 text-sm text-center text-gray-500 dark:text-gray-400">Tudo tranquilo por aqui! Nenhum alerta.</p>
              ) : (
                alertas.map(a => (
                  <div key={a.id} className="p-3 border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/50 flex gap-2">
                    <span className={`mt-0.5 ${a.tipo === 'danger' ? 'text-red-500' : 'text-yellow-500'}`}>●</span>
                    <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">{a.msg}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
