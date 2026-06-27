"use client"

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/useIsMobile"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Drawer } from "vaul"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
  title?: string
}

export function ModalDrawer({ open, onOpenChange, children, className, title = "Modal" }: Props) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer.Root open={open} onOpenChange={onOpenChange}>
        <Drawer.Portal>
          <Drawer.Trigger asChild></Drawer.Trigger>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
          <Drawer.Content
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50",
              "flex flex-col max-h-[90svh]",
              "rounded-t-3xl bg-card border border-border/60 border-b-0",
              "focus:outline-none",
              className
            )}
          >
            <Drawer.Title className="sr-only">{title}</Drawer.Title>
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-9 h-1 rounded-full bg-muted-foreground/25" />
            </div>
            {children}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
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
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  )
}
