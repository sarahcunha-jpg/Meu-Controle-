import * as XLSX from 'xlsx'

const MESES_MAP = { 
  jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, 
  jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12 
}

export function lerPlanilha(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })
  const resultado = []
  const hashControle = new Set() 
  
  // Tenta achar o ano atual da planilha (procura por "202x" nas primeiras linhas)
  let anoReferencia = new Date().getFullYear()

  workbook.SheetNames.forEach(sheetName => {
    const nomeAbaLower = sheetName.toLowerCase().trim()
    const mesReferencia = MESES_MAP[nomeAbaLower] || null

    if (nomeAbaLower.includes('resumo') || nomeAbaLower.includes('página') || !mesReferencia) return

    const worksheet = workbook.Sheets[sheetName]
    const linhas = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' })

    if (linhas.length === 0) return

    // Tenta extrair o ano (ex: "Janeiro de 2026")
    for(let i=0; i < Math.min(6, linhas.length); i++) {
       const texto = linhas[i]?.join(' ')
       const matchAno = texto?.match(/20\d{2}/)
       if (matchAno) { anoReferencia = parseInt(matchAno[0]); break }
    }

    let linhaCabecalhoIdx = -1
    for (let i = 0; i < linhas.length; i++) {
      if (linhas[i] && linhas[i].some(celula => String(celula).toLowerCase().trim() === 'data')) {
        linhaCabecalhoIdx = i
        break
      }
    }

    if (linhaCabecalhoIdx === -1) return

    const cabecalho = linhas[linhaCabecalhoIdx].map(c => String(c || '').toLowerCase().trim())
    const colunasData = []
    cabecalho.forEach((col, index) => {
      if (col === 'data') colunasData.push(index)
    })

    colunasData.forEach(idxData => {
      const idxCat = idxData + 1
      const idxValor = idxData + 2

      if (cabecalho[idxCat]?.includes('cat') && cabecalho[idxValor]?.includes('valor')) {
        const isReceita = idxData < (cabecalho.length / 2)
        const tipo = isReceita ? 'receita' : 'despesa'

        for (let i = linhaCabecalhoIdx + 1; i < linhas.length; i++) {
          const linha = linhas[i]
          if (!linha) continue

          const catVal = String(linha[idxCat] || '').trim()
          let valorVal = linha[idxValor]
          
          // Limpa o valor se vier com R$ ou formatação
          if (typeof valorVal === 'string') valorVal = valorVal.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')
          
          const valorNum = Number(valorVal)
          if (isNaN(valorNum) || valorNum === 0) continue

          // Se não tiver categoria e for receita, assume Salário. Se despesa, Outros.
          let categoriaFinal = catVal
          if (!categoriaFinal) {
             categoriaFinal = isReceita ? 'Salário' : 'Outros'
          }

          let dataVal = linha[idxData]
          let dataFormatada = ''

          try {
            if (dataVal instanceof Date) {
              dataFormatada = dataVal.toISOString().slice(0, 10)
            } else if (typeof dataVal === 'string' && dataVal.includes('/')) {
              const [d, m, a] = dataVal.split('/')
              dataFormatada = `${a}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
            } else if (typeof dataVal === 'string' && dataVal.includes('-')) {
              dataFormatada = dataVal.slice(0, 10) // Já está em formato ISO
            } else if (typeof dataVal === 'number') {
              const date = new Date(Math.round((dataVal - 25569) * 86400 * 1000))
              dataFormatada = date.toISOString().slice(0, 10)
            }
          } catch(e) { }

          // SE NÃO TIVER DATA (ex: salário), usa o dia 1º do mês da aba!
          if (!dataFormatada || dataFormatada.includes('NaN')) {
            dataFormatada = `${anoReferencia}-${String(mesReferencia).padStart(2, '0')}-01`
          }

          const hash = `${dataFormatada}-${categoriaFinal}-${valorNum}-${tipo}`
          if (hashControle.has(hash)) continue
          hashControle.add(hash)

          resultado.push({
            data: dataFormatada,
            descricao: categoriaFinal, 
            valor: Math.abs(valorNum),
            tipo: tipo,
            categoria: categoriaFinal
          })
        }
      }
    })
  })

  return resultado
}
