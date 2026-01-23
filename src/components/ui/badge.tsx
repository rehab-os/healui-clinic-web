import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-lg border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-healui-physio transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-healui-physio text-white [a&]:hover:bg-healui-physio/90",
        secondary:
          "border-transparent bg-healui-physio/20 text-healui-physio [a&]:hover:bg-healui-physio/30",
        destructive:
          "border-transparent bg-red-500 text-white [a&]:hover:bg-red-600",
        outline:
          "text-text-dark border-border-color [a&]:hover:bg-healui-physio/5 [a&]:hover:border-healui-physio",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
