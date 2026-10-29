import { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import { formatCurrency } from '../utils/formatCurrency'
import { resumoDashboard, gastosPorCategoria, totalParcelado, calcularPrevisaoMes } from '../utils/calculos'
import { useAuth } from '../hooks/useAuth'
import { observarReceitas } from '../services/receitasService'
import { observarDespesas } from '../services/despesasService'
import { observarParcelas } from '../services/comprasService'
import { observarRecorrentes } from '../services/recorrentesService'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const CORES = ['#0ea5e9', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#64748b']

export default function Dashboard() {
  const { user } = useAuth()
  const [receitas, setReceitas] = useState([])
  const [despesas, setDespesas] = useState([])
  const [parcelas, setParcelas] = useState([])
  const [recorrentes, setRecorrentes] = useState([])

  useEffect(() => {
    if (!user) return
    const u1 = observarReceitas(user.uid, setReceitas)
    const u2 = observarDespesas(user.uid, setDespesas)
    const u3 = observarParcelas(user.uid, setParcelas)
    const u4 = observarRecorrentes(user.uid, setRecorrentes)
    return () => { u1(); u2(); u3(); u4() }
  }, [user])

  const resumo = resumoDashboard(receitas, despesas)
  const porCategoria = gastosPorCategoria(despesas)
  const totalParc = totalParcelado(parcelas)
  const previsao = calcularPrevisaoMes(receitas, despesas, parcelas, recorrentes)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600">Visão geral do seu dinheiro</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card title="Saldo atual" value={formatCurrency(resumo.saldoAtual)} color={resumo.saldoAtual >= 0 ? 'success' : 'danger'} />
        <Card title="Receitas do mês" value={formatCurrency(resumo.receitasMes)} color="success" />
        <Card title="Despesas do mês" value={formatCurrency(resumo.despesasMes)} color="danger" />
        <Card title="Total Parcelado" value={formatCurrency(totalParc)} color="warning" subtitle="Cartões" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Previsão do Próximo Mês</h3>
          <p className="text-3xl font-bold text-primary-700">{formatCurrency(previsao.saldoPrevisto)}</p>
          <p className="text-sm text-gray-600 mt-2">Estimativa considerando suas parcelas futuras e contas recorrentes.</p>
          <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <p>Contas Recorrentes: -{formatCurrency(previsao.totalRecorrentes)}</p>
            <p>Parcelas Próximo Mês: -{formatCurrency(previsao.parcelasProx)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Receitas x Despesas</h3>
          <div className="h-48">
            <ResponsiveContainer>
              <BarChart data={[
                { nome: 'Receitas', valor: receitas.reduce((a, r) => a + Number(r.valor || 0), 0) },
                { nome: 'Despesas', valor: despesas.reduce((a, d) => a + Number(d.valor || 0), 0) }
              ]}>
                <XAxis dataKey="nome" />
                <YAxis />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="valor" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
         <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Gastos por categoria</h3>
          <div className="h-64">
            {porCategoria.length === 0 ? (
              <p className="text-sm text-gray-500 mt-10 text-center">Nenhuma despesa cadastrada ainda.</p>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={porCategoria} dataKey="valor" nameKey="categoria" outerRadius={80} label>
                    {porCategoria.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div></div>
      </div>
    </div>
  )
}
