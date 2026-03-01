'use client'

import { useState } from 'react'
import { BakerData } from '../page'

type Props = { data: BakerData; update: (fields: Partial<BakerData>) => void }

const inputStyle = { borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }

const COTTAGE_LAWS: Record<string, { summary: string; full: string; link: string }> = {
  AL: { summary: 'Alabama allows cottage food sales directly to consumers with no license required. No sales cap.', full: 'Alabama Cottage Food Law (SB 194): No license or inspection required. No annual sales limit. Sales must be direct to consumer from home, farmers markets, or roadside stands. Products must be labeled with name, address, ingredients, allergens, and net weight. Allowed products include baked goods, jams, jellies, candy, and other shelf-stable foods.', link: 'https://cottagefoodlaws.com/state/alabama' },
  AK: { summary: 'Alaska allows home-based food sales with a Cottage Food permit. Annual sales up to $25,000.', full: 'Alaska Cottage Food Law (AS 17.20.020): A Cottage Food permit is required. Annual gross sales up to $25,000. Sales must be direct to consumer. Products must be labeled with producer name, address, product name, ingredients, allergens, and net weight.', link: 'https://cottagefoodlaws.com/state/alaska' },
  AZ: { summary: 'Arizona allows cottage food sales with no license required. Annual sales up to $75,000.', full: 'Arizona Cottage Food Law (HB 2341): No license or inspection required. Annual gross sales up to $75,000. Direct and indirect sales allowed. Products must include name, address, product name, ingredients, allergens, net weight, and "Made in an Arizona home kitchen" statement.', link: 'https://cottagefoodlaws.com/state/arizona' },
  AR: { summary: 'Arkansas allows cottage food sales directly to consumers with no license required. Sales up to $20,000/year.', full: 'Arkansas Cottage Food Law (SB 906): No license required. Annual gross sales up to $20,000. Direct sales only. Products must be labeled with producer name, address, product name, ingredients, and allergens.', link: 'https://cottagefoodlaws.com/state/arkansas' },
  CA: { summary: 'California allows home bakers to sell up to $75,000/year directly or through retailers with a permit.', full: 'California Homemade Food Act (AB 1616 & AB 626): Class A permit allows direct sales up to $75,000/year — no inspection required. Class B permit allows indirect sales through stores — annual inspection required. Register with your county health department before selling.', link: 'https://cottagefoodlaws.com/state/california' },
  CO: { summary: 'Colorado allows cottage food sales with a registration. Annual sales up to $10,000 without registration, $50,000 with.', full: 'Colorado Cottage Foods Act (HB 12-1027): Sales up to $10,000/year with no registration. With a Cottage Food Registration, sales up to $50,000/year allowed. Direct and indirect sales permitted with registration.', link: 'https://cottagefoodlaws.com/state/colorado' },
  CT: { summary: 'Connecticut allows cottage food sales with a license. Annual sales up to $50,000.', full: 'Connecticut Cottage Food Law (PA 21-168): A Home Processor license is required ($100/year). Annual gross sales up to $50,000. Direct and indirect sales allowed.', link: 'https://cottagefoodlaws.com/state/connecticut' },
  DE: { summary: 'Delaware allows cottage food sales directly to consumers. Annual sales up to $7,500 without a license.', full: 'Delaware Cottage Food Law: Sales up to $7,500/year with no license required. Above that threshold, a food facility license is required. Direct sales only.', link: 'https://cottagefoodlaws.com/state/delaware' },
  DC: { summary: 'Washington DC allows cottage food operations with sales up to $25,000/year directly to consumers.', full: 'Washington DC Cottage Food Law: Annual gross sales up to $25,000. A basic business license from DCRA is recommended. Products must include ingredient list, allergen information, and home kitchen statement.', link: 'https://cottagefoodlaws.com/state/washington-dc' },
  FL: { summary: 'Florida allows selling homemade foods directly to consumers with no license required. No sales cap.', full: 'Florida Cottage Food Law (FS 500.80): No license required. No annual sales cap. Online sales allowed for in-state delivery. Products must include "Made in a cottage food operation that is not subject to Florida\'s food safety regulations."', link: 'https://cottagefoodlaws.com/state/florida' },
  GA: { summary: 'Georgia allows selling homemade foods directly to consumers with no license required. No sales limit.', full: 'Georgia Cottage Food Law (HB 1361): No license or inspection required. No annual sales limit. Direct sales only. Products must include the home kitchen not inspected statement.', link: 'https://cottagefoodlaws.com/state/georgia' },
  HI: { summary: 'Hawaii allows cottage food sales with a Home Bakery permit. No sales cap.', full: 'Hawaii Cottage Food Law (HRS 321-11.2): A Home Bakery permit is required from the Department of Health. No annual sales cap. Direct and indirect sales allowed.', link: 'https://cottagefoodlaws.com/state/hawaii' },
  ID: { summary: 'Idaho allows cottage food sales with no license required. Annual sales up to $50,000.', full: 'Idaho Cottage Food Law (SB 1337): No license or inspection required. Annual gross sales up to $50,000. Direct and indirect sales allowed.', link: 'https://cottagefoodlaws.com/state/idaho' },
  IL: { summary: 'Illinois allows cottage food sales directly to consumers with gross sales under $50,000/year.', full: 'Illinois Cottage Food Operation Act: No license required below $50,000/year. Direct sales only — no wholesale or out-of-state internet sales.', link: 'https://cottagefoodlaws.com/state/illinois' },
  IN: { summary: 'Indiana allows cottage food sales with no license required. Annual sales up to $20,000.', full: 'Indiana Cottage Food Law (HEA 1309): No license required. Annual gross sales up to $20,000. Direct sales only.', link: 'https://cottagefoodlaws.com/state/indiana' },
  IA: { summary: 'Iowa allows cottage food sales with a Home Food Establishment license. No sales cap.', full: 'Iowa Cottage Food Law: A Home Food Establishment license is required ($25/year). No annual sales cap. Direct and indirect sales allowed.', link: 'https://cottagefoodlaws.com/state/iowa' },
  KS: { summary: 'Kansas allows cottage food sales with no license required. Annual sales up to $50,000.', full: 'Kansas Cottage Food Law: No license or inspection required. Annual gross sales up to $50,000. Direct and indirect sales allowed.', link: 'https://cottagefoodlaws.com/state/kansas' },
  KY: { summary: 'Kentucky allows cottage food sales with no license required. Annual sales up to $60,000.', full: 'Kentucky Cottage Food Law: No license required. Annual gross sales up to $60,000. Direct and indirect sales allowed.', link: 'https://cottagefoodlaws.com/state/kentucky' },
  LA: { summary: 'Louisiana allows cottage food sales with a Cottage Food Permit. Annual sales up to $20,000.', full: 'Louisiana Cottage Food Law: A Cottage Food Permit is required. Annual gross sales up to $20,000. Direct sales only.', link: 'https://cottagefoodlaws.com/state/louisiana' },
  ME: { summary: 'Maine allows cottage food sales with no license required. Annual sales up to $20,000.', full: 'Maine Cottage Food Law: No license required. Annual gross sales up to $20,000. Direct sales only.', link: 'https://cottagefoodlaws.com/state/maine' },
  MD: { summary: 'Maryland allows home bakers to sell directly to consumers without a license for gross sales under $25,000/year.', full: 'Maryland Cottage Food Law: No license required for gross sales under $25,000/year. Direct sales only — no wholesale or restaurant sales. Products must include name, address, ingredients, allergens, and home kitchen not inspected by the Maryland Department of Health statement.', link: 'https://cottagefoodlaws.com/state/maryland' },
  MA: { summary: 'Massachusetts allows cottage food sales with a Home Food Operation permit. Annual sales up to $25,000.', full: 'Massachusetts Cottage Food Law: A Home Food Operation permit from your local Board of Health is required. Annual gross sales up to $25,000. Direct sales only.', link: 'https://cottagefoodlaws.com/state/massachusetts' },
  MI: { summary: 'Michigan allows cottage food sales with no license required. Annual sales up to $25,000.', full: 'Michigan Cottage Food Law: No license required. Annual gross sales up to $25,000. Direct and indirect sales allowed.', link: 'https://cottagefoodlaws.com/state/michigan' },
  MN: { summary: 'Minnesota allows cottage food sales with no license required. Annual sales up to $18,000.', full: 'Minnesota Cottage Food Law: No license required. Annual gross sales up to $18,000. Direct sales only.', link: 'https://cottagefoodlaws.com/state/minnesota' },
  MS: { summary: 'Mississippi allows cottage food sales with no license required. Annual sales up to $50,000.', full: 'Mississippi Cottage Food Law: No license required. Annual gross sales up to $50,000. Direct and indirect sales allowed.', link: 'https://cottagefoodlaws.com/state/mississippi' },
  MO: { summary: 'Missouri allows cottage food sales with no license required. Annual sales up to $50,000.', full: 'Missouri Cottage Food Law: No license required. Annual gross sales up to $50,000. Direct and indirect sales allowed.', link: 'https://cottagefoodlaws.com/state/missouri' },
  MT: { summary: 'Montana allows cottage food sales with no license required. Annual sales up to $10,000.', full: 'Montana Cottage Food Law: No license required. Annual gross sales up to $10,000. Direct sales only.', link: 'https://cottagefoodlaws.com/state/montana' },
  NE: { summary: 'Nebraska allows cottage food sales with no license required. Annual sales up to $50,000.', full: 'Nebraska Cottage Food Law: No license required. Annual gross sales up to $50,000. Direct and indirect sales allowed.', link: 'https://cottagefoodlaws.com/state/nebraska' },
  NV: { summary: 'Nevada allows cottage food sales with a Cottage Food Permit. Annual sales up to $35,000.', full: 'Nevada Cottage Food Law: A Cottage Food Permit is required. Annual gross sales up to $35,000. Direct and indirect sales allowed.', link: 'https://cottagefoodlaws.com/state/nevada' },
  NH: { summary: 'New Hampshire allows cottage food sales with no license required. Annual sales up to $20,000.', full: 'New Hampshire Cottage Food Law: No license required. Annual gross sales up to $20,000. Direct sales only.', link: 'https://cottagefoodlaws.com/state/new-hampshire' },
  NJ: { summary: 'New Jersey allows cottage food sales with a Home Processor registration. Annual sales up to $50,000.', full: 'New Jersey Cottage Food Law: A Home Processor registration is required. Annual gross sales up to $50,000. Direct and indirect sales allowed.', link: 'https://cottagefoodlaws.com/state/new-jersey' },
  NM: { summary: 'New Mexico allows cottage food sales with no license required. Annual sales up to $60,000.', full: 'New Mexico Cottage Food Law: No license required. Annual gross sales up to $60,000. Direct and indirect sales allowed.', link: 'https://cottagefoodlaws.com/state/new-mexico' },
  NY: { summary: 'New York allows selling homemade non-potentially-hazardous foods directly to consumers. Annual sales limit of $50,000.', full: 'New York State Cottage Food Law: No license required for direct sales below $50,000/year. Products must include name, address, product name, ingredients, allergen information, and net weight.', link: 'https://cottagefoodlaws.com/state/new-york' },
  NC: { summary: 'North Carolina allows selling homemade foods directly to consumers. Annual gross sales must not exceed $20,000.', full: 'North Carolina Cottage Food Law: No license required below $20,000/year. Direct sales only. Products must include operator name, address, product name, ingredients, allergens, and home kitchen not inspected statement.', link: 'https://cottagefoodlaws.com/state/north-carolina' },
  ND: { summary: 'North Dakota allows cottage food sales with no license required. Annual sales up to $30,000.', full: 'North Dakota Cottage Food Law: No license required. Annual gross sales up to $30,000. Direct and indirect sales allowed.', link: 'https://cottagefoodlaws.com/state/north-dakota' },
  OH: { summary: 'Ohio allows cottage food sales with no license required. Annual sales up to $35,000.', full: 'Ohio Cottage Food Law: No license required. Annual gross sales up to $35,000. Direct and indirect sales allowed.', link: 'https://cottagefoodlaws.com/state/ohio' },
  OK: { summary: 'Oklahoma allows cottage food sales with no license required. Annual sales up to $60,000.', full: 'Oklahoma Cottage Food Law: No license required. Annual gross sales up to $60,000. Direct and indirect sales allowed.', link: 'https://cottagefoodlaws.com/state/oklahoma' },
  OR: { summary: 'Oregon allows cottage food sales with a Home Bakery license. Annual sales up to $50,000.', full: 'Oregon Cottage Food Law: A Home Bakery license is required ($100/year). Annual gross sales up to $50,000. Direct and indirect sales allowed.', link: 'https://cottagefoodlaws.com/state/oregon' },
  PA: { summary: 'Pennsylvania allows cottage food sales with no license required for direct sales. Annual sales up to $12,000.', full: 'Pennsylvania Cottage Food Law: No license required for annual gross sales up to $12,000. Direct sales only. Above $12,000, a retail food facility license is required.', link: 'https://cottagefoodlaws.com/state/pennsylvania' },
  RI: { summary: 'Rhode Island allows cottage food sales with a Home Food Manufacturing license. Annual sales up to $25,000.', full: 'Rhode Island Cottage Food Law: A Home Food Manufacturing license is required. Annual gross sales up to $25,000. Direct and indirect sales allowed.', link: 'https://cottagefoodlaws.com/state/rhode-island' },
  SC: { summary: 'South Carolina allows cottage food sales with no license required. Annual sales up to $15,000.', full: 'South Carolina Cottage Food Law: No license required. Annual gross sales up to $15,000. Direct sales only.', link: 'https://cottagefoodlaws.com/state/south-carolina' },
  SD: { summary: 'South Dakota allows cottage food sales with no license required. Annual sales up to $25,000.', full: 'South Dakota Cottage Food Law: No license required. Annual gross sales up to $25,000. Direct and indirect sales allowed.', link: 'https://cottagefoodlaws.com/state/south-dakota' },
  TN: { summary: 'Tennessee allows cottage food sales with no license required. Annual sales up to $50,000.', full: 'Tennessee Cottage Food Law: No license required. Annual gross sales up to $50,000. Direct and indirect sales allowed.', link: 'https://cottagefoodlaws.com/state/tennessee' },
  TX: { summary: 'Texas allows selling homemade foods directly to consumers with no license required. No sales limit.', full: 'Texas Cottage Food Law: No license, permit, or inspection required. No annual sales limit. Online sales allowed for in-person delivery only. Products must include home kitchen not inspected statement.', link: 'https://cottagefoodlaws.com/state/texas' },
  UT: { summary: 'Utah allows cottage food sales with a Cottage Food Registration. Annual sales up to $20,000.', full: 'Utah Cottage Food Law: A Cottage Food Registration is required. Annual gross sales up to $20,000. Direct and indirect sales allowed.', link: 'https://cottagefoodlaws.com/state/utah' },
  VT: { summary: 'Vermont allows cottage food sales with no license required. Annual sales up to $125,000.', full: 'Vermont Cottage Food Law: No license required. Annual gross sales up to $125,000. Direct and indirect sales allowed. Vermont has one of the most permissive cottage food laws in the country.', link: 'https://cottagefoodlaws.com/state/vermont' },
  VA: { summary: 'Virginia permits selling homemade foods directly to consumers with no license required. Annual gross sales must not exceed $35,000.', full: 'Virginia Cottage Food Law: No license or inspection required. Annual gross sales up to $35,000. Direct sales only — no wholesale or out-of-state internet sales.', link: 'https://cottagefoodlaws.com/state/virginia' },
  WA: { summary: 'Washington allows cottage food sales with a Cottage Food permit. Annual sales up to $25,000.', full: 'Washington Cottage Food Law: A Cottage Food permit is required. Annual gross sales up to $25,000. Direct and indirect sales allowed.', link: 'https://cottagefoodlaws.com/state/washington' },
  WV: { summary: 'West Virginia allows cottage food sales with no license required. Annual sales up to $50,000.', full: 'West Virginia Cottage Food Law: No license required. Annual gross sales up to $50,000. Direct and indirect sales allowed.', link: 'https://cottagefoodlaws.com/state/west-virginia' },
  WI: { summary: 'Wisconsin allows cottage food sales with no license required. Annual sales up to $20,000.', full: 'Wisconsin Cottage Food Law: No license required. Annual gross sales up to $20,000. Direct sales only.', link: 'https://cottagefoodlaws.com/state/wisconsin' },
  WY: { summary: 'Wyoming allows cottage food sales with no license required. No sales cap.', full: 'Wyoming Cottage Food Law: No license or inspection required. No annual sales cap. Direct and indirect sales allowed. Wyoming has one of the most permissive cottage food laws in the US.', link: 'https://cottagefoodlaws.com/state/wyoming' },
}

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

