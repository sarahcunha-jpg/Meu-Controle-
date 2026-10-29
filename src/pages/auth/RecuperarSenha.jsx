import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '../../layouts/AuthLayout'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { recuperarSenha } from '../../services/authService'

export default function RecuperarSenha() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(''); setMsg(''); setLoading(true)
    try {
      await recuperarSenha(email)
      setMsg('Enviamos um link de recuperação para seu e-mail.')
    } catch {
      setErro('Não foi possível enviar. Verifique o e-mail.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Recuperar senha</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        {msg && <Alert type="success">{msg}</Alert>}
        {erro && <Alert type="error">{erro}</Alert>}
        <Input label="E-mail" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
        <Button type="submit" disabled={loading} className="w-full">{loading ? 'Enviando...' : 'Enviar link'}</Button>
      </form>
      <div className="mt-4 text-sm text-center">
        <Link to="/login" className="text-primary-600 hover:underline">Voltar para login</Link>
      </div>
    </AuthLayout>
  )
}
