import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { cn } from '@/lib/utils'

function Sheet({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetBackdrop({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="sheet-backdrop"
      className={cn(
        'fixed inset-0 z-40 bg-black/50 data-[open]:animate-in data-[open]:fade-in-0 data-[closed]:animate-out data-[closed]:fade-out-0',
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  side = 'left',
  ...props
}: DialogPrimitive.Popup.Props & { side?: 'left' | 'right' | 'top' | 'bottom' }) {
  const sideClasses = {
    left: 'inset-y-0 left-0 h-full w-72 data-[open]:slide-in-from-left data-[closed]:slide-out-to-left',
    right: 'inset-y-0 right-0 h-full w-72 data-[open]:slide-in-from-right data-[closed]:slide-out-to-right',
    top: 'inset-x-0 top-0 data-[open]:slide-in-from-top data-[closed]:slide-out-to-top',
    bottom: 'inset-x-0 bottom-0 data-[open]:slide-in-from-bottom data-[closed]:slide-out-to-bottom',
  }

  return (
    <DialogPrimitive.Portal>
      <SheetBackdrop />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          'fixed z-50 border-border bg-background shadow-lg duration-200 data-[open]:animate-in data-[open]:fade-in-0 data-[closed]:animate-out data-[closed]:fade-out-0',
          sideClasses[side],
          className
        )}
        {...props}
      />
    </DialogPrimitive.Portal>
  )
}

function SheetTitle({
  className,
  ...props
}: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn('text-lg font-semibold leading-none', className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetBackdrop,
  SheetContent,
  SheetTitle,
  SheetDescription,
}
