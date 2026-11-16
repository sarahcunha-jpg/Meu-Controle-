import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useDate } from '../contexts/DateContext'
import { observarReceitas } from '../services/receitasService'
import { observarDespesas } from '../services/despesasService'
import { observarParcelas } from '../services/comprasService'
import { observarRecorrentes, observarStatus } from '../services/recorrentesService'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'
import { exportarCSV } from '../utils/exportar'
import { Button } from '../components/ui/Button'
import { useTheme } from '../contexts/ThemeContext'

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function Relatorios() {
  const { user } = useAuth()
  const { mes, ano } = useDate()
  const { theme } = useTheme()

  const [receitas, setReceitas] = useState([])
  const [despesas, setDespesas] = useState([])
  const [parcelas, setParcelas] = useState([])
  const [recorrentes, setRecorrentes] = useState([])
  const [statusRec, setStatusRec] = useState([])
  const [filtroTipo, setFiltroTipo] = useState('todos')

  useEffect(() => {
    if (!user) return
    const u1 = observarReceitas(user.uid, setReceitas)
    const u2 = observarDespesas(user.uid, setDespesas)
    const u3 = observarParcelas(user.uid, setParcelas)
    const u4 = observarRecorrentes(user.uid, setRecorrentes)
    const u5 = observarStatus(user.uid, setStatusRec)
    return () => { u1(); u2(); u3(); u4(); u5() }
  }, [user])

  const getStatusRec = (id) => {
    const s = statusRec.find(r => r.recorrenteId === id && Number(r.ano) === Number(ano) && Number(r.mes) === Number(mes + 1))
    return s ? s.status : 'pendente'
  }

  // --- MONTAGEM DA LISTA UNIFICADA ---
  const todasTransacoes = [
    ...receitas.map(r => ({
      id: r.id, data: r.data, descricao: r.descricao, categoria: r.categoria,
      tipo: 'Receita', status: 'Recebido', valor: Number(r.valor)
    })),
    ...despesas.map(d => ({
      id: d.id, data: d.data, descricao: d.descricao, categoria: d.categoria,
      tipo: 'Despesa', status: 'Pago', valor: Number(d.valor)
    })),
    ...parcelas.map(p => ({
      id: p.id, data: p.dataVencimento, descricao: `${p.descricao} (${p.numero}/${p.totalParcelas})`,
      categoria: 'Cartão de Crédito', tipo: 'Parcela',
      status: p.status === 'paga' ? 'Pago' : p.status === 'pulada' ? 'Pulado' : 'Pendente', valor: Number(p.valor)
    })),
    ...recorrentes
      .filter(r => getStatusRec(r.id) !== 'pulada')
      .map(r => ({
        id: r.id, data: `${ano}-${String(mes + 1).padStart(2, '0')}-01`, descricao: r.nome,
        categoria: r.categoria, tipo: 'Conta Fixa',
        status: getStatusRec(r.id) === 'paga' ? 'Pago' : 'Pendente', valor: Number(r.valor)
      }))
  ]

  // Filtra pelo mês selecionado e pelo filtro de tipo
  const filtradas = todasTransacoes.filter(t => {
    if (!t.data) return false
    const [y, m] = t.data.split('-')
    const bateMes = Number(m) === (mes + 1) && Number(y) === ano
    const bateTipo = filtroTipo === 'todos' ? true : t.tipo === filtroTipo
    return bateMes && bateTipo
  }).sort((a, b) => a.data.localeCompare(b.data))

  // Cálculos
  const totalEntradas = filtradas.filter(t => t.tipo === 'Receita').reduce((a, t) => a + t.valor, 0)
  const totalSaidas = filtradas.filter(t => t.tipo !== 'Receita').reduce((a, t) => a + t.valor, 0)
  const saldo = totalEntradas - totalSaidas

  function handleExportar() {
    const dadosParaExportar = filtradas.map(t => ({
      Data: t.data, Tipo: t.tipo, Status: t.status, Descricao: t.descricao, Categoria: t.categoria,
      Valor: t.valor.toFixed(2).replace('.', ',')
    }))
    exportarCSV(dadosParaExportar, `Relatorio_${MESES[mes]}_${ano}`)
  }

  // Componente para os Badges de Status
  const StatusBadge = ({ status }) => {
    const map = {
      'Pago': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'Recebido': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'Pendente': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      'Pulado': 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400'
    }
    return <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${map[status] || map['Pendente']}`}>{status}</span>
  }

  // Componente para os Tipos
  const TipoBadge = ({ tipo }) => {
    const map = {
      'Receita': 'text-green-600 bg-green-50 dark:bg-green-900/20',
      'Despesa': 'text-red-600 bg-red-50 dark:bg-red-900/20',
      'Parcela': 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
      'Conta Fixa': 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
    }
    return <span className={`px-2 py-1 rounded text-xs font-bold ${map[tipo]}`}>{tipo}</span>
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto print:max-w-full print:m-0 print:p-0">
      
      {/* CABEÇALHO DA PÁGINA (Oculto na Impressão) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">Relatórios</h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Extrato completo de {MESES[mes]} de {ano}</p>
        </div>
        
        <div className="flex gap-2 no-print">
          <Button variant="secondary" onClick={() => window.print()} className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            Imprimir PDF
          </Button>
          <Button onClick={handleExportar} className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* CABEÇALHO PARA IMPRESSÃO (Só aparece no PDF) */}
      <div className="hidden print:block mb-8 border-b-2 border-gray-800 pb-4">
        <h1 className="text-2xl font-black text-black">Meu Controle+</h1>
        <p className="text-gray-600">Relatório Financeiro - {MESES[mes]} de {ano}</p>
        <p className="text-gray-500 text-sm mt-1">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      {/* FILTROS E RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-3 print:gap-4 print:mb-6">
        
        {/* Seletor de Filtro */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 col-span-1 print:hidden">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Filtrar Visualização</label>
          <select 
            value={filtroTipo} 
            onChange={e => setFiltroTipo(e.target.value)} 
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-gray-50 dark:bg-slate-700 font-bold text-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Tudo (Extrato Completo)</option>
            <option value="Receita">Apenas Receitas</option>
            <option value="Despesa">Apenas Despesas Avulsas</option>
            <option value="Parcela">Apenas Faturas/Parcelas</option>
            <option value="Conta Fixa">Apenas Contas Fixas</option>
          </select>
        </div>
        
        {/* Cards de Resumo (Estilizados para a tela e para o papel) */}
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-800/50 flex flex-col justify-center print:border-green-600 print:bg-white">
          <p className="text-xs text-green-700 dark:text-green-400 font-bold uppercase tracking-wider print:text-green-700">Total Entradas</p>
          <p className="text-xl font-black text-green-700 dark:text-green-400 print:text-green-700">{formatCurrency(totalEntradas)}</p>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-800/50 flex flex-col justify-center print:border-red-600 print:bg-white">
          <p className="text-xs text-red-700 dark:text-red-400 font-bold uppercase tracking-wider print:text-red-700">Total Saídas</p>
          <p className="text-xl font-black text-red-700 dark:text-red-400 print:text-red-700">{formatCurrency(totalSaidas)}</p>
        </div>
        
        <div className={`p-4 rounded-2xl border flex flex-col justify-center print:bg-white ${saldo >= 0 ? 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/50 print:border-blue-600' : 'bg-orange-50 border-orange-100 dark:bg-orange-900/20 dark:border-orange-800/50 print:border-orange-600'}`}>
          <p className={`text-xs font-bold uppercase tracking-wider ${saldo >= 0 ? 'text-blue-700 dark:text-blue-400 print:text-blue-700' : 'text-orange-700 dark:text-orange-400 print:text-orange-700'}`}>Resultado Líquido</p>
          <p className={`text-xl font-black ${saldo >= 0 ? 'text-blue-700 dark:text-blue-400 print:text-blue-700' : 'text-orange-700 dark:text-orange-400 print:text-orange-700'}`}>{formatCurrency(saldo)}</p>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden print:shadow-none print:border-none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700 print:bg-gray-100 print:text-black">
              <tr>
                <th className="px-5 py-4 font-bold">Data</th>
                <th className="px-5 py-4 font-bold">Descrição</th>
                <th className="px-5 py-4 font-bold">Tipo</th>
                <th className="px-5 py-4 font-bold">Status</th>
                <th className="px-5 py-4 font-bold text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-12 text-center text-gray-500 dark:text-gray-400 font-medium">
                    Nenhuma movimentação encontrada para este filtro.
                  </td>
                </tr>
              ) : (
                filtradas.map((t, i) => (
                  <tr key={`${t.id}-${i}`} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap font-medium">{formatDate(t.data)}</td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-gray-900 dark:text-white print:text-black">{t.descricao}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{t.categoria}</p>
                    </td>
                    <td className="px-5 py-4">
                      <TipoBadge tipo={t.tipo} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className={`px-5 py-4 text-right font-black whitespace-nowrap ${t.tipo === 'Receita' ? 'text-green-600 dark:text-green-400 print:text-black' : 'text-red-600 dark:text-red-400 print:text-black'}`}>
                      {t.tipo === 'Receita' ? '+' : '-'}{formatCurrency(t.valor)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSS PARA FORÇAR A IMPRESSÃO BONITA */}
      <style>{`
        @media print {
          @page { margin: 1cm; }
          body { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          .no-print { display: none !important; }
          header, aside { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; width: 100% !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  )
}
