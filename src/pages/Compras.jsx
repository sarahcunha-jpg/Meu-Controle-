import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useDate } from '../contexts/DateContext'
import { observarCompras, observarParcelas, criarCompraParcelada, excluirCompra, marcarParcelaPaga } from '../services/comprasService'
import { observarCartoes } from '../services/cartoesService'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function Compras() {
  const { user } = useAuth()
  const { mes, ano } = useDate()
  const [compras, setCompras] = useState([])
  const [parcelas, setParcelas] = useState([])
  const [cartoes, setCartoes] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [form, setForm] = useState({ descricao: '', valorTotal: '', numParcelas: 1, cartaoId: '', dataCompra: '' })

  useEffect(() => {
    if (!user) return
    const u1 = observarCompras(user.uid, setCompras)
    const u2 = observarParcelas(user.uid, setParcelas)
    const u3 = observarCartoes(user.uid, setCartoes)
    return () => { u1(); u2(); u3() }
  }, [user])

  useEffect(() => {
    if (cartoes.length > 0 && !form.cartaoId) setForm(f => ({...f, cartaoId: cartoes[0].id}))
  }, [cartoes])

  function abrirModal() {
    const hoje = new Date()
    const diaHoje = String(hoje.getDate()).padStart(2, '0')
    const mesFormatado = String(mes + 1).padStart(2, '0')
    const novaData = `${ano}-${mesFormatado}-${diaHoje}`
    
    setForm(prev => ({ ...prev, dataCompra: novaData }))
    setOpen(true)
  }

  const parcelasDoMes = parcelas.filter(p => {
    if (!p.dataVencimento) return false
    const [y, m] = p.dataVencimento.split('-')
    return Number(m) === (mes + 1) && Number(y) === ano
  })

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.cartaoId) return alert('Cadastre um cartão primeiro.')
    if (!form.dataCompra) return alert('Preencha a data da compra.')
    
    const cartaoSelecionado = cartoes.find(c => c.id === form.cartaoId)

    setLoading(true)
    try {
      await criarCompraParcelada(user.uid, {
        descricao: form.descricao,
        valorTotal: Number(form.valorTotal),
        numParcelas: Number(form.numParcelas),
        cartaoId: form.cartaoId,
        dataCompra: form.dataCompra,
        diaVencimento: cartaoSelecionado?.diaVencimento,
        diaFechamento: cartaoSelecionado?.diaFechamento
      })
      setOpen(false)
      setForm({ ...form, descricao: '', valorTotal: '', numParcelas: 1 })
    } catch (err) { alert(err.message) } finally { setLoading(false) }
  }

  const cartaoNome = (id) => cartoes.find(c => c.id === id)?.nome || 'Cartão'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faturas e Parcelas</h1>
          <p className="text-sm text-gray-600">Vencimentos de {MESES[mes]} de {ano}</p>
        </div>
        <Button onClick={abrirModal}>+ Nova Compra</Button>
      </div>

      <div className="bg-orange-50 rounded-xl border border-orange-100 p-4">
        <h2 className="text-lg font-bold text-orange-800 mb-3 flex items-center gap-2">
          <span>📅</span> Parcelas com vencimento em {MESES[mes]}
        </h2>
        
        {parcelasDoMes.length === 0 ? (
          <p className="text-sm text-orange-700/70">Nenhuma parcela vence neste mês.</p>
        ) : (
          <div className="space-y-2">
            {parcelasDoMes.map(p => {
              const isPaga = p.status === 'paga'
              return (
                <div key={p.id} className={`p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between shadow-sm border gap-3 ${isPaga ? 'bg-green-50 border-green-200' : 'bg-white border-transparent'}`}>
                  
                  <div>
                    <p className={`font-medium ${isPaga ? 'text-green-800 line-through' : 'text-gray-900'}`}>{p.descricao}</p>
                    <p className="text-xs text-gray-500">{cartaoNome(p.cartaoId)} • Parcela {p.numero}/{p.totalParcelas} • Vence {formatDate(p.dataVencimento)}</p>
                  </div>
                  
                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <span className={`font-bold whitespace-nowrap ${isPaga ? 'text-green-600' : 'text-orange-600'}`}>
                      {formatCurrency(p.valor)}
                    </span>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => marcarParcelaPaga(p.id, isPaga ? 'pendente' : 'paga')} 
                        className={`text-xs px-2 py-1 rounded font-bold whitespace-nowrap ${isPaga ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-green-500 text-white hover:bg-green-600'}`}
                      >
                        {isPaga ? 'Desfazer' : 'Pagar'}
                      </button>
                      
                      <button 
                        onClick={() => {
                          if(window.confirm('Deseja excluir esta compra e TODAS as suas parcelas?')) {
                            excluirCompra(user.uid, p.compraId)
                          }
                        }} 
                        className="text-xs text-red-600 hover:underline px-1"
                        title="Excluir compra inteira"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                  
                </div>
              )
            })}
            
            <div className="text-right pt-3 mt-2 text-sm font-bold text-orange-800 border-t border-orange-200">
              Total a pagar neste mês: {formatCurrency(parcelasDoMes.filter(p => p.status !== 'paga').reduce((a, p) => a + Number(p.valor), 0))}
            </div>
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nova Compra Parcelada">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="O que você comprou?" required value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Valor Total (R$)" type="number" step="0.01" required value={form.valorTotal} onChange={e => setForm({...form, valorTotal: e.target.value})} />
            <Input label="Parcelas" type="number" min="1" max="24" required value={form.numParcelas} onChange={e => setForm({...form, numParcelas: e.target.value})} />
          </div>
          <Select label="Cartão" options={cartoes.map(c => ({ value: c.id, label: c.nome }))} value={form.cartaoId} onChange={e => setForm({...form, cartaoId: e.target.value})} />
          <Input label="Data da Compra" type="date" required value={form.dataCompra} onChange={e => setForm({...form, dataCompra: e.target.value})} />
          <Button type="submit" disabled={loading} className="w-full">Cadastrar Compra</Button>
        </form>
      </Modal>
    </div>
  )
}
