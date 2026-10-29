function total(itens) {
  return itens.reduce((a, i) => a + Number(i.valor || 0), 0)
}

export function filtrarMes(itens, date = new Date(), campoData = 'data') {
  const ano = date.getFullYear()
  const mes = date.getMonth()
  return itens.filter(i => {
    if (!i[campoData]) return false
    const d = new Date(i[campoData] + 'T00:00:00')
    return d.getFullYear() === ano && d.getMonth() === mes
  })
}

export function resumoDashboard(receitas, despesas, hoje = new Date()) {
  const rMes = filtrarMes(receitas, hoje)
  const dMes = filtrarMes(despesas, hoje)
  return {
    saldoAtual: total(receitas) - total(despesas),
    receitasMes: total(rMes),
    despesasMes: total(dMes),
    saldoMes: total(rMes) - total(dMes)
  }
}

export function gastosPorCategoria(despesas) {
  const map = {}
  despesas.forEach(d => {
    const c = d.categoria || 'Outros'
    map[c] = (map[c] || 0) + Number(d.valor || 0)
  })
  return Object.entries(map).map(([categoria, valor]) => ({ categoria, valor }))
}

// ESTA É A FUNÇÃO QUE ESTAVA FALTANDO:
export function gastosPorCategoriaMes(despesas, hoje = new Date()) {
  const dMes = filtrarMes(despesas, hoje)
  return gastosPorCategoria(dMes)
}

export function limiteUsadoCartao(parcelas, cartaoId) {
  return total(parcelas.filter(p => p.cartaoId === cartaoId && p.status === 'pendente'))
}

export function totalParcelado(parcelas) {
  return total(parcelas.filter(p => p.status === 'pendente'))
}

export function calcularPrevisaoMes(receitas, despesas, parcelas, recorrentes, hoje = new Date()) {
  const resumo = resumoDashboard(receitas, despesas, hoje)
  const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)
  const parcelasProximoMes = filtrarMes(parcelas, proximoMes, 'dataVencimento')
  const totalParcelasProx = total(parcelasProximoMes)
  const totalRecorrentes = total(recorrentes)
  const saldoPrevisto = resumo.saldoAtual - totalParcelasProx - totalRecorrentes

  return { saldoPrevisto, parcelasProx: totalParcelasProx, totalRecorrentes }
}

export function gerarAnalisesIA(receitas, despesas, parcelas, cartoes, recorrentes, orcamentos) {
  const insights = []
  const hoje = new Date()
  const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
  
  const despesasMes = filtrarMes(despesas, hoje)
  const despesasMesPassado = filtrarMes(despesas, mesPassado)
  const totalMes = total(despesasMes)
  const totalMesPassado = total(despesasMesPassado)

  if (totalMesPassado > 0) {
    const diff = ((totalMes - totalMesPassado) / totalMesPassado) * 100
    if (diff > 10) {
      insights.push({ tipo: 'danger', texto: `Seus gastos aumentaram ${diff.toFixed(0)}% em relação ao mês passado.` })
    } else if (diff < -10) {
      insights.push({ tipo: 'success', texto: `Parabéns! Você reduziu seus gastos em ${Math.abs(diff).toFixed(0)}% este mês.` })
    }
  }

  const porCat = gastosPorCategoria(despesasMes)
  if (porCat.length > 0) {
    const maior = porCat.sort((a, b) => b.valor - a.valor)[0]
    const pct = ((maior.valor / totalMes) * 100).toFixed(0)
    insights.push({ tipo: 'info', texto: `A categoria "${maior.categoria}" representa ${pct}% das suas despesas este mês.` })
  }

  cartoes.forEach(c => {
    const usado = limiteUsadoCartao(parcelas, c.id)
    const pct = (usado / c.limite) * 100
    if (pct >= 80) {
      insights.push({ tipo: 'warning', texto: `Atenção! Seu cartão ${c.nome} está usando ${pct.toFixed(0)}% do limite.` })
    }
  })

  const totalRec = total(recorrentes)
  if (totalRec > 0) {
    insights.push({ tipo: 'info', texto: `Suas contas recorrentes somam R$ ${totalRec.toFixed(2).replace('.', ',')} por mês.` })
  }

  orcamentos.forEach(o => {
    const gasto = porCat.find(g => g.categoria === o.categoria)?.valor || 0
    if (gasto > o.limite) {
      insights.push({ tipo: 'danger', texto: `Você ultrapassou o orçamento de ${o.categoria}!` })
    }
  })

  return insights
}

export function analisarCompra(compra, dadosGlobais) {
  const { valorTotal, numParcelas, cartaoId } = compra
  const { receitas, despesas, parcelas, cartoes, recorrentes } = dadosGlobais
  
  const resumo = resumoDashboard(receitas, despesas)
  const valorParcela = valorTotal / numParcelas
  
  let status = 'green'
  let titulo = 'Compra Possível'
  let motivos = []

  if (cartaoId) {
    const cartao = cartoes.find(c => c.id === cartaoId)
    if (cartao) {
      const limiteDisp = cartao.limite - limiteUsadoCartao(parcelas, cartaoId)
      if (valorTotal > limiteDisp) {
        status = 'red'
        titulo = 'Não Recomendada'
        motivos.push(`O valor da compra (R$ ${valorTotal}) é maior que o limite disponível no cartão (R$ ${limiteDisp.toFixed(2)}).`)
      } else if (valorTotal > limiteDisp * 0.8) {
        if (status !== 'red') status = 'yellow'
        titulo = status === 'red' ? titulo : 'Atenção'
        motivos.push(`A compra vai consumir mais de 80% do limite disponível do seu cartão ${cartao.nome}.`)
      }
    }
  }

  const totalRecorrentes = total(recorrentes)
  const rendaMensal = total(filtrarMes(receitas, new Date()))
  const comprometimento = ((totalRecorrentes + valorParcela) / rendaMensal) * 100

  if (rendaMensal > 0) {
    if (comprometimento > 70) {
      status = 'red'
      titulo = 'Não Recomendada'
      motivos.push(`A nova parcela (R$ ${valorParcela.toFixed(2)}) fará com que seus custos fixos comprometam ${comprometimento.toFixed(0)}% da sua renda mensal (acima do recomendado de 30-50%).`)
    } else if (comprometimento > 50) {
      if (status !== 'red') status = 'yellow'
      titulo = status === 'red' ? titulo : 'Atenção'
      motivos.push(`A parcela de R$ ${valorParcela.toFixed(2)} deixará seu orçamento apertado (comprometendo ${comprometimento.toFixed(0)}% da renda).`)
    }
  }

  if (numParcelas === 1 || numParcelas === '1') {
    if (valorTotal > resumo.saldoAtual) {
      status = 'red'
      titulo = 'Não Recomendada'
      motivos.push(`Você não tem saldo suficiente em conta para pagar à vista (Saldo: R$ ${resumo.saldoAtual.toFixed(2)}).`)
    } else if (valorTotal > resumo.saldoAtual * 0.5) {
      if (status !== 'red') status = 'yellow'
      titulo = status === 'red' ? titulo : 'Atenção'
      motivos.push(`A compra vai consumir mais da metade do seu saldo atual em conta.`)
    }
  }

  if (motivos.length === 0) {
    motivos.push(`Seu saldo atual e margem mensal suportam tranquilamente a parcela de R$ ${valorParcela.toFixed(2)}.`)
  }

  return { status, titulo, motivos, valorParcela }
}
