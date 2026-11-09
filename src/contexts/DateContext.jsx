import { createContext, useState, useContext, useEffect } from 'react'

export const DateContext = createContext(null)

export function DateProvider({ children }) {
  // Inicializa pegando do localStorage, ou usa o mês atual se não tiver nada salvo
  const [mes, setMes] = useState(() => {
    const salvo = localStorage.getItem('@meucontrole:mes')
    return salvo ? Number(salvo) : new Date().getMonth()
  })
  
  const [ano, setAno] = useState(() => {
    const salvo = localStorage.getItem('@meucontrole:ano')
    return salvo ? Number(salvo) : new Date().getFullYear()
  })

  // Sempre que mudar, salva no localStorage
  useEffect(() => {
    localStorage.setItem('@meucontrole:mes', mes)
    localStorage.setItem('@meucontrole:ano', ano)
  }, [mes, ano])

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
