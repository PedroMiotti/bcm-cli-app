"use client"

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/useIsMobile"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Sheet, SheetContent } from "@/components/ui/sheet"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

export function ModalDrawer({ open, onOpenChange, children, className }: Props) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className={cn(
            "rounded-t-3xl bg-card border-border/60 p-0 gap-0 max-h-[90vh] flex flex-col overflow-hidden",
            className
          )}
        >
          {/* iOS-style drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-9 h-1 rounded-full bg-muted-foreground/25" />
          </div>
          {children}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "max-w-sm bg-card border-border/60 p-0 overflow-hidden max-h-[85vh] flex flex-col",
          className
        )}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}
