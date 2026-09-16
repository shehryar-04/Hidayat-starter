import { forwardRef } from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from './utils'

/**
 * Accessible select dropdown built on Radix UI Select.
 * @param {object} props - Radix Select.Root props
 * @example
 * <Select>
 *   <SelectTrigger><SelectValue placeholder="Choose..." /></SelectTrigger>
 *   <SelectContent>
 *     <SelectItem value="a">Option A</SelectItem>
 *   </SelectContent>
 * </Select>
 */
export const Select = SelectPrimitive.Root

export const SelectValue = SelectPrimitive.Value

export const SelectTrigger = forwardRef(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-10 w-full items-center justify-between rounded-xl border border-neutral-200/90 dark:border-[#1a2e23] bg-white dark:bg-[#0f1a14] text-neutral-900 dark:text-neutral-100 px-3.5 text-sm transition-all duration-150 outline-none',
      'focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:border-emerald-500/80',
      'disabled:opacity-50 disabled:pointer-events-none',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = 'SelectTrigger'

export const SelectContent = forwardRef(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 min-w-[8rem] overflow-hidden rounded-xl border border-neutral-200/90 dark:border-[#1a2e23] bg-white dark:bg-[#0f1a14] text-neutral-900 dark:text-neutral-100 shadow-xl',
        'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        className
      )}
      position="popper"
      sideOffset={4}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = 'SelectContent'

export const SelectItem = forwardRef(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none transition-colors',
      'focus:bg-neutral-100 dark:focus:bg-[#14221b] data-[highlighted]:bg-neutral-100 dark:data-[highlighted]:bg-[#14221b]',
      'text-neutral-800 dark:text-neutral-200',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-primary-500 dark:text-emerald-400" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText className="pl-6">{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = 'SelectItem'
