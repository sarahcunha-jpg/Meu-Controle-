import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../../layouts/AuthLayout'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { cadastrarUsuario } from '../../services/authService'

export default function Cadastro() {
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [detalheErro, setDetalheErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setDetalheErro('')

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setLoading(true)
    try {
      await cadastrarUsuario(nome, email, senha)
      navigate('/')
    } catch (err) {
      console.error('Erro no cadastro:', err)
      setDetalheErro(`${err.code || 'sem-code'} — ${err.message || 'sem mensagem'}`)

      switch (err.code) {
        case 'auth/email-already-in-use':
          setErro('Este e-mail já está em uso. Tente outro ou faça login.')
          break
        case 'auth/invalid-email':
          setErro('E-mail inválido. Verifique o formato.')
          break
        case 'auth/weak-password':
          setErro('Senha muito fraca. Use pelo menos 6 caracteres.')
          break
        case 'auth/operation-not-allowed':
          setErro('O login por e-mail/senha NÃO está ativado no Firebase Console.')
          break
        case 'auth/unauthorized-domain':
          setErro('Este domínio NÃO está autorizado no Firebase. Adicione-o em Authentication → Settings → Authorized domains.')
          break
        case 'auth/network-request-failed':
          setErro('Falha de rede. Verifique sua conexão.')
          break
        case 'auth/too-many-requests':
          setErro('Muitas tentativas. Aguarde alguns minutos e tente de novo.')
          break
        default:
          if (err.code === 'permission-denied' || (err.message && err.message.includes('permission'))) {
            setErro('Conta criada, MAS as regras do Firestore bloquearam o salvamento. Publique as regras no Firebase Console → Firestore → Rules.')
          } else {
            setErro('Não foi possível criar a conta. Veja o detalhe técnico abaixo.')
          }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Criar conta</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        {erro && <Alert type="error">{erro}</Alert>}
        {detalheErro && (
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-2 text-xs font-mono text-gray-700 break-all">
            {detalheErro}
          </div>
        )}
        <Input
          label="Nome"
          required
          value={nome}
          onChange={e => setNome(e.target.value)}
          autoComplete="name"
        />
        <Input
          label="E-mail"
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
        />
        <Input
          label="Senha (mínimo 6 caracteres)"
          type="password"
          required
          value={senha}
          onChange={e => setSenha(e.target.value)}
          autoComplete="new-password"
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Criando...' : 'Criar conta'}
        </Button>
      </form>
      <div className="mt-4 text-sm text-center text-gray-600">
        Já tem conta? <Link to="/login" className="text-primary-600 hover:underline">Entrar</Link>
      </div>
    </AuthLayout>
  )
}