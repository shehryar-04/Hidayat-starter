import { useState, useEffect } from 'react'
import { ShieldCheck, ShieldAlert } from 'lucide-react'
import { isAuthBypassEnabled, setAuthBypass } from '../../config/authBypass'
import { cn } from './index'

export function AuthBypassBadge({ className = '' }) {
  const [bypass, setBypass] = useState(isAuthBypassEnabled)

  useEffect(() => {
    const handler = () => setBypass(isAuthBypassEnabled())
    window.addEventListener('auth_bypass_changed', handler)
    return () => window.removeEventListener('auth_bypass_changed', handler)
  }, [])

  return (
    <button
      type="button"
      onClick={() => setAuthBypass(!bypass)}
      title={
        bypass
          ? 'Auth testing bypass is ACTIVE: operating as Admin without login. Click to disable.'
          : 'Auth testing bypass is INACTIVE: normal login required. Click to enable Admin bypass.'
      }
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border shadow-2xs cursor-pointer select-none',
        bypass
          ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
          : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700',
        className
      )}
    >
      {bypass ? (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span className="hidden sm:inline">Admin Bypass Active</span>
          <span className="sm:hidden">Bypass</span>
        </>
      ) : (
        <>
          <ShieldAlert className="w-3.5 h-3.5 opacity-60" />
          <span className="hidden sm:inline">Bypass Off</span>
        </>
      )}
    </button>
  )
}
