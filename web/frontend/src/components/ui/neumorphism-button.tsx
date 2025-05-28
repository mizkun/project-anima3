import * as React from "react"
import { Button, IconButton } from '@mui/material'
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const neumorphismButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "",
        primary: "font-semibold",
        secondary: "",
        success: "font-semibold",
        warning: "font-semibold",
        danger: "font-semibold",
      },
      size: {
        default: "",
        sm: "text-xs",
        lg: "text-base",
        icon: "",
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
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    if (asChild) {
      const Comp = Slot
      return (
        <Comp
          className={cn(neumorphismButtonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        />
      )
    }

    // Material UI Button variant mapping
    const getMuiVariant = () => {
      switch (variant) {
        case 'primary':
        case 'success':
        case 'warning':
        case 'danger':
          return 'contained'
        case 'secondary':
          return 'outlined'
        default:
          return 'text'
      }
    }

    // Material UI color mapping
    const getMuiColor = () => {
      switch (variant) {
        case 'primary':
          return 'primary'
        case 'success':
          return 'success'
        case 'warning':
          return 'warning'
        case 'danger':
          return 'error'
        case 'secondary':
          return 'secondary'
        default:
          return 'primary'
      }
    }

    // Material UI size mapping
    const getMuiSize = () => {
      switch (size) {
        case 'sm':
          return 'small'
        case 'lg':
          return 'large'
        default:
          return 'medium'
      }
    }

    if (size === 'icon') {
      return (
        <IconButton
          ref={ref}
          color={getMuiColor() as any}
          size={getMuiSize()}
          className={cn(neumorphismButtonVariants({ variant, size, className }))}
          {...props}
        >
          {children}
        </IconButton>
      )
    }

    return (
      <Button
        ref={ref}
        variant={getMuiVariant() as any}
        color={getMuiColor() as any}
        size={getMuiSize()}
        className={cn(neumorphismButtonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Button>
    )
  }
)
NeumorphismButton.displayName = "NeumorphismButton"

export { NeumorphismButton, neumorphismButtonVariants } 