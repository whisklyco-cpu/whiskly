'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function AccountSettings() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'profile' | 'email' | 'password'>('profile')

  // Profile
  const [fullName, setFullName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState('')

  // Email
  const [newEmail, setNewEmail] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailSaved, setEmailSaved] = useState(false)
  const [emailError, setEmailError] = useState('')

  // Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      setNewEmail(session.user.email || '')

      // Try to load customer profile first, then baker
      const { data: customer } = await supabase.from('customers').select('*').eq('user_id', session.user.id).maybeSingle()
      if (customer) {
        setProfile({ ...customer, type: 'customer' })
        setFullName(customer.full_name || '')
      } else {
        const { data: baker } = await supabase.from('bakers').select('*').eq('user_id', session.user.id).maybeSingle()
        if (baker) {
          setProfile({ ...baker, type: 'baker' })
          setFullName(baker.business_name || '')
        }
      }
      setLoading(false)
    }
    loadUser()
  }, [])

  async function saveProfile() {
    if (!profile) return
    setSavingProfile(true)
    setProfileError('')
    if (profile.type === 'customer') {
      const { error } = await supabase.from('customers').update({ full_name: fullName }).eq('user_id', user.id)
      if (error) setProfileError(error.message)
      else { setProfileSaved(true); setTimeout(() => setProfileSaved(false), 3000) }
    } else {
      const { error } = await supabase.from('bakers').update({ business_name: fullName }).eq('user_id', user.id)
      if (error) setProfileError(error.message)
      else { setProfileSaved(true); setTimeout(() => setProfileSaved(false), 3000) }
    }
    setSavingProfile(false)
  }

  async function saveEmail() {
    if (!newEmail.trim() || newEmail === user.email) return
    setSavingEmail(true)
    setEmailError('')
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
    if (error) {
      setEmailError(error.message)
    } else {
      setEmailSaved(true)
      setTimeout(() => setEmailSaved(false), 5000)
    }
    setSavingEmail(false)
  }

  async function savePassword() {
    if (!newPassword || !confirmPassword) return
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match.'); return }
    if (newPassword.length < 8) { setPasswordError('Password must be at least 8 characters.'); return }
    setSavingPassword(true)
    setPasswordError('')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSaved(true)
      setNewPassword('')
      setConfirmPassword('')
      setCurrentPassword('')
      setTimeout(() => setPasswordSaved(false), 3000)
    }
    setSavingPassword(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0eb' }}>
      <p style={{ color: '#2d1a0e' }}>Loading...</p>
    </div>
  )

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f0eb' }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-5 py-10">

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#2d1a0e' }}>Account Settings</h1>
            <p className="text-sm mt-1" style={{ color: '#5c3d2e' }}>{user?.email}</p>
          </div>
          <Link
            href={profile?.type === 'baker' ? '/dashboard/baker' : '/dashboard/customer'}
            className="text-sm font-semibold underline"
            style={{ color: '#8B4513' }}>
            Back to Dashboard
          </Link>
        </div>

        {/* Section tabs */}
        <div className="flex gap-2 mb-6">
          {[['profile', 'Profile'], ['email', 'Email'], ['password', 'Password']].map(([val, label]) => (
            <button key={val} onClick={() => setActiveSection(val as any)}
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: activeSection === val ? '#2d1a0e' : 'white', color: activeSection === val ? 'white' : '#2d1a0e' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Profile section */}
        {activeSection === 'profile' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-1" style={{ color: '#2d1a0e' }}>
              {profile?.type === 'baker' ? 'Business Name' : 'Your Name'}
            </h2>
            <p className="text-sm mb-5" style={{ color: '#5c3d2e' }}>
              {profile?.type === 'baker' ? 'This is your public business name shown to customers.' : 'This is the name shown on your orders and reviews.'}
            </p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>
                  {profile?.type === 'baker' ? 'Business Name' : 'Full Name'}
                </label>
                <input value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm"
                  style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
              </div>

              {profileError && <p className="text-xs" style={{ color: '#dc2626' }}>{profileError}</p>}
              {profileSaved && <p className="text-xs" style={{ color: '#166534' }}>Saved successfully.</p>}

              <button onClick={saveProfile} disabled={savingProfile || !fullName.trim()}
                className="py-3 rounded-xl text-white font-semibold text-sm"
                style={{ backgroundColor: '#2d1a0e', opacity: (savingProfile || !fullName.trim()) ? 0.6 : 1 }}>
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Email section */}
        {activeSection === 'email' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-1" style={{ color: '#2d1a0e' }}>Email Address</h2>
            <p className="text-sm mb-5" style={{ color: '#5c3d2e' }}>
              Your current email is <strong>{user?.email}</strong>. If you change it, you will need to confirm the new address.
            </p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>New Email Address</label>
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm"
                  style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
              </div>

              {emailError && <p className="text-xs" style={{ color: '#dc2626' }}>{emailError}</p>}
              {emailSaved && (
                <div className="px-4 py-3 rounded-xl text-xs font-medium" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                  Confirmation email sent to {newEmail}. Check your inbox and click the link to confirm the change.
                </div>
              )}

              <button onClick={saveEmail} disabled={savingEmail || !newEmail.trim() || newEmail === user?.email}
                className="py-3 rounded-xl text-white font-semibold text-sm"
                style={{ backgroundColor: '#2d1a0e', opacity: (savingEmail || !newEmail.trim() || newEmail === user?.email) ? 0.6 : 1 }}>
                {savingEmail ? 'Updating...' : 'Update Email'}
              </button>
            </div>
          </div>
        )}

        {/* Password section */}
        {activeSection === 'password' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-1" style={{ color: '#2d1a0e' }}>Change Password</h2>
            <p className="text-sm mb-5" style={{ color: '#5c3d2e' }}>Choose a strong password of at least 8 characters.</p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-4 py-3 rounded-xl border text-sm"
                    style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
                  <button type="button" onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-3 text-xs font-semibold"
                    style={{ color: '#5c3d2e' }}>
                    {showPasswords ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#2d1a0e' }}>Confirm New Password</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && savePassword()}
                  placeholder="Repeat your password"
                  className="w-full px-4 py-3 rounded-xl border text-sm"
                  style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6' }} />
              </div>

              {passwordError && <p className="text-xs" style={{ color: '#dc2626' }}>{passwordError}</p>}
              {passwordSaved && <p className="text-xs" style={{ color: '#166534' }}>Password updated successfully.</p>}

              <button onClick={savePassword} disabled={savingPassword || !newPassword || !confirmPassword}
                className="py-3 rounded-xl text-white font-semibold text-sm"
                style={{ backgroundColor: '#2d1a0e', opacity: (savingPassword || !newPassword || !confirmPassword) ? 0.6 : 1 }}>
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>

              <div className="pt-2 border-t" style={{ borderColor: '#f5f0eb' }}>
                <p className="text-xs mb-2" style={{ color: '#5c3d2e' }}>Forgot your current password?</p>
                <Link href="/forgot-password" className="text-xs font-semibold underline" style={{ color: '#8B4513' }}>
                  Reset via email instead
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Sign out */}
        <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold mb-1" style={{ color: '#2d1a0e' }}>Sign Out</h2>
          <p className="text-xs mb-4" style={{ color: '#5c3d2e' }}>You will be signed out of your account on this device.</p>
          <button onClick={handleSignOut}
            className="px-5 py-2.5 rounded-xl border text-sm font-semibold"
            style={{ borderColor: '#dc2626', color: '#dc2626' }}>
            Sign Out
          </button>
        </div>

      </div>
    </main>
  )
}