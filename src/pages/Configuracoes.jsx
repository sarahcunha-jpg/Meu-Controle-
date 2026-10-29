import { useAuth } from '../hooks/useAuth'

export default function Configuracoes() {
  const { user } = useAuth()
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-600">Informações da sua conta</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-1">
        <p className="text-sm text-gray-600">Nome</p>
        <p className="font-medium text-gray-900">{user?.displayName || '—'}</p>
        <p className="text-sm text-gray-600 mt-3">E-mail</p>
        <p className="font-medium text-gray-900">{user?.email}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-sm text-gray-600">
        <p className="font-medium text-gray-900 mb-2">Privacidade e Segurança</p>
        <p>
          Seus dados financeiros são armazenados com segurança e vinculados apenas à sua conta.
          Nenhuma informação é compartilhada com outros usuários ou vendida.
        </p>
      </div>
    </div>
  )
}
