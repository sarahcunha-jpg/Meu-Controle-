import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useDate } from '../contexts/DateContext'
import { observarDespesas, criarDespesa, atualizarDespesa, excluirDespesa } from '../services/despesasService'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { TransacaoForm } from '../components/transacoes/TransacaoForm'
import { CATEGORIAS_DESPESA } from '../utils/categorias'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function Despesas() {
  const { user } = useAuth()
  const { mes, ano } = useDate()
  const [itens, setItens] = useState([])
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    return observarDespesas(user.uid, setItens)
  }, [user])

  // O FILTRO AGORA USA O MÊS GLOBAL
  const filtradas = itens.filter(i => {
    if (!i.data) return false
    const d = new Date(i.data + 'T00:00:00')
    return d.getMonth() === mes && d.getFullYear() === ano
  })

  const dataPadrao = `${ano}-${String(mes + 1).padStart(2, '0')}-${new Date().getDate()}`

  async function handleSubmit(dados) {
    setLoading(true)
    try {
      if (editando) await atualizarDespesa(editando.id, dados)
      else await criarDespesa(user.uid, dados)
      setOpen(false); setEditando(null)
    } catch (e) { alert(e.message) } finally { setLoading(false) }
  }

  async function handleDuplicar(item) {
    const dataAtual = new Date(item.data + 'T12:00:00')
    dataAtual.setMonth(dataAtual.getMonth() + 1)
    await criarDespesa(user.uid, { ...item, data: dataAtual.toISOString().slice(0, 10) })
    alert('Duplicado para o próximo mês!')
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Despesas</h1>
          <p className="text-sm text-gray-600">Visualizando {MESES[mes]} de {ano}</p>
        </div>
        <Button onClick={() => { setEditando(null); setOpen(true) }}>+ Nova despesa</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filtradas.length === 0 ? (
          <p className="p-6 text-sm text-gray-500 text-center">Nenhuma despesa em {MESES[mes]}.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtradas.map(item => (
              <div key={item.id} className="p-3 flex items-center gap-3 flex-wrap">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.descricao}</p>
                  <p className="text-xs text-gray-500">{item.categoria} • {formatDate(item.data)}</p>
                </div>
                <span className="font-semibold text-red-600">-{formatCurrency(item.valor)}</span>
                <div className="flex gap-1">
                  <button onClick={() => handleDuplicar(item)} className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600">Dup</button>
                  <button onClick={() => { setEditando(item); setOpen(true) }} className="text-xs px-2 py-1 rounded bg-gray-100">Edt</button>
                  <button onClick={() => excluirDespesa(item.id)} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">Exc</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editando ? 'Editar' : 'Nova despesa'}>
        <TransacaoForm categorias={CATEGORIAS_DESPESA} tipo="despesa" initial={editando || { data: dataPadrao }} onSubmit={handleSubmit} onCancel={() => setOpen(false)} loading={loading} showFormaPagamento />
      </Modal>
    </div>
  )
}
