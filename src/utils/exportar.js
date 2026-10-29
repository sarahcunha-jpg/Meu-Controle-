export async function exportarCSV(dados, nomeArquivo) {
  if (!dados || dados.length === 0) {
    alert('Não há dados para exportar.')
    return
  }

  const cabecalho = Object.keys(dados[0])
  const linhas = dados.map(obj => 
    cabecalho.map(chave => {
      let valor = obj[chave] ?? ''
      valor = String(valor).replace(/"/g, '""')
      return `"${valor}"`
    }).join(',')
  )

  const csvContent = [cabecalho.join(','), ...linhas].join('\n')
  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' })
  const nomeCompleto = `${nomeArquivo}.csv`
  const file = new File([blob], nomeCompleto, { type: 'text/csv' })

  // Tentar usar o compartilhamento nativo (Celular)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      // Avisa o usuário o que fazer
      alert("O arquivo vai ser gerado. Escolha 'Salvar em Arquivos' ou envie para você mesmo no WhatsApp/Email.")
      
      await navigator.share({
        files: [file],
        title: 'Relatório Meu Controle+',
        text: 'Aqui está o seu relatório financeiro.'
      })
      return // Se compartilhou, finaliza aqui
    } catch (err) {
      // Se o usuário cancelar o menu de compartilhamento, cai aqui
      console.log('Compartilhamento cancelado pelo usuário', err)
    }
  }

  // Fallback: Forçar download (Computador ou celular antigo)
  try {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', nomeCompleto)
    // Adiciona ao body e clica
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    // Alerta de sucesso no download
    alert("Arquivo baixado! Verifique a pasta Downloads do seu celular.")
  } catch (err) {
    alert("Seu navegador bloqueou o download. Tente abrir o app pelo Chrome ou Safari.")
  }
}
