import { BakerData } from '../page'

type Props = { data: BakerData; update: (fields: Partial<BakerData>) => void }

const inputStyle = { borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }

export default function StepSix({ data, update }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm" style={{ color: '#5c3d2e' }}>Set your pricing structure. Customers see this before sending a request.</p>

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Starting Price ($) *</label>
        <input
          type="number"
          value={data.starting_price}
          onChange={e => update({ starting_price: e.target.value })}
          placeholder="75"
          className="w-full px-4 py-3 rounded-xl border text-sm"
          style={inputStyle}
        />
        <p className="text-xs mt-1" style={{ color: '#5c3d2e' }}>Your lowest price for a basic order</p>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Deposit Required (%)</label>
        <select
          value={data.deposit_percentage}
          onChange={e => update({ deposit_percentage: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border text-sm"
          style={inputStyle}
        >
          <option value="25">25% deposit</option>
          <option value="50">50% deposit</option>
          <option value="75">75% deposit</option>
          <option value="100">100% upfront</option>
        </select>
      </div>

      <div>
        <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
          <input
            type="checkbox"
            checked={data.custom_quote_required}
            onChange={e => update({ custom_quote_required: e.target.checked })}
            className="w-4 h-4"
          />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>Custom quotes required</p>
            <p className="text-xs mt-0.5" style={{ color: '#5c3d2e' }}>Final price is determined after discussing order details</p>
          </div>
        </label>
      </div>
    </div>
  )
}