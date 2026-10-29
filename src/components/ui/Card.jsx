export function Card({ title, value, color = 'primary', subtitle }) {
  const colors = {
    primary: 'text-blue-700',
    success: 'text-green-700',
    danger: 'text-red-700',
    warning: 'text-yellow-700',
    gray: 'text-gray-700'
  }
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <p className="text-sm text-gray-600">{title}</p>
      <p className={`text-2xl font-bold mt-2 ${colors[color]}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  )
}
