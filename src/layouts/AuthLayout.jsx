export function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black text-primary-700 dark:text-primary-400">Meu Controle+</h1>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">Seu dinheiro organizado. Suas decisões mais inteligentes.</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-transparent dark:border-slate-700">
          {children}
        </div>
      </div>
    </div>
  )
}
