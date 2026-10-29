export function exportarCSV(dados, nomeArquivo) {
  if (!dados || dados.length === 0) {
    alert('Não há dados para exportar.')
    return
  }

  // Pega as chaves do primeiro objeto para o cabeçalho
  const cabecalho = Object.keys(dados[0])
  
  // Formata as linhas
  const linhas = dados.map(obj => 
    cabecalho.map(chave => {
      let valor = obj[chave] ?? ''
      // Escapa aspas e vírgulas
      valor = String(valor).replace(/"/g, '""')
      return `"${valor}"`
    }).join(',')
  )

  // Junta tudo
  const csvContent = [cabecalho.join(','), ...linhas].join('\n')
  
  // Cria o arquivo e força o download
  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${nomeArquivo}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
