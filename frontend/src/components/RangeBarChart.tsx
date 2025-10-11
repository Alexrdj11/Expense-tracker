import { useMemo } from 'react'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export type Expense = { amount: number; expenseDate: string }

function toKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function RangeBarChart({
  items,
  rangeDays,
  startDate,
  endDate,
}: {
  items: Expense[]
  rangeDays?: number
  startDate?: string
  endDate?: string
}) {
  const { labels, values } = useMemo(() => {
    let start: Date
    let end: Date
    if (startDate && endDate) {
      start = new Date(`${startDate}T00:00:00`)
      end = new Date(`${endDate}T00:00:00`)
    } else {
      const today = new Date()
      end = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const days = rangeDays ?? 30
      start = new Date(end)
      start.setDate(end.getDate() - (days - 1))
    }

    const map = new Map<string, number>()
    const cursor = new Date(start)
    while (cursor <= end) {
      map.set(toKey(cursor), 0)
      cursor.setDate(cursor.getDate() + 1)
    }

    for (const e of items) {
      const key = e.expenseDate.slice(0, 10)
      if (map.has(key)) map.set(key, (map.get(key) || 0) + Number(e.amount || 0))
    }
    return { labels: [...map.keys()], values: [...map.values()] }
  }, [items, rangeDays, startDate, endDate])

  const data = {
    labels,
    datasets: [
      {
        label: 'Daily spend',
        data: values,
        backgroundColor: 'rgba(124,58,237,0.6)',
        borderColor: '#7c3aed',
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { intersect: false, mode: 'index' as const } },
    scales: {
      y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,.2)' } },
      x: { ticks: { color: '#94a3b8', maxTicksLimit: 8 }, grid: { display: false } },
    },
  }

  return (
    <div className="card" style={{ width: '100%' }}>
      <Bar data={data} options={options} />
    </div>
  )
}