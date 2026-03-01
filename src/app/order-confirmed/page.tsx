import Link from 'next/link'

export default async function OrderConfirmed({
  searchParams,
}: {
  searchParams: Promise<{ ref: string }>
}) {
  const { ref } = await searchParams

  return (
    <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0eb' }}>
      <div className="bg-white rounded-2xl shadow-sm p-10 w-full max-w-md text-center">
        
        <div className="text-6xl mb-6">🎂</div>
        
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#2d1a0e' }}>Request Sent!</h1>
        <p className="text-sm mb-6" style={{ color: '#5c3d2e' }}>
          Your request has been sent to the baker. They'll review it and get back to you soon.
        </p>

        <div className="px-4 py-3 rounded-xl mb-6" style={{ backgroundColor: '#f5f0eb' }}>
          <p className="text-xs font-medium mb-1" style={{ color: '#5c3d2e' }}>Your Reference Code</p>
          <p className="text-lg font-bold" style={{ color: '#2d1a0e' }}>{ref}</p>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/bakers" className="w-full py-3 rounded-lg text-white font-semibold block" style={{ backgroundColor: '#2d1a0e' }}>
            Browse More Bakers
          </Link>
          <Link href="/" className="w-full py-3 rounded-lg font-semibold block border" style={{ borderColor: '#2d1a0e', color: '#2d1a0e' }}>
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}