import { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import { formatCurrency } from '../utils/formatCurrency'
import { resumoDashboard, gastosPorCategoria, filtrarMes } from '../utils/calculos'
import { useAuth } from '../hooks/useAuth'
import { useDate } from '../contexts/DateContext'
import { observarReceitas } from '../services/receitasService'
import { observarDespesas } from '../services/despesasService'
import { observarParcelas } from '../services/comprasService'
import { observarRecorrentes } from '../services/recorrentesService'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const CORES = ['#0ea5e9', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#64748b']
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function Dashboard() {
  const { user } = useAuth()
  const { mes, ano, dataReferencia } = useDate()
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

  // Cálculos focados no mês selecionado
  const resumo = resumoDashboard(receitas, despesas, dataReferencia)
  const despesasMes = filtrarMes(despesas, dataReferencia)
  const porCategoria = gastosPorCategoria(despesasMes)
  
  // Parcelas que vencem no mês selecionado
  const parcelasMes = filtrarMes(parcelas, dataReferencia, 'dataVencimento')
  const totalParcelasMes = parcelasMes.reduce((a, p) => a + Number(p.valor), 0)

  // Previsão (Mês selecionado + Contas fixas)
  const totalRecorrentes = recorrentes.reduce((a, r) => a + Number(r.valor), 0)
  const saldoPrevisto = resumo.saldoMes - totalRecorrentes - totalParcelasMes

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600">Visão de {MESES[mes]} de {ano}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card title="Receitas do Mês" value={formatCurrency(resumo.receitasMes)} color="success" />
        <Card title="Despesas do Mês" value={formatCurrency(resumo.despesasMes)} color="danger" />
        <Card title="Saldo do Mês" value={formatCurrency(resumo.saldoMes)} color={resumo.saldoMes >= 0 ? 'success' : 'danger'} />
        <Card title="Parcelas deste Mês" value={formatCurrency(totalParcelasMes)} color="warning" subtitle={`${parcelasMes.length} parcelas`} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Previsão Realista (Mês)</h3>
          <p className="text-3xl font-bold text-primary-700">{formatCurrency(saldoPrevisto)}</p>
          <p className="text-sm text-gray-600 mt-2">Saldo do mês descontando contas fixas e parcelas.</p>
          <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded flex flex-col gap-1">
            <p>(-) Contas Recorrentes: {formatCurrency(totalRecorrentes)}</p>
            <p>(-) Parcelas deste mês: {formatCurrency(totalParcelasMes)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Receitas x Despesas</h3>
          <div className="h-48">
            <ResponsiveContainer>
              <BarChart data={[
                { nome: 'Receitas', valor: resumo.receitasMes },
                { nome: 'Despesas', valor: resumo.despesasMes }
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
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Gastos por categoria (neste mês)</h3>
          <div className="h-64">
            {porCategoria.length === 0 ? (
              <p className="text-sm text-gray-500 mt-10 text-center">Nenhuma despesa neste mês.</p>
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
    </div>
  )
}
