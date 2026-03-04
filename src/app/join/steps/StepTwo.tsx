import { BakerData } from '../page'
import { useState } from 'react'

type Props = { data: BakerData; update: (fields: Partial<BakerData>) => void }

const inputStyle = { borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }

const COTTAGE_LAWS: Record<string, { summary: string; full: string; link: string }> = {
  AL: { summary: "Alabama allows cottage food sales up to $20,000/year with no license required.", full: "Alabama cottage food law permits the sale of non-potentially-hazardous foods made in a home kitchen. Sales are limited to $20,000 per year. No license or inspection is required. Sales must be direct to consumer. Labeling must include producer name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/alabama" },
  AK: { summary: "Alaska allows cottage food sales with no annual limit and no license required.", full: "Alaska has a broad cottage food law. No annual sales limit. No license or inspection required. Direct and indirect sales allowed. Products must be labeled with name, address, ingredients, and allergens.", link: "https://cottagefoodlaws.com/state/alaska" },
  AZ: { summary: "Arizona allows cottage food sales up to $75,000/year with no license required.", full: "Arizona permits cottage food sales up to $75,000/year. No license required. Online and indirect sales allowed. Must label with name, address, ingredients, allergens, and net weight.", link: "https://cottagefoodlaws.com/state/arizona" },
  AR: { summary: "Arkansas allows cottage food sales up to $50,000/year with no license required.", full: "Arkansas cottage food law allows sales up to $50,000/year. No license or inspection required. Direct and online sales permitted. Must label with producer info and ingredients.", link: "https://cottagefoodlaws.com/state/arkansas" },
  CA: { summary: "California allows cottage food sales up to $75,000/year with a Class A permit.", full: "California requires a Class A or Class B permit. Class A allows direct sales up to $75,000/year with no inspection. Class B allows indirect sales and requires inspection. Must label with permit number, ingredients, and allergens.", link: "https://cottagefoodlaws.com/state/california" },
  CO: { summary: "Colorado allows cottage food sales up to $10,000/year with no license required.", full: "Colorado permits cottage food sales up to $10,000/year. No license required. Direct sales only. Must label with name, address, ingredients, and net weight.", link: "https://cottagefoodlaws.com/state/colorado" },
  CT: { summary: "Connecticut allows cottage food sales with no annual limit.", full: "Connecticut has no annual sales limit for cottage food. No license required for most products. Direct sales only. Must label with producer name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/connecticut" },
  DE: { summary: "Delaware allows cottage food sales up to $7,500/year.", full: "Delaware permits cottage food sales up to $7,500/year. No license required. Direct sales only at farmers markets and similar venues. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/delaware" },
  FL: { summary: "Florida allows cottage food sales up to $50,000/year with no license required.", full: "Florida cottage food law allows sales up to $50,000/year. No license or inspection required. Direct and online sales permitted. Must label with name, address, and statement that product was made in a cottage food operation.", link: "https://cottagefoodlaws.com/state/florida" },
  GA: { summary: "Georgia allows cottage food sales up to $50,000/year with no license required.", full: "Georgia permits cottage food sales up to $50,000/year. No license required. Direct sales only. Must label with name, address, ingredients, and net weight.", link: "https://cottagefoodlaws.com/state/georgia" },
  HI: { summary: "Hawaii allows cottage food sales with registration required.", full: "Hawaii requires registration with the Department of Health. No annual sales limit. Direct sales only. Must label with registration number, name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/hawaii" },
  ID: { summary: "Idaho allows cottage food sales up to $50,000/year with no license required.", full: "Idaho permits cottage food sales up to $50,000/year. No license required. Direct and indirect sales allowed. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/idaho" },
  IL: { summary: "Illinois allows cottage food sales up to $50,000/year with no license required.", full: "Illinois cottage food law allows sales up to $50,000/year. No license required. Direct and online sales permitted. Must label with name, address, ingredients, and allergens.", link: "https://cottagefoodlaws.com/state/illinois" },
  IN: { summary: "Indiana allows cottage food sales up to $50,000/year with no license required.", full: "Indiana permits cottage food sales up to $50,000/year. No license required. Direct sales only. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/indiana" },
  IA: { summary: "Iowa allows cottage food sales up to $50,000/year with no license required.", full: "Iowa cottage food law allows sales up to $50,000/year. No license required. Direct and online sales permitted. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/iowa" },
  KS: { summary: "Kansas allows cottage food sales with no annual limit.", full: "Kansas has no annual sales limit. No license required. Direct sales only. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/kansas" },
  KY: { summary: "Kentucky allows cottage food sales up to $60,000/year.", full: "Kentucky permits cottage food sales up to $60,000/year. No license required for most products. Direct and online sales allowed. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/kentucky" },
  LA: { summary: "Louisiana allows cottage food sales up to $20,000/year.", full: "Louisiana cottage food law allows sales up to $20,000/year. No license required. Direct sales only. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/louisiana" },
  ME: { summary: "Maine allows cottage food sales up to $20,000/year with no license required.", full: "Maine permits cottage food sales up to $20,000/year. No license required. Direct sales only. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/maine" },
  MD: { summary: "Maryland allows cottage food sales up to $25,000/year with no license required.", full: "Maryland cottage food law allows sales up to $25,000/year. No license or inspection required. Direct sales only. Must label with name, address, ingredients, and net weight.", link: "https://cottagefoodlaws.com/state/maryland" },
  MA: { summary: "Massachusetts allows cottage food sales up to $25,000/year.", full: "Massachusetts permits cottage food sales up to $25,000/year. No license required for most products. Direct sales only. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/massachusetts" },
  MI: { summary: "Michigan allows cottage food sales up to $25,000/year with no license required.", full: "Michigan cottage food law allows sales up to $25,000/year. No license required. Direct and online sales permitted. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/michigan" },
  MN: { summary: "Minnesota allows cottage food sales up to $78,000/year.", full: "Minnesota permits cottage food sales up to $78,000/year. No license required for most products. Direct and indirect sales allowed. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/minnesota" },
  MS: { summary: "Mississippi allows cottage food sales up to $20,000/year.", full: "Mississippi cottage food law allows sales up to $20,000/year. No license required. Direct sales only. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/mississippi" },
  MO: { summary: "Missouri allows cottage food sales with no annual limit.", full: "Missouri has no annual sales limit. No license required. Direct sales only. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/missouri" },
  MT: { summary: "Montana allows cottage food sales up to $10,000/year.", full: "Montana permits cottage food sales up to $10,000/year. No license required. Direct sales only. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/montana" },
  NE: { summary: "Nebraska allows cottage food sales up to $50,000/year.", full: "Nebraska cottage food law allows sales up to $50,000/year. No license required. Direct and online sales permitted. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/nebraska" },
  NV: { summary: "Nevada allows cottage food sales up to $35,000/year.", full: "Nevada permits cottage food sales up to $35,000/year. No license required. Direct sales only. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/nevada" },
  NH: { summary: "New Hampshire allows cottage food sales up to $20,000/year.", full: "New Hampshire cottage food law allows sales up to $20,000/year. No license required. Direct sales only. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/new-hampshire" },
  NJ: { summary: "New Jersey allows cottage food sales up to $50,000/year.", full: "New Jersey permits cottage food sales up to $50,000/year. No license required for most products. Direct and online sales allowed. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/new-jersey" },
  NM: { summary: "New Mexico allows cottage food sales up to $60,000/year.", full: "New Mexico cottage food law allows sales up to $60,000/year. No license required. Direct and online sales permitted. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/new-mexico" },
  NY: { summary: "New York allows cottage food sales up to $50,000/year with no license required.", full: "New York permits cottage food sales up to $50,000/year. No license required. Direct sales only at farmers markets and similar venues. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/new-york" },
  NC: { summary: "North Carolina allows cottage food sales up to $20,000/year.", full: "North Carolina cottage food law allows sales up to $20,000/year. No license required. Direct sales only. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/north-carolina" },
  ND: { summary: "North Dakota allows cottage food sales up to $50,000/year.", full: "North Dakota permits cottage food sales up to $50,000/year. No license required. Direct and online sales allowed. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/north-dakota" },
  OH: { summary: "Ohio allows cottage food sales up to $35,000/year with no license required.", full: "Ohio cottage food law allows sales up to $35,000/year. No license required. Direct sales only. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/ohio" },
  OK: { summary: "Oklahoma allows cottage food sales up to $50,000/year.", full: "Oklahoma permits cottage food sales up to $50,000/year. No license required. Direct and online sales permitted. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/oklahoma" },
  OR: { summary: "Oregon allows cottage food sales up to $50,000/year.", full: "Oregon cottage food law allows sales up to $50,000/year. No license required for most products. Direct and online sales allowed. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/oregon" },
  PA: { summary: "Pennsylvania allows cottage food sales up to $12,000/year without a license.", full: "Pennsylvania permits cottage food sales up to $12,000/year without a license. Over $12,000 requires a home food processor license. Direct sales only. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/pennsylvania" },
  RI: { summary: "Rhode Island allows cottage food sales up to $25,000/year.", full: "Rhode Island cottage food law allows sales up to $25,000/year. No license required. Direct sales only. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/rhode-island" },
  SC: { summary: "South Carolina allows cottage food sales up to $20,000/year.", full: "South Carolina permits cottage food sales up to $20,000/year. No license required. Direct sales only. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/south-carolina" },
  SD: { summary: "South Dakota allows cottage food sales up to $5,000/year.", full: "South Dakota cottage food law allows sales up to $5,000/year. No license required. Direct sales only. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/south-dakota" },
  TN: { summary: "Tennessee allows cottage food sales up to $50,000/year with no license required.", full: "Tennessee permits cottage food sales up to $50,000/year. No license required. Direct and online sales permitted. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/tennessee" },
  TX: { summary: "Texas allows cottage food sales with no annual limit and no license required.", full: "Texas has one of the most permissive cottage food laws. No annual sales limit. No license required. Online and indirect sales allowed. Must label with name, address, ingredients, and statement that product was not inspected.", link: "https://cottagefoodlaws.com/state/texas" },
  UT: { summary: "Utah allows cottage food sales up to $20,000/year.", full: "Utah cottage food law allows sales up to $20,000/year. No license required. Direct sales only. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/utah" },
  VT: { summary: "Vermont allows cottage food sales up to $125,000/year — one of the most permissive laws.", full: "Vermont has one of the highest sales limits at $125,000/year. No license required. Direct and online sales allowed. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/vermont" },
  VA: { summary: "Virginia allows cottage food sales up to $25,000/year with no license required.", full: "Virginia permits cottage food sales up to $25,000/year. No license required. Direct sales only. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/virginia" },
  WA: { summary: "Washington allows cottage food sales up to $25,000/year.", full: "Washington cottage food law allows sales up to $25,000/year. No license required for most products. Direct sales only. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/washington" },
  WV: { summary: "West Virginia allows cottage food sales up to $50,000/year.", full: "West Virginia permits cottage food sales up to $50,000/year. No license required. Direct and online sales allowed. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/west-virginia" },
  WI: { summary: "Wisconsin allows cottage food sales up to $20,000/year.", full: "Wisconsin cottage food law allows sales up to $20,000/year. No license required. Direct sales only. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/wisconsin" },
  WY: { summary: "Wyoming allows cottage food sales up to $250,000/year — one of the highest limits.", full: "Wyoming has one of the highest sales limits at $250,000/year. No license required. Direct and online sales allowed. Must label with name, address, and ingredients.", link: "https://cottagefoodlaws.com/state/wyoming" },
}

