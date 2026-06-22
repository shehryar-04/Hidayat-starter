import { forwardRef } from 'react'

/**
 * CertificateTemplate — a stunning, print-ready certificate of completion.
 *
 * Rendered at a fixed A4-landscape pixel size (1123 × 794) so it captures
 * cleanly to PDF via html2canvas. The parent scales it responsively for
 * on-screen preview using CSS transform.
 *
 * Design language: deep emerald + antique gold, ivory parchment field,
 * arabesque corner flourishes, a gold wax-style medallion seal, and a
 * QR verification block — themed for an Islamic seminary.
 *
 * @param {{
 *   studentName: string,
 *   courseTitle: string,
 *   instructorName?: string,
 *   certificateNumber: string,
 *   verificationCode: string,
 *   issuedAt: string,
 *   verifyUrl: string,
 *   logoUrl?: string,
 * }} props
 */
const CertificateTemplate = forwardRef(function CertificateTemplate(
  {
    studentName,
    courseTitle,
    instructorName = 'Hidayat Academy',
    certificateNumber,
    verificationCode,
    issuedAt,
    verifyUrl,
    logoUrl = '/assets/LOGO_HIDAYAT.png',
  },
  ref
) {
  const GOLD = '#bf9b46'
  const EMERALD = '#0c4a32'
  const EMERALD_DEEP = '#083a26'
  const IVORY = '#fdfbf2'

  const formattedDate = issuedAt
    ? new Date(issuedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&data=${encodeURIComponent(
    verifyUrl
  )}`

  return (
    <div
      ref={ref}
      style={{
        width: 1123,
        height: 794,
        position: 'relative',
        background: `linear-gradient(135deg, ${EMERALD} 0%, ${EMERALD_DEEP} 100%)`,
        fontFamily: 'Georgia, "Times New Roman", serif',
        overflow: 'hidden',
        boxSizing: 'border-box',
        padding: 18,
      }}
    >
      {/* Outer gold hairline frame */}
      <div
        style={{
          position: 'absolute',
          inset: 14,
          border: `2px solid ${GOLD}`,
          borderRadius: 6,
          pointerEvents: 'none',
        }}
      />

      {/* Ivory parchment field */}
      <div
        style={{
          position: 'absolute',
          inset: 26,
          background: IVORY,
          borderRadius: 4,
          boxShadow: 'inset 0 0 0 6px rgba(191,155,70,0.18)',
        }}
      />

      {/* Subtle watermark seal behind content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.05,
          pointerEvents: 'none',
        }}
      >
        <StarMedallion size={420} color={EMERALD} />
      </div>

      {/* Corner flourishes */}
      <CornerFlourish color={GOLD} style={{ top: 34, left: 34 }} />
      <CornerFlourish color={GOLD} style={{ top: 34, right: 34, transform: 'scaleX(-1)' }} />
      <CornerFlourish color={GOLD} style={{ bottom: 34, left: 34, transform: 'scaleY(-1)' }} />
      <CornerFlourish color={GOLD} style={{ bottom: 34, right: 34, transform: 'scale(-1,-1)' }} />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '50px 90px 38px',
          boxSizing: 'border-box',
        }}
      >
        {/* Header: logo + academy */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img
            src={logoUrl}
            alt=""
            crossOrigin="anonymous"
            style={{ width: 54, height: 54, objectFit: 'contain' }}
          />
          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 2,
                color: EMERALD,
                lineHeight: 1,
              }}
            >
              HIDAYAT ACADEMY
            </div>
            <div style={{ fontSize: 11, letterSpacing: 5, color: GOLD, marginTop: 4 }}>
              ISLAMIC SEMINARY · DARUL ULOOM
            </div>
          </div>
        </div>

        {/* Title */}
        <div style={{ marginTop: 26 }}>
          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              color: EMERALD,
              letterSpacing: 1,
              lineHeight: 1.05,
            }}
          >
            Certificate
          </div>
          <div
            style={{
              fontSize: 16,
              letterSpacing: 8,
              color: GOLD,
              marginTop: 6,
              textTransform: 'uppercase',
            }}
          >
            of Completion
          </div>
        </div>

        {/* Divider */}
        <Divider color={GOLD} />

        {/* Presented to */}
        <div style={{ fontSize: 14, color: '#6b6b5e', letterSpacing: 1, marginTop: 4 }}>
          This certificate is proudly presented to
        </div>

        {/* Student name */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            fontStyle: 'italic',
            color: EMERALD,
            margin: '10px 0 6px',
            lineHeight: 1.1,
          }}
        >
          {studentName}
        </div>

        {/* underline accent under name */}
        <div
          style={{
            width: 360,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
            marginBottom: 18,
          }}
        />

        {/* Course statement */}
        <div style={{ fontSize: 15, color: '#5a5a4f', maxWidth: 720, lineHeight: 1.6 }}>
          for successfully completing all requirements of the course
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#1f3d2f',
            marginTop: 10,
            maxWidth: 760,
            lineHeight: 1.3,
          }}
        >
          {courseTitle}
        </div>

        {/* Signatures + seal row */}
        <div
          style={{
            marginTop: 'auto',
            width: '100%',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          {/* Date */}
          <FooterBlock label="Date Issued" value={formattedDate} color={EMERALD} gold={GOLD} />

          {/* Seal */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transform: 'translateY(8px)',
            }}
          >
            <WaxSeal gold={GOLD} emerald={EMERALD} />
          </div>

          {/* Instructor */}
          <FooterBlock
            label="Instructor"
            value={instructorName}
            color={EMERALD}
            gold={GOLD}
            align="right"
          />
        </div>

        {/* Verification band — separated from the signature row */}
        <div
          style={{
            width: '100%',
            marginTop: 26,
            paddingTop: 14,
            borderTop: `1px solid rgba(191,155,70,0.4)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* QR + verify URL */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src={qrSrc}
              alt="Verification QR code"
              crossOrigin="anonymous"
              style={{
                width: 52,
                height: 52,
                background: '#fff',
                padding: 3,
                border: `1px solid ${GOLD}`,
                borderRadius: 4,
              }}
            />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 9, letterSpacing: 1, color: '#8a8a7a' }}>VERIFY AT</div>
              <div style={{ fontSize: 10, color: EMERALD, fontWeight: 700 }}>
                hidayat.pk/certificate
              </div>
              <div style={{ fontSize: 10, color: '#8a8a7a', marginTop: 2, fontFamily: 'monospace' }}>
                {verificationCode}
              </div>
            </div>
          </div>

          {/* Certificate number */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, letterSpacing: 1, color: '#8a8a7a' }}>CERTIFICATE NO.</div>
            <div style={{ fontSize: 11, color: EMERALD, fontWeight: 700, fontFamily: 'monospace' }}>
              {certificateNumber}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

