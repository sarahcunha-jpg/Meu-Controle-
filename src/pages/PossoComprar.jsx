import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { observarReceitas } from '../services/receitasService'
import { observarDespesas } from '../services/despesasService'
import { observarParcelas } from '../services/comprasService'
import { observarCartoes } from '../services/cartoesService'
import { observarRecorrentes } from '../services/recorrentesService'
import { analisarCompra } from '../utils/calculos'
import { formatCurrency } from '../utils/formatCurrency'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'

export default function PossoComprar() {
  const { user } = useAuth()
  const [dados, setDados] = useState({ receitas: [], despesas: [], parcelas: [], cartoes: [], recorrentes: [] })
  
  const [form, setForm] = useState({ descricao: '', valorTotal: '', numParcelas: '1', cartaoId: '' })
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    if (!user) return
    const unsubs = [
      observarReceitas(user.uid, v => setDados(d => ({ ...d, receitas: v }))),
      observarDespesas(user.uid, v => setDados(d => ({ ...d, despesas: v }))),
      observarParcelas(user.uid, v => setDados(d => ({ ...d, parcelas: v }))),
      observarCartoes(user.uid, v => setDados(d => ({ ...d, cartoes: v }))),
      observarRecorrentes(user.uid, v => setDados(d => ({ ...d, recorrentes: v })))
    ]
    return () => unsubs.forEach(u => u())
  }, [user])

  function handleAnalisar(e) {
    e.preventDefault()
    if (!form.valorTotal || Number(form.valorTotal) <= 0) return
    
    const res = analisarCompra(
      { ...form, valorTotal: Number(form.valorTotal), numParcelas: Number(form.numParcelas) },
      dados
    )
    setResultado(res)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">🛒 Posso Comprar?</h1>
        <p className="text-gray-600 mt-1">Descubra o impacto dessa compra no seu orçamento antes de gastar.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Formulário */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <form onSubmit={handleAnalisar} className="space-y-4">
            <Input label="O que você quer comprar?" required placeholder="Ex: PC Gamer" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} />
            <Input label="Preço (R$)" type="number" step="0.01" required value={form.valorTotal} onChange={e => setForm({...form, valorTotal: e.target.value})} />
            
            <Select 
              label="Forma de Pagamento" 
              options={[{value: '1', label: 'À vista'}, {value: '2', label: '2x'}, {value: '3', label: '3x'}, {value: '6', label: '6x'}, {value: '10', label: '10x'}, {value: '12', label: '12x'}]} 
              value={form.numParcelas} 
              onChange={e => setForm({...form, numParcelas: e.target.value})} 
            />
            
            {Number(form.numParcelas) > 1 && (
              <Select 
                label="Cartão de Crédito" 
                options={[{value: '', label: 'Selecione...'}, ...dados.cartoes.map(c => ({ value: c.id, label: c.nome }))]} 
                value={form.cartaoId} 
                onChange={e => setForm({...form, cartaoId: e.target.value})} 
              />
            )}

            <Button type="submit" className="w-full mt-2">Analisar Compra</Button>
          </form>
        </div>

        {/* Resultado */}
        <div>
          {!resultado ? (
            <div className="h-full flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-gray-400">
              Preencha os dados ao lado e o assistente dirá se a compra cabe no seu bolso.
            </div>
          ) : (
            <div className={`p-5 rounded-xl border-2 h-full ${
              resultado.status === 'green' ? 'bg-green-50 border-green-200' : 
              resultado.status === 'yellow' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
            }`}>
              <h3 className={`text-xl font-bold mb-3 ${
                resultado.status === 'green' ? 'text-green-700' : 
                resultado.status === 'yellow' ? 'text-yellow-700' : 'text-red-700'
              }`}>{resultado.titulo}</h3>
              
              <ul className="space-y-2 mb-4">
                {resultado.motivos.map((m, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span>•</span> {m}
                  </li>
                ))}
              </ul>

              {resultado.valorParcela > 0 && (
                <div className="bg-white/60 p-3 rounded-lg text-sm text-gray-800 font-medium">
                  Impacto mensal: {formatCurrency(resultado.valorParcela)} / mês
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="text-xs text-gray-400 text-center">
        * Esta é uma análise baseada nos dados informados por você, não constituindo garantia ou aconselhamento financeiro profissional.
      </div>
    </div>
  )
}
