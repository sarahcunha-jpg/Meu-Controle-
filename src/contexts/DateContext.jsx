import { createContext, useState, useContext } from 'react'

export const DateContext = createContext(null)

export function DateProvider({ children }) {
  const hoje = new Date()
  const [mes, setMes] = useState(hoje.getMonth())
  const [ano, setAno] = useState(hoje.getFullYear())

  // Retorna um objeto Date para o primeiro dia do mês selecionado
  const dataReferencia = new Date(ano, mes, 1)

  return (
    <DateContext.Provider value={{ mes, setMes, ano, setAno, dataReferencia }}>
      {children}
    </DateContext.Provider>
  )
}

export function useDate() {
  return useContext(DateContext)
}