function Divider({ color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 8px' }}>
      <span style={{ width: 60, height: 1, background: color, opacity: 0.6 }} />
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 0l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"
          fill={color}
        />
      </svg>
      <span style={{ width: 60, height: 1, background: color, opacity: 0.6 }} />
    </div>
  )
}

function FooterBlock({ label, value, color, gold, align = 'left' }) {
  return (
    <div style={{ minWidth: 180, textAlign: align }}>
      <div style={{ fontSize: 16, fontWeight: 700, color, fontStyle: 'italic' }}>
        {value || '—'}
      </div>
      <div
        style={{
          height: 1,
          background: gold,
          opacity: 0.5,
          margin: '6px 0',
        }}
      />
      <div style={{ fontSize: 10, letterSpacing: 2, color: '#8a8a7a', textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  )
}

/** Antique-gold wax-style medallion seal. */
function WaxSeal({ gold, emerald }) {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
      {/* scalloped outer ring */}
      <g>
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i / 24) * Math.PI * 2
          const cx = 48 + Math.cos(angle) * 42
          const cy = 48 + Math.sin(angle) * 42
          return <circle key={i} cx={cx} cy={cy} r={5} fill={gold} opacity={0.9} />
        })}
      </g>
      <circle cx="48" cy="48" r="40" fill={gold} />
      <circle cx="48" cy="48" r="34" fill={emerald} />
      <circle cx="48" cy="48" r="33" fill="none" stroke={gold} strokeWidth="1.5" />
      {/* central star */}
      <path
        d="M48 24l5.5 16.5H71l-14 10.2 5.4 16.5L48 57l-14.4 10.2L39 50.7 25 40.5h17.5z"
        fill={gold}
      />
      <text
        x="48"
        y="84"
        textAnchor="middle"
        fontSize="7"
        fill={gold}
        fontFamily="Georgia, serif"
        letterSpacing="1"
      >
        SEAL
      </text>
    </svg>
  )
}

/** Arabesque corner flourish. */
function CornerFlourish({ color, style }) {
  return (
    <svg
      width="96"
      height="96"
      viewBox="0 0 96 96"
      fill="none"
      style={{ position: 'absolute', zIndex: 2, ...style }}
    >
      <path
        d="M4 92V40C4 20 20 4 40 4h52"
        stroke={color}
        strokeWidth="2"
        opacity="0.55"
      />
      <path
        d="M14 92V46C14 28 28 14 46 14h46"
        stroke={color}
        strokeWidth="1"
        opacity="0.4"
      />
      <path
        d="M12 40c10 0 18 8 18 18M40 12c0 10 8 18 18 18"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.5"
      />
      <circle cx="12" cy="12" r="3" fill={color} opacity="0.7" />
    </svg>
  )
}

/** Eight-point star medallion used as a faint watermark. */
function StarMedallion({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path
        d="M50 2l11 26 26-11-11 26 11 26-26-11-11 26-11-26-26 11 11-26-11-26 26 11z"
        fill={color}
      />
      <circle cx="50" cy="50" r="24" fill="#fff" />
      <circle cx="50" cy="50" r="24" fill={color} opacity="0.25" />
    </svg>
  )
}

export default CertificateTemplate
