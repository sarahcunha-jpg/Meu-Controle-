import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { observarCompras, observarParcelas, criarCompraParcelada, excluirCompra } from '../services/comprasService'
import { observarCartoes } from '../services/cartoesService'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate, todayISO } from '../utils/formatDate'

export default function Compras() {
  const { user } = useAuth()
  const [compras, setCompras] = useState([])
  const [parcelas, setParcelas] = useState([])
  const [cartoes, setCartoes] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [form, setForm] = useState({ descricao: '', valorTotal: '', numParcelas: 1, cartaoId: '', dataCompra: todayISO() })

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

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.cartaoId) return alert('Cadastre um cartão primeiro.')
    setLoading(true)
    try {
      await criarCompraParcelada(user.uid, {
        descricao: form.descricao,
        valorTotal: Number(form.valorTotal),
        numParcelas: Number(form.numParcelas),
        cartaoId: form.cartaoId,
        dataCompra: form.dataCompra
      })
      setOpen(false)
      setForm({ ...form, descricao: '', valorTotal: '', numParcelas: 1 })
    } catch (err) { alert(err.message) } finally { setLoading(false) }
  }

  const cartaoNome = (id) => cartoes.find(c => c.id === id)?.nome || 'Cartão excluído'

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compras Parceladas</h1>
          <p className="text-sm text-gray-600">O sistema cria as parcelas automaticamente</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ Nova Compra</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {compras.length === 0 ? (
          <p className="p-6 text-sm text-gray-500 text-center">Nenhuma compra cadastrada.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {compras.map(c => (
              <div key={c.id} className="p-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{c.descricao}</p>
                  <p className="text-xs text-gray-500">
                    {cartaoNome(c.cartaoId)} • {c.numParcelas}x de {formatCurrency(c.valorTotal / c.numParcelas)} • {formatDate(c.dataCompra)}
                  </p>
                </div>
                <span className="font-semibold text-gray-800">{formatCurrency(c.valorTotal)}</span>
                
                {/* AQUI ESTÁ A CORREÇÃO: Passando user.uid e c.id */}
                <button onClick={() => excluirCompra(user.uid, c.id)} className="text-xs text-red-600 hover:underline ml-2">
                  Excluir
                </button>
                
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nova Compra Parcelada">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="O que você comprou?" required value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Valor Total (R$)" type="number" step="0.01" required value={form.valorTotal} onChange={e => setForm({...form, valorTotal: e.target.value})} />
            <Input label="Parcelas (ex: 2)" type="number" min="1" max="24" required value={form.numParcelas} onChange={e => setForm({...form, numParcelas: e.target.value})} />
          </div>
          <Select label="Cartão" options={cartoes.map(c => ({ value: c.id, label: c.nome }))} value={form.cartaoId} onChange={e => setForm({...form, cartaoId: e.target.value})} />
          <Input label="Data da Compra" type="date" required value={form.dataCompra} onChange={e => setForm({...form, dataCompra: e.target.value})} />
          
          {form.valorTotal > 0 && form.numParcelas > 0 && (
            <div className="bg-blue-50 text-blue-700 p-2 rounded text-sm text-center">
              Serão geradas <strong>{form.numParcelas} parcelas</strong> de aprox. <strong>{formatCurrency(form.valorTotal / form.numParcelas)}</strong>
            </div>
          )}
          
          <Button type="submit" disabled={loading} className="w-full">Cadastrar Compra</Button>
        </form>
      </Modal>
    </div>
  )
}