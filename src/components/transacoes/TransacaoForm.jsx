import { useState } from 'react'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { todayISO } from '../../utils/formatDate'
import { FORMAS_PAGAMENTO } from '../../utils/categorias'

export function TransacaoForm({
  categorias, tipo, initial = {}, onSubmit, onCancel, loading, showFormaPagamento = false
}) {
  const [dados, setDados] = useState({
    descricao: initial.descricao || '',
    valor: initial.valor ?? '',
    categoria: initial.categoria || categorias[0],
    data: initial.data || todayISO(),
    observacoes: initial.observacoes || '',
    formaPagamento: initial.formaPagamento || FORMAS_PAGAMENTO[0]
  })

  function set(campo, valor) { setDados(d => ({ ...d, [campo]: valor })) }

  function handleSubmit(e) {
    e.preventDefault()
    const v = Number(dados.valor)
    if (!dados.descricao.trim()) return alert('Informe a descrição.')
    if (!v || v <= 0) return alert('Informe um valor maior que zero.')
    if (!dados.data) return alert('Informe uma data.')
    onSubmit({ ...dados, valor: v, tipo })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input label="Descrição" required value={dados.descricao} onChange={e => set('descricao', e.target.value)} />
      <Input label="Valor (R$)" type="number" step="0.01" min="0.01" required value={dados.valor} onChange={e => set('valor', e.target.value)} />
      <Select label="Categoria" options={categorias} value={dados.categoria} onChange={e => set('categoria', e.target.value)} />
      {showFormaPagamento && (
        <Select label="Forma de pagamento" options={FORMAS_PAGAMENTO} value={dados.formaPagamento} onChange={e => set('formaPagamento', e.target.value)} />
      )}
      <Input label="Data" type="date" required value={dados.data} onChange={e => set('data', e.target.value)} />
      <Input label="Observações (opcional)" value={dados.observacoes} onChange={e => set('observacoes', e.target.value)} />
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  )
}
