import { AlertTriangle, AlertCircle, Info, HelpCircle } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'
import { cn } from './utils'

const VARIANT_ICONS = {
  danger: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  primary: HelpCircle,
}

const VARIANT_STYLES = {
  danger: {
    iconBg: 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400',
    buttonVariant: 'destructive',
  },
  warning: {
    iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
    buttonVariant: 'primary',
  },
  info: {
    iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
    buttonVariant: 'primary',
  },
  primary: {
    iconBg: 'bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400',
    buttonVariant: 'primary',
  },
}

/**
 * Reusable Confirmation Dialog
 * Standard replacement for browser window.confirm().
 *
 * @param {object} props
 * @param {boolean} props.open - Whether dialog is visible
 * @param {function} props.onClose - Triggered on cancel or dismiss
 * @param {function} props.onConfirm - Triggered when user confirms
 * @param {string} [props.title='Confirm Action'] - Dialog title
 * @param {React.ReactNode} [props.message] - Main message / description
 * @param {React.ReactNode} [props.children] - Additional content if provided
 * @param {string} [props.confirmText='Confirm'] - Confirm button label
 * @param {string} [props.cancelText='Cancel'] - Cancel button label
 * @param {'danger'|'warning'|'primary'|'info'} [props.variant='danger'] - Visual style
 * @param {boolean} [props.loading=false] - Async action loading state
 * @param {React.ComponentType} [props.icon] - Custom icon
 */
export function ConfirmDialog({
  open,
  onClose,
  onCancel,
  onConfirm,
  title = 'Confirm Action',
  message,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
  icon: CustomIcon,
  className,
}) {
  const handleCancel = onCancel || onClose
  const config = VARIANT_STYLES[variant] || VARIANT_STYLES.danger
  const Icon = CustomIcon || VARIANT_ICONS[variant] || AlertCircle

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      size="sm"
      closeButton={!loading}
      preventOverlayClose={loading}
      className={cn('sm:max-w-[440px]', className)}
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={config.buttonVariant}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-3.5">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', config.iconBg)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0 pt-0.5 space-y-1.5">
          <h3 className="font-display font-semibold text-base text-neutral-900 dark:text-white leading-tight">
            {title}
          </h3>
          {message && (
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {message}
            </p>
          )}
          {children}
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
