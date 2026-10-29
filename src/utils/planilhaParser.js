import * as XLSX from 'xlsx'

export function lerPlanilha(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })
  const resultado = []
  const datasProcessadas = new Set() // Evita duplicar se ler a mesma aba duas vezes

  // Percorre todas as abas da planilha
  workbook.SheetNames.forEach(sheetName => {
    // Ignora abas de resumo ou vazias
    if (sheetName.toLowerCase().includes('resumo') || sheetName.toLowerCase().includes('página')) return

    const worksheet = workbook.Sheets[sheetName]
    const linhas = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    // Procura a linha que tem o cabeçalho "Data"
    let linhaCabecalhoIdx = -1
    for (let i = 0; i < linhas.length; i++) {
      if (linhas[i] && linhas[i].some(celula => String(celula).toLowerCase().trim() === 'data')) {
        linhaCabecalhoIdx = i
        break
      }
    }

    if (linhaCabecalhoIdx === -1) return // Se não achou "Data", pula a aba

    const cabecalho = linhas[linhaCabecalhoIdx].map(c => String(c || '').toLowerCase().trim())
    
    // Encontra todas as colunas chamadas "Data"
    const colunasData = []
    cabecalho.forEach((col, index) => {
      if (col === 'data') colunasData.push(index)
    })

    // Para cada coluna "Data" encontrada, tenta ler a Categoria e o Valor ao lado
    colunasData.forEach(idxData => {
      const idxCat = idxData + 1
      const idxValor = idxData + 2

      // Verifica se as colunas seguintes são Categoria e Valor
      if (cabecalho[idxCat]?.includes('cat') && cabecalho[idxValor]?.includes('valor')) {
        
        // Define se é Receita ou Despesa baseado na posição da coluna
        // Se a coluna de Data estiver na metade esquerda da tabela, é Receita. Se for na direita, é Despesa.
        const tipo = idxData < (cabecalho.length / 2) ? 'receita' : 'despesa'

        // Lê as linhas abaixo do cabeçalho
        for (let i = linhaCabecalhoIdx + 1; i < linhas.length; i++) {
          const linha = linhas[i]
          if (!linha) continue

          const dataVal = linha[idxData]
          const catVal = String(linha[idxCat] || '').trim()
          const valorVal = linha[idxValor]

          // Se a linha não tiver data, categoria ou valor, pula
          if (!dataVal || !catVal || valorVal === undefined || valorVal === null) continue
          
          // Se o valor não for um número, pula (ignora fórmulas de texto)
          const valorNum = Number(valorVal)
          if (isNaN(valorNum)) continue

          let dataFormatada = ''
          try {
            if (dataVal instanceof Date) {
              dataFormatada = dataVal.toISOString().slice(0, 10)
            } else if (typeof dataVal === 'string' && dataVal.includes('/')) {
              const [d, m, a] = dataVal.split('/')
              dataFormatada = `${a}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
            } else if (typeof dataVal === 'number') {
              const date = new Date(Math.round((dataVal - 25569) * 86400 * 1000))
              dataFormatada = date.toISOString().slice(0, 10)
            }
          } catch(e) { continue }

          if (!dataFormatada || dataFormatada.includes('NaN')) continue

          // Evita duplicar o mesmo lançamento caso a aba repita
          const hash = `${dataFormatada}-${catVal}-${valorNum}-${tipo}`
          if (datasProcessadas.has(hash)) continue
          datasProcessadas.add(hash)

          resultado.push({
            data: dataFormatada,
            descricao: catVal, // Usa a Categoria como Descrição
            valor: Math.abs(valorNum),
            tipo: tipo,
            categoria: catVal // Mantém a categoria original
          })
        }
      }
    })
  })

  return resultado
}
