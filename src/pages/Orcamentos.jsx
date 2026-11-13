import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useDate } from '../contexts/DateContext'
import { observarOrcamentos, criarOrcamento, excluirOrcamento } from '../services/orcamentosService'
import { observarDespesas } from '../services/despesasService'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { CATEGORIAS_DESPESA } from '../utils/categorias'
import { formatCurrency } from '../utils/formatCurrency'
import { gastosPorCategoriaMes } from '../utils/calculos'

export default function Orcamentos() {
  const { user } = useAuth()
  const { dataReferencia } = useDate()
  const [orcamentos, setOrcamentos] = useState([])
  const [despesas, setDespesas] = useState([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ categoria: CATEGORIAS_DESPESA[0], limite: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    const u1 = observarOrcamentos(user.uid, setOrcamentos)
    const u2 = observarDespesas(user.uid, setDespesas)
    return () => { u1(); u2() }
  }, [user])

  const gastosAtuais = gastosPorCategoriaMes(despesas, dataReferencia)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await criarOrcamento(user.uid, { categoria: form.categoria, limite: Number(form.limite) })
      setOpen(false)
    } finally { setLoading(false) }
  }

  function duplicarMesPassado() {
    if (orcamentos.length === 0) return alert('Não há orçamentos para copiar.')
    if (!window.confirm('Deseja copiar os limites do mês anterior para este mês?')) return
    
    // Lógica simplificada de cópia para o Firebase
    orcamentos.forEach(async (o) => {
      await criarOrcamento(user.uid, { categoria: o.categoria, limite: o.limite })
    })
    alert('Orçamentos copiados com sucesso!')
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orçamentos</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Defina limites por categoria</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={duplicarMesPassado}>Duplicar Anterior</Button>
          <Button onClick={() => setOpen(true)}>+ Novo Orçamento</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {orcamentos.map(o => {
          const gasto = gastosAtuais.find(g => g.categoria === o.categoria)?.valor || 0
          const pct = Math.min(100, (gasto / o.limite) * 100)
          const status = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-500' : 'bg-green-500'
          
          return (
            <div key={o.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 relative">
              <button onClick={() => excluirOrcamento(o.id)} className="absolute top-2 right-2 text-red-500 text-xs">Excluir</button>
              <h3 className="font-bold text-gray-800 dark:text-white">{o.categoria}</h3>
              <div className="flex justify-between text-sm mt-2 mb-1">
                <span className="text-gray-600 dark:text-gray-400">{formatCurrency(gasto)} gastos</span>
                <span className="font-bold text-gray-600 dark:text-gray-300">{formatCurrency(o.limite)} limite</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className={`h-full ${status}`} style={{ width: `${pct}%` }}></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">{pct.toFixed(1)}%</p>
            </div>
          )
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Novo Orçamento">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Select label="Categoria" options={CATEGORIAS_DESPESA} value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} />
          <Input label="Limite Mensal (R$)" type="number" step="0.01" required value={form.limite} onChange={e => setForm({...form, limite: e.target.value})} />
          <Button type="submit" disabled={loading} className="w-full">Salvar</Button>
        </form>
      </Modal>
    </div>
  )
}
