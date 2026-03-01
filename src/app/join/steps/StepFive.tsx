import { BakerData } from '../page'

type Props = { data: BakerData; update: (fields: Partial<BakerData>) => void }

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function StepFive({ data, update }: Props) {
  function toggleDay(day: string) {
    const current = data.days_available
    update({ days_available: current.includes(day) ? current.filter(d => d !== day) : [...current, day] })
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm" style={{ color: '#5c3d2e' }}>Set your availability so customers know when to expect their orders.</p>

      <div>
        <label className="block text-sm font-semibold mb-3" style={{ color: '#2d1a0e' }}>Days You Accept Orders *</label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map(day => (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: data.days_available.includes(day) ? '#2d1a0e' : '#f5f0eb',
                color: data.days_available.includes(day) ? 'white' : '#2d1a0e',
                border: `1px solid ${data.days_available.includes(day) ? '#2d1a0e' : '#e0d5cc'}`
              }}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Lead Time Required *</label>
        <select
          value={data.lead_time_days}
          onChange={e => update({ lead_time_days: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border text-sm"
          style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}
        >
          <option value="1">1 day</option>
          <option value="2">2 days</option>
          <option value="3">3 days</option>
          <option value="7">1 week</option>
          <option value="14">2 weeks</option>
          <option value="21">3 weeks</option>
          <option value="30">1 month</option>
          <option value="60">2+ months</option>
        </select>
        <p className="text-xs mt-1" style={{ color: '#5c3d2e' }}>Minimum notice you need before an event date</p>
      </div>
    </div>
  )
}