export default function StepTwo({ data, update }: Props) {
  const [expanded, setExpanded] = useState(false)
  const cottageLaw = data.state ? COTTAGE_LAWS[data.state] : null

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm" style={{ color: '#5c3d2e' }}>Tell us about your setup and where you're located.</p>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>City *</label>
          <input value={data.city} onChange={e => update({ city: e.target.value })} placeholder="Upper Marlboro" className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>State *</label>
          <select value={data.state} onChange={e => { update({ state: e.target.value }); setExpanded(false) }} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle}>
            <option value="">State</option>
            {US_STATES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>ZIP Code *</label>
        <input value={data.zip_code} onChange={e => update({ zip_code: e.target.value })} placeholder="20774" className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-3" style={{ color: '#2d1a0e' }}>What type of baker are you? *</label>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => update({ is_cottage_baker: true })} className="p-4 rounded-xl border-2 text-left transition-all" style={{ borderColor: data.is_cottage_baker ? '#2d1a0e' : '#e0d5cc', backgroundColor: data.is_cottage_baker ? '#f5f0eb' : 'white' }}>
            <p className="font-semibold text-sm" style={{ color: '#2d1a0e' }}>🏠 Cottage Baker</p>
            <p className="text-xs mt-1" style={{ color: '#5c3d2e' }}>I bake from home</p>
          </button>
          <button onClick={() => update({ is_cottage_baker: false })} className="p-4 rounded-xl border-2 text-left transition-all" style={{ borderColor: !data.is_cottage_baker ? '#2d1a0e' : '#e0d5cc', backgroundColor: !data.is_cottage_baker ? '#f5f0eb' : 'white' }}>
            <p className="font-semibold text-sm" style={{ color: '#2d1a0e' }}>🏪 Storefront Baker</p>
            <p className="text-xs mt-1" style={{ color: '#5c3d2e' }}>I have a commercial kitchen or shop</p>
          </button>
        </div>
      </div>

      {data.is_cottage_baker && (
        <div className="flex flex-col gap-4">
          {cottageLaw ? (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #f59e0b' }}>
              <div className="p-4" style={{ backgroundColor: '#fef9c3' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: '#854d0e' }}>📋 {data.state} Cottage Food Law</p>
                <p className="text-xs leading-relaxed" style={{ color: '#854d0e' }}>
                  {expanded ? cottageLaw.full : cottageLaw.summary}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <button onClick={() => setExpanded(!expanded)} className="text-xs font-semibold underline" style={{ color: '#854d0e' }}>
                    {expanded ? 'Show less ↑' : 'Read full law ↓'}
                  </button>
                  <a href={cottageLaw.link} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold underline" style={{ color: '#854d0e' }}>
                    View official law →
                  </a>
                </div>
              </div>
              <div className="px-4 py-2" style={{ backgroundColor: '#fef3c7' }}>
                <p className="text-xs" style={{ color: '#92400e' }}>
                  ⚠️ This summary is for informational purposes only and is not legal advice. Laws change — always verify with your state or consult an attorney before selling.
                </p>
              </div>
            </div>
          ) : data.state ? (
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#f5f0eb' }}>
              <p className="text-sm" style={{ color: '#5c3d2e' }}>Please check your state's cottage food laws before selling. Requirements vary by state.</p>
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Cottage Food Permit Number (if applicable)</label>
            <input value={data.cottage_permit_number} onChange={e => update({ cottage_permit_number: e.target.value })} placeholder="Optional" className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={data.cottage_state_agreed} onChange={e => update({ cottage_state_agreed: e.target.checked })} className="mt-0.5 w-4 h-4 flex-shrink-0" />
            <span className="text-sm" style={{ color: '#2d1a0e' }}>
              I confirm that I have read and understand my state's cottage food laws and agree to operate in compliance with them.
            </span>
          </label>
        </div>
      )}
    </div>
  )
}