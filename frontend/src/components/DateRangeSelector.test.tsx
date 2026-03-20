import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateRangeSelector } from '../components/DateRangeSelector'

describe('DateRangeSelector Component', () => {
  it('renders date range selector with presets', () => {
    const mockOnDateChange = vi.fn()
    
    render(<DateRangeSelector onDateChange={mockOnDateChange} />)

    expect(screen.getByText('Select Time Period')).toBeInTheDocument()
    expect(screen.getByText('7 Days')).toBeInTheDocument()
    expect(screen.getByText('30 Days')).toBeInTheDocument()
    expect(screen.getByText('90 Days')).toBeInTheDocument()
    expect(screen.getByText('This Month')).toBeInTheDocument()
  })

  it('calls onDateChange when preset is clicked', async () => {
    const mockOnDateChange = vi.fn()
    const user = userEvent.setup()

    render(<DateRangeSelector onDateChange={mockOnDateChange} />)

    const sevenDaysButton = screen.getByRole('button', { name: /7 Days/i })
    await user.click(sevenDaysButton)

    expect(mockOnDateChange).toHaveBeenCalled()
    expect(mockOnDateChange).toHaveBeenCalledWith(expect.any(Date), expect.any(Date))
  })

  it('displays custom date inputs', () => {
    const mockOnDateChange = vi.fn()

    render(<DateRangeSelector onDateChange={mockOnDateChange} />)

    const fromInput = screen.getByLabelText('From')
    const toInput = screen.getByLabelText('To')

    expect(fromInput).toBeInTheDocument()
    expect(toInput).toBeInTheDocument()
  })

  it('highlights active preset', async () => {
    const mockOnDateChange = vi.fn()
    const user = userEvent.setup()

    render(<DateRangeSelector onDateChange={mockOnDateChange} />)

    const thirtyDaysButton = screen.getByRole('button', { name: /30 Days/i })
    await user.click(thirtyDaysButton)

    expect(thirtyDaysButton).toHaveClass('active')
  })

  it('shows date range display', () => {
    const mockOnDateChange = vi.fn()

    render(<DateRangeSelector onDateChange={mockOnDateChange} />)

    expect(screen.getByText(/Showing data from/)).toBeInTheDocument()
  })

  it('disables apply button when start > end', async () => {
    const mockOnDateChange = vi.fn()

    render(<DateRangeSelector onDateChange={mockOnDateChange} />)

    const applyButton = screen.getByRole('button', { name: /Apply/i })
    
    // Initially enabled
    expect(applyButton).not.toBeDisabled()

    // TODO: Set dates so start > end and verify disabled state
  })
})
