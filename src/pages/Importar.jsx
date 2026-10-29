import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { lerPlanilha } from '../utils/planilhaParser'
import { criarReceita, observarReceitas } from '../services/receitasService'
import { criarDespesa, observarDespesas } from '../services/despesasService'
import { criarRecorrente, observarRecorrentes } from '../services/recorrentesService'
import { criarCompraParcelada, observarCompras } from '../services/comprasService'
import { observarCartoes, criarCartao } from '../services/cartoesService'
import { Button } from '../components/ui/Button'
import { CATEGORIAS_DESPESA, CATEGORIAS_RECEITA } from '../utils/categorias'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'

export default function Importar() {
  const { user } = useAuth()
  const [dados, setDados] = useState([])
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState('')
  
  // Dados existentes para checar duplicidade
  const [existentes, setExistentes] = useState({ receitas: [], despesas: [], recorrentes: [], compras: [], cartoes: [] })

  useEffect(() => {
    if (!user) return
    const u1 = observarReceitas(user.uid, v => setExistentes(d => ({...d, receitas: v})))
    const u2 = observarDespesas(user.uid, v => setExistentes(d => ({...d, despesas: v})))
    const u3 = observarRecorrentes(user.uid, v => setExistentes(d => ({...d, recorrentes: v})))
    const u4 = observarCompras(user.uid, v => setExistentes(d => ({...d, compras: v})))
    const u5 = observarCartoes(user.uid, v => setExistentes(d => ({...d, cartoes: v})))
    return () => { u1(); u2(); u3(); u4(); u5() }
  }, [user])

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setErro('')
    setSucesso('')

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target.result
        const transacoes = lerPlanilha(arrayBuffer)
        if (transacoes.length === 0) throw new Error("Nenhuma transação encontrada.")
        setDados(transacoes)
      } catch (err) {
        setErro(err.message)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  function handleMudarTipo(index, novoTipo) {
    const novosDados = [...dados]
    novosDados[index].tipo = novoTipo
    setDados(novosDados)
  }

  function handleMudarCategoria(index, novaCategoria) {
    const novosDados = [...dados]
    novosDados[index].categoria = novaCategoria
    novosDados[index].descricao = novaCategoria
    setDados(novosDados)
  }

  async function handleConfirmar() {
    setLoading(true)
    
    try {
      // 1. Montar Set de hashes do que já existe no banco
      const hashExistentes = new Set()
      
      existentes.receitas.forEach(r => hashExistentes.add(`${r.data}-${r.descricao}-${r.valor}-receita`))
      existentes.despesas.forEach(d => hashExistentes.add(`${d.data}-${d.descricao}-${d.valor}-despesa`))
      existentes.compras.forEach(c => hashExistentes.add(`${c.dataCompra}-${c.descricao}-${c.valorTotal}-parcelada`))
      existentes.recorrentes.forEach(r => hashExistentes.add(`-${r.nome}-${r.valor}-recorrente`)) // Recorrente não tem data fixa

      // 2. Separar o que é novo do que é duplicado
      const novos = []
      const duplicados = []
      
      dados.forEach(t => {
        const hash = `${t.data}-${t.descricao}-${t.valor}-${t.tipo}`
        const isRecorrente = t.tipo === 'recorrente' ? `-${t.descricao}-${t.valor}-recorrente` : hash
        
        if (t.tipo !== 'recorrente' && hashExistentes.has(hash)) duplicados.push(t)
        else if (t.tipo === 'recorrente' && hashExistentes.has(isRecorrente)) duplicados.push(t)
        else novos.push(t)
      })

      // 3. Perguntar ao usuário sobre os duplicados
      let importarTudo = [...novos]
      
      if (duplicados.length > 0) {
        const msg = `Encontramos ${novos.length} lançamentos novos e ${duplicados.length} que já existem no sistema.\n\nDeseja adicionar TAMBÉM os que já existem?\n\nClique em OK para adicionar todos, ou Cancelar para importar só os novos.`
        const querDuplicar = window.confirm(msg)
        if (querDuplicar) importarTudo = [...novos, ...duplicados]
      }

      if (importarTudo.length === 0) {
         setSucesso('Nenhum lançamento novo para importar (todos já existiam).')
         setLoading(false)
         return
      }

      // 4. Salvar no Firebase
      let cartaoIdParaParceladas = existentes.cartoes[0]?.id
      
      // Se for importar parceladas e não tem cartão, cria um "Cartão Importado"
      if (importarTudo.some(t => t.tipo === 'parcelada') && !cartaoIdParaParceladas) {
         const novoCartaoRef = await criarCartao(user.uid, { nome: 'Cartão Importado', limite: 99999, diaFechamento: 1, diaVencimento: 10 })
         // Como não temos o retorno do ID no service, vamos pegar o mais recente na próxima renderização, mas para a importação atual, vamos buscar ou usar um ID fictício
         // Para simplificar, vamos apenas salvar como despesa se não tiver cartão.
      }

      for (const t of importarTudo) {
        if (t.tipo === 'receita') {
          await criarReceita(user.uid, { descricao: t.descricao, valor: t.valor, categoria: t.categoria, data: t.data })
        } else if (t.tipo === 'recorrente') {
          await criarRecorrente(user.uid, { nome: t.descricao, valor: t.valor, categoria: t.categoria })
        } else if (t.tipo === 'parcelada') {
          if (cartaoIdParaParceladas) {
             await criarCompraParcelada(user.uid, { descricao: t.descricao, valorTotal: t.valor, numParcelas: 1, cartaoId: cartaoIdParaParceladas, dataCompra: t.data })
          } else {
             await criarDespesa(user.uid, { descricao: t.descricao, valor: t.valor, categoria: t.categoria, data: t.data, formaPagamento: 'Crédito' })
          }
        } else {
          await criarDespesa(user.uid, { descricao: t.descricao, valor: t.valor, categoria: t.categoria, data: t.data, formaPagamento: 'Transferência' })
        }
      }

      setSucesso(`${importarTudo.length} lançamentos importados! (${novos.length} novos, ${importarTudo.length - novos.length} duplicados adicionados)`)
      setDados([])
    } catch (err) {
      setErro('Erro ao salvar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Importar Planilha</h1>
        <p className="text-sm text-gray-600">Traga seus gastos do Excel ou Google Sheets</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-semibold mb-2">1. Selecione o arquivo</h3>
        <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFile} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700" />
        {erro && <p className="text-red-500 text-sm mt-2">{erro}</p>}
        {sucesso && <p className="text-green-600 font-bold text-sm mt-2">{sucesso}</p>}
      </div>

      {dados.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">2. Revise os lançamentos</h3>
            <p className="text-sm text-gray-500">Encontramos {dados.length} transações</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-sm text-left text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Descrição</th>
                    <th className="px-4 py-3">Vai para...</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.map((t, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="px-4 py-2 whitespace-nowrap">{formatDate(t.data)}</td>
                      <td className="px-4 py-2">{t.descricao}</td>
                      <td className="px-4 py-2">
                        <select value={t.tipo} onChange={e => handleMudarTipo(i, e.target.value)} className="text-xs border rounded p-1 font-bold text-primary-700">
                          <option value="despesa">Despesa</option>
                          <option value="receita">Receita</option>
                          <option value="recorrente">Conta Recorrente</option>
                          <option value="parcelada">Compra Parcelada</option>
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <select value={t.categoria} onChange={e => handleMudarCategoria(i, e.target.value)} className="text-xs border rounded p-1 max-w-[150px]">
                          {t.tipo === 'receita' ? CATEGORIAS_RECEITA.map(c => <option key={c} value={c}>{c}</option>) : CATEGORIAS_DESPESA.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className={`px-4 py-2 text-right font-bold ${t.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.tipo === 'receita' ? '+' : '-'}{formatCurrency(t.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDados([])}>Cancelar</Button>
            <Button onClick={handleConfirmar} disabled={loading}>{loading ? 'Importando...' : 'Confirmar Importação'}</Button>
          </div>
        </div>
      )}
    </div>
  )
}
