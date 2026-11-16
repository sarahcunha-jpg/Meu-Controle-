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

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function Relatorios() {
  const { user } = useAuth()
  const { mes, ano } = useDate()

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

  const todasTransacoes = [
    ...receitas.map(r => ({ id: r.id, data: r.data, descricao: r.descricao, categoria: r.categoria, tipo: 'Receita', status: 'Recebido', valor: Number(r.valor) })),
    ...despesas.map(d => ({ id: d.id, data: d.data, descricao: d.descricao, categoria: d.categoria, tipo: 'Despesa', status: 'Pago', valor: Number(d.valor) })),
    ...parcelas.map(p => ({ id: p.id, data: p.dataVencimento, descricao: `${p.descricao} (${p.numero}/${p.totalParcelas})`, categoria: 'Cartão de Crédito', tipo: 'Parcela', status: p.status === 'paga' ? 'Pago' : p.status === 'pulada' ? 'Pulado' : 'Pendente', valor: Number(p.valor) })),
    ...recorrentes.filter(r => getStatusRec(r.id) !== 'pulada').map(r => ({ id: r.id, data: `${ano}-${String(mes + 1).padStart(2, '0')}-01`, descricao: r.nome, categoria: r.categoria, tipo: 'Conta Fixa', status: getStatusRec(r.id) === 'paga' ? 'Pago' : 'Pendente', valor: Number(r.valor) }))
  ]

  const filtradas = todasTransacoes.filter(t => {
    if (!t.data) return false
    const [y, m] = t.data.split('-')
    const bateMes = Number(m) === (mes + 1) && Number(y) === ano
    const bateTipo = filtroTipo === 'todos' ? true : t.tipo === filtroTipo
    return bateMes && bateTipo
  }).sort((a, b) => a.data.localeCompare(b.data))

  const totalEntradas = filtradas.filter(t => t.tipo === 'Receita').reduce((a, t) => a + t.valor, 0)
  const totalSaidas = filtradas.filter(t => t.tipo !== 'Receita').reduce((a, t) => a + t.valor, 0)
  const saldo = totalEntradas - totalSaidas

  function handleExportar() {
    const dadosParaExportar = filtradas.map(t => ({
      Data: t.data, Tipo: t.tipo, Status: t.status, Descricao: t.descricao, Categoria: t.categoria, Valor: t.valor.toFixed(2).replace('.', ',')
    }))
    exportarCSV(dadosParaExportar, `Relatorio_${MESES[mes]}_${ano}`)
  }

  const StatusBadge = ({ status }) => {
    const map = {
      'Pago': 'bg-green-100 text-green-700 print:border print:border-green-600 print:text-black',
      'Recebido': 'bg-green-100 text-green-700 print:border print:border-green-600 print:text-black',
      'Pendente': 'bg-yellow-100 text-yellow-700 print:border print:border-yellow-600 print:text-black',
      'Pulado': 'bg-gray-100 text-gray-600 print:border print:border-gray-400 print:text-black'
    }
    return <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${map[status] || map['Pendente']}`}>{status}</span>
  }

  const TipoBadge = ({ tipo }) => {
    const map = {
      'Receita': 'text-green-600 print:text-black',
      'Despesa': 'text-red-600 print:text-black',
      'Parcela': 'text-orange-600 print:text-black',
      'Conta Fixa': 'text-blue-600 print:text-black'
    }
    return <span className={`text-xs font-bold ${map[tipo]}`}>{tipo}</span>
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto print:max-w-full print:m-0 print:p-0">
      
      {/* CABEÇALHO DA TELA (Oculto na Impressão) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">Relatórios</h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Extrato completo de {MESES[mes]} de {ano}</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => window.print()}>
            Imprimir PDF
          </Button>
          <Button onClick={handleExportar}>
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* CABEÇALHO PARA IMPRESSÃO (Só aparece no PDF) */}
      <div className="hidden print:flex justify-between items-end border-b-2 border-black pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-black">Meu Controle+</h1>
          <p className="text-gray-800 font-bold mt-1">Relatório Financeiro - {MESES[mes]} de {ano}</p>
        </div>
        <div className="text-right text-sm text-gray-600">
          <p>Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
          <p>Tipo: {filtroTipo === 'todos' ? 'Extrato Completo' : filtroTipo}</p>
        </div>
      </div>

      {/* FILTROS E RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-3 print:gap-4">
        
        {/* Seletor de Filtro (Oculto na impressão) */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 print:hidden">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Filtrar Visualização</label>
          <select 
            value={filtroTipo} 
            onChange={e => setFiltroTipo(e.target.value)} 
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-gray-50 dark:bg-slate-700 font-bold text-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Tudo (Extrato Completo)</option>
            <option value="Receita">Apenas Receitas</option>
            <option value="Despesa">Apenas Despesas</option>
            <option value="Parcela">Apenas Parcelas</option>
            <option value="Conta Fixa">Apenas Contas Fixas</option>
          </select>
        </div>
        
        {/* Cards de Resumo (Forçados a ficar lado a lado no PDF) */}
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800/50 flex flex-col justify-center print:border-green-600 print:bg-white print:p-2">
          <p className="text-xs text-green-700 dark:text-green-400 font-bold uppercase print:text-black">Entradas</p>
          <p className="text-lg font-black text-green-700 dark:text-green-400 print:text-black">{formatCurrency(totalEntradas)}</p>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800/50 flex flex-col justify-center print:border-red-600 print:bg-white print:p-2">
          <p className="text-xs text-red-700 dark:text-red-400 font-bold uppercase print:text-black">Saídas</p>
          <p className="text-lg font-black text-red-700 dark:text-red-400 print:text-black">{formatCurrency(totalSaidas)}</p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50 flex flex-col justify-center print:border-blue-600 print:bg-white print:p-2">
          <p className="text-xs text-blue-700 dark:text-blue-400 font-bold uppercase print:text-black">Resultado</p>
          <p className="text-lg font-black text-blue-700 dark:text-blue-400 print:text-black">{formatCurrency(saldo)}</p>
        </div>
      </div>

      {/* TABELA (Configurada para não cortar no PDF) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden print:border-none print:shadow-none">
        <div className="overflow-x-auto max-h-[600px] print:max-h-none print:overflow-visible">
          <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300 print:text-black">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700 print:bg-gray-200 print:text-black print:border-black">
              <tr>
                <th className="px-5 py-3 font-bold print:py-2">Data</th>
                <th className="px-5 py-3 font-bold print:py-2">Descrição</th>
                <th className="px-5 py-3 font-bold print:py-2">Tipo</th>
                <th className="px-5 py-3 font-bold print:py-2">Status</th>
                <th className="px-5 py-3 font-bold text-right print:py-2">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700 print:divide-gray-300">
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                    Nenhuma movimentação encontrada.
                  </td>
                </tr>
              ) : (
                filtradas.map((t, i) => (
                  <tr key={`${t.id}-${i}`} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 print:hover:bg-transparent">
                    <td className="px-5 py-3 whitespace-nowrap font-medium print:py-2">{formatDate(t.data)}</td>
                    <td className="px-5 py-3 print:py-2">
                      <p className="font-bold text-gray-900 dark:text-white print:text-black">{t.descricao}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 print:text-gray-600">{t.categoria}</p>
                    </td>
                    <td className="px-5 py-3 print:py-2">
                      <TipoBadge tipo={t.tipo} />
                    </td>
                    <td className="px-5 py-3 print:py-2">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className={`px-5 py-3 text-right font-black whitespace-nowrap print:py-2 print:text-black`}>
                      {t.tipo === 'Receita' ? '+' : '-'}{formatCurrency(t.valor)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSS DE IMPRESSÃO AVANÇADO */}
      <style>{`
        @media print {
          /* Remove margens padrão do navegador e configura a página */
          @page { margin: 1.5cm; size: A4 portrait; }
          
          /* Força a impressão das cores de fundo e texto */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          
          /* Esconde elementos de navegação */
          .print\\:hidden { display: none !important; }
          header, aside, nav, button { display: none !important; }
          
          /* Limpa o layout principal */
          body { background: white !important; }
          main { padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; }
          
          /* Evita que a tabela corte linhas no meio entre as páginas */
          table { page-break-inside: auto; width: 100%; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; } /* Repete o cabeçalho em todas as páginas */
        }
      `}</style>
    </div>
  )
}
