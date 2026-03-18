'use client'

interface EmailModalProps {
  emailModal: { to: string; subject: string; body: string } | null
  onClose: () => void
}

export function EmailModal({ emailModal, onClose }: EmailModalProps) {
  if (!emailModal) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="font-bold" style={{ color: '#2d1a0e' }}>Copy Email Text</p>
          <button onClick={onClose} className="text-xs font-semibold px-3 py-1.5 rounded-lg border" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Close</button>
        </div>
        {emailModal.to && <p className="text-xs" style={{ color: '#5c3d2e' }}><strong>To:</strong> {emailModal.to}</p>}
        {emailModal.subject && <p className="text-xs" style={{ color: '#5c3d2e' }}><strong>Subject:</strong> {emailModal.subject}</p>}
        <p className="text-xs font-semibold" style={{ color: '#854d0e' }}>Select all the text below and copy it manually (Ctrl+A then Ctrl+C / Cmd+A then Cmd+C):</p>
        <textarea
          readOnly
          value={emailModal.body}
          rows={10}
          onFocus={e => e.target.select()}
          className="w-full px-3 py-2 rounded-xl border text-xs resize-none"
          style={{ borderColor: '#e0d5cc', color: '#2d1a0e', backgroundColor: '#faf8f6', fontFamily: 'inherit' }} />
        <div className="flex gap-2">
          {emailModal.to && (
            <a
              href={'mailto:' + emailModal.to + (emailModal.subject ? '?subject=' + encodeURIComponent(emailModal.subject) + '&body=' + encodeURIComponent(emailModal.body) : '')}
              className="flex-1 py-2.5 rounded-xl text-white text-xs font-semibold text-center"
              style={{ backgroundColor: '#2d1a0e' }}>
              Try Open in Email Client
            </a>
          )}
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-xs font-semibold" style={{ borderColor: '#e0d5cc', color: '#5c3d2e' }}>Done</button>
        </div>
      </div>
    </div>
  )
}
