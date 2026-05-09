const STORAGE_KEY = 'whiskly_attribution'
const FROM_SEARCH_KEY = 'whiskly_from_search'

export function captureAttribution(): void {
  if (typeof window === 'undefined') return

  // Mark if the user is currently on the browse page
  if (window.location.pathname === '/bakers') {
    sessionStorage.setItem(FROM_SEARCH_KEY, '1')
  }

  // Capture UTM params from the current URL if present
  const params = new URLSearchParams(window.location.search)
  const utm_source = params.get('utm_source') ?? ''
  const utm_medium = params.get('utm_medium') ?? ''
  const utm_campaign = params.get('utm_campaign') ?? ''

  if (utm_source || utm_medium || utm_campaign) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ utm_source, utm_medium, utm_campaign }))
  }
}

export function getAttribution(): {
  referral_source: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
} {
  if (typeof window === 'undefined') {
    return { referral_source: 'direct', utm_source: '', utm_medium: '', utm_campaign: '' }
  }

  const fromSearch = sessionStorage.getItem(FROM_SEARCH_KEY) === '1'
  const stored = sessionStorage.getItem(STORAGE_KEY)
  const { utm_source = '', utm_medium = '', utm_campaign = '' } = stored ? JSON.parse(stored) : {}

  let referral_source = 'direct'
  if (fromSearch) {
    referral_source = 'whiskly_search'
  } else if (utm_source) {
    referral_source = utm_source
  }

  return { referral_source, utm_source, utm_medium, utm_campaign }
}
