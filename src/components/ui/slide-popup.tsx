"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SlidePopupProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root> {
  children?: React.ReactNode
}

function SlidePopup({ children, ...props }: SlidePopupProps) {
  return <DialogPrimitive.Root {...props}>{children}</DialogPrimitive.Root>
}

function SlidePopupTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger {...props} />
}

function SlidePopupPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal {...props} />
}

function SlidePopupClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close {...props} />
}

function SlidePopupOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

interface SlidePopupContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  showCloseButton?: boolean
}

function SlidePopupContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: SlidePopupContentProps) {
  return (
    <SlidePopupPortal>
      <SlidePopupOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-white max-h-[85vh] w-full overflow-y-auto",
          "shadow-2xl rounded-b-2xl",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "duration-300",
          className
        )}
        {...props}
      >
        <div className="relative p-6">
          {showCloseButton && (
            <DialogPrimitive.Close
              className={cn(
                "absolute top-4 right-4 rounded-lg opacity-70 transition-all duration-200",
                "hover:opacity-100 hover:bg-gray-100 p-2",
                "focus:ring-2 focus:ring-healui-physio focus:ring-offset-2 focus:outline-none",
                "disabled:pointer-events-none"
              )}
            >
              <XIcon className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}
          {children}
        </div>
      </DialogPrimitive.Content>
    </SlidePopupPortal>
  )
}

function SlidePopupHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-2 pb-4 pr-8", className)}
      {...props}
    />
  )
}

function SlidePopupTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("text-xl leading-none font-semibold text-text-dark", className)}
      {...props}
    />
  )
}

function SlidePopupDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("text-text-gray text-sm mt-1", className)}
      {...props}
    />
  )
}

function SlidePopupBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex-1", className)}
      {...props}
    />
  )
}

function SlidePopupFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 pt-6 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

export {
  SlidePopup,
  SlidePopupTrigger,
  SlidePopupContent,
  SlidePopupHeader,
  SlidePopupTitle,
  SlidePopupDescription,
  SlidePopupBody,
  SlidePopupFooter,
  SlidePopupClose,
}