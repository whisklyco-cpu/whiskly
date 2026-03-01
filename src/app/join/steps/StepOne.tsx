import { BakerData } from '../page'

type Props = { data: BakerData; update: (fields: Partial<BakerData>) => void }

const inputStyle = {
  borderColor: '#e0d5cc',
  color: '#2d1a0e',
  backgroundColor: '#faf8f6'
}

export default function StepOne({ data, update }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm" style={{ color: '#5c3d2e' }}>Let's start with the basics. This is how customers and Whiskly will identify you.</p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Full Name *</label>
          <input
            value={data.full_name}
            onChange={e => update({ full_name: e.target.value })}
            placeholder="Alexandria Johnson"
            className="w-full px-4 py-3 rounded-xl border text-sm"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Business Name *</label>
          <input
            value={data.business_name}
            onChange={e => update({ business_name: e.target.value })}
            placeholder="Sweet Creations Bakery"
            className="w-full px-4 py-3 rounded-xl border text-sm"
            style={inputStyle}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Email *</label>
          <input
            type="email"
            value={data.email}
            onChange={e => update({ email: e.target.value })}
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-xl border text-sm"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Phone *</label>
          <input
            type="tel"
            value={data.phone}
            onChange={e => update({ phone: e.target.value })}
            placeholder="(301) 555-0100"
            className="w-full px-4 py-3 rounded-xl border text-sm"
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Password *</label>
        <input
          type="password"
          value={data.password}
          onChange={e => update({ password: e.target.value })}
          placeholder="Min. 6 characters"
          className="w-full px-4 py-3 rounded-xl border text-sm"
          style={inputStyle}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Instagram Handle</label>
          <div className="flex items-center border rounded-xl overflow-hidden" style={{ borderColor: '#e0d5cc', backgroundColor: '#faf8f6' }}>
            <span className="px-3 text-sm" style={{ color: '#5c3d2e' }}>@</span>
            <input
              value={data.instagram_handle}
              onChange={e => update({ instagram_handle: e.target.value })}
              placeholder="yourbakery"
              className="flex-1 py-3 pr-4 text-sm bg-transparent outline-none"
              style={{ color: '#2d1a0e' }}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>How did you hear about us?</label>
          <select
            value={data.how_did_you_hear}
            onChange={e => update({ how_did_you_hear: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border text-sm"
            style={inputStyle}
          >
            <option value="">Select one</option>
            <option>Word of mouth</option>
            <option>Instagram</option>
            <option>TikTok</option>
            <option>Google</option>
            <option>Facebook</option>
            <option>Another baker</option>
            <option>Other</option>
          </select>
        </div>
      </div>
    </div>
  )
}