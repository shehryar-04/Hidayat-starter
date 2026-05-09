import logoSrc from '../../assets/LOGO_HIDAYAT.png'

/**
 * Reusable HIDAYAT logo component.
 * @param {object} props
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Size variant
 * @param {boolean} [props.showText=true] - Show "HIDAYAT" text next to logo
 * @param {string} [props.className] - Additional classes
 */
export default function Logo({ size = 'md', showText = true, className = '' }) {
  const sizes = {
    sm: { img: 'h-8 w-8', text: 'text-base' },
    md: { img: 'h-10 w-10', text: 'text-xl sm:text-2xl' },
    lg: { img: 'h-14 w-14', text: 'text-2xl sm:text-3xl' },
  }
  const s = sizes[size] || sizes.md

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img src={logoSrc} alt="HIDAYAT" className={`${s.img} object-contain`} />
      {showText && (
        <span className="flex flex-col leading-tight">
          <span className={`font-serif font-bold text-primary ${s.text}`}>
            HIDAYAT
          </span>
          <span className="text-[9px] sm:text-[10px] font-sans text-slate-500 tracking-wide">
            Learning Today, Leading Tomorrow
          </span>
        </span>
      )}
    </span>
  )
}

/** Just the image, for favicon / tab icon usage */
export { logoSrc }
