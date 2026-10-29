import * as XLSX from 'xlsx'

export function lerPlanilha(arrayBuffer) {
  // Lê o arquivo Excel ou CSV
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })
  const primeiraAba = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[primeiraAba]
  
  // Converte para uma lista de linhas
  const linhas = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
  if (linhas.length < 2) return []

  // Descobre os índices das colunas pelo cabeçalho
  const cabecalho = linhas[0].map(c => String(c || '').toLowerCase().trim())
  const idxData = cabecalho.findIndex(c => c.includes('data'))
  const idxDesc = cabecalho.findIndex(c => c.includes('descri') || c.includes('hist') || c.includes('title') || c.includes('estabelecimento'))
  const idxValor = cabecalho.findIndex(c => c.includes('valor') || c.includes('quantia') || c.includes('amount'))
  const idxCat = cabecalho.findIndex(c => c.includes('categoria') || c.includes('category'))

  if (idxData === -1 || idxDesc === -1 || idxValor === -1) {
    throw new Error("Não foi possível encontrar as colunas de Data, Descrição ou Valor. Verifique se a primeira linha da planilha tem esses nomes.")
  }

  const resultado = []

  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i]
    if (!linha || linha.length === 0) continue

    // Trata a Data (aceita formato Date do Excel, texto com / ou número serial)
    let dataVal = linha[idxData]
    let dataFormatada = ''
    try {
      if (dataVal instanceof Date) {
        dataFormatada = dataVal.toISOString().slice(0, 10)
      } else if (typeof dataVal === 'string' && dataVal.includes('/')) {
        const [d, m, a] = dataVal.split('/')
        dataFormatada = `${a}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
      } else if (typeof dataVal === 'number') {
        // Data serial do Excel
        const date = new Date(Math.round((dataVal - 25569) * 86400 * 1000))
        dataFormatada = date.toISOString().slice(0, 10)
      } else if (typeof dataVal === 'string') {
        dataFormatada = dataVal.slice(0, 10) // Tenta usar os primeiros 10 caracteres
      }
    } catch(e) { continue }

    if (!dataFormatada || dataFormatada.includes('NaN')) continue

    const descStr = String(linha[idxDesc] || '').trim()
    let valorStr = String(linha[idxValor] || '').replace(/[R$\s]/g, '')
    
    // Trata o valor
    let cleanValor = valorStr
    if (cleanValor.includes(',')) cleanValor = cleanValor.replace(/\./g, '').replace(',', '.')
    const valor = Number(cleanValor)

    if (isNaN(valor) || !descStr) continue

    const tipo = valor < 0 ? 'despesa' : 'receita'
    
    // Verifica se a planilha já tem uma categoria
    let categoria = (idxCat !== -1 && linha[idxCat]) ? String(linha[idxCat]).trim() : ''
    
    // Se não tiver, faz a auto-categorização baseada na descrição
    if (!categoria) {
      categoria = tipo === 'receita' ? 'Salário' : 'Outros'
      const descLower = descStr.toLowerCase()
      
      if (tipo === 'despesa') {
        if (descLower.match(/mercado|padaria|ifood|restaurante|lanche|pizza|burger|pao|acougue|hortifruti/)) categoria = 'Alimentação'
        else if (descLower.match(/uber|99|posto|gasolina|estacionamento|pedagio|passagem|onibus|metro/)) categoria = 'Transporte'
        else if (descLower.match(/netflix|spotify|prime|disney|hbo|globoplay|youtube|apple/)) categoria = 'Assinaturas'
        else if (descLower.match(/farmacia|drogaria|clinica|hospital|medico|dentista|academia/)) categoria = 'Saúde'
        else if (descLower.match(/aluguel|condominio|luz|agua|gas|internet|vivo|claro|tim|oi/)) categoria = 'Moradia'
        else if (descLower.match(/shopee|mercado livre|amazon|magazine|americanas|loja/)) categoria = 'Compras'
      }
    }

    resultado.push({
      data: dataFormatada,
      descricao: descStr,
      valor: Math.abs(valor),
      tipo: tipo,
      categoria: categoria
    })
  }

  return resultado
}
