import { BakerData } from '../page'

type Props = { data: BakerData; update: (fields: Partial<BakerData>) => void }

const inputStyle = { borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }

export default function StepSeven({ data, update }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm" style={{ color: '#5c3d2e' }}>Almost done! Tell customers about yourself and set your policies.</p>

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Your Bio *</label>
        <textarea
          value={data.bio}
          onChange={e => update({ bio: e.target.value })}
          rows={4}
          placeholder="Tell customers about your baking story, your style, what makes your creations special..."
          className="w-full px-4 py-3 rounded-xl border text-sm resize-none"
          style={inputStyle}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Cancellation Policy</label>
        <select
          value={data.cancellation_policy}
          onChange={e => update({ cancellation_policy: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border text-sm"
          style={inputStyle}
        >
          <option value="">Select a policy</option>
          <option value="No refunds after booking">No refunds after booking</option>
          <option value="Full refund if cancelled 2+ weeks out">Full refund if cancelled 2+ weeks out</option>
          <option value="50% refund if cancelled 1 week out">50% refund if cancelled 1 week out</option>
          <option value="Full refund if cancelled 48hrs out">Full refund if cancelled 48hrs out</option>
          <option value="Custom - discussed per order">Custom - discussed per order</option>
        </select>
      </div>


      {/* Terms */}
      <div className="p-4 rounded-xl border" style={{ borderColor: '#e0d5cc', backgroundColor: '#faf8f6' }}>
        <p className="text-sm font-semibold mb-2" style={{ color: '#2d1a0e' }}>Whiskly Seller Agreement</p>
        <p className="text-xs mb-3 leading-relaxed" style={{ color: '#5c3d2e' }}>
          By joining Whiskly as a baker, you agree to: maintain accurate profile information, fulfill confirmed orders, comply with local food safety laws, and adhere to Whiskly's marketplace policies. Whiskly charges a platform fee on completed transactions.
        </p>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.agreed_to_terms}
            onChange={e => update({ agreed_to_terms: e.target.checked })}
            className="mt-0.5 w-4 h-4 flex-shrink-0"
          />
          <span className="text-sm font-medium" style={{ color: '#2d1a0e' }}>
            I agree to Whiskly's Seller Terms and confirm all information is accurate. *
          </span>
        </label>
      </div>
    </div>
  )
}