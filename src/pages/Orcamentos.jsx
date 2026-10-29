import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
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

  const gastosAtuais = gastosPorCategoriaMes(despesas)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await criarOrcamento(user.uid, { categoria: form.categoria, limite: Number(form.limite) })
      setOpen(false)
      setForm({ categoria: CATEGORIAS_DESPESA[0], limite: '' })
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-sm text-gray-600">Defina limites por categoria</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ Novo Orçamento</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {orcamentos.map(o => {
          const gasto = gastosAtuais.find(g => g.categoria === o.categoria)?.valor || 0
          const pct = Math.min(100, (gasto / o.limite) * 100)
          const status = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-500' : 'bg-green-500'
          const textStatus = pct >= 100 ? 'text-red-600' : pct >= 80 ? 'text-yellow-600' : 'text-green-600'

          return (
            <div key={o.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative">
              <button onClick={() => excluirOrcamento(o.id)} className="absolute top-2 right-2 text-red-500 text-xs hover:underline">Excluir</button>
              <h3 className="font-bold text-gray-800">{o.categoria}</h3>
              <div className="flex justify-between text-sm mt-2 mb-1">
                <span>{formatCurrency(gasto)} gastos</span>
                <span className={`font-bold ${textStatus}`}>{formatCurrency(o.limite)} limite</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div className={`h-full ${status}`} style={{ width: `${pct}%` }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">{pct.toFixed(1)}% utilizado</p>
            </div>
          )
        })}
        {orcamentos.length === 0 && <p className="text-gray-500 text-sm">Nenhum orçamento definido.</p>}
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
