import { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import { formatCurrency } from '../utils/formatCurrency'
import { resumoDashboard, gastosPorCategoria, filtrarMes } from '../utils/calculos'
import { useAuth } from '../hooks/useAuth'
import { useDate } from '../contexts/DateContext'
import { observarReceitas } from '../services/receitasService'
import { observarDespesas } from '../services/despesasService'
import { observarParcelas } from '../services/comprasService'
import { observarRecorrentes, observarStatus } from '../services/recorrentesService'
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
  const [statusRec, setStatusRec] = useState([])
  const [cofrinho, setCofrinho] = useState([])

  useEffect(() => {
    if (!user) return
    const u1 = observarReceitas(user.uid, setReceitas)
    const u2 = observarDespesas(user.uid, setDespesas)
    const u3 = observarParcelas(user.uid, setParcelas)
    const u4 = observarRecorrentes(user.uid, setRecorrentes)
    const u5 = observarStatus(user.uid, setStatusRec)
    const u6 = observarContasGuardadas(user.uid, setCofrinho)
    return () => { u1(); u2(); u3(); u4(); u5(); u6() }
  }, [user])

  const resumo = resumoDashboard(receitas, despesas, dataReferencia)
  const despesasMes = filtrarMes(despesas, dataReferencia)
  const porCategoria = gastosPorCategoria(despesasMes)
  
  // === PARCELAS ===
  const parcelasMes = filtrarMes(parcelas, dataReferencia, 'dataVencimento')
  const parcelasPagas = parcelasMes.filter(p => p.status === 'paga').reduce((a, p) => a + Number(p.valor), 0)
  
  // Bruto: tudo que está pendente (sem descontar cofrinho)
  const parcelasPendentesBruto = parcelasMes.filter(p => p.status === 'pendente').reduce((a, p) => a + Number(p.valor), 0)

  // === RECORRENTES ===
  const getStatusRec = (id) => {
    const s = statusRec.find(r => r.recorrenteId === id && Number(r.ano) === Number(ano) && Number(r.mes) === Number(mes + 1))
    return s ? s.status : 'pendente'
  }
  const recPagas = recorrentes.filter(r => getStatusRec(r.id) === 'paga').reduce((a, r) => a + Number(r.valor), 0)
  // Bruto: contas fixas pendentes
  const recPendentesBruto = recorrentes.filter(r => getStatusRec(r.id) === 'pendente').reduce((a, r) => a + Number(r.valor), 0)

  // === COFRINHO (A MÁGICA ACONTECE AQUI) ===
  const cofrinhoMes = cofrinho.filter(c => Number(c.mes) === (mes + 1) && Number(c.ano) === ano)
  const totalGuardado = cofrinhoMes.reduce((a, c) => a + Number(c.valorGuardado), 0)

  // Quanto do cofrinho é para abater parcelas?
  const cofrinhoParaParcelas = cofrinhoMes
    .filter(c => parcelasMes.some(p => p.id === c.origemId && p.status === 'pendente'))
    .reduce((acc, c) => acc + Number(c.valorGuardado), 0)

  // Quanto do cofrinho é para abater contas fixas?
  const cofrinhoParaRecorrentes = cofrinhoMes
    .filter(c => recorrentes.some(r => r.id === c.origemId && getStatusRec(r.id) === 'pendente'))
    .reduce((acc, c) => acc + Number(c.valorGuardado), 0)

  // Líquido: O que falta pagar de verdade (valor bruto - valor guardado)
  const parcelasPendentesLiquido = Math.max(0, parcelasPendentesBruto - cofrinhoParaParcelas)
  const recPendentesLiquido = Math.max(0, recPendentesBruto - cofrinhoParaRecorrentes)

  // === CONSOLIDAÇÃO GERAL (Para os cards de cima) ===
  // As despesas totais continuam sendo as despesas totais do mês (não mudam com o cofrinho)
  const totalDespesasConsolidadas = resumo.despesasMes + parcelasPagas + parcelasPendentesBruto + recPagas + recPendentesBruto
  const saldoReal = resumo.receitasMes - totalDespesasConsolidadas

  // Para o Balanço: Pagamento Líquido (descontando o cofrinho)
  const totalFaltaPagarGeral = parcelasPendentesLiquido + recPendentesLiquido

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-800 tracking-tight">Dashboard</h1>
        <p className="text-sm font-medium text-gray-500">Visão de {MESES[mes]} de {ano}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="Receitas" value={formatCurrency(resumo.receitasMes)} color="success" />
        <Card title="Despesas Totais" value={formatCurrency(totalDespesasConsolidadas)} color="danger" subtitle="Tudo o que foi gasto" />
        <Card title="Saldo do Mês" value={formatCurrency(saldoReal)} color={saldoReal >= 0 ? 'primary' : 'dark'} />
        <Card title="Guardado no Cofrinho" value={formatCurrency(totalGuardado)} color="warning" subtitle="Já separado" />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        
        {/* BALANÇO DE CONTAS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 col-span-1 flex flex-col">
          <div className="flex justify-between items-end mb-4">
            <h3 className="font-bold text-gray-800 text-lg">Balanço de Contas</h3>
          </div>
          
          <div className="space-y-5 flex-1">
            
            {/* BLOCO 1: CONTAS FIXAS */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-bold text-gray-700 flex items-center gap-1">📅 Contas Fixas</span>
                <span className="text-xs font-bold text-gray-500">{((recPagas / (recPagas + recPendentesLiquido || 1)) * 100).toFixed(0)}% Pago</span>
              </div>
              
              <div className="flex justify-between text-xs mb-2">
                <span className="text-green-600 font-semibold">Pago: {formatCurrency(recPagas)}</span>
                <div className="text-right">
                  <span className="text-red-500 font-semibold">Falta: {formatCurrency(recPendentesLiquido)}</span>
                  {cofrinhoParaRecorrentes > 0 && (
                    <p className="text-[10px] text-blue-500">(-{formatCurrency(cofrinhoParaRecorrentes)} do cofrinho)</p>
                  )}
                </div>
              </div>
              
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${(recPagas / (recPagas + recPendentesBruto || 1)) * 100}%` }}></div>
              </div>
            </div>

            {/* BLOCO 2: PARCELAS */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-bold text-gray-700 flex items-center gap-1">💳 Faturas/Parcelas</span>
                <span className="text-xs font-bold text-gray-500">{((parcelasPagas / (parcelasPagas + parcelasPendentesLiquido || 1)) * 100).toFixed(0)}% Pago</span>
              </div>
              
              <div className="flex justify-between text-xs mb-2">
                <span className="text-green-600 font-semibold">Pago: {formatCurrency(parcelasPagas)}</span>
                <div className="text-right">
                  <span className="text-orange-500 font-semibold">Falta: {formatCurrency(parcelasPendentesLiquido)}</span>
                  {cofrinhoParaParcelas > 0 && (
                    <p className="text-[10px] text-blue-500">(-{formatCurrency(cofrinhoParaParcelas)} do cofrinho)</p>
                  )}
                </div>
              </div>
              
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500" style={{ width: `${(parcelasPagas / (parcelasPagas + parcelasPendentesBruto || 1)) * 100}%` }}></div>
              </div>
            </div>

            {/* BLOCO 3: O COFRINHO DETALHADO */}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex justify-between text-sm mb-3">
                <span className="font-bold text-gray-700 flex items-center gap-1">🐷 Cofrinho</span>
              </div>
              
              {cofrinhoMes.length === 0 ? (
                <p className="text-xs text-gray-400">Nenhuma conta no cofrinho.</p>
              ) : (
                <div className="space-y-3">
                  {cofrinhoMes.map(c => {
                    const pct = Math.min(100, (Number(c.valorGuardado) / Number(c.valorTotal)) * 100)
                    return (
                      <div key={c.id}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 font-medium truncate max-w-[120px]" title={c.nome}>{c.nome}</span>
                          <span className="text-blue-600 font-bold">{formatCurrency(c.valorGuardado)} <span className="text-gray-400 font-normal">de {formatCurrency(c.valorTotal)}</span></span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>

          <div className="bg-blue-50 p-3 rounded-xl mt-5 text-xs text-blue-800 font-medium text-center">
            Se você pagar tudo agora, seu saldo final será <strong className={saldoReal >= 0 ? 'text-blue-700' : 'text-red-600'}>{formatCurrency(saldoReal)}</strong>.
          </div>
        </div>

        {/* Gráfico Receitas x Despesas */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 col-span-2">
          <h3 className="font-bold text-gray-800 mb-2 text-lg">Receitas x Despesas</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={[
                { nome: 'Receitas', valor: resumo.receitasMes },
                { nome: 'Despesas', valor: totalDespesasConsolidadas }
              ]}>
                <XAxis dataKey="nome" tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip formatter={(v) => formatCurrency(v)} cursor={{fill: 'transparent'}} />
                <Bar dataKey="valor" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Gastos por Categoria */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-2 text-lg">Gastos por Categoria (Avulsos)</h3>
          <div className="h-64">
            {porCategoria.length === 0 ? (
              <p className="text-sm text-gray-400 mt-10 text-center font-medium">Nenhuma despesa avulsa neste mês.</p>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={porCategoria} dataKey="valor" nameKey="categoria" outerRadius={90} innerRadius={60} label>
                    {porCategoria.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
      </div>
    </div>
  )
}