export default function StepTwo({ data, update }: Props) {
  const [showFullLaw, setShowFullLaw] = useState(false)
  const law = data.state ? COTTAGE_LAWS[data.state.toUpperCase()] : null

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm" style={{ color: '#5c3d2e' }}>Tell us about your setup and location.</p>

      {/* Location */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>City *</label>
          <input value={data.city} onChange={e => update({ city: e.target.value })}
            placeholder="Upper Marlboro" className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
        </div>
        <div className="col-span-1">
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>State *</label>
          <select value={data.state} onChange={e => update({ state: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle}>
            <option value="">Select</option>
            {['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="col-span-1">
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>ZIP *</label>
          <input value={data.zip_code} onChange={e => update({ zip_code: e.target.value })}
            placeholder="20774" className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
        </div>
      </div>

      {/* Baker Type */}
      <div>
        <label className="block text-sm font-semibold mb-3" style={{ color: '#2d1a0e' }}>What type of baker are you? *</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => update({ is_cottage_baker: true })}
            className="p-4 rounded-xl border-2 text-left transition-all"
            style={{
              borderColor: data.is_cottage_baker === true ? '#2d1a0e' : '#e0d5cc',
              backgroundColor: data.is_cottage_baker === true ? '#f5f0eb' : 'white'
            }}
          >
            <p className="text-xl mb-1">🏠</p>
            <p className="font-semibold text-sm" style={{ color: '#2d1a0e' }}>Cottage Baker</p>
            <p className="text-xs mt-1" style={{ color: '#5c3d2e' }}>I bake from home under cottage food laws</p>
          </button>

          <button
            onClick={() => update({ is_cottage_baker: false })}
            className="p-4 rounded-xl border-2 text-left transition-all"
            style={{
              borderColor: data.is_cottage_baker === false ? '#2d1a0e' : '#e0d5cc',
              backgroundColor: data.is_cottage_baker === false ? '#f5f0eb' : 'white'
            }}
          >
            <p className="text-xl mb-1">🏪</p>
            <p className="font-semibold text-sm" style={{ color: '#2d1a0e' }}>Storefront Baker</p>
            <p className="text-xs mt-1" style={{ color: '#5c3d2e' }}>I operate a licensed commercial bakery</p>
          </button>
        </div>
      </div>

      {/* Cottage Food Laws */}
      {data.is_cottage_baker === true && law && (
        <div className="rounded-xl border p-4" style={{ backgroundColor: '#fef9c3', borderColor: '#f59e0b' }}>
          <p className="text-sm font-semibold mb-1" style={{ color: '#854d0e' }}>
            🏠 {data.state} Cottage Food Law
          </p>
          <p className="text-sm mb-2" style={{ color: '#854d0e' }}>{law.summary}</p>
          {showFullLaw && (
            <p className="text-xs mb-2 leading-relaxed" style={{ color: '#854d0e' }}>{law.full}</p>
          )}
          <div className="flex items-center justify-between">
            <button onClick={() => setShowFullLaw(!showFullLaw)}
              className="text-xs font-semibold underline" style={{ color: '#854d0e' }}>
              {showFullLaw ? 'Show less ↑' : 'Read full law ↓'}
            </button>
            <a href={law.link} target="_blank" rel="noopener noreferrer"
              className="text-xs font-semibold underline" style={{ color: '#854d0e' }}>
              Official source →
            </a>
          </div>
          <div className="mt-3 pt-3 border-t" style={{ borderColor: '#f59e0b' }}>
            <p className="text-xs italic" style={{ color: '#854d0e' }}>
              This summary is for informational purposes only and is not legal advice. Laws change — always verify with your state or consult an attorney before selling.
            </p>
          </div>
        </div>
      )}

      {/* Cottage permit */}
      {data.is_cottage_baker === true && (
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Cottage Permit Number <span className="font-normal text-xs">(if applicable)</span></label>
          <input value={data.cottage_permit_number} onChange={e => update({ cottage_permit_number: e.target.value })}
            placeholder="Optional" className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
          <label className="flex items-start gap-3 mt-3 cursor-pointer">
            <input type="checkbox" checked={data.cottage_state_agreed}
              onChange={e => update({ cottage_state_agreed: e.target.checked })}
              className="mt-0.5 w-4 h-4 flex-shrink-0" />
            <span className="text-xs leading-relaxed" style={{ color: '#5c3d2e' }}>
              I confirm I have read and understand my state's cottage food laws and will comply with all applicable regulations.
            </span>
          </label>
        </div>
      )}

      {/* Storefront verification */}
      {data.is_cottage_baker === false && (
        <div className="rounded-xl border p-5 flex flex-col gap-4" style={{ backgroundColor: '#f0f9ff', borderColor: '#0ea5e9' }}>
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: '#0369a1' }}>🏪 Storefront Verification Required</p>
            <p className="text-xs leading-relaxed" style={{ color: '#0369a1' }}>
              To list as a storefront baker, we need to verify your business. Your profile will show as <strong>Pending Verification</strong> until approved. This usually takes 1-2 business days.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Business Address *</label>
            <input
              value={data.business_address || ''}
              onChange={e => update({ business_address: e.target.value } as any)}
              placeholder="123 Main St, Upper Marlboro, MD 20774"
              className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Proof of Business *</label>
            <p className="text-xs mb-2" style={{ color: '#5c3d2e' }}>Upload one of: business license, EIN confirmation letter, or health department permit (PDF or image)</p>
            <label className="flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer" style={{ borderColor: '#e0d5cc', backgroundColor: '#faf8f6' }}>
              <span className="text-lg">📎</span>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: '#2d1a0e' }}>
                  {(data as any).verification_file_name || 'Choose file...'}
                </p>
                <p className="text-xs" style={{ color: '#5c3d2e' }}>PDF, JPG, or PNG — max 10MB</p>
              </div>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) update({ verification_file_name: file.name, verification_file: file } as any)
                }}
              />
            </label>
            {(data as any).verification_file_name && (
              <p className="text-xs mt-1.5 font-medium" style={{ color: '#166534' }}>
                ✓ {(data as any).verification_file_name} selected
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>EIN / Business License Number</label>
            <input
              value={(data as any).ein_number || ''}
              onChange={e => update({ ein_number: e.target.value } as any)}
              placeholder="XX-XXXXXXX"
              className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
          </div>

          <div className="p-3 rounded-lg" style={{ backgroundColor: '#e0f2fe' }}>
            <p className="text-xs" style={{ color: '#0369a1' }}>
              📋 Your documents are reviewed by the Whiskly team and never shared publicly. Once verified, your profile will display a <strong>Verified Storefront</strong> badge.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}