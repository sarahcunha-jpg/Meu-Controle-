export function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary-700">Meu Controle+</h1>
          <p className="text-sm text-gray-600 mt-1">Seu dinheiro organizado. Suas decisões mais inteligentes.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-6">{children}</div>
      </div>
    </div>
  )
}
