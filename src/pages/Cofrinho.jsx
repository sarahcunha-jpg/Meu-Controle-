import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useDate } from '../contexts/DateContext'
import { observarContasGuardadas, criarContaCofrinho, depositarNaConta, excluirContaCofrinho } from '../services/guardaContasService'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { formatCurrency } from '../utils/formatCurrency'

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function Cofrinho() {
  const { user } = useAuth()
  const { mes, ano } = useDate()
  const [contas, setContas] = useState([])
  
  // Estados do Modal de Criar
  const [openNovo, setOpenNovo] = useState(false)
  const [formNovo, setFormNovo] = useState({ nome: '', valorTotal: '' })

  // Estados do Modal de Depositar
  const [openDeposito, setOpenDeposito] = useState(false)
  const [contaSelecionada, setContaSelecionada] = useState(null)
  const [valorDeposito, setValorDeposito] = useState('')

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    return observarContasGuardadas(user.uid, setContas)
  }, [user])

  // Filtra as contas apenas do mês e ano selecionados
  const contasDoMes = contas.filter(c => Number(c.mes) === (mes + 1) && Number(c.ano) === ano)

  async function handleCriarConta(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await criarContaCofrinho(user.uid, {
        nome: formNovo.nome,
        valorTotal: Number(formNovo.valorTotal),
        mes: mes + 1,
        ano: ano
      })
      setOpenNovo(false)
      setFormNovo({ nome: '', valorTotal: '' })
    } catch (err) { alert(err.message) } finally { setLoading(false) }
  }

  async function handleDepositar(e) {
    e.preventDefault()
    if (!contaSelecionada) return
    setLoading(true)
    try {
      await depositarNaConta(contaSelecionada.id, Number(valorDeposito))
      setOpenDeposito(false)
      setValorDeposito('')
      setContaSelecionada(null)
    } catch (err) { alert(err.message) } finally { setLoading(false) }
  }

  function abrirDeposito(conta) {
    setContaSelecionada(conta)
    setValorDeposito('')
    setOpenDeposito(true)
  }

  // Cálculos totais do mês
  const totalContas = contasDoMes.reduce((a, c) => a + Number(c.valorTotal), 0)
  const totalGuardado = contasDoMes.reduce((a, c) => a + Number(c.valorGuardado), 0)
  const totalFalta = totalContas - totalGuardado

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cofrinho de Contas</h1>
          <p className="text-sm text-gray-600">Separe o dinheiro aos poucos para pagar suas contas de {MESES[mes]}</p>
        </div>
        <Button onClick={() => setOpenNovo(true)}>+ Nova Conta para Guardar</Button>
      </div>

      {/* Resumo do Cofrinho no Mês */}
      <div className="grid grid-cols-3 gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase">Total das Contas</p>
          <p className="text-lg font-bold text-gray-800">{formatCurrency(totalContas)}</p>
        </div>
        <div>
          <p className="text-xs text-green-600 font-semibold uppercase">Já Guardado</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(totalGuardado)}</p>
        </div>
        <div>
          <p className="text-xs text-red-600 font-semibold uppercase">Falta Guardar</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(totalFalta)}</p>
        </div>
      </div>

      {/* Lista de Contas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {contasDoMes.length === 0 ? (
          <p className="p-6 text-sm text-gray-500 text-center">Nenhuma conta adicionada ao cofrinho neste mês.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {contasDoMes.map(c => {
              const falta = Number(c.valorTotal) - Number(c.valorGuardado)
              const pct = Math.min(100, (Number(c.valorGuardado) / Number(c.valorTotal)) * 100)
              const concluido = falta <= 0

              return (
                <div key={c.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-lg">{c.nome}</p>
                    
                    <div className="w-full bg-gray-200 h-2 rounded-full mt-2 overflow-hidden">
                      <div className={`h-full ${concluido ? 'bg-green-500' : 'bg-primary-500'}`} style={{ width: `${pct}%` }}></div>
                    </div>
                    
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-green-600 font-bold">{formatCurrency(c.valorGuardado)} guardado</span>
                      <span className="text-gray-500">Total: {formatCurrency(c.valorTotal)}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end min-w-[120px]">
                    <p className={`text-sm font-bold ${concluido ? 'text-green-600' : 'text-red-500'}`}>
                      {concluido ? 'Completo! 🎉' : `Falta ${formatCurrency(falta)}`}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => abrirDeposito(c)}
                      className="text-xs px-3 py-2 rounded font-bold bg-primary-50 text-primary-700 hover:bg-primary-100"
                    >
                      + Guardar
                    </button>
                    <button 
                      onClick={() => {
                        if(window.confirm('Excluir esta conta do cofrinho?')) excluirContaCofrinho(c.id)
                      }}
                      className="text-xs text-red-600 hover:underline px-2"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL CRIAR CONTA */}
      <Modal open={openNovo} onClose={() => setOpenNovo(false)} title="Nova Conta no Cofrinho">
        <form onSubmit={handleCriarConta} className="space-y-3">
          <Input label="Nome da Conta (ex: Aluguel, Luz)" required value={formNovo.nome} onChange={e => setFormNovo({...formNovo, nome: e.target.value})} />
          <Input label="Valor Total da Conta (R$)" type="number" step="0.01" required value={formNovo.valorTotal} onChange={e => setFormNovo({...formNovo, valorTotal: e.target.value})} />
          <Button type="submit" disabled={loading} className="w-full">Criar Cofrinho</Button>
        </form>
      </Modal>

      {/* MODAL DEPOSITAR */}
      <Modal 
        open={openDeposito} 
        onClose={() => setOpenDeposito(false)} 
        title={`Guardar dinheiro para: ${contaSelecionada?.nome}`}
      >
        <form onSubmit={handleDepositar} className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 text-center border border-blue-100">
            Você já guardou <strong>{formatCurrency(contaSelecionada?.valorGuardado || 0)}</strong>.<br/>
            Faltam <strong>{formatCurrency((contaSelecionada?.valorTotal || 0) - (contaSelecionada?.valorGuardado || 0))}</strong>.
          </div>
          
          <Input 
            label="Quanto você está guardando agora? (R$)" 
            type="number" 
            step="0.01" 
            required 
            autoFocus
            value={valorDeposito} 
            onChange={e => setValorDeposito(e.target.value)} 
          />
          
          <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
            Confirmar e Guardar
          </Button>
        </form>
      </Modal>
    </div>
  )
}
