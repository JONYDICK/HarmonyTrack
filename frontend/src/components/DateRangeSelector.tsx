import { useState } from 'react'
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns'

interface DateRange {
  start: Date
  end: Date
}

interface DateRangeSelectorProps {
  onDateChange: (start: Date, end: Date) => void
  defaultRange?: 'week' | 'month' | 'quarter' | 'year' | 'all'
}

const PRESET_RANGES: Record<string, () => DateRange> = {
  '7 Days': () => ({
    start: subDays(new Date(), 7),
    end: new Date(),
  }),
  '30 Days': () => ({
    start: subDays(new Date(), 30),
    end: new Date(),
  }),
  '90 Days': () => ({
    start: subDays(new Date(), 90),
    end: new Date(),
  }),
  'This Month': () => ({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  }),
  'Last Month': () => ({
    start: startOfMonth(subMonths(new Date(), 1)),
    end: endOfMonth(subMonths(new Date(), 1)),
  }),
  'All Time': () => ({
    start: new Date(2020, 0, 1),
    end: new Date(),
  }),
}

export function DateRangeSelector({
  onDateChange,
}: DateRangeSelectorProps) {
  const [startDate, setStartDate] = useState<string>(
    format(subDays(new Date(), 30), 'yyyy-MM-dd')
  )
  const [endDate, setEndDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  )
  const [selectedPreset, setSelectedPreset] = useState<string>('30 Days')

  const handlePresetClick = (presetName: string) => {
    const range = PRESET_RANGES[presetName]()
    setStartDate(format(range.start, 'yyyy-MM-dd'))
    setEndDate(format(range.end, 'yyyy-MM-dd'))
    setSelectedPreset(presetName)
    onDateChange(range.start, range.end)
  }

  const handleCustomDateChange = () => {
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start <= end) {
      setSelectedPreset('')
      onDateChange(start, end)
    }
  }

  return (
    <div className="date-range-selector">
      <div className="selector-header">
        <h3>Select Time Period</h3>
      </div>

      <div className="preset-buttons">
        {Object.keys(PRESET_RANGES).map((preset) => (
          <button
            key={preset}
            className={`preset-btn ${selectedPreset === preset ? 'active' : ''}`}
            onClick={() => handlePresetClick(preset)}
          >
            {preset}
          </button>
        ))}
      </div>

      <div className="custom-range">
        <div className="date-input-group">
          <label htmlFor="start-date">From</label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={endDate}
          />
        </div>

        <div className="date-input-group">
          <label htmlFor="end-date">To</label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            max={format(new Date(), 'yyyy-MM-dd')}
          />
        </div>

        <button
          className="apply-custom-btn"
          onClick={handleCustomDateChange}
          disabled={new Date(startDate) > new Date(endDate)}
        >
          Apply
        </button>
      </div>

      <div className="date-display">
        <p>
          Showing data from <strong>{format(new Date(startDate), 'MMM d, yyyy')}</strong> to{' '}
          <strong>{format(new Date(endDate), 'MMM d, yyyy')}</strong>
        </p>
      </div>
    </div>
  )
}
