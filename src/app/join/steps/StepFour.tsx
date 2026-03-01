import { BakerData } from '../page'

type Props = { data: BakerData; update: (fields: Partial<BakerData>) => void }

const inputStyle = { borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }

const RADIUS_OPTIONS = [
  { value: '5', label: '5 miles — Very local' },
  { value: '10', label: '10 miles — My city' },
  { value: '15', label: '15 miles — Nearby cities' },
  { value: '25', label: '25 miles — Metro area' },
  { value: '50', label: '50 miles — Regional' },
  { value: '100', label: '100+ miles — I deliver far' },
]

export default function StepFour({ data, update }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm" style={{ color: '#5c3d2e' }}>Where do you serve and how do customers get their orders?</p>

      {/* Service Radius */}
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>How far do you serve from your ZIP code? *</label>
        <div className="flex flex-col gap-2">
          {RADIUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => update({ serves_zip_codes: opt.value })}
              className="flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all"
              style={{
                borderColor: data.serves_zip_codes === opt.value ? '#2d1a0e' : '#e0d5cc',
                backgroundColor: data.serves_zip_codes === opt.value ? '#f5f0eb' : 'white'
              }}
            >
              <span className="text-sm font-medium" style={{ color: '#2d1a0e' }}>{opt.label}</span>
              {data.serves_zip_codes === opt.value && (
                <span className="text-xs font-bold" style={{ color: '#2d1a0e' }}>✓</span>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs mt-2" style={{ color: '#5c3d2e' }}>Based on your ZIP code: {data.zip_code || 'enter your ZIP in step 2'}</p>
      </div>

      {/* Fulfillment */}
      <div>
        <label className="block text-sm font-semibold mb-3" style={{ color: '#2d1a0e' }}>Fulfillment Options *</label>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
            <input type="checkbox" checked={data.pickup_available} onChange={e => update({ pickup_available: e.target.checked })} className="w-4 h-4" />
            <div>
              <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>📦 Pickup Available</p>
              <p className="text-xs" style={{ color: '#5c3d2e' }}>Customers come to you</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
            <input type="checkbox" checked={data.delivery_available} onChange={e => update({ delivery_available: e.target.checked })} className="w-4 h-4" />
            <div>
              <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>🚗 Delivery Available</p>
              <p className="text-xs" style={{ color: '#5c3d2e' }}>You deliver to customers</p>
            </div>
          </label>
        </div>
      </div>

      {data.delivery_available && (
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Delivery Fee Range</label>
          <input value={data.delivery_fee_range} onChange={e => update({ delivery_fee_range: e.target.value })} placeholder="e.g. $10-$25 depending on distance" className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Minimum Order ($)</label>
          <input type="number" value={data.minimum_order} onChange={e => update({ minimum_order: e.target.value })} placeholder="50" className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Rush Orders?</label>
          <select value={data.rush_orders_available ? 'yes' : 'no'} onChange={e => update({ rush_orders_available: e.target.value === 'yes' })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle}>
            <option value="no">No rush orders</option>
            <option value="yes">Yes, I accept rush orders</option>
          </select>
        </div>
      </div>

      {data.rush_orders_available && (
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Rush Order Fee</label>
          <input value={data.rush_order_fee} onChange={e => update({ rush_order_fee: e.target.value })} placeholder="e.g. +$50 for 48hr turnaround" className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
        </div>
      )}
    </div>
  )
}