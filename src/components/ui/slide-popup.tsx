"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
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
  mobileHeader?: boolean
  mobileTitle?: string
  mobileDescription?: string
}

function SlidePopupContent({
  className,
  children,
  showCloseButton = true,
  mobileHeader = false,
  mobileTitle = "Create Smart Note",
  mobileDescription,
  ...props
}: SlidePopupContentProps) {
  return (
    <SlidePopupPortal>
      <SlidePopupOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 bg-white w-full overflow-hidden",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "duration-200",
          // Mobile: Full screen
          "inset-0 h-full",
          // Desktop: Centered modal
          "lg:inset-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2",
          "lg:h-auto lg:max-h-[90vh] lg:w-[90vw] lg:max-w-3xl",
          "lg:rounded-xl lg:shadow-2xl lg:border lg:border-gray-200",
          className
        )}
        {...props}
      >
        <VisuallyHidden.Root asChild>
          <DialogPrimitive.Title>{mobileTitle}</DialogPrimitive.Title>
        </VisuallyHidden.Root>
        <div className="relative h-full lg:h-auto lg:max-h-[90vh] flex flex-col">
          {/* Gradient Header - Both Mobile and Desktop */}
          <div className="bg-gradient-to-r from-healui-physio to-healui-primary text-white px-4 py-4 lg:px-6 flex items-center justify-between shadow-sm flex-shrink-0 lg:rounded-t-xl">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold">{mobileTitle}</h2>
              {mobileDescription && (
                <p className="text-sm text-white/80 mt-1">{mobileDescription}</p>
              )}
            </div>
            {showCloseButton && (
              <DialogPrimitive.Close
                className={cn(
                  "ml-4 rounded-lg text-white/80 hover:text-white hover:bg-white/20 p-2 transition-all duration-200 flex-shrink-0",
                  "focus:ring-2 focus:ring-white focus:ring-offset-2 focus:outline-none",
                  "disabled:pointer-events-none"
                )}
              >
                <XIcon className="h-6 w-6" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            )}
          </div>
          
          {/* Content - Scrollable with constrained height */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-4 lg:p-6">
              {children}
            </div>
          </div>
        </div>
      </DialogPrimitive.Content>
    </SlidePopupPortal>
  )
}

function SlidePopupHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-2 mb-6", className)}
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
      className={cn("text-2xl font-bold text-gray-900 leading-tight", className)}
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
      className={cn("text-gray-600 text-base leading-relaxed", className)}
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
        "flex flex-col-reverse gap-3 px-4 py-4 lg:px-6 lg:py-6 sm:flex-row sm:justify-end border-t border-gray-200 bg-white flex-shrink-0",
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