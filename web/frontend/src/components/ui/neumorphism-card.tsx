import * as React from "react"
import { cn } from "@/lib/utils"

const NeumorphismCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "neumorphism-card rounded-2xl text-gray-300 dark:text-gray-300 text-gray-700 p-1",
      className
    )}
    {...props}
  />
))
NeumorphismCard.displayName = "NeumorphismCard"

const NeumorphismCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 p-6", className)}
    {...props}
  />
))
NeumorphismCardHeader.displayName = "NeumorphismCardHeader"

const NeumorphismCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-bold leading-none tracking-tight text-gray-200 dark:text-gray-200 text-gray-800",
      className
    )}
    {...props}
  />
))
NeumorphismCardTitle.displayName = "NeumorphismCardTitle"

const NeumorphismCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-400 dark:text-gray-400 text-gray-600 leading-relaxed", className)}
    {...props}
  />
))
NeumorphismCardDescription.displayName = "NeumorphismCardDescription"

const NeumorphismCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
NeumorphismCardContent.displayName = "NeumorphismCardContent"

const NeumorphismCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
NeumorphismCardFooter.displayName = "NeumorphismCardFooter"

export { 
  NeumorphismCard, 
  NeumorphismCardHeader, 
  NeumorphismCardFooter, 
  NeumorphismCardTitle, 
  NeumorphismCardDescription, 
  NeumorphismCardContent 
} 