export function lerCSV(texto) {
  const linhas = texto.split(/\r?\n/).filter(l => l.trim() !== '')
  if (linhas.length < 2) return []

  // Descobre o separador (vírgula ou ponto e vírgula)
  const separador = linhas[0].includes(';') ? ';' : ','

  // Tenta achar os índices das colunas pelo cabeçalho
  const cabecalho = linhas[0].toLowerCase().split(separador)
  const idxData = cabecalho.findIndex(c => c.includes('data'))
  const idxDesc = cabecalho.findIndex(c => c.includes('descri') || c.includes('hist') || c.includes('title'))
  const idxValor = cabecalho.findIndex(c => c.includes('valor') || c.includes('quantia') || c.includes('amount'))

  if (idxData === -1 || idxDesc === -1 || idxValor === -1) {
    throw new Error("Não foi possível identificar as colunas de Data, Descrição ou Valor no arquivo.")
  }

  const resultado = []

  for (let i = 1; i < linhas.length; i++) {
    // Divide a linha respeitando aspas (ex: "Mercado, Pão de Açúcar")
    const colunas = linhas[i].split(separador)
    
    const dataStr = colunas[idxData]?.replace(/"/g, '').trim()
    const descStr = colunas[idxDesc]?.replace(/"/g, '').trim()
    let valorStr = colunas[idxValor]?.replace(/"/g, '').trim()

    if (!dataStr || !descStr || !valorStr) continue

    // Formata a data (de DD/MM/AAAA para AAAA-MM-DD)
    let dataFormatada = dataStr
    if (dataStr.includes('/')) {
      const [d, m, a] = dataStr.split('/')
      dataFormatada = `${a}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }

    // Limpa o valor
    let cleanValor = valorStr.replace(/[R$\s]/g, '')
    
    // Se tem vírgula, assume formato brasileiro (1.234,56)
    if (cleanValor.includes(',')) {
      cleanValor = cleanValor.replace(/\./g, '').replace(',', '.')
    } 
    // Se não tem vírgula, assume formato americano (1234.56) e deixa o ponto como está

    const valor = Number(cleanValor)

    if (isNaN(valor)) continue

    resultado.push({
      data: dataFormatada,
      descricao: descStr,
      valor: Math.abs(valor), // Guarda o valor positivo
      tipo: valor < 0 ? 'despesa' : 'receita',
      categoria: valor < 0 ? 'Outros' : 'Salário'
    })
  }

  return resultado
}
