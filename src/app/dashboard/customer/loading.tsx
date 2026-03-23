export default function Loading() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf8f6', padding: '32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ height: '40px', width: '240px', backgroundColor: '#e0d5cc', borderRadius: '6px', marginBottom: '12px' }} />
        <div style={{ height: '20px', width: '160px', backgroundColor: '#e0d5cc', borderRadius: '6px', marginBottom: '32px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ height: '320px', backgroundColor: '#e0d5cc', borderRadius: '16px' }} />
          ))}
        </div>
      </div>
    </div>
  )
}