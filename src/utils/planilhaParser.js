import * as XLSX from 'xlsx'

const MESES_MAP = { jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12 }

// Palavras-chave para ajudar o sistema a adivinhar
const KW_RECEITA = ['salario', 'salário', 'freela', 'vale', 'presente', 'investimento', 'rendimento', 'entrada']
const KW_RECORRENTE = ['aluguel', 'agua', 'água', 'luz', 'internet', 'celular', 'condominio', 'condomínio', 'netflix', 'spotify', 'academia']

function classificar(nome) {
  const lower = nome.toLowerCase()
  if (KW_RECEITA.some(k => lower.includes(k))) return 'receita'
  if (KW_RECORRENTE.some(k => lower.includes(k))) return 'recorrente'
  return 'despesa' // Se não for nenhum dos outros, é despesa
}

export function lerPlanilha(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })
  const resultado = []
  const hashControle = new Set() 
  let anoReferencia = new Date().getFullYear()

  workbook.SheetNames.forEach(sheetName => {
    const nomeAbaLower = sheetName.toLowerCase().trim()
    const mesReferencia = MESES_MAP[nomeAbaLower] || null

    // Pula abas de resumo ou que não são meses
    if (nomeAbaLower.includes('resumo') || nomeAbaLower.includes('página') || !mesReferencia) return

    const worksheet = workbook.Sheets[sheetName]
    const linhas = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' })

    if (linhas.length === 0) return

    // Tenta achar o ano no topo da aba
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
    
    // Procura a coluna de Data em qualquer lugar da linha
    cabecalho.forEach((col, idxData) => {
      if (col === 'data') {
        const idxCat = idxData + 1
        const idxValor = idxData + 2

        for (let i = linhaCabecalhoIdx + 1; i < linhas.length; i++) {
          const linha = linhas[i]
          if (!linha) continue

          let catVal = String(linha[idxCat] || '').trim()
          let valorVal = linha[idxValor]
          
          // Limpa o valor
          if (typeof valorVal === 'string') valorVal = valorVal.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')
          const valorNum = Number(valorVal)
          
          // Se não tiver valor ou o valor não for número, pula
          if (isNaN(valorNum) || valorNum === 0) continue

          // Se a categoria estiver vazia, tenta achar pela posição (esquerda = receita, direita = despesa)
          if (!catVal) {
            catVal = idxData < (cabecalho.length / 2) ? 'Receita Diversa' : 'Despesa Diversa'
          }

          let dataFormatada = ''
          const dataVal = linha[idxData]
          try {
            if (dataVal instanceof Date) dataFormatada = dataVal.toISOString().slice(0, 10)
            else if (typeof dataVal === 'string' && dataVal.includes('/')) {
              const [d, m, a] = dataVal.split('/')
              dataFormatada = `${a}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
            } else if (typeof dataVal === 'string' && dataVal.includes('-')) {
              dataFormatada = dataVal.slice(0, 10)
            } else if (typeof dataVal === 'number') {
              const date = new Date(Math.round((dataVal - 25569) * 86400 * 1000))
              dataFormatada = date.toISOString().slice(0, 10)
            }
          } catch(e) { }

          // Se não tiver data, usa o dia 1º do mês da aba
          if (!dataFormatada || dataFormatada.includes('NaN')) {
            dataFormatada = `${anoReferencia}-${String(mesReferencia).padStart(2, '0')}-01`
          }

          const hash = `${dataFormatada}-${catVal}-${valorNum}`
          if (hashControle.has(hash)) continue
          hashControle.add(hash)

          // AQUI ELE USA A INTELIGÊNCIA PARA CLASSIFICAR
          const tipoSugerido = classificar(catVal)

          resultado.push({
            data: dataFormatada,
            descricao: catVal, 
            valor: Math.abs(valorNum),
            tipo: tipoSugerido,
            categoria: catVal
          })
        }
      }
    })
  })

  return resultado
}
