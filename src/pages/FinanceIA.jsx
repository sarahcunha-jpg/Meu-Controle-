import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { observarReceitas } from '../services/receitasService'
import { observarDespesas } from '../services/despesasService'
import { observarParcelas } from '../services/comprasService'
import { observarCartoes } from '../services/cartoesService'
import { observarRecorrentes } from '../services/recorrentesService'
import { observarOrcamentos } from '../services/orcamentosService'
import { gerarAnalisesIA } from '../utils/calculos'
import { Alert } from '../components/ui/Alert'

export default function FinanceIA() {
  const { user } = useAuth()
  const [dados, setDados] = useState({ receitas: [], despesas: [], parcelas: [], cartoes: [], recorrentes: [], orcamentos: [] })

  useEffect(() => {
    if (!user) return
    const unsubs = [
      observarReceitas(user.uid, v => setDados(d => ({ ...d, receitas: v }))),
      observarDespesas(user.uid, v => setDados(d => ({ ...d, despesas: v }))),
      observarParcelas(user.uid, v => setDados(d => ({ ...d, parcelas: v }))),
      observarCartoes(user.uid, v => setDados(d => ({ ...d, cartoes: v }))),
      observarRecorrentes(user.uid, v => setDados(d => ({ ...d, recorrentes: v }))),
      observarOrcamentos(user.uid, v => setDados(d => ({ ...d, orcamentos: v })))
    ]
    return () => unsubs.forEach(u => u())
  }, [user])

  const insights = gerarAnalisesIA(dados.receitas, dados.despesas, dados.parcelas, dados.cartoes, dados.recorrentes, dados.orcamentos)

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🤖 Finance IA</h1>
        <p className="text-sm text-gray-600">Análises inteligentes baseadas no seu comportamento financeiro</p>
      </div>

      <div className="space-y-3">
        {insights.length === 0 ? (
          <div className="bg-white p-6 rounded-xl border border-gray-100 text-center text-gray-500">
            Ainda não há dados suficientes para gerar análises. Cadastre mais receitas e despesas!
          </div>
        ) : (
          insights.map((insight, idx) => (
            <div key={idx} className={`p-4 rounded-xl border-l-4 shadow-sm bg-white ${
              insight.tipo === 'danger' ? 'border-red-500' : 
              insight.tipo === 'warning' ? 'border-yellow-500' : 
              insight.tipo === 'success' ? 'border-green-500' : 'border-blue-500'
            }`}>
              <p className="text-gray-800 font-medium">{insight.texto}</p>
            </div>
          ))
        )}
      </div>
      <div className="text-xs text-gray-400 mt-4 text-center">
        A Finance IA usa regras pré-definidas para analisar seus dados, não substituindo um consultor financeiro.
      </div>
    </div>
  )
}
