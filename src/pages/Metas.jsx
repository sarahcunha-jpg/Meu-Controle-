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
  
  const [openMov, setOpenMov] = useState(false)
  const [metaSelecionada, setMetaSelecionada] = useState(null)
  const [valorMov, setValorMov] = useState('')
  const [tipoMov, setTipoMov] = useState('add')

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
      alert('Erro ao atualizar cofrinho: ' + err.message)
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">Cofrinho</h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Suas metas e objetivos de vida</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ Novo Objetivo</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {metas.map(m => {
          const pct = Math.min(100, (m.valorAtual / m.valorAlvo) * 100)
          const restante = Math.max(0, m.valorAlvo - m.valorAtual)
          const concluida = m.valorAtual >= m.valorAlvo

          return (
            <div key={m.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 relative transition-colors">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-gray-800 dark:text-white text-lg">{m.nome}</h3>
                <button onClick={() => excluirMeta(m.id)} className="text-red-500 hover:text-red-700 text-xs font-bold uppercase">Excluir</button>
              </div>
              
              <div className="flex justify-between text-sm mb-2">
                <span className="text-green-600 dark:text-green-400 font-bold">{formatCurrency(m.valorAtual)}</span>
                <span className="text-gray-500 dark:text-gray-400 font-medium">Meta: {formatCurrency(m.valorAlvo)}</span>
              </div>
              
              <div className="w-full bg-gray-100 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                <div className={`h-full ${concluida ? 'bg-green-500' : 'bg-primary-500'}`} style={{ width: `${pct}%` }}></div>
              </div>
              
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2 mb-5">
                <span>{pct.toFixed(0)}% concluído</span>
                <span>{concluida ? 'Objetivo atingido! 🎉' : `Faltam ${formatCurrency(restante)}`}</span>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  className="flex-1 text-xs py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
                  onClick={() => abrirMovimentacao(m, 'add')}
                >
                  + Guardar
                </Button>
                <Button 
                  variant="ghost" 
                  className="flex-1 text-xs py-2 border border-slate-200 dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
                  onClick={() => abrirMovimentacao(m, 'sub')}
                >
                  - Resgatar
                </Button>
              </div>
            </div>
          )
        })}
        {metas.length === 0 && (
          <div className="col-span-full bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
            <p className="text-gray-500 dark:text-gray-400">Você ainda não tem nenhum objetivo. Que tal criar um?</p>
          </div>
        )}
      </div>

      {/* Modal de Nova Meta */}
      <Modal open={open} onClose={() => setOpen(false)} title="Novo Objetivo">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nome do Objetivo (ex: Viagem, Carro)" required value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Valor Alvo (R$)" type="number" step="0.01" required value={form.valorAlvo} onChange={e => setForm({...form, valorAlvo: e.target.value})} />
            <Input label="Já guardado (R$)" type="number" step="0.01" value={form.valorAtual} onChange={e => setForm({...form, valorAtual: e.target.value})} />
          </div>
          <Button type="submit" disabled={loading} className="w-full">Salvar Objetivo</Button>
        </form>
      </Modal>

      {/* Modal de Movimentação */}
      <Modal 
        open={openMov} 
        onClose={() => setOpenMov(false)} 
        title={tipoMov === 'add' ? `Guardar em: ${metaSelecionada?.nome}` : `Resgatar de: ${metaSelecionada?.nome}`}
      >
        <form onSubmit={handleMovimentar} className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl text-sm text-gray-700 dark:text-gray-300 text-center border border-slate-100 dark:border-slate-600">
            Saldo atual deste objetivo: <br/>
            <strong className="text-xl text-green-600 dark:text-green-400">{formatCurrency(metaSelecionada?.valorAtual || 0)}</strong>
          </div>
          
          <Input 
            label="Valor (R$)" 
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
            className={`w-full ${tipoMov === 'sub' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {loading ? 'Processando...' : tipoMov === 'add' ? 'Confirmar Depósito' : 'Confirmar Resgate'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
