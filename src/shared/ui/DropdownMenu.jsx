import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu'
import { forwardRef } from 'react'
import { cn } from './utils'

/**
 * Accessible dropdown menu built on Radix UI with entrance animations.
 * Completely theme-aware in both Light and Dark modes.
 * @example
 * <DropdownMenu>
 *   <DropdownMenuTrigger asChild><Button>Open</Button></DropdownMenuTrigger>
 *   <DropdownMenuContent>
 *     <DropdownMenuItem>Action</DropdownMenuItem>
 *   </DropdownMenuContent>
 * </DropdownMenu>
 */
export const DropdownMenu = DropdownPrimitive.Root
export const DropdownMenuTrigger = DropdownPrimitive.Trigger

export const DropdownMenuContent = forwardRef(({ className, children, sideOffset = 4, ...props }, ref) => (
  <DropdownPrimitive.Portal>
    <DropdownPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 min-w-[9rem] overflow-hidden rounded-xl border border-neutral-200/90 dark:border-[#1a2e23] bg-white dark:bg-[#0f1a14] text-neutral-900 dark:text-neutral-100 p-1 shadow-xl backdrop-blur-md',
        'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-1',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        className
      )}
      {...props}
    >
      {children}
    </DropdownPrimitive.Content>
  </DropdownPrimitive.Portal>
))
DropdownMenuContent.displayName = 'DropdownMenuContent'

export const DropdownMenuItem = forwardRef(({ className, ...props }, ref) => (
  <DropdownPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none transition-colors duration-150',
      'text-neutral-800 dark:text-neutral-200',
      'focus:bg-neutral-100 dark:focus:bg-[#14221b] focus:text-neutral-900 dark:focus:text-white',
      'data-[highlighted]:bg-neutral-100 dark:data-[highlighted]:bg-[#14221b] data-[highlighted]:text-neutral-900 dark:data-[highlighted]:text-white',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = 'DropdownMenuItem'

export const DropdownMenuSeparator = forwardRef(({ className, ...props }, ref) => (
  <DropdownPrimitive.Separator ref={ref} className={cn('-mx-1 my-1 h-px bg-neutral-100 dark:bg-[#1a2e23]', className)} {...props} />
))
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'

export default DropdownMenu
