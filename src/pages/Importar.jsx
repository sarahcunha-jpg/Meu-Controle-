import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { lerPlanilha } from '../utils/planilhaParser'
import { criarReceita, observarReceitas } from '../services/receitasService'
import { criarDespesa, observarDespesas } from '../services/despesasService'
import { criarRecorrente, observarRecorrentes } from '../services/recorrentesService'
import { criarCompraParcelada, observarCompras } from '../services/comprasService'
import { observarCartoes, criarCartao } from '../services/cartoesService'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { CATEGORIAS_DESPESA, CATEGORIAS_RECEITA } from '../utils/categorias'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'

export default function Importar() {
  const { user } = useAuth()
  const [dados, setDados] = useState([])
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState('')
  
  const [mostrarModalDup, setMostrarModalDup] = useState(false)
  const [contagemDup, setContagemDup] = useState({ novos: 0, duplicados: 0, listaNovos: [], listaDups: [] })

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
    setErro(''); setSucesso('')
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const transacoes = lerPlanilha(event.target.result)
        if (transacoes.length === 0) throw new Error("Nenhuma transação encontrada.")
        setDados(transacoes)
      } catch (err) { setErro(err.message) }
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

  // FUNÇÃO NOVA: Excluir linha da importação
  function handleExcluirLinha(index) {
    const novosDados = [...dados]
    novosDados.splice(index, 1)
    setDados(novosDados)
  }

  function prepararImportacao() {
    if (dados.length === 0) return

    const hashExistentes = new Set()
    existentes.receitas.forEach(r => hashExistentes.add(`${r.data}-${r.descricao}-${r.valor}-receita`))
    existentes.despesas.forEach(d => hashExistentes.add(`${d.data}-${d.descricao}-${d.valor}-despesa`))
    existentes.compras.forEach(c => hashExistentes.add(`${c.dataCompra}-${c.descricao}-${c.valorTotal}-parcelada`))
    existentes.recorrentes.forEach(r => hashExistentes.add(`-${r.nome}-${r.valor}-recorrente`))

    const listaNovos = []
    const listaDups = []
    
    dados.forEach(t => {
      const hash = t.tipo === 'recorrente' 
        ? `-${t.descricao}-${t.valor}-recorrente` 
        : `${t.data}-${t.descricao}-${t.valor}-${t.tipo}`

      if (hashExistentes.has(hash)) listaDups.push(t)
      else listaNovos.push(t)
    })

    setContagemDup({ novos: listaNovos.length, duplicados: listaDups.length, listaNovos, listaDups })
    setMostrarModalDup(true)
  }

  async function executarImportacao(importarDuplicados) {
    setMostrarModalDup(false)
    setLoading(true)
    setErro('')

    const paraImportar = importarDuplicados 
      ? [...contagemDup.listaNovos, ...contagemDup.listaDups] 
      : contagemDup.listaNovos

    if (paraImportar.length === 0) {
      setSucesso('Nenhum lançamento novo. Todos já existiam.')
      setLoading(false)
      return
    }

    try {
      let cartaoId = existentes.cartoes[0]?.id
      if (paraImportar.some(t => t.tipo === 'parcelada') && !cartaoId) {
        await criarCartao(user.uid, { nome: 'Cartão Importado', limite: 10000, diaFechamento: 1, diaVencimento: 10 })
        alert('Criamos um cartão "Cartão Importado" com limite de R$ 10.000 para receber as compras parceladas.')
      }

      for (const t of paraImportar) {
        if (t.tipo === 'receita') {
          await criarReceita(user.uid, { descricao: t.descricao, valor: t.valor, categoria: t.categoria, data: t.data })
        } else if (t.tipo === 'recorrente') {
          await criarRecorrente(user.uid, { nome: t.descricao, valor: t.valor, categoria: t.categoria })
        } else if (t.tipo === 'parcelada') {
          const idCartao = existentes.cartoes[0]?.id
          if (idCartao) {
             await criarCompraParcelada(user.uid, { descricao: t.descricao, valorTotal: t.valor, numParcelas: 1, cartaoId: idCartao, dataCompra: t.data })
          } else {
             await criarDespesa(user.uid, { descricao: t.descricao, valor: t.valor, categoria: t.categoria, data: t.data, formaPagamento: 'Crédito' })
          }
        } else {
          await criarDespesa(user.uid, { descricao: t.descricao, valor: t.valor, categoria: t.categoria, data: t.data, formaPagamento: 'Transferência' })
        }
      }

      setSucesso(`${paraImportar.length} lançamentos importados com sucesso!`)
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
            <h3 className="font-semibold text-lg">2. Revise os lançamentos ({dados.length})</h3>
            <p className="text-sm text-gray-500">Confira os dados ou exclua o que não quiser.</p>
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
                    <th className="px-4 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.map((t, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="px-4 py-2 whitespace-nowrap">{formatDate(t.data)}</td>
                      <td className="px-4 py-2">{t.descricao}</td>
                      <td className="px-4 py-2">
                        <select value={t.tipo} onChange={e => handleMudarTipo(i, e.target.value)} className={`text-xs border rounded p-1 font-bold ${t.tipo === 'receita' ? 'text-green-600' : t.tipo === 'recorrente' ? 'text-blue-600' : t.tipo === 'parcelada' ? 'text-orange-600' : 'text-red-600'}`}>
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
                      <td className="px-4 py-2 text-center">
                        {/* BOTÃO DE EXCLUIR ADICIONADO AQUI */}
                        <button 
                          onClick={() => handleExcluirLinha(i)} 
                          className="text-red-500 hover:text-red-700 font-bold px-2 py-1 bg-red-50 rounded"
                          title="Excluir esta linha"
                        >
                          X
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDados([])}>Cancelar Tudo</Button>
            <Button onClick={prepararImportacao} disabled={loading}>Verificar e Importar</Button>
          </div>
        </div>
      )}

      {/* MODAL DE DUPLICADOS */}
      <Modal open={mostrarModalDup} onClose={() => setMostrarModalDup(false)} title="Aviso de Duplicados">
        <div className="space-y-4">
          <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg border border-yellow-200 text-sm">
            Encontramos <strong>{contagemDup.listaNovos.length}</strong> lançamentos novos e <strong>{contagemDup.listaDups.length}</strong> lançamentos que <strong>já existem</strong> no seu sistema.
          </div>
          
          <p className="text-sm text-gray-600">O que você deseja fazer?</p>

          <div className="flex flex-col gap-2">
            <Button onClick={() => executarImportacao(true)} className="w-full">
              Importar Todos ({contagemDup.listaNovos.length + contagemDup.listaDups.length})
            </Button>
            <Button onClick={() => executarImportacao(false)} variant="secondary" className="w-full">
              Importar Apenas os Novos ({contagemDup.listaNovos.length})
            </Button>
            <Button onClick={() => setMostrarModalDup(false)} variant="ghost" className="w-full">
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
