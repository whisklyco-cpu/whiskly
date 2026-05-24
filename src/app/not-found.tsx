import Link from 'next/link';

export default function NotFound() {
  return (
    <>
      <style>{`
        @keyframes whiskly-card-float {
          0%, 100% { transform: rotate(-3deg) translateY(0); }
          50% { transform: rotate(-1.5deg) translateY(-3px); }
        }
        @keyframes whiskly-steam {
          0%, 100% { opacity: 0.4; transform: translateY(0); }
          50% { opacity: 0.6; transform: translateY(-2px); }
        }
        .whiskly-card-float {
          transform-origin: 200px 130px;
          transform-box: fill-box;
          animation: whiskly-card-float 4s ease-in-out infinite;
        }
        .whiskly-steam {
          animation: whiskly-steam 3s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .whiskly-card-float, .whiskly-steam {
            animation: none;
          }
          .whiskly-card-float {
            transform: rotate(-3deg);
          }
        }
      `}</style>

      <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[#FAF6EE]">
        <div className="max-w-xl w-full text-center">
          {/* Recipe box illustration */}
          <div className="mb-8 flex justify-center">
            <svg
              viewBox="0 0 400 320"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full max-w-sm md:max-w-md h-auto"
              role="img"
              aria-label="An empty recipe box with a card showing 404"
            >
              {/* Ambient steam wisps */}
              <g
                className="whiskly-steam"
                stroke="#D4C4A8"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                opacity="0.5"
              >
                <path d="M 100 60 Q 105 50 100 40 Q 95 30 100 22" />
                <path d="M 300 55 Q 305 45 300 35 Q 295 25 300 18" />
              </g>

              {/* Recipe box body */}
              <rect
                x="80"
                y="180"
                width="240"
                height="100"
                fill="#A47551"
                stroke="#5D3A1A"
                strokeWidth="2"
                rx="6"
              />

              {/* Wood grain (subtle) */}
              <g opacity="0.4" stroke="#8B5A2B" fill="none">
                <line x1="90" y1="205" x2="310" y2="205" strokeWidth="0.6" />
                <line x1="90" y1="230" x2="310" y2="230" strokeWidth="0.6" />
                <line x1="90" y1="255" x2="310" y2="255" strokeWidth="0.6" />
              </g>

              {/* Box top lip (darker) */}
              <rect x="80" y="180" width="240" height="14" fill="#7A5238" />

              {/* Recipe box label */}
              <rect
                x="170"
                y="235"
                width="60"
                height="20"
                fill="#FFF8EC"
                stroke="#5D3A1A"
                strokeWidth="0.8"
                rx="2"
              />
              <text
                x="200"
                y="249"
                textAnchor="middle"
                fontFamily="Georgia, serif"
                fontSize="11"
                fill="#5D3A1A"
                fontStyle="italic"
              >
                Recipes
              </text>

              {/* Shadow under box */}
              <ellipse
                cx="200"
                cy="288"
                rx="120"
                ry="8"
                fill="#3D2914"
                opacity="0.15"
              />

              {/* Back card - left */}
              <g transform="rotate(-8 170 160)">
                <rect
                  x="120"
                  y="125"
                  width="100"
                  height="60"
                  fill="#FFF8EC"
                  stroke="#5D3A1A"
                  strokeWidth="0.8"
                  rx="3"
                />
                <line x1="130" y1="138" x2="205" y2="138" stroke="#C8915C" strokeWidth="0.5" />
                <line x1="130" y1="148" x2="200" y2="148" stroke="#C8915C" strokeWidth="0.5" />
                <line x1="130" y1="158" x2="205" y2="158" stroke="#C8915C" strokeWidth="0.5" />
                <line x1="130" y1="168" x2="185" y2="168" stroke="#C8915C" strokeWidth="0.5" />
              </g>

              {/* Back card - right */}
              <g transform="rotate(6 240 160)">
                <rect
                  x="190"
                  y="125"
                  width="100"
                  height="60"
                  fill="#FFF8EC"
                  stroke="#5D3A1A"
                  strokeWidth="0.8"
                  rx="3"
                />
                <line x1="200" y1="138" x2="275" y2="138" stroke="#C8915C" strokeWidth="0.5" />
                <line x1="200" y1="148" x2="270" y2="148" stroke="#C8915C" strokeWidth="0.5" />
                <line x1="200" y1="158" x2="275" y2="158" stroke="#C8915C" strokeWidth="0.5" />
              </g>

              {/* Front card with 404 (animated) */}
              <g className="whiskly-card-float">
                <rect
                  x="130"
                  y="90"
                  width="140"
                  height="100"
                  fill="#FFF8EC"
                  stroke="#5D3A1A"
                  strokeWidth="1.5"
                  rx="4"
                />

                {/* Washi tape on top corners */}
                <rect
                  x="125"
                  y="83"
                  width="22"
                  height="9"
                  fill="#E8B27D"
                  opacity="0.7"
                  rx="1"
                  transform="rotate(-12 136 87)"
                />
                <rect
                  x="253"
                  y="83"
                  width="22"
                  height="9"
                  fill="#E8B27D"
                  opacity="0.7"
                  rx="1"
                  transform="rotate(12 264 87)"
                />

                {/* Header dashes (recipe title underline) */}
                <line x1="145" y1="110" x2="170" y2="110" stroke="#C8915C" strokeWidth="0.8" />
                <line x1="230" y1="110" x2="255" y2="110" stroke="#C8915C" strokeWidth="0.8" />

                {/* The 404 */}
                <text
                  x="200"
                  y="155"
                  textAnchor="middle"
                  fontFamily="Georgia, serif"
                  fontSize="42"
                  fill="#8B5A2B"
                  fontWeight="500"
                >
                  404
                </text>

                {/* Recipe instructions placeholder lines */}
                <line
                  x1="145"
                  y1="170"
                  x2="255"
                  y2="170"
                  stroke="#C8915C"
                  strokeWidth="0.6"
                  strokeDasharray="2,2"
                />
                <line
                  x1="145"
                  y1="180"
                  x2="240"
                  y2="180"
                  stroke="#C8915C"
                  strokeWidth="0.6"
                  strokeDasharray="2,2"
                />
              </g>
            </svg>
          </div>

          {/* Heading */}
          <h1 className="font-serif text-3xl md:text-4xl text-[#2C1810] font-medium mb-4">
            We can&apos;t find that recipe
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-[#5D3A1A] mb-8 max-w-md mx-auto leading-relaxed">
            The page you&apos;re looking for isn&apos;t in our recipe box. Let&apos;s get you back to
            something good.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/bakers"
              className="inline-block bg-[#2C1810] text-white px-8 py-3 rounded font-medium hover:bg-[#3D2914] transition-colors"
            >
              Browse Bakers
            </Link>
            <Link
              href="/"
              className="inline-block border-2 border-[#2C1810] text-[#2C1810] px-8 py-3 rounded font-medium hover:bg-[#2C1810] hover:text-white transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
