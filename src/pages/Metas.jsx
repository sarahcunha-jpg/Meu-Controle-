import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { observarMetas, criarMeta, excluirMeta, atualizarMeta } from '../services/metasService'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { formatCurrency } from '../utils/formatCurrency'

export default function Metas() {
  const { user } = useAuth()
  const [metas, setMetas] = useState([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ nome: '', valorAlvo: '', valorAtual: '' })
  
  // Estados para o modal de movimentação
  const [openMov, setOpenMov] = useState(false)
  const [metaSelecionada, setMetaSelecionada] = useState(null)
  const [valorMov, setValorMov] = useState('')
  const [tipoMov, setTipoMov] = useState('add') // 'add' ou 'sub'

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    return observarMetas(user.uid, setMetas)
  }, [user])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await criarMeta(user.uid, { 
        nome: form.nome, 
        valorAlvo: Number(form.valorAlvo), 
        valorAtual: Number(form.valorAtual) || 0 
      })
      setOpen(false)
      setForm({ nome: '', valorAlvo: '', valorAtual: '' })
    } finally { setLoading(false) }
  }

  async function handleMovimentar(e) {
    e.preventDefault()
    if (!metaSelecionada) return

    const valor = Number(valorMov)
    if (valor <= 0) return alert('Informe um valor maior que zero.')

    let novoValor = Number(metaSelecionada.valorAtual)
    if (tipoMov === 'add') {
      novoValor += valor
    } else {
      if (valor > novoValor) return alert('Você não pode resgatar mais do que o valor guardado.')
      novoValor -= valor
    }

    setLoading(true)
    try {
      await atualizarMeta(metaSelecionada.id, { valorAtual: novoValor })
      setOpenMov(false)
      setValorMov('')
      setMetaSelecionada(null)
    } catch (err) {
      alert('Erro ao atualizar meta: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  function abrirMovimentacao(meta, tipo) {
    setMetaSelecionada(meta)
    setTipoMov(tipo)
    setValorMov('')
    setOpenMov(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Metas Financeiras</h1>
          <p className="text-sm text-gray-600">O que você quer conquistar?</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ Nova Meta</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {metas.map(m => {
          const pct = Math.min(100, (m.valorAtual / m.valorAlvo) * 100)
          const restante = Math.max(0, m.valorAlvo - m.valorAtual)
          const concluida = m.valorAtual >= m.valorAlvo

          return (
            <div key={m.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800 text-lg">{m.nome}</h3>
                <button onClick={() => excluirMeta(m.id)} className="text-red-500 text-xs hover:underline">Excluir</button>
              </div>
              
              <div className="flex justify-between text-sm mb-1">
                <span className="text-green-600 font-bold">{formatCurrency(m.valorAtual)}</span>
                <span className="text-gray-500">de {formatCurrency(m.valorAlvo)}</span>
              </div>
              
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div className={`h-full ${concluida ? 'bg-green-500' : 'bg-primary-500'}`} style={{ width: `${pct}%` }}></div>
              </div>
              
              <div className="flex justify-between text-xs text-gray-500 mt-2 mb-4">
                <span>{pct.toFixed(0)}% concluído</span>
                <span>{concluida ? 'Meta atingida! 🎉' : `Faltam ${formatCurrency(restante)}`}</span>
              </div>

              {/* Botões de movimentação */}
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  className="flex-1 text-xs py-1"
                  onClick={() => abrirMovimentacao(m, 'add')}
                >
                  + Guardar
                </Button>
                <Button 
                  variant="ghost" 
                  className="flex-1 text-xs py-1 border border-gray-200"
                  onClick={() => abrirMovimentacao(m, 'sub')}
                >
                  - Resgatar
                </Button>
              </div>
            </div>
          )
        })}
        {metas.length === 0 && <p className="text-gray-500 text-sm">Nenhuma meta cadastrada.</p>}
      </div>

      {/* Modal de Nova Meta */}
      <Modal open={open} onClose={() => setOpen(false)} title="Nova Meta">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Nome da Meta (ex: Viagem)" required value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Valor Alvo (R$)" type="number" step="0.01" required value={form.valorAlvo} onChange={e => setForm({...form, valorAlvo: e.target.value})} />
            <Input label="Já guardado (R$)" type="number" step="0.01" value={form.valorAtual} onChange={e => setForm({...form, valorAtual: e.target.value})} />
          </div>
          <Button type="submit" disabled={loading} className="w-full">Salvar Meta</Button>
        </form>
      </Modal>

      {/* Modal de Movimentação (Guardar / Resgatar) */}
      <Modal 
        open={openMov} 
        onClose={() => setOpenMov(false)} 
        title={tipoMov === 'add' ? `Guardar dinheiro para: ${metaSelecionada?.nome}` : `Resgatar dinheiro de: ${metaSelecionada?.nome}`}
      >
        <form onSubmit={handleMovimentar} className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 text-center border border-gray-100">
            Saldo atual da meta: <strong>{formatCurrency(metaSelecionada?.valorAtual || 0)}</strong>
          </div>
          
          <Input 
            label="Valor da Movimentação (R$)" 
            type="number" 
            step="0.01" 
            min="0.01"
            required 
            autoFocus
            value={valorMov} 
            onChange={e => setValorMov(e.target.value)} 
          />
          
          <Button 
            type="submit" 
            disabled={loading} 
            className={`w-full ${tipoMov === 'sub' ? 'bg-red-600 hover:bg-red-700' : ''}`}
          >
            {loading ? 'Processando...' : tipoMov === 'add' ? 'Confirmar Depósito' : 'Confirmar Resgate'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
