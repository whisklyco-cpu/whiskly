'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const PLATFORMS = ['Instagram', 'Threads', 'TikTok', 'Facebook', 'Lemon8', 'Pinterest', 'LinkedIn']
const CONTENT_TYPES = ['Baker Spotlight', 'Seasonal', 'Behind the Scenes', 'Product / Order', 'Promotional', 'Educational', 'User Generated', 'Other']

const PLATFORM_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Instagram: { bg: '#fce7f3', text: '#9d174d', dot: '#ec4899' },
  Threads:   { bg: '#f1f5f9', text: '#334155', dot: '#64748b' },
  TikTok:    { bg: '#fce7f3', text: '#9d174d', dot: '#9d174d' },
  Facebook:  { bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6' },
  Lemon8:    { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
  Pinterest: { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' },
  LinkedIn:  { bg: '#dbeafe', text: '#1e40af', dot: '#0ea5e9' },
}

const BEST_DAYS: Record<string, string> = {
  Instagram: 'Tue, Wed, Fri · 9am–11am',
  Threads:   'Mon–Fri · 8am–10am',
  TikTok:    'Tue, Thu, Fri · 7pm–9pm',
  Facebook:  'Wed, Thu · 1pm–3pm',
  Lemon8:    'Sat, Sun · 10am–12pm',
  Pinterest: 'Sat · 8pm–11pm',
  LinkedIn:  'Tue, Wed, Thu · 8am–10am',
}

const SEASONAL_EVENTS = [
  { name: "Valentine's Day", month: 1, day: 14, reminderDays: 21 },
  { name: "Mother's Day", month: 4, day: 11, reminderDays: 21 },
  { name: 'Graduation Season', month: 4, day: 15, reminderDays: 14 },
  { name: 'Summer Weddings', month: 5, day: 1, reminderDays: 30 },
  { name: 'Halloween', month: 9, day: 31, reminderDays: 21 },
  { name: 'Thanksgiving', month: 10, day: 27, reminderDays: 21 },
  { name: 'Christmas', month: 11, day: 25, reminderDays: 28 },
  { name: "New Year's Eve", month: 11, day: 31, reminderDays: 14 },
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

interface Post {
  id: string
  platform: string
  caption: string
  scheduled_for: string
  baker_name: string
  content_type: string
  status: string
  posted_at: string | null
  reminder_sent: boolean
  created_at: string
}

interface AdLog {
  id: string
  data: { campaign_name: string; start_date: string; end_date: string; platform: string }
}

interface ContentCalendarProps {
  adLogs: AdLog[]
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isOverdue(post: Post) {
  return post.status === 'scheduled' && new Date(post.scheduled_for) < new Date()
}

function fmt12(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ContentCalendar({ adLogs }: ContentCalendarProps) {
  const today = new Date()
  const [view, setView] = useState<'month' | 'week'>('month')
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [markingDone, setMarkingDone] = useState<string | null>(null)

  // Form state
  const [formPlatform, setFormPlatform] = useState('')
  const [formCaption, setFormCaption] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formTime, setFormTime] = useState('10:00')
  const [formBaker, setFormBaker] = useState('')
  const [formType, setFormType] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadPosts() }, [])

  async function loadPosts() {
    setLoading(true)
    const { data } = await supabase
      .from('marketing_content')
      .select('*')
      .order('scheduled_for', { ascending: true })
    setPosts(data || [])
    setLoading(false)
  }

  async function savePost() {
    if (!formPlatform || !formDate) return
    setSaving(true)
    const scheduledFor = new Date(`${formDate}T${formTime}:00`).toISOString()
    await supabase.from('marketing_content').insert({
      platform: formPlatform,
      caption: formCaption.trim(),
      scheduled_for: scheduledFor,
      baker_name: formBaker.trim(),
      content_type: formType,
      status: 'scheduled',
    })
    setFormPlatform(''); setFormCaption(''); setFormDate(''); setFormTime('10:00')
    setFormBaker(''); setFormType('')
    setSaving(false)
    setShowForm(false)
    setSelectedDay(null)
    loadPosts()
  }

  async function markPosted(post: Post) {
    setMarkingDone(post.id)
    const postedAt = new Date().toISOString()
    await supabase.from('marketing_content').update({ status: 'posted', posted_at: postedAt }).eq('id', post.id)
    // Auto-log to marketing_logs social
    await supabase.from('marketing_logs').insert({
      type: 'social',
      data: {
        platform: post.platform,
        caption: post.caption,
        baker: post.baker_name,
        posted_at: postedAt,
        from_calendar: true,
      },
    })
    setMarkingDone(null)
    setSelectedPost(null)
    loadPosts()
  }

  async function deletePost(postId: string) {
    await supabase.from('marketing_content').delete().eq('id', postId)
    setSelectedPost(null)
    loadPosts()
  }

  // ── MONTH VIEW HELPERS ────────────────────────────────────────
  function getMonthDays() {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: (Date | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d))
    return days
  }

  function postsForDay(day: Date) {
    return posts.filter(p => isSameDay(new Date(p.scheduled_for), day))
  }

  function seasonalForDay(day: Date) {
    return SEASONAL_EVENTS.filter(e => e.month === day.getMonth() && e.day === day.getDate())
  }

  function seasonalDeadlineForDay(day: Date) {
    // Show campaign deadline reminders (3 weeks before event)
    return SEASONAL_EVENTS.filter(e => {
      const eventDate = new Date(day.getFullYear(), e.month, e.day)
      const deadline = new Date(eventDate)
      deadline.setDate(deadline.getDate() - e.reminderDays)
      return isSameDay(deadline, day)
    })
  }

  function adsForDay(day: Date) {
    return adLogs.filter(a => {
      if (!a.data?.start_date || !a.data?.end_date) return false
      const start = new Date(a.data.start_date)
      const end = new Date(a.data.end_date)
      return day >= start && day <= end
    })
  }

  // ── WEEK VIEW HELPERS ─────────────────────────────────────────
  function getWeekDays() {
    const d = view === 'week' ? new Date(currentDate) : new Date(today)
    const day = d.getDay()
    const start = new Date(d)
    start.setDate(d.getDate() - day)
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      return date
    })
  }

  function prevPeriod() {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    } else {
      const d = new Date(currentDate)
      d.setDate(d.getDate() - 7)
      setCurrentDate(d)
    }
  }

  function nextPeriod() {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    } else {
      const d = new Date(currentDate)
      d.setDate(d.getDate() + 7)
      setCurrentDate(d)
    }
  }

  function openDayForm(day: Date) {
    setSelectedDay(day)
    setFormDate(day.toISOString().split('T')[0])
    setShowForm(true)
  }

  const monthDays = getMonthDays()
  const weekDays = getWeekDays()

  const upcomingReminders = posts.filter(p => {
    if (p.status !== 'scheduled') return false
    const diff = (new Date(p.scheduled_for).getTime() - Date.now()) / 86400000
    return diff > 0 && diff <= 7
  })

  const overduePosts = posts.filter(isOverdue)

  return (
    <div className="flex flex-col gap-4">

      {/* Alerts */}
      {overduePosts.length > 0 && (
        <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: '#fee2e2' }}>
          <span className="text-xs font-semibold" style={{ color: '#991b1b' }}>
            {overduePosts.length} overdue post{overduePosts.length !== 1 ? 's' : ''} — mark as posted or delete
          </span>
        </div>
      )}
      {upcomingReminders.length > 0 && (
        <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: '#fef3c7' }}>
          <span className="text-xs font-semibold" style={{ color: '#92400e' }}>
            {upcomingReminders.length} post{upcomingReminders.length !== 1 ? 's' : ''} scheduled in the next 7 days
          </span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={prevPeriod} className="p-1.5 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>←</button>
            <p className="font-bold text-base" style={{ color: '#2d1a0e' }}>
              {view === 'month'
                ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                : `Week of ${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            </p>
            <button onClick={nextPeriod} className="p-1.5 rounded-lg border text-sm" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>→</button>
            <button onClick={() => setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))}
              className="text-xs px-2.5 py-1 rounded-lg border" style={{ borderColor: '#e0d5cc', color: '#9c7b6b' }}>Today</button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(['month', 'week'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold capitalize"
                  style={{ backgroundColor: view === v ? '#2d1a0e' : '#f5f0eb', color: view === v ? 'white' : '#5c3d2e' }}>
                  {v}
                </button>
              ))}
            </div>
            <button onClick={() => { setShowForm(true); setFormDate(today.toISOString().split('T')[0]) }}
              className="text-xs px-3 py-1.5 rounded-lg text-white font-semibold"
              style={{ backgroundColor: '#8B4513' }}>
              + Schedule Post
            </button>
          </div>
        </div>
      </div>

      {/* Best days reference */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-xs font-bold mb-2" style={{ color: '#2d1a0e' }}>Best Times to Post</p>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map(p => {
            const colors = PLATFORM_COLORS[p]
            return (
              <div key={p} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs" style={{ backgroundColor: colors.bg }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors.dot }} />
                <span className="font-semibold" style={{ color: colors.text }}>{p}</span>
                <span style={{ color: colors.text, opacity: 0.7 }}>{BEST_DAYS[p]}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── MONTH VIEW ─────────────────────────────────────────── */}
      {view === 'month' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b" style={{ borderColor: '#e0d5cc' }}>
            {DAYS.map(d => (
              <div key={d} className="py-2 text-center text-xs font-semibold" style={{ color: '#9c7b6b' }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {monthDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} className="border-r border-b p-1 min-h-24" style={{ borderColor: '#f5f0eb', backgroundColor: '#faf8f6' }} />
              const dayPosts = postsForDay(day)
              const seasonal = seasonalForDay(day)
              const deadlines = seasonalDeadlineForDay(day)
              const ads = adsForDay(day)
              const isToday = isSameDay(day, today)

              return (
                <div key={day.toISOString()}
                  onClick={() => openDayForm(day)}
                  className="border-r border-b p-1 min-h-24 cursor-pointer hover:bg-opacity-50 transition-colors"
                  style={{ borderColor: '#f5f0eb', backgroundColor: isToday ? '#fef9f5' : 'white' }}>

                  {/* Day number */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold flex items-center justify-center w-6 h-6 rounded-full"
                      style={{ backgroundColor: isToday ? '#2d1a0e' : 'transparent', color: isToday ? 'white' : '#5c3d2e' }}>
                      {day.getDate()}
                    </span>
                  </div>

                  {/* Ad ranges */}
                  {ads.slice(0, 1).map(a => (
                    <div key={a.id} className="text-xs px-1 py-0.5 rounded mb-0.5 truncate"
                      style={{ backgroundColor: '#f5f0eb', color: '#8B4513', fontSize: '10px' }}>
                      Ad: {a.data.campaign_name}
                    </div>
                  ))}

                  {/* Seasonal events */}
                  {seasonal.map(e => (
                    <div key={e.name} className="text-xs px-1 py-0.5 rounded mb-0.5 truncate"
                      style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: '10px' }}>
                      {e.name}
                    </div>
                  ))}

                  {/* Seasonal deadlines */}
                  {deadlines.map(e => (
                    <div key={`dl-${e.name}`} className="text-xs px-1 py-0.5 rounded mb-0.5 truncate"
                      style={{ backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '10px' }}>
                      Send: {e.name} campaign
                    </div>
                  ))}

                  {/* Posts */}
                  {dayPosts.slice(0, 3).map(p => {
                    const colors = PLATFORM_COLORS[p.platform] || { bg: '#f5f0eb', text: '#5c3d2e', dot: '#9c7b6b' }
                    const overdue = isOverdue(p)
                    return (
                      <div key={p.id}
                        onClick={e => { e.stopPropagation(); setSelectedPost(p) }}
                        className="flex items-center gap-1 px-1 py-0.5 rounded mb-0.5 cursor-pointer"
                        style={{ backgroundColor: overdue ? '#fee2e2' : p.status === 'posted' ? '#dcfce7' : colors.bg }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: overdue ? '#ef4444' : p.status === 'posted' ? '#16a34a' : colors.dot }} />
                        <span className="truncate" style={{ color: overdue ? '#991b1b' : p.status === 'posted' ? '#15803d' : colors.text, fontSize: '10px' }}>
                          {fmt12(p.scheduled_for)} {p.platform}
                        </span>
                      </div>
                    )
                  })}
                  {dayPosts.length > 3 && (
                    <p style={{ fontSize: '10px', color: '#9c7b6b' }}>+{dayPosts.length - 3} more</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── WEEK VIEW ──────────────────────────────────────────── */}
      {view === 'week' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b" style={{ borderColor: '#e0d5cc' }}>
            {weekDays.map(day => {
              const isToday = isSameDay(day, today)
              return (
                <div key={day.toISOString()} className="py-3 text-center border-r" style={{ borderColor: '#f5f0eb', backgroundColor: isToday ? '#fef9f5' : 'white' }}>
                  <p className="text-xs font-semibold" style={{ color: '#9c7b6b' }}>{DAYS[day.getDay()]}</p>
                  <span className="text-sm font-bold flex items-center justify-center w-7 h-7 rounded-full mx-auto mt-0.5"
                    style={{ backgroundColor: isToday ? '#2d1a0e' : 'transparent', color: isToday ? 'white' : '#2d1a0e' }}>
                    {day.getDate()}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-7 min-h-64">
            {weekDays.map(day => {
              const dayPosts = postsForDay(day)
              const seasonal = seasonalForDay(day)
              const deadlines = seasonalDeadlineForDay(day)
              const ads = adsForDay(day)
              const isToday = isSameDay(day, today)

              return (
                <div key={day.toISOString()}
                  onClick={() => openDayForm(day)}
                  className="border-r p-2 cursor-pointer"
                  style={{ borderColor: '#f5f0eb', backgroundColor: isToday ? '#fef9f5' : 'white' }}>

                  {ads.slice(0, 1).map(a => (
                    <div key={a.id} className="text-xs px-1.5 py-1 rounded mb-1 truncate"
                      style={{ backgroundColor: '#f5f0eb', color: '#8B4513', fontSize: '11px' }}>
                      Ad: {a.data.campaign_name}
                    </div>
                  ))}

                  {seasonal.map(e => (
                    <div key={e.name} className="text-xs px-1.5 py-1 rounded mb-1"
                      style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: '11px' }}>
                      {e.name}
                    </div>
                  ))}

                  {deadlines.map(e => (
                    <div key={`dl-${e.name}`} className="text-xs px-1.5 py-1 rounded mb-1"
                      style={{ backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '11px' }}>
                      Deadline: {e.name}
                    </div>
                  ))}

                  {dayPosts.map(p => {
                    const colors = PLATFORM_COLORS[p.platform] || { bg: '#f5f0eb', text: '#5c3d2e', dot: '#9c7b6b' }
                    const overdue = isOverdue(p)
                    return (
                      <div key={p.id}
                        onClick={e => { e.stopPropagation(); setSelectedPost(p) }}
                        className="px-1.5 py-1.5 rounded mb-1 cursor-pointer"
                        style={{ backgroundColor: overdue ? '#fee2e2' : p.status === 'posted' ? '#dcfce7' : colors.bg }}>
                        <p className="text-xs font-semibold truncate"
                          style={{ color: overdue ? '#991b1b' : p.status === 'posted' ? '#15803d' : colors.text }}>
                          {fmt12(p.scheduled_for)} · {p.platform}
                        </p>
                        {p.caption && (
                          <p className="text-xs truncate mt-0.5" style={{ color: overdue ? '#991b1b' : p.status === 'posted' ? '#15803d' : colors.text, opacity: 0.8 }}>
                            {p.caption}
                          </p>
                        )}
                        {p.status === 'posted' && <p className="text-xs mt-0.5" style={{ color: '#15803d', opacity: 0.7 }}>Posted</p>}
                        {overdue && <p className="text-xs mt-0.5" style={{ color: '#991b1b' }}>Overdue</p>}
                      </div>
                    )
                  })}

                  <button onClick={e => { e.stopPropagation(); openDayForm(day) }}
                    className="text-xs w-full text-center mt-1 py-1 rounded" style={{ color: '#c4a882' }}>
                    + Add
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── SCHEDULE POST FORM (modal) ────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(45,26,14,0.4)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="font-bold" style={{ color: '#2d1a0e' }}>Schedule a Post</p>
              <button onClick={() => { setShowForm(false); setSelectedDay(null) }} style={{ color: '#9c7b6b' }}>✕</button>
            </div>

            <div className="flex flex-col gap-3">
              <select value={formPlatform} onChange={e => setFormPlatform(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: formPlatform ? '#2d1a0e' : '#9c7b6b' }}>
                <option value="">Platform...</option>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              {formPlatform && (
                <p className="text-xs px-2" style={{ color: '#9c7b6b' }}>Best time: {BEST_DAYS[formPlatform]}</p>
              )}

              <select value={formType} onChange={e => setFormType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: formType ? '#2d1a0e' : '#9c7b6b' }}>
                <option value="">Content type...</option>
                {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#9c7b6b' }}>Date</label>
                  <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }} />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#9c7b6b' }}>Time</label>
                  <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }} />
                </div>
              </div>

              <input value={formBaker} onChange={e => setFormBaker(e.target.value)}
                placeholder="Baker featured (optional)"
                className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }} />

              <textarea value={formCaption} onChange={e => setFormCaption(e.target.value)}
                placeholder="Caption or post description (optional)" rows={3}
                className="w-full px-3 py-2 rounded-xl border text-sm resize-none" style={{ borderColor: '#e0d5cc', color: '#2d1a0e' }} />
            </div>

            <div className="flex gap-2">
              <button onClick={savePost} disabled={saving || !formPlatform || !formDate}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ backgroundColor: '#2d1a0e', opacity: (!formPlatform || !formDate) ? 0.4 : 1 }}>
                {saving ? 'Saving...' : 'Schedule Post'}
              </button>
              <button onClick={() => { setShowForm(false); setSelectedDay(null) }}
                className="px-4 py-2.5 rounded-xl text-sm border font-semibold"
                style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── POST DETAIL MODAL ─────────────────────────────────── */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(45,26,14,0.4)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(() => {
                  const colors = PLATFORM_COLORS[selectedPost.platform] || { bg: '#f5f0eb', text: '#5c3d2e', dot: '#9c7b6b' }
                  return <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: colors.bg, color: colors.text }}>{selectedPost.platform}</span>
                })()}
                {selectedPost.status === 'posted' && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>Posted</span>}
                {isOverdue(selectedPost) && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>Overdue</span>}
              </div>
              <button onClick={() => setSelectedPost(null)} style={{ color: '#9c7b6b' }}>✕</button>
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-xs" style={{ color: '#9c7b6b' }}>
                {fmtDate(selectedPost.scheduled_for)} at {fmt12(selectedPost.scheduled_for)}
              </p>
              {selectedPost.content_type && <p className="text-xs" style={{ color: '#8B4513' }}>{selectedPost.content_type}</p>}
              {selectedPost.baker_name && <p className="text-xs font-semibold" style={{ color: '#5c3d2e' }}>Baker: {selectedPost.baker_name}</p>}
              {selectedPost.caption && <p className="text-sm mt-1" style={{ color: '#2d1a0e' }}>{selectedPost.caption}</p>}
              {selectedPost.posted_at && <p className="text-xs mt-1" style={{ color: '#9c7b6b' }}>Posted {fmtDate(selectedPost.posted_at)}</p>}
            </div>

            <div className="flex gap-2">
              {selectedPost.status !== 'posted' && (
                <button onClick={() => markPosted(selectedPost)} disabled={markingDone === selectedPost.id}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ backgroundColor: '#16a34a' }}>
                  {markingDone === selectedPost.id ? 'Marking...' : 'Mark as Posted'}
                </button>
              )}
              <button onClick={() => deletePost(selectedPost.id)}
                className="px-4 py-2.5 rounded-xl text-sm border font-semibold"
                style={{ borderColor: '#fee2e2', color: '#991b1b' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── UPCOMING POSTS LIST ───────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <p className="font-bold mb-3" style={{ color: '#2d1a0e' }}>Upcoming Scheduled Posts</p>
        {posts.filter(p => p.status === 'scheduled').length === 0 && (
          <p className="text-xs" style={{ color: '#9c7b6b' }}>No posts scheduled yet. Click any day on the calendar to add one.</p>
        )}
        <div className="flex flex-col gap-2">
          {posts.filter(p => p.status === 'scheduled').slice(0, 10).map(p => {
            const colors = PLATFORM_COLORS[p.platform] || { bg: '#f5f0eb', text: '#5c3d2e', dot: '#9c7b6b' }
            const overdue = isOverdue(p)
            return (
              <div key={p.id}
                onClick={() => setSelectedPost(p)}
                className="flex items-center justify-between p-3 rounded-xl border cursor-pointer"
                style={{ borderColor: overdue ? '#fca5a5' : '#e0d5cc', backgroundColor: overdue ? '#fff5f5' : 'white' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: overdue ? '#ef4444' : colors.dot }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#2d1a0e' }}>{p.platform} · {p.content_type || 'Post'}</p>
                    <p className="text-xs" style={{ color: '#9c7b6b' }}>{fmtDate(p.scheduled_for)} at {fmt12(p.scheduled_for)}</p>
                    {p.caption && <p className="text-xs truncate max-w-xs mt-0.5" style={{ color: '#5c3d2e' }}>{p.caption}</p>}
                  </div>
                </div>
                {overdue
                  ? <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>Overdue</span>
                  : <span className="text-xs" style={{ color: '#9c7b6b' }}>→</span>}
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}