export function Card({ title, value, color = 'primary', subtitle }) {
  const colors = {
    primary: 'from-blue-500 to-blue-600 text-white',
    success: 'from-green-500 to-green-600 text-white',
    danger: 'from-red-500 to-red-600 text-white',
    warning: 'from-yellow-400 to-yellow-500 text-white',
    gray: 'from-gray-100 to-gray-200 text-gray-800',
    dark: 'from-gray-800 to-gray-900 text-white'
  }
  
  return (
    <div className={`rounded-2xl shadow-md p-5 bg-gradient-to-br ${colors[color]} transition-transform hover:scale-[1.02] duration-200`}>
      <p className="text-sm font-medium opacity-90">{title}</p>
      <p className="text-2xl font-black mt-2">{value}</p>
      {subtitle && <p className="text-xs opacity-75 mt-1 font-semibold">{subtitle}</p>}
    </div>
  )
}
