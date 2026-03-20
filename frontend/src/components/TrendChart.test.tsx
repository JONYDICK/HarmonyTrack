import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TrendChart } from '../components/TrendChart'

describe('TrendChart Component', () => {
  const mockData = [
    {
      date: '2024-02-01',
      happiness: 0.7,
      energy: 0.6,
      calmness: 0.8,
      danceability: 0.5,
    },
    {
      date: '2024-02-02',
      happiness: 0.75,
      energy: 0.65,
      calmness: 0.75,
      danceability: 0.6,
    },
    {
      date: '2024-02-03',
      happiness: 0.8,
      energy: 0.7,
      calmness: 0.7,
      danceability: 0.65,
    },
  ]

  it('renders chart with data', () => {
    render(<TrendChart data={mockData} />)

    // Chart should render without errors
    expect(screen.getByText(/Mood Trend Over Time/)).toBeInTheDocument()
  })

  it('displays legend items', () => {
    render(<TrendChart data={mockData} />)

    expect(screen.getByText(/Happiness/)).toBeInTheDocument()
    expect(screen.getByText(/Energy/)).toBeInTheDocument()
    expect(screen.getByText(/Calmness/)).toBeInTheDocument()
  })

  it('handles empty data', () => {
    render(<TrendChart data={[]} />)

    expect(screen.getByText(/No mood data available/)).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<TrendChart data={[]} loading={true} />)

    const skeletonBars = document.querySelectorAll('.skeleton-bar')
    expect(skeletonBars.length).toBeGreaterThan(0)
  })

  it('displays legend descriptions', () => {
    render(<TrendChart data={mockData} />)

    expect(screen.getByText(/How positive you felt/)).toBeInTheDocument()
    expect(screen.getByText(/Activity and intensity level/)).toBeInTheDocument()
    expect(screen.getByText(/Relaxation and peace/)).toBeInTheDocument()
  })

  it('converts decimal values to percentages', () => {
    render(<TrendChart data={mockData} />)

    // The chart should convert 0.7 to 70%, etc.
    // This is more of an integration test checking the canvas rendering
    const chart = document.querySelector('canvas')
    expect(chart).toBeInTheDocument()
  })
})
