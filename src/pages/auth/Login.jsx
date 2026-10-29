import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../../layouts/AuthLayout'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { login } from '../../services/authService'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      await login(email, senha)
      navigate('/')
    } catch {
      setErro('E-mail ou senha inválidos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Entrar</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        {erro && <Alert type="error">{erro}</Alert>}
        <Input label="E-mail" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
        <Input label="Senha" type="password" required value={senha} onChange={e => setSenha(e.target.value)} />
        <Button type="submit" disabled={loading} className="w-full">{loading ? 'Entrando...' : 'Entrar'}</Button>
      </form>
      <div className="mt-4 text-sm text-center text-gray-600 space-y-2">
        <div><Link to="/recuperar-senha" className="text-primary-600 hover:underline">Esqueci minha senha</Link></div>
        <div>Não tem conta? <Link to="/cadastro" className="text-primary-600 hover:underline">Cadastre-se</Link></div>
      </div>
    </AuthLayout>
  )
}
