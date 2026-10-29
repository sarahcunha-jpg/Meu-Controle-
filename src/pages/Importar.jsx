import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { lerCSV } from '../utils/csvParser'
import { criarReceita } from '../services/receitasService'
import { criarDespesa } from '../services/despesasService'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { CATEGORIAS_DESPESA, CATEGORIAS_RECEITA } from '../utils/categorias'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'

export default function Importar() {
  const { user } = useAuth()
  const [dados, setDados] = useState([])
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState('')

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setErro('')
    setSucesso('')

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const texto = event.target.result
        const transacoes = lerCSV(texto)
        if (transacoes.length === 0) throw new Error("Nenhuma transação encontrada no arquivo.")
        setDados(transacoes)
      } catch (err) {
        setErro(err.message)
      }
    }
    reader.readAsText(file, 'UTF-8')
  }

  function handleMudarCategoria(index, novaCategoria) {
    const novosDados = [...dados]
    novosDados[index].categoria = novaCategoria
    setDados(novosDados)
  }

  function handleMudarTipo(index, novoTipo) {
    const novosDados = [...dados]
    novosDados[index].tipo = novoTipo
    novosDados[index].categoria = novoTipo === 'despesa' ? 'Outros' : 'Salário'
    setDados(novosDados)
  }

  async function handleConfirmar() {
    if (!window.confirm(`Deseja importar ${dados.length} lançamentos?`)) return
    setLoading(true)
    setErro('')
    
    try {
      // Importa uma por uma (o Firebase limita lotes, então faremos um loop simples)
      for (const t of dados) {
        if (t.tipo === 'receita') {
          await criarReceita(user.uid, { descricao: t.descricao, valor: t.valor, categoria: t.categoria, data: t.data })
        } else {
          await criarDespesa(user.uid, { descricao: t.descricao, valor: t.valor, categoria: t.categoria, data: t.data, formaPagamento: 'Transferência' })
        }
      }
      setSucesso(`${dados.length} lançamentos importados com sucesso!`)
      setDados([])
    } catch (err) {
      setErro('Erro ao salvar no banco: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Importar Extrato</h1>
        <p className="text-sm text-gray-600">Traga seus gastos do banco de forma automática</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-semibold mb-2">1. Selecione o arquivo CSV</h3>
        <p className="text-xs text-gray-500 mb-3">O arquivo deve ter colunas de <strong>Data</strong>, <strong>Descrição</strong> e <strong>Valor</strong>.</p>
        <input type="file" accept=".csv" onChange={handleFile} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
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
                    <th className="px-4 py-3">Tipo</th>
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
                        <select value={t.tipo} onChange={e => handleMudarTipo(i, e.target.value)} className="text-xs border rounded p-1">
                          <option value="despesa">Despesa</option>
                          <option value="receita">Receita</option>
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <select value={t.categoria} onChange={e => handleMudarCategoria(i, e.target.value)} className="text-xs border rounded p-1 max-w-[150px]">
                          {t.tipo === 'receita' 
                            ? CATEGORIAS_RECEITA.map(c => <option key={c} value={c}>{c}</option>)
                            : CATEGORIAS_DESPESA.map(c => <option key={c} value={c}>{c}</option>)
                          }
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
