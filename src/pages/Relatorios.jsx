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

  // --- MONTAGEM DA LISTA UNIFICADA ---
  const todasTransacoes = [
    // 1. Receitas
    ...receitas.map(r => ({
      id: r.id,
      data: r.data,
      descricao: r.descricao,
      categoria: r.categoria,
      tipo: 'Receita',
      status: 'Recebido',
      valor: Number(r.valor)
    })),
    // 2. Despesas Avulsas
    ...despesas.map(d => ({
      id: d.id,
      data: d.data,
      descricao: d.descricao,
      categoria: d.categoria,
      tipo: 'Despesa',
      status: 'Pago',
      valor: Number(d.valor)
    })),
    // 3. Parcelas de Cartão
    ...parcelas.map(p => ({
      id: p.id,
      data: p.dataVencimento,
      descricao: `${p.descricao} (${p.numero}/${p.totalParcelas})`,
      categoria: 'Cartão de Crédito',
      tipo: 'Parcela',
      status: p.status === 'paga' ? 'Pago' : p.status === 'pulada' ? 'Pulado' : 'Pendente',
      valor: Number(p.valor)
    })),
    // 4. Contas Recorrentes (ignorando as puladas)
    ...recorrentes
      .filter(r => getStatusRec(r.id) !== 'pulada')
      .map(r => ({
        id: r.id,
        data: `${ano}-${String(mes + 1).padStart(2, '0')}-01`, // Usa o dia 1º do mês para ordenar
        descricao: r.nome,
        categoria: r.categoria,
        tipo: 'Conta Fixa',
        status: getStatusRec(r.id) === 'paga' ? 'Pago' : 'Pendente',
        valor: Number(r.valor)
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
      Data: t.data,
      Tipo: t.tipo,
      Status: t.status,
      Descricao: t.descricao,
      Categoria: t.categoria,
      Valor: t.valor.toFixed(2).replace('.', ',')
    }))
    
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    exportarCSV(dadosParaExportar, `Relatorio_Completo_${meses[mes]}_${ano}`)
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-sm text-gray-600">Extrato completo de todas as movimentações</p>
        </div>
        
        <div className="flex gap-2 no-print">
          <Button variant="secondary" onClick={() => window.print()}>Imprimir PDF</Button>
          <Button onClick={handleExportar}>Exportar CSV</Button>
        </div>
      </div>

      {/* Filtros e Resumo */}
      <div className="grid md:grid-cols-4 gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="md:col-span-1">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Filtrar por Tipo</label>
          <select 
            value={filtroTipo} 
            onChange={e => setFiltroTipo(e.target.value)} 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white font-medium"
          >
            <option value="todos">Tudo (Extrato Completo)</option>
            <option value="Receita">Apenas Receitas</option>
            <option value="Despesa">Apenas Despesas Avulsas</option>
            <option value="Parcela">Apenas Parcelas de Cartão</option>
            <option value="Conta Fixa">Apenas Contas Recorrentes</option>
          </select>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex flex-col justify-center">
          <p className="text-xs text-green-700 font-bold uppercase">Entradas</p>
          <p className="text-lg font-bold text-green-700">{formatCurrency(totalEntradas)}</p>
        </div>
        
        <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex flex-col justify-center">
          <p className="text-xs text-red-700 font-bold uppercase">Saídas</p>
          <p className="text-lg font-bold text-red-700">{formatCurrency(totalSaidas)}</p>
        </div>
        
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex flex-col justify-center">
          <p className="text-xs text-blue-700 font-bold uppercase">Resultado</p>
          <p className={`text-lg font-bold ${saldo >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{formatCurrency(saldo)}</p>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    Nenhuma movimentação encontrada para este filtro.
                  </td>
                </tr>
              ) : (
                filtradas.map((t, i) => (
                  <tr key={`${t.id}-${i}`} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(t.data)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{t.descricao}</p>
                      <p className="text-[10px] text-gray-400">{t.categoria}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        t.tipo === 'Receita' ? 'bg-green-100 text-green-700' : 
                        t.tipo === 'Despesa' ? 'bg-red-100 text-red-700' : 
                        t.tipo === 'Parcela' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {t.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold ${
                        t.status === 'Pago' || t.status === 'Recebido' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${t.tipo === 'Receita' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.tipo === 'Receita' ? '+' : '-'}{formatCurrency(t.valor)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSS para impressão */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          aside, header, nav { display: none !important; }
          main { width: 100% !important; margin: 0 !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  )
}
