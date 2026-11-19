const getCor = (valor, max) => {
  if (valor === 0) return 'bg-gray-100 dark:bg-slate-700/50 text-gray-400'
  const pct = valor / max
  if (pct < 0.2) return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
  if (pct < 0.4) return 'bg-green-300 dark:bg-green-700/60 text-green-900 dark:text-green-100'
  if (pct < 0.6) return 'bg-yellow-300 dark:bg-yellow-600/60 text-yellow-900 dark:text-yellow-100'
  if (pct < 0.8) return 'bg-orange-400 dark:bg-orange-600/80 text-white'
  return 'bg-red-500 text-white'
}

export function Heatmap({ despesas, mes, ano }) {
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay()
  const diasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

  // Agrupa gastos por dia
  const gastosPorDia = {}
  despesas.forEach(d => {
    if (!d.data) return
    const dia = Number(d.data.split('-')[2])
    gastosPorDia[dia] = (gastosPorDia[dia] || 0) + Number(d.valor)
  })

  const maxGasto = Math.max(...Object.values(gastosPorDia), 1)
  const blocosVazios = Array(primeiroDiaSemana).fill(null)
  const dias = Array.from({ length: diasNoMes }, (_, i) => i + 1)

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="font-bold text-gray-800 dark:text-white mb-4">Mapa de Gastos Diários</h3>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {diasSemana.map((d, i) => <div key={i} className="text-center text-xs font-bold text-gray-400">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {blocosVazios.map((_, i) => <div key={`vazio-${i}`} />)}
        {dias.map(dia => {
          const gasto = gastosPorDia[dia] || 0
          return (
            <div 
              key={dia} 
              className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-bold transition-colors cursor-pointer ${getCor(gasto, maxGasto)}`}
              title={`Dia ${dia}: ${gasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
            >
              {dia}
            </div>
          )
        })}
      </div>
      <div className="flex justify-end items-center gap-2 mt-4 text-xs text-gray-500 font-medium">
        <span>Menos</span>
        <div className="w-3 h-3 bg-gray-100 dark:bg-slate-700 rounded-sm"></div>
        <div className="w-3 h-3 bg-green-300 dark:bg-green-700 rounded-sm"></div>
        <div className="w-3 h-3 bg-yellow-300 rounded-sm"></div>
        <div className="w-3 h-3 bg-orange-400 rounded-sm"></div>
        <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
        <span>Mais</span>
      </div>
    </div>
  )
}
