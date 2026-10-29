export function lerCSV(texto) {
  const linhas = texto.split(/\r?\n/).filter(l => l.trim() !== '')
  if (linhas.length < 2) return []

  const separador = linhas[0].includes(';') ? ';' : ','
  const cabecalho = linhas[0].toLowerCase().split(separador)
  
  const idxData = cabecalho.findIndex(c => c.includes('data'))
  const idxDesc = cabecalho.findIndex(c => c.includes('descri') || c.includes('hist') || c.includes('title'))
  const idxValor = cabecalho.findIndex(c => c.includes('valor') || c.includes('quantia') || c.includes('amount'))

  if (idxData === -1 || idxDesc === -1 || idxValor === -1) {
    throw new Error("Não foi possível identificar as colunas de Data, Descrição ou Valor no arquivo.")
  }

  const resultado = []

  for (let i = 1; i < linhas.length; i++) {
    const colunas = linhas[i].split(separador)
    
    const dataStr = colunas[idxData]?.replace(/"/g, '').trim()
    const descStr = colunas[idxDesc]?.replace(/"/g, '').trim()
    let valorStr = colunas[idxValor]?.replace(/"/g, '').trim()

    if (!dataStr || !descStr || !valorStr) continue

    let dataFormatada = dataStr
    if (dataStr.includes('/')) {
      const [d, m, a] = dataStr.split('/')
      dataFormatada = `${a}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }

    let cleanValor = valorStr.replace(/[R$\s]/g, '')
    if (cleanValor.includes(',')) cleanValor = cleanValor.replace(/\./g, '').replace(',', '.')
    
    const valor = Number(cleanValor)
    if (isNaN(valor)) continue

    const tipo = valor < 0 ? 'despesa' : 'receita'
    
    // --- AQUI COMEÇA A INTELIGÊNCIA DE CATEGORIZAÇÃO ---
    let categoria = tipo === 'receita' ? 'Salário' : 'Outros'
    const descLower = descStr.toLowerCase()

    if (tipo === 'despesa') {
      // Palavras-chave para Alimentação
      if (descLower.match(/mercado|padaria|ifood|restaurante|lanche|pizza|burger|pao|acougue|hortifruti/)) categoria = 'Alimentação'
      
      // Palavras-chave para Transporte
      else if (descLower.match(/uber|99|posto|gasolina|estacionamento|pedagio|passagem|onibus|metro/)) categoria = 'Transporte'
      
      // Palavras-chave para Assinaturas
      else if (descLower.match(/netflix|spotify|prime|disney|hbo|globoplay|youtube|apple/)) categoria = 'Assinaturas'
      
      // Palavras-chave para Saúde
      else if (descLower.match(/farmacia|drogaria|clinica|hospital|medico|dentista|academia/)) categoria = 'Saúde'
      
      // Palavras-chave para Moradia (Contas)
      else if (descLower.match(/aluguel|condominio|luz|agua|gas|internet|vivo|claro|tim|oi/)) categoria = 'Moradia'
      
      // Palavras-chave para Compras
      else if (descLower.match(/shopee|mercado livre|amazon|magazine|americanas|loja/)) categoria = 'Compras'
    }
    // --- FIM DA INTELIGÊNCIA ---

    resultado.push({
      data: dataFormatada,
      descricao: descStr,
      valor: Math.abs(valor),
      tipo: tipo,
      categoria: categoria // Já vai preenchida automaticamente!
    })
  }

  return resultado
}
