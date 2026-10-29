import * as XLSX from 'xlsx'

const MESES_MAP = { 
  jan: 1, janeiro: 1, fev: 2, fevereiro: 2, mar: 3, março: 3, abr: 4, abril: 4, 
  mai: 5, maio: 5, jun: 6, junho: 6, jul: 7, julho: 7, ago: 8, agosto: 8, 
  set: 9, setembro: 9, out: 10, outubro: 10, nov: 11, novembro: 11, dez: 12, dezembro: 12 
}

const KW_RECEITA = ['salario', 'salário', 'freela', 'vale', 'presente', 'investimento', 'rendimento', 'entrada', 'receita']
const KW_RECORRENTE = ['aluguel', 'agua', 'água', 'luz', 'internet', 'celular', 'condominio', 'condomínio', 'academia']
const KW_PARCELADA = ['nubank', 'cartao', 'cartão', 'santander', 'renner', 'shopee', 'riachuelo', 'oboticario', 'empréstimo', 'emprestimo']

function classificar(nome, isLeft) {
  const lower = String(nome).toLowerCase()
  if (KW_RECEITA.some(k => lower.includes(k))) return 'receita'
  if (KW_RECORRENTE.some(k => lower.includes(k))) return 'recorrente'
  if (KW_PARCELADA.some(k => lower.includes(k))) return 'parcelada'
  if (isLeft) return 'receita' // Se estiver na esquerda e não for nada específico, é receita
  return 'despesa'
}

// Função super segura para ler valores
function parseCurrency(val) {
  if (typeof val === 'number') return val
  if (!val) return 0
  let str = String(val).replace(/[R$\s]/g, '')
  if (str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.')
  }
  return Number(str)
}

export function lerPlanilha(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })
  const resultado = []
  const hashControle = new Set() 
  let anoReferencia = new Date().getFullYear()

  workbook.SheetNames.forEach(sheetName => {
    const nomeAbaLower = sheetName.toLowerCase().trim()
    const mesReferencia = MESES_MAP[nomeAbaLower] || null

    if (nomeAbaLower.includes('resumo') || nomeAbaLower.includes('página') || !mesReferencia) return

    const worksheet = workbook.Sheets[sheetName]
    const linhas = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' })

    if (linhas.length === 0) return

    // Tenta achar o ano no topo da aba
    for(let i=0; i < Math.min(10, linhas.length); i++) {
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
    
    cabecalho.forEach((col, idxData) => {
      if (col === 'data') {
        const idxCat = idxData + 1
        const idxValor = idxData + 2
        const isLeftSide = idxData < (cabecalho.length / 2)

        for (let i = linhaCabecalhoIdx + 1; i < linhas.length; i++) {
          const linha = linhas[i]
          if (!linha) continue

          let catVal = String(linha[idxCat] || '').trim()
          const valorNum = parseCurrency(linha[idxValor])
          
          if (isNaN(valorNum) || valorNum === 0) continue

          if (!catVal) catVal = isLeftSide ? 'Receita Diversa' : 'Despesa Diversa'

          let dataFormatada = ''
          const dataVal = linha[idxData]
          try {
            if (dataVal instanceof Date) {
              dataFormatada = dataVal.toISOString().slice(0, 10)
            } else if (typeof dataVal === 'string' && dataVal.includes('/')) {
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

          resultado.push({
            data: dataFormatada,
            descricao: catVal, 
            valor: Math.abs(valorNum),
            tipo: classificar(catVal, isLeftSide),
            categoria: catVal
          })
        }
      }
    })
  })

  return resultado
}
