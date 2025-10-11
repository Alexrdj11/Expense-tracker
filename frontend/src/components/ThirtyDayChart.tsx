import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, Legend,
} from 'chart.js'
import { useMemo } from 'react'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, Legend)

export type Expense = { amount: number; expenseDate: string }

export default function ThirtyDayChart({ items }: { items: Expense[] }) {
  const { labels, values } = useMemo(() => {
    const days = 30
    const today = new Date()
    const map = new Map<string, number>()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      map.set(key, 0)
    }
    for (const e of items) {
      const key = new Date(e.expenseDate).toISOString().slice(0, 10)
      if (map.has(key)) map.set(key, (map.get(key) || 0) + Number(e.amount || 0))
    }
    return {
      labels: [...map.keys()],
      values: [...map.values()],
    }
  }, [items])

  const data = {
    labels,
    datasets: [
      {
        label: 'Daily spend (last 30 days)',
        data: values,
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124,58,237,.25)',
        fill: true,
        tension: 0.35,
        pointRadius: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,.2)' } },
      x: { ticks: { color: '#94a3b8', maxTicksLimit: 8 }, grid: { display: false } },
    },
  } as const

  return (
    <div className="card" style={{ width: '100%' }}>
      <div style={{ marginBottom: 8, fontWeight: 700 }}>Last 30 days</div>
      <Line data={data} options={options} />
    </div>
  )
}