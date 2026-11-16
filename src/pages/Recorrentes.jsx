import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useDate } from '../contexts/DateContext'
import { observarRecorrentes, criarRecorrente, excluirRecorrente, observarStatus, mudarStatusRecorrente } from '../services/recorrentesService'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { CATEGORIAS_DESPESA } from '../utils/categorias'
import { formatCurrency } from '../utils/formatCurrency'

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function Recorrentes() {
  const { user } = useAuth()
  const { mes, ano } = useDate()
  const [contas, setContas] = useState([])
  const [status, setStatus] = useState([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ nome: '', valor: '', categoria: CATEGORIAS_DESPESA[0] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    const u1 = observarRecorrentes(user.uid, setContas)
    const u2 = observarStatus(user.uid, setStatus)
    return () => { u1(); u2() }
  }, [user])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await criarRecorrente(user.uid, { nome: form.nome, valor: Number(form.valor), categoria: form.categoria })
      setOpen(false)
      setForm({ nome: '', valor: '', categoria: CATEGORIAS_DESPESA[0] })
    } finally { setLoading(false) }
  }

  const getStatus = (contaId) => {
    const registro = status.find(s => 
      s.recorrenteId === contaId && 
      Number(s.ano) === Number(ano) && 
      Number(s.mes) === Number(mes + 1)
    )
    return registro ? registro.status : 'pendente'
  }

  const contasPendentes = contas.filter(c => getStatus(c.id) === 'pendente')
  const totalPendente = contasPendentes.reduce((a, c) => a + Number(c.valor), 0)
  const totalPago = contas.filter(c => getStatus(c.id) === 'paga').reduce((a, c) => a + Number(c.valor), 0)

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contas Recorrentes</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Custos fixos de {MESES[mes]}</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ Nova Conta</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 p-4 rounded-xl text-yellow-800 dark:text-yellow-300 text-sm">
          <p className="font-semibold mb-1">Contas a Pagar:</p>
          <p className="text-xl font-black">{formatCurrency(totalPendente)}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 p-4 rounded-xl text-green-800 dark:text-green-300 text-sm">
          <p className="font-semibold mb-1">Já Paguei:</p>
          <p className="text-xl font-black">{formatCurrency(totalPago)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        {contas.length === 0 ? (
          <p className="p-6 text-sm text-gray-500 dark:text-gray-400 text-center">Nenhuma conta recorrente cadastrada.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {contas.map(c => {
              const st = getStatus(c.id)
              const isPaga = st === 'paga'
              const isPulada = st === 'pulada'

              return (
                <div key={c.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isPaga || isPulada ? 'bg-gray-50 dark:bg-slate-800/50 opacity-60' : ''}`}>
                  
                  {/* INFO DA CONTA */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-lg truncate ${isPaga || isPulada ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                      {c.nome}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{c.categoria} • {formatCurrency(c.valor)}/mês</p>
                  </div>
                  
                  {/* BOTÕES DE AÇÃO */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    <button 
                      onClick={() => mudarStatusRecorrente(user.uid, c.id, ano, mes + 1, isPaga ? 'pendente' : 'paga')}
                      className={`text-xs px-3 py-2 rounded-lg font-bold whitespace-nowrap transition-colors ${isPaga ? 'bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-white' : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'}`}
                    >
                      {isPaga ? 'Desfazer Pago' : 'Pagar'}
                    </button>
                    <button 
                      onClick={() => mudarStatusRecorrente(user.uid, c.id, ano, mes + 1, isPulada ? 'pendente' : 'pulada')}
                      className={`text-xs px-3 py-2 rounded-lg font-bold whitespace-nowrap transition-colors ${isPulada ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-700/50 dark:text-yellow-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300'}`}
                    >
                      {isPulada ? 'Desfazer' : 'Pular'}
                    </button>
                    <button onClick={() => excluirRecorrente(c.id)} className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-2">Excluir</button>
                  </div>
                  
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nova Conta Recorrente">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Nome (ex: Aluguel)" required value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
          <Input label="Valor Mensal (R$)" type="number" step="0.01" required value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} />
          <Select label="Categoria" options={CATEGORIAS_DESPESA} value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} />
          <Button type="submit" disabled={loading} className="w-full">Salvar Conta</Button>
        </form>
      </Modal>
    </div>
  )
}
