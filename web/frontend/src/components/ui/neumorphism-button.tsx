import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const neumorphismButtonVariants = cva(
  "neumorphism-button inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "",
        primary: "text-blue-600 font-semibold",
        secondary: "text-gray-600",
        success: "text-green-600 font-semibold",
        warning: "text-orange-600 font-semibold",
        danger: "text-red-600 font-semibold",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-lg px-4 text-xs",
        lg: "h-14 rounded-2xl px-8 text-base",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface NeumorphismButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof neumorphismButtonVariants> {
  asChild?: boolean
}

const NeumorphismButton = React.forwardRef<HTMLButtonElement, NeumorphismButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(neumorphismButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
NeumorphismButton.displayName = "NeumorphismButton"

export { NeumorphismButton, neumorphismButtonVariants } 