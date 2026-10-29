import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  observarDespesas, criarDespesa, atualizarDespesa, excluirDespesa
} from '../services/despesasService'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { TransacaoForm } from '../components/transacoes/TransacaoForm'
import { CATEGORIAS_DESPESA } from '../utils/categorias'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function Despesas() {
  const { user } = useAuth()
  const [itens, setItens] = useState([])
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [loading, setLoading] = useState(false)
  const [busca, setBusca] = useState('')

  // Filtros de data
  const hoje = new Date()
  const [mesFiltro, setMesFiltro] = useState(hoje.getMonth())
  const [anoFiltro, setAnoFiltro] = useState(hoje.getFullYear())

  useEffect(() => {
    if (!user) return
    return observarDespesas(user.uid, setItens)
  }, [user])

  // Filtra por mês, ano e texto de busca
  const filtradas = itens.filter(i => {
    if (!i.data) return false
    const d = new Date(i.data + 'T00:00:00')
    const bateData = d.getMonth() === Number(mesFiltro) && d.getFullYear() === Number(anoFiltro)
    const bateBusca = i.descricao?.toLowerCase().includes(busca.toLowerCase()) || i.categoria?.toLowerCase().includes(busca.toLowerCase())
    return bateData && bateBusca
  })

  async function handleSubmit(dados) {
    setLoading(true)
    try {
      if (editando) await atualizarDespesa(editando.id, dados)
      else await criarDespesa(user.uid, dados)
      setOpen(false); setEditando(null)
    } catch (e) {
      alert('Erro ao salvar: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleExcluir(item) {
    if (!confirm(`Excluir "${item.descricao}"?`)) return
    await excluirDespesa(item.id)
  }

  async function handleDuplicar(item) {
    try {
      const dataAtual = new Date(item.data + 'T12:00:00')
      dataAtual.setMonth(dataAtual.getMonth() + 1)
      const novaData = dataAtual.toISOString().slice(0, 10)

      await criarDespesa(user.uid, {
        descricao: item.descricao,
        valor: item.valor,
        categoria: item.categoria,
        data: novaData,
        formaPagamento: item.formaPagamento || 'Dinheiro',
        observacoes: item.observacoes || ''
      })
      alert(`"${item.descricao}" duplicada para o próximo mês!`)
    } catch (e) {
      alert('Erro ao duplicar: ' + e.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Despesas</h1>
          <p className="text-sm text-gray-600">Registre tudo o que você gasta</p>
        </div>
        <Button onClick={() => { setEditando(null); setOpen(true) }}>+ Nova despesa</Button>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-wrap gap-2 items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
        <input
          placeholder="Buscar por descrição..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
        />
        <select value={mesFiltro} onChange={e => setMesFiltro(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select value={anoFiltro} onChange={e => setAnoFiltro(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          {[hoje.getFullYear() - 1, hoje.getFullYear(), hoje.getFullYear() + 1].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filtradas.length === 0 ? (
          <p className="p-6 text-sm text-gray-500 text-center">Nenhuma despesa encontrada para este mês.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtradas.map(item => (
              <div key={item.id} className="p-3 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{item.descricao}</p>
                  <p className="text-xs text-gray-500">
                    {item.categoria} • {formatDate(item.data)}
                    {item.formaPagamento ? ` • ${item.formaPagamento}` : ''}
                  </p>
                </div>
                <span className="font-semibold text-red-600 whitespace-nowrap">-{formatCurrency(item.valor)}</span>
                <div className="flex gap-1">
                  <button onClick={() => handleDuplicar(item)} className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100" title="Duplicar para o mês seguinte">Duplicar</button>
                  <button onClick={() => { setEditando(item); setOpen(true) }} className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">Editar</button>
                  <button onClick={() => handleExcluir(item)} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200">Excluir</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => { setOpen(false); setEditando(null) }} title={editando ? 'Editar despesa' : 'Nova despesa'}>
        <TransacaoForm
          categorias={CATEGORIAS_DESPESA}
          tipo="despesa"
          initial={editando || {}}
          onSubmit={handleSubmit}
          onCancel={() => { setOpen(false); setEditando(null) }}
          loading={loading}
          showFormaPagamento
        />
      </Modal>
    </div>
  )
}