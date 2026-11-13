import { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import { formatCurrency } from '../utils/formatCurrency'
import { resumoDashboard, gastosPorCategoria, filtrarMes } from '../utils/calculos'
import { useAuth } from '../hooks/useAuth'
import { useDate } from '../contexts/DateContext'
import { observarReceitas } from '../services/receitasService'
import { observarDespesas } from '../services/despesasService'
import { observarParcelas } from '../services/comprasService'
import { observarRecorrentes, observarPuladas } from '../services/recorrentesService'
import { observarContasGuardadas } from '../services/guardaContasService'
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
  const [puladas, setPuladas] = useState([])
  const [cofrinho, setCofrinho] = useState([])

  useEffect(() => {
    if (!user) return
    const u1 = observarReceitas(user.uid, setReceitas)
    const u2 = observarDespesas(user.uid, setDespesas)
    const u3 = observarParcelas(user.uid, setParcelas)
    const u4 = observarRecorrentes(user.uid, setRecorrentes)
    const u5 = observarPuladas(user.uid, setPuladas)
    const u6 = observarContasGuardadas(user.uid, setCofrinho)
    return () => { u1(); u2(); u3(); u4(); u5(); u6() }
  }, [user])

  const resumo = resumoDashboard(receitas, despesas, dataReferencia)
  const despesasMes = filtrarMes(despesas, dataReferencia)
  const porCategoria = gastosPorCategoria(despesasMes)
  
  const parcelasMes = filtrarMes(parcelas, dataReferencia, 'dataVencimento').filter(p => p.status !== 'pulada')
  const totalParcelasMes = parcelasMes.reduce((a, p) => a + Number(p.valor), 0)

  const totalRecorrentes = recorrentes
    .filter(r => !puladas.some(p => p.recorrenteId === r.id && Number(p.ano) === Number(ano) && Number(p.mes) === Number(mes + 1)))
    .reduce((a, r) => a + Number(r.valor), 0)

  const totalDespesasConsolidadas = resumo.despesasMes + totalParcelasMes + totalRecorrentes
  const saldoReal = resumo.receitasMes - totalDespesasConsolidadas

  // Cálculos do Cofrinho
  const cofrinhoMes = cofrinho.filter(c => Number(c.mes) === (mes + 1) && Number(c.ano) === ano)
  const totalCofrinho = cofrinhoMes.reduce((a, c) => a + Number(c.valorTotal), 0)
  const totalGuardado = cofrinhoMes.reduce((a, c) => a + Number(c.valorGuardado), 0)
  const faltaGuardar = totalCofrinho - totalGuardado

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600">Visão de {MESES[mes]} de {ano}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card title="Receitas do Mês" value={formatCurrency(resumo.receitasMes)} color="success" />
        <Card title="Despesas Totais" value={formatCurrency(totalDespesasConsolidadas)} color="danger" subtitle="Avulsas + Parcelas + Fixas" />
        <Card title="Saldo do Mês" value={formatCurrency(saldoReal)} color={saldoReal >= 0 ? 'success' : 'danger'} />
        <Card title="Falta Guardar" value={formatCurrency(faltaGuardar)} color={faltaGuardar > 0 ? 'warning' : 'success'} subtitle={`Guardado: ${formatCurrency(totalGuardado)}`} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Resumo dos seus Gastos</h3>
          <p className="text-3xl font-bold text-primary-700">{formatCurrency(totalDespesasConsolidadas)}</p>
          <p className="text-sm text-gray-600 mt-2">Tudo o que saiu da sua conta neste mês.</p>
          
          <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg flex flex-col gap-2">
            <div className="flex justify-between">
              <span>(-) Despesas Avulsas:</span>
              <span className="font-semibold">{formatCurrency(resumo.despesasMes)}</span>
            </div>
            <div className="flex justify-between">
              <span>(-) Faturas/Parcelas:</span>
              <span className="font-semibold">{formatCurrency(totalParcelasMes)}</span>
            </div>
            <div className="flex justify-between">
              <span>(-) Contas Fixas:</span>
              <span className="font-semibold">{formatCurrency(totalRecorrentes)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 mt-1 text-sm text-gray-800">
              <span>Saldo Final:</span>
              <span className={`font-bold ${saldoReal >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(saldoReal)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Cofrinho de Contas</h3>
          
          <div className="mt-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Total Guardado</span>
              <span className="font-bold text-green-600">{formatCurrency(totalGuardado)}</span>
            </div>
            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: `${totalCofrinho > 0 ? (totalGuardado / totalCofrinho) * 100 : 0}%` }}></div>
            </div>
            <div className="flex justify-between text-sm mt-3 mb-1">
              <span className="text-gray-600">Falta Guardar</span>
              <span className="font-bold text-red-500">{formatCurrency(faltaGuardar)}</span>
            </div>
            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
              <div className="h-full bg-red-500" style={{ width: `${totalCofrinho > 0 ? (faltaGuardar / totalCofrinho) * 100 : 0}%` }}></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Gastos por categoria (avulsos neste mês)</h3>
          <div className="h-64">
            {porCategoria.length === 0 ? (
              <p className="text-sm text-gray-500 mt-10 text-center">Nenhuma despesa avulsa neste mês.</p>
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
