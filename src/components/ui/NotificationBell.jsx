import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useDate } from '../../contexts/DateContext'
import { observarOrcamentos } from '../../services/orcamentosService'
import { observarCartoes } from '../../services/cartoesService'
import { observarParcelas } from '../../services/comprasService'
import { observarRecorrentes } from '../../services/recorrentesService'
import { observarDespesas } from '../../services/despesasService'
import { limiteUsadoCartao, filtrarMes, gastosPorCategoria } from '../../utils/calculos'
import { formatCurrency } from '../../utils/formatCurrency'

export function NotificationBell() {
  const { user } = useAuth()
  const { dataReferencia } = useDate()
  const [open, setOpen] = useState(false)
  
  const [cartoes, setCartoes] = useState([])
  const [parcelas, setParcelas] = useState([])
  const [recorrentes, setRecorrentes] = useState([])
  const [orcamentos, setOrcamentos] = useState([])
  const [despesas, setDespesas] = useState([])

  useEffect(() => {
    if (!user) return
    const u1 = observarCartoes(user.uid, setCartoes)
    const u2 = observarParcelas(user.uid, setParcelas)
    const u3 = observarRecorrentes(user.uid, setRecorrentes)
    const u4 = observarOrcamentos(user.uid, setOrcamentos)
    const u5 = observarDespesas(user.uid, setDespesas)
    return () => { u1(); u2(); u3(); u4(); u5() }
  }, [user])

  const alertas = []

  // 1. Cartões acima de 80%
  cartoes.forEach(c => {
    const usado = limiteUsadoCartao(parcelas, c.id)
    if (usado / c.limite >= 0.8) {
      alertas.push({ id: `cartao-${c.id}`, tipo: 'danger', msg: `Cartão ${c.nome} está com ${((usado/c.limite)*100).toFixed(0)}% do limite usado.` })
    }
  })

  // 2. Orçamentos estourados
  const despesasMes = filtrarMes(despesas, dataReferencia)
  const gastosCat = gastosPorCategoria(despesasMes)
  orcamentos.forEach(o => {
    const gasto = gastosCat.find(g => g.categoria === o.categoria)?.valor || 0
    if (gasto > o.limite) {
      alertas.push({ id: `orc-${o.id}`, tipo: 'danger', msg: `Orçamento de ${o.categoria} estourado (${formatCurrency(gasto)} de ${formatCurrency(o.limite)}).` })
    }
  })

  // 3. Parcelas vencendo em breve (próximos 5 dias)
  const hoje = new Date()
  parcelas.filter(p => p.status === 'pendente').forEach(p => {
    const venc = new Date(p.dataVencimento + 'T12:00:00')
    const diff = (venc - hoje) / (1000 * 60 * 60 * 24)
    if (diff >= 0 && diff <= 5) {
      alertas.push({ id: `parc-${p.id}`, tipo: 'warning', msg: `Parcela "${p.descricao}" vence em ${Math.ceil(diff)} dias (${formatCurrency(p.valor)}).` })
    }
  })

  // 4. Contas fixas pendentes no mês
  // (Lógica simplificada para não pesar o componente)

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
        {alertas.length > 0 && (
          <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        )}
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
