import { BakerData } from '../page'

type Props = { data: BakerData; update: (fields: Partial<BakerData>) => void }

const SPECIALTIES = ['Wedding Cakes', 'Birthday Cakes', 'Custom Cookies', 'Cupcakes', 'Kids Party Cakes', 'Vegan/Gluten Free', 'Alcohol Infused', 'Breads', 'Cheesecakes', 'Macarons', 'Custom Dessert Boxes', 'Other']
const DIETARY_TAGS = ['Vegan', 'Gluten Free', 'Nut Free', 'Halal', 'Kosher', 'Dairy Free', 'Sugar Free']

export default function StepThree({ data, update }: Props) {
  function toggleSpecialty(s: string) {
    const current = data.specialties
    update({ specialties: current.includes(s) ? current.filter(x => x !== s) : [...current, s] })
  }

  function toggleDietary(tag: string) {
    const current = data.dietary_tags
    update({ dietary_tags: current.includes(tag) ? current.filter(x => x !== tag) : [...current, tag] })
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm" style={{ color: '#5c3d2e' }}>Tell us what you make. This feeds our search filters so customers can find you.</p>

      <div>
        <label className="block text-sm font-semibold mb-3" style={{ color: '#2d1a0e' }}>Specialties * (select all that apply)</label>
        <div className="flex flex-wrap gap-2">
          {SPECIALTIES.map(s => (
            <button
              key={s}
              onClick={() => toggleSpecialty(s)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: data.specialties.includes(s) ? '#2d1a0e' : '#f5f0eb',
                color: data.specialties.includes(s) ? 'white' : '#2d1a0e',
                border: `1px solid ${data.specialties.includes(s) ? '#2d1a0e' : '#e0d5cc'}`
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-3" style={{ color: '#2d1a0e' }}>Dietary Options (select all that apply)</label>
        <div className="flex flex-wrap gap-2">
          {DIETARY_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => toggleDietary(tag)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: data.dietary_tags.includes(tag) ? '#2d1a0e' : '#f5f0eb',
                color: data.dietary_tags.includes(tag) ? 'white' : '#2d1a0e',
                border: `1px solid ${data.dietary_tags.includes(tag) ? '#2d1a0e' : '#e0d5cc'}`
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2d1a0e' }}>Years of Experience</label>
        <select
          value={data.years_experience}
          onChange={e => update({ years_experience: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border text-sm"
          style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }}
        >
          <option value="">Select</option>
          <option value="1">Less than 1 year</option>
          <option value="2">1-2 years</option>
          <option value="3">3-5 years</option>
          <option value="6">6-10 years</option>
          <option value="11">10+ years</option>
        </select>
      </div>
    </div>
  )
}