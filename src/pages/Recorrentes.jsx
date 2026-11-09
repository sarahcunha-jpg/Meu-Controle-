import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useDate } from '../contexts/DateContext'
import { observarRecorrentes, criarRecorrente, excluirRecorrente, observarPuladas, alternarPuloMes } from '../services/recorrentesService'
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
  const [puladas, setPuladas] = useState([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ nome: '', valor: '', categoria: CATEGORIAS_DESPESA[0] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    const u1 = observarRecorrentes(user.uid, setContas)
    const u2 = observarPuladas(user.uid, setPuladas)
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

  const isPulada = (contaId) => {
    return puladas.some(p => 
      p.recorrenteId === contaId && 
      Number(p.ano) === Number(ano) && 
      Number(p.mes) === Number(mes + 1)
    )
  }

  const totalMensal = contas.filter(c => !isPulada(c.id)).reduce((a, c) => a + Number(c.valor), 0)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contas Recorrentes</h1>
          <p className="text-sm text-gray-600">Custos fixos de {MESES[mes]}</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ Nova Conta</Button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-yellow-800 text-sm">
        O total das suas contas fixas em {MESES[mes]} é <strong>{formatCurrency(totalMensal)}</strong>.
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {contas.length === 0 ? (
          <p className="p-6 text-sm text-gray-500 text-center">Nenhuma conta recorrente cadastrada.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {contas.map(c => {
              const pulada = isPulada(c.id)
              return (
                <div key={c.id} className={`p-3 flex items-center gap-3 ${pulada ? 'bg-gray-50 opacity-60' : ''}`}>
                  <div className="flex-1">
                    <p className={`font-medium ${pulada ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{c.nome}</p>
                    <p className="text-xs text-gray-500">{c.categoria}</p>
                  </div>
                  <span className={`font-semibold ${pulada ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{formatCurrency(c.valor)}/mês</span>
                  
                  <div className="flex gap-2 ml-2">
                    <button 
                      onClick={() => alternarPuloMes(user.uid, c.id, ano, mes + 1, pulada)}
                      className={`text-xs px-2 py-1 rounded font-bold ${pulada ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {pulada ? 'Desfazer Pulo' : 'Não pagarei'}
                    </button>
                    <button onClick={() => excluirRecorrente(c.id)} className="text-xs text-red-600 hover:underline">Excluir</button>
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
