import { useState } from 'react'

export default function Ajuda() {
  const [aberto, setAberto] = useState('')

  const secoes = [
    {
      id: 'primeiros-passos',
      titulo: '🚀 Primeiros Passos',
      conteudo: 'Para começar, cadastre suas Receitas (o que você ganha) e suas Despesas (o que você gasta) no mês atual. Você pode usar a aba "Importar Extrato" se tiver uma planilha do seu banco.',
    },
    {
      id: 'cartoes',
      titulo: '💳 Cartões e Parcelas',
      conteudo: 'Vá em "Cartões" e cadastre seu cartão informando o limite, o dia de fechamento e o dia de vencimento. Depois, na aba "Compras e Parcelas", registre suas compras. O sistema vai dividir automaticamente e jogar as parcelas nos meses corretos.',
    },
    {
      id: 'recorrentes',
      titulo: '📅 Contas Recorrentes',
      conteudo: 'Aluguel, internet, Netflix. Cadastre esses gastos fixos na aba "Contas Recorrentes". Todo mês eles aparecerão lá. Quando você pagar, basta clicar em "Pagar". Se não for pagar em um mês específico, clique em "Pular".',
    },
    {
      id: 'reserva',
      titulo: '🐷 Reserva de Contas',
      conteudo: 'Sabe quando você recebe e já separa o dinheiro da conta de luz? Use a "Reserva de Contas". Você seleciona a conta, diz quanto já guardou e o sistema mostra uma barra de progresso até você completar o valor total para pagar.',
    },
    {
      id: 'cofrinho',
      titulo: '🎯 Cofrinho (Metas)',
      conteudo: 'Aqui é onde você guarda dinheiro para realizar sonhos: viagens, um celular novo, etc. Você define o valor total e vai depositando (ou resgatando) aos poucos.',
    },
    {
      id: 'ia',
      titulo: '🤖 Finance IA e Posso Comprar?',
      conteudo: 'A "Finance IA" analisa seus hábitos e te dá dicas. Já o "Posso Comprar?" simula uma compra e diz se ela vai comprometer seu orçamento atual e futuro com base nos seus dados.',
    },
    {
      id: 'relatorios',
      titulo: '📊 Relatórios',
      conteudo: 'Aqui você tem a visão completa do mês. Pode filtrar por tipo de gasto e exportar tudo para uma planilha no Excel clicando em "Exportar CSV".',
    }
  ]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">Guia do Usuário</h1>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Aprenda a usar todos os recursos do Meu Controle+</p>
      </div>

      <div className="space-y-3">
        {secoes.map(secao => (
          <div 
            key={secao.id} 
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-all"
          >
            <button 
              onClick={() => setAberto(aberto === secao.id ? '' : secao.id)}
              className="w-full flex justify-between items-center p-5 text-left font-bold text-gray-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <span className="text-lg">{secao.titulo}</span>
              <span className="text-xl text-slate-400">{aberto === secao.id ? '−' : '+'}</span>
            </button>
            
            {aberto === secao.id && (
              <div className="px-5 pb-5 pt-2 text-gray-600 dark:text-gray-300 text-sm leading-relaxed border-t border-slate-100 dark:border-slate-700">
                {secao.conteudo}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
