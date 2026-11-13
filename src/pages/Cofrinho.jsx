import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useDate } from '../contexts/DateContext'
import { observarContasGuardadas, criarContaCofrinho, alterarValorCofrinho, excluirContaCofrinho } from '../services/guardaContasService'
import { observarDespesas } from '../services/despesasService'
import { observarRecorrentes } from '../services/recorrentesService'
import { observarParcelas } from '../services/comprasService'
import { observarCartoes } from '../services/cartoesService'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { formatCurrency } from '../utils/formatCurrency'
import { filtrarMes } from '../utils/calculos'

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function Cofrinho() {
  const { user } = useAuth()
  const { mes, ano, dataReferencia } = useDate()
  
  const [contas, setContas] = useState([])
  const [despesas, setDespesas] = useState([])
  const [recorrentes, setRecorrentes] = useState([])
  const [parcelas, setParcelas] = useState([])
  const [cartoes, setCartoes] = useState([])
  
  const [openNovo, setOpenNovo] = useState(false)
  const [openMov, setOpenMov] = useState(false)
  
  const [tipoNovaConta, setTipoNovaConta] = useState('recorrente')
  const [contaSelecionadaId, setContaSelecionadaId] = useState('')
  const [valorMov, setValorMov] = useState('')
  const [acaoMov, setAcaoMov] = useState('depositar')
  const [contaMov, setContaMov] = useState(null)
  
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    const u1 = observarContasGuardadas(user.uid, setContas)
    const u2 = observarDespesas(user.uid, setDespesas)
    const u3 = observarRecorrentes(user.uid, setRecorrentes)
    const u4 = observarParcelas(user.uid, setParcelas)
    const u5 = observarCartoes(user.uid, setCartoes)
    return () => { u1(); u2(); u3(); u4(); u5() }
  }, [user])

  // Reseta o select quando abre o modal
  function abrirNovoModal() {
    setContaSelecionadaId('')
    setTipoNovaConta('recorrente')
    setOpenNovo(true)
  }

  const despesasMes = filtrarMes(despesas, dataReferencia)
  
  // Filtra parcelas pendentes
  const parcelasMes = filtrarMes(parcelas, dataReferencia, 'dataVencimento').filter(p => p.status === 'pendente')
  
  const contasDoMes = contas.filter(c => Number(c.mes) === (mes + 1) && Number(c.ano) === ano)

  const getCartaoNome = (id) => cartoes.find(c => c.id === id)?.nome || 'Cartão'

  // OPÇÕES: Filtra para não mostrar o que já está no cofrinho
  const opcoesRecorrentes = recorrentes
    .filter(r => !contasDoMes.some(c => c.origemId === r.id))
    .map(r => ({ value: `rec_${r.id}`, label: `${r.nome} (${formatCurrency(r.valor)})`, valor: r.valor, nome: r.nome, id: r.id }))
    
  const opcoesDespesas = despesasMes
    .filter(d => !contasDoMes.some(c => c.origemId === d.id))
    .map(d => ({ value: `des_${d.id}`, label: `${d.descricao} (${formatCurrency(d.valor)})`, valor: d.valor, nome: d.descricao, id: d.id }))
    
  const opcoesParcelas = parcelasMes
    .filter(p => !contasDoMes.some(c => c.origemId === p.id))
    .map(p => ({ 
      value: `par_${p.id}`, 
      label: `${getCartaoNome(p.cartaoId)} - ${p.descricao} (${p.numero}/${p.totalParcelas}) - ${formatCurrency(p.valor)}`, 
      valor: p.valor, 
      nome: `${getCartaoNome(p.cartaoId)} - ${p.descricao} (${p.numero}/${p.totalParcelas})`,
      id: p.id
    }))

  let opcoesAtuais = []
  if (tipoNovaConta === 'recorrente') opcoesAtuais = opcoesRecorrentes
  else if (tipoNovaConta === 'despesa') opcoesAtuais = opcoesDespesas
  else if (tipoNovaConta === 'parcela') opcoesAtuais = opcoesParcelas

  // Adiciona a opção padrão
  const opcoesSelect = opcoesAtuais.length > 0 
    ? [{ value: '', label: 'Selecione uma conta pendente...' }, ...opcoesAtuais] 
    : [{ value: '', label: 'Nenhuma conta pendente encontrada' }]

  async function handleCriarConta(e) {
    e.preventDefault()
    if (!contaSelecionadaId) return alert('Por favor, selecione uma conta na lista.')
    
    const escolhida = opcoesAtuais.find(o => o.value === contaSelecionadaId)
    if (!escolhida) return

    setLoading(true)
    try {
      await criarContaCofrinho(user.uid, {
        nome: escolhida.nome,
        valorTotal: escolhida.valor,
        origemId: escolhida.id, // Salva o ID para não aparecer de novo
        mes: mes + 1,
        ano: ano
      })
      setOpenNovo(false)
    } catch (err) { alert(err.message) } finally { setLoading(false) }
  }

  async function handleMovimentar(e) {
    e.preventDefault()
    if (!contaMov) return
    
    let valor = Number(valorMov)
    if (valor <= 0) return alert('Digite um valor maior que zero.')

    if (acaoMov === 'retirar') {
      if (valor > contaMov.valorGuardado) return alert('Você não pode retirar mais do que tem guardado.')
      valor = valor * -1
    }

    setLoading(true)
    try {
      await alterarValorCofrinho(contaMov.id, valor)
      setOpenMov(false)
      setValorMov('')
      setContaMov(null)
    } catch (err) { alert(err.message) } finally { setLoading(false) }
  }

  function abrirMovimentacao(conta, tipo) {
    setContaMov(conta)
    setAcaoMov(tipo)
    setValorMov('')
    setOpenMov(true)
  }

  const totalContas = contasDoMes.reduce((a, c) => a + Number(c.valorTotal), 0)
  const totalGuardado = contasDoMes.reduce((a, c) => a + Number(c.valorGuardado), 0)
  const totalFalta = Math.max(0, totalContas - totalGuardado)

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cofrinho de Contas</h1>
          <p className="text-sm text-gray-600">Separe o dinheiro para pagar suas contas de {MESES[mes]}</p>
        </div>
        <Button onClick={abrirNovoModal}>+ Adicionar ao Cofrinho</Button>
      </div>

      <div className="grid grid-cols-3 gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase">Total de Contas</p>
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
                      onClick={() => abrirMovimentacao(c, 'depositar')}
                      className="text-xs px-3 py-1.5 rounded font-bold bg-green-50 text-green-700 hover:bg-green-100"
                    >
                      + Guardar
                    </button>
                    <button 
                      onClick={() => abrirMovimentacao(c, 'retirar')}
                      className="text-xs px-3 py-1.5 rounded font-bold bg-red-50 text-red-700 hover:bg-red-100"
                    >
                      - Retirar
                    </button>
                    <button 
                      onClick={() => {
                        if(window.confirm('Excluir esta conta do cofrinho?')) excluirContaCofrinho(c.id)
                      }}
                      className="text-xs text-gray-400 hover:text-gray-600 px-1"
                    >
                      X
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal open={openNovo} onClose={() => setOpenNovo(false)} title="Adicionar Conta ao Cofrinho">
        <form onSubmit={handleCriarConta} className="space-y-3">
          <Select 
            label="De onde vem esta conta?" 
            options={[
              {value: 'recorrente', label: 'Conta Recorrente'},
              {value: 'despesa', label: 'Despesa do Mês'},
              {value: 'parcela', label: 'Fatura de Cartão (Parcela)'}
            ]} 
            value={tipoNovaConta} 
            onChange={e => { setTipoNovaConta(e.target.value); setContaSelecionadaId('') }} 
          />
          
          <Select 
            label="Selecione a conta" 
            options={opcoesSelect} 
            value={contaSelecionadaId} 
            onChange={e => setContaSelecionadaId(e.target.value)} 
            required
          />
          
          <Button type="submit" disabled={loading || opcoesAtuais.length === 0} className="w-full mt-2">
            Adicionar ao Cofrinho
          </Button>
        </form>
      </Modal>

      <Modal 
        open={openMov} 
        onClose={() => setOpenMov(false)} 
        title={acaoMov === 'depositar' ? `Guardar dinheiro para: ${contaMov?.nome}` : `Retirar dinheiro de: ${contaMov?.nome}`}
      >
        <form onSubmit={handleMovimentar} className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 text-center border border-blue-100">
            Você já guardou <strong>{formatCurrency(contaMov?.valorGuardado || 0)}</strong>.
          </div>
          
          <Input 
            label={acaoMov === 'depositar' ? "Quanto está guardando agora? (R$)" : "Quanto está retirando? (R$)"}
            type="number" 
            step="0.01" 
            required 
            autoFocus
            value={valorMov} 
            onChange={e => setValorMov(e.target.value)} 
          />
          
          <Button 
            type="submit" 
            disabled={loading} 
            className={`w-full ${acaoMov === 'depositar' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {acaoMov === 'depositar' ? 'Confirmar Depósito' : 'Confirmar Retirada'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
