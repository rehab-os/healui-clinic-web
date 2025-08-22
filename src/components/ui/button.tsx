import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-healui-physio",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-physio text-white shadow-sm hover:shadow-physio hover:scale-105 active:scale-95",
        destructive:
          "bg-red-500 text-white shadow-sm hover:bg-red-600 focus-visible:outline-red-500",
        outline:
          "border border-border-color bg-background shadow-sm hover:bg-healui-physio/5 hover:border-healui-physio",
        secondary:
          "bg-healui-physio/10 text-healui-physio border-2 border-transparent hover:border-healui-physio hover:shadow-md",
        ghost:
          "hover:bg-healui-physio/10 hover:text-healui-physio",
        link: "text-healui-physio underline-offset-4 hover:underline font-medium",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 rounded-xl px-6 has-[>svg]:px-5 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
