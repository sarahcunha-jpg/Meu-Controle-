import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { observarCartoes, criarCartao, atualizarCartao, excluirCartao } from '../services/cartoesService'
import { observarParcelas } from '../services/comprasService'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { formatCurrency } from '../utils/formatCurrency'
import { limiteUsadoCartao } from '../utils/calculos'

export default function Cartoes() {
  const { user } = useAuth()
  const [cartoes, setCartoes] = useState([])
  const [parcelas, setParcelas] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Estado para controlar se estamos criando ou editando
  const [cartaoEditando, setCartaoEditando] = useState(null)
  
  const [form, setForm] = useState({ nome: '', limite: '', diaFechamento: 1, diaVencimento: 10 })

  useEffect(() => {
    if (!user) return
    const u1 = observarCartoes(user.uid, setCartoes)
    const u2 = observarParcelas(user.uid, setParcelas)
    return () => { u1(); u2() }
  }, [user])

  // Abre o modal para criar um cartão novo
  function abrirNovo() {
    setCartaoEditando(null)
    setForm({ nome: '', limite: '', diaFechamento: 1, diaVencimento: 10 })
    setOpen(true)
  }

  // Abre o modal preenchido para editar o cartão existente
  function abrirEdicao(cartao) {
    setCartaoEditando(cartao)
    setForm({ 
      nome: cartao.nome, 
      limite: cartao.limite, 
      diaFechamento: cartao.diaFechamento, 
      diaVencimento: cartao.diaVencimento 
    })
    setOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const dados = { ...form, limite: Number(form.limite) }
      
      if (cartaoEditando) {
        await atualizarCartao(cartaoEditando.id, dados)
      } else {
        await criarCartao(user.uid, dados)
      }
      
      setOpen(false)
      setForm({ nome: '', limite: '', diaFechamento: 1, diaVencimento: 10 })
    } catch (err) { 
      alert(err.message) 
    } finally { 
      setLoading(false) 
    }
  }

  async function handleExcluir(id) {
    if (window.confirm('Tem certeza que deseja excluir este cartão? As compras atreladas a ele ficarão sem cartão.')) {
      await excluirCartao(id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Meus Cartões</h1>
        <Button onClick={abrirNovo}>+ Novo Cartão</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {cartoes.map(c => {
          const usado = limiteUsadoCartao(parcelas, c.id)
          const disponivel = Number(c.limite) - usado
          const pct = Math.min(100, (usado / Number(c.limite)) * 100)
          
          return (
            <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-gray-800">{c.nome}</h3>
                <div className="flex gap-2">
                  <button onClick={() => abrirEdicao(c)} className="text-blue-500 text-xs hover:underline font-semibold">Editar</button>
                  <button onClick={() => handleExcluir(c.id)} className="text-red-500 text-xs hover:underline">Excluir</button>
                </div>
              </div>
              
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span>Limite Total:</span> <span>{formatCurrency(c.limite)}</span></div>
                <div className="flex justify-between text-red-600"><span>Usado:</span> <span>-{formatCurrency(usado)}</span></div>
                <div className="flex justify-between font-bold text-green-600"><span>Disponível:</span> <span>{formatCurrency(disponivel)}</span></div>
              </div>
              
              <div className="w-full bg-gray-200 h-2 rounded-full mt-3 overflow-hidden">
                <div className={`h-full ${pct > 80 ? 'bg-red-500' : 'bg-primary-500'}`} style={{ width: `${pct}%` }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Fecha dia {c.diaFechamento} • Vence dia {c.diaVencimento}</p>
            </div>
          )
        })}
        {cartoes.length === 0 && <p className="text-gray-500 text-sm">Nenhum cartão cadastrado.</p>}
      </div>

      <Modal 
        open={open} 
        onClose={() => setOpen(false)} 
        title={cartaoEditando ? "Editar Cartão" : "Novo Cartão"}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Nome do Cartão" required value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
          <Input label="Limite (R$)" type="number" step="0.01" min="1" required value={form.limite} onChange={e => setForm({...form, limite: e.target.value})} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Dia Fechamento" type="number" min="1" max="31" required value={form.diaFechamento} onChange={e => setForm({...form, diaFechamento: e.target.value})} />
            <Input label="Dia Vencimento" type="number" min="1" max="31" required value={form.diaVencimento} onChange={e => setForm({...form, diaVencimento: e.target.value})} />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {cartaoEditando ? 'Salvar Alterações' : 'Cadastrar Cartão'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
