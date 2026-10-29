import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { observarReceitas } from '../services/receitasService'
import { observarDespesas } from '../services/despesasService'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'
import { exportarCSV } from '../utils/exportar'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export default function Relatorios() {
  const { user } = useAuth()
  const [receitas, setReceitas] = useState([])
  const [despesas, setDespesas] = useState([])
  
  const hoje = new Date()
  const [mesFiltro, setMesFiltro] = useState(hoje.getMonth())
  const [anoFiltro, setAnoFiltro] = useState(hoje.getFullYear())

  useEffect(() => {
    if (!user) return
    const u1 = observarReceitas(user.uid, setReceitas)
    const u2 = observarDespesas(user.uid, setDespesas)
    return () => { u1(); u2() }
  }, [user])

  // Junta receitas e despesas em uma única lista com um "tipo"
  const todasTransacoes = [
    ...receitas.map(r => ({ ...r, tipo: 'Receita' })),
    ...despesas.map(d => ({ ...d, tipo: 'Despesa' }))
  ]

  // Filtra pelo mês e ano selecionados
  const transacoesFiltradas = todasTransacoes.filter(t => {
    if (!t.data) return false
    const d = new Date(t.data + 'T00:00:00')
    return d.getMonth() === Number(mesFiltro) && d.getFullYear() === Number(anoFiltro)
  }).sort((a, b) => a.data.localeCompare(b.data)) // Ordena por data

  const totalReceitas = transacoesFiltradas.filter(t => t.tipo === 'Receita').reduce((a, t) => a + Number(t.valor), 0)
  const totalDespesas = transacoesFiltradas.filter(t => t.tipo === 'Despesa').reduce((a, t) => a + Number(t.valor), 0)
  const saldo = totalReceitas - totalDespesas

  function handleExportar() {
    // Prepara os dados para o CSV (tirando o UID e formatando)
    const dadosParaExportar = transacoesFiltradas.map(t => ({
      Data: t.data,
      Tipo: t.tipo,
      Descricao: t.descricao,
      Categoria: t.categoria,
      Forma_Pagamento: t.formaPagamento || '-',
      Valor: Number(t.valor).toFixed(2).replace('.', ',')
    }))
    
    exportarCSV(dadosParaExportar, `Relatorio_${MESES[mesFiltro]}_${anoFiltro}`)
  }

  const anosDisponiveis = [hoje.getFullYear(), hoje.getFullYear() - 1, hoje.getFullYear() - 2]

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-sm text-gray-600">Analise e exporte suas movimentações</p>
        </div>
        
        <div className="flex gap-2 no-print">
          <Button variant="secondary" onClick={() => window.print()}>Imprimir PDF</Button>
          <Button onClick={handleExportar}>Exportar CSV</Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end no-print">
        <div className="w-40">
          <Select 
            label="Mês" 
            options={MESES.map((m, i) => ({ value: i, label: m }))} 
            value={mesFiltro} 
            onChange={e => setMesFiltro(e.target.value)} 
          />
        </div>
        <div className="w-32">
          <Select 
            label="Ano" 
            options={anosDisponiveis.map(a => ({ value: a, label: a }))} 
            value={anoFiltro} 
            onChange={e => setAnoFiltro(e.target.value)} 
          />
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
          <p className="text-sm text-green-700 font-medium">Receitas</p>
          <p className="text-xl font-bold text-green-700">{formatCurrency(totalReceitas)}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
          <p className="text-sm text-red-700 font-medium">Despesas</p>
          <p className="text-xl font-bold text-red-700">{formatCurrency(totalDespesas)}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <p className="text-sm text-blue-700 font-medium">Saldo do Período</p>
          <p className={`text-xl font-bold ${saldo >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{formatCurrency(saldo)}</p>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {transacoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    Nenhuma movimentação encontrada neste período.
                  </td>
                </tr>
              ) : (
                transacoesFiltradas.map(t => (
                  <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">{formatDate(t.data)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{t.descricao}</td>
                    <td className="px-4 py-3">{t.categoria}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${t.tipo === 'Receita' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {t.tipo}
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

      {/* CSS para esconder os botões na hora de imprimir */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          aside { display: none !important; }
          main { width: 100% !important; }
        }
      `}</style>
    </div>
  )
}
