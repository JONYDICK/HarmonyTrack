// React is in scope via react-jsx transform
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import '../styles/TrendChart.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface MoodDataPoint {
  date: string
  happiness: number
  energy: number
  calmness: number
  danceability: number
}

interface TrendChartProps {
  data: MoodDataPoint[]
  loading?: boolean
}

export function TrendChart({ data, loading = false }: TrendChartProps) {
  if (loading) {
    return (
      <div className="trend-chart-container">
        <div className="loading-skeleton">
          <div className="skeleton-bar" />
          <div className="skeleton-bar" />
          <div className="skeleton-bar" />
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="trend-chart-container">
        <div className="empty-state">
          <p>No mood data available for this period</p>
        </div>
      </div>
    )
  }

  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: 'Happiness',
        data: data.map((d) => (d.happiness * 100).toFixed(0)),
        borderColor: '#FFB81C',
        backgroundColor: 'rgba(255, 184, 28, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#FFB81C',
        pointHoverRadius: 6,
      },
      {
        label: 'Energy',
        data: data.map((d) => (d.energy * 100).toFixed(0)),
        borderColor: '#FF6B6B',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#FF6B6B',
        pointHoverRadius: 6,
      },
      {
        label: 'Calmness',
        data: data.map((d) => (d.calmness * 100).toFixed(0)),
        borderColor: '#00D084',
        backgroundColor: 'rgba(0, 208, 132, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#00D084',
        pointHoverRadius: 6,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: 'bold' as const,
          },
          color: '#666',
        },
      },
      title: {
        display: true,
        text: 'Mood Trend Over Time',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: 20,
        color: '#333',
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
        titleFont: {
          size: 12,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 11,
        },
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${context.parsed.y}%`
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function (value: any) {
            return value + '%'
          },
          font: {
            size: 11,
          },
          color: '#999',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        title: {
          display: true,
          text: 'Mood Score (%)',
          color: '#666',
        },
      },
      x: {
        ticks: {
          font: {
            size: 10,
          },
          color: '#999',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
  }

  return (
    <div className="trend-chart-container">
      <div className="chart-wrapper">
        <Line data={chartData} options={options} />
      </div>

      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#FFB81C' }} />
          <span>Happiness - How positive you felt</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#FF6B6B' }} />
          <span>Energy - Activity and intensity level</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#00D084' }} />
          <span>Calmness - Relaxation and peace</span>
        </div>
      </div>
    </div>
  )
}
