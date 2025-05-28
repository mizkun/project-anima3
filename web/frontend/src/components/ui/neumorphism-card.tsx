import * as React from "react"
import { Card, CardContent, CardHeader, CardActions } from '@mui/material'
import { cn } from "@/lib/utils"

const NeumorphismCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { elevation?: number }
>(({ className, elevation = 1, ...props }, ref) => (
  <Card
    ref={ref}
    elevation={elevation}
    className={cn("", className)}
    sx={{
      backgroundColor: 'background.paper',
      border: '1px solid',
      borderColor: 'divider',
    }}
    {...props}
  />
))
NeumorphismCard.displayName = "NeumorphismCard"

const NeumorphismCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardHeader
    ref={ref}
    className={cn("", className)}
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
    className={cn("text-xl font-bold leading-none tracking-tight", className)}
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
    className={cn("text-sm leading-relaxed", className)}
    style={{ color: 'text.secondary' }}
    {...props}
  />
))
NeumorphismCardDescription.displayName = "NeumorphismCardDescription"

const NeumorphismCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardContent ref={ref} className={cn("", className)} {...props} />
))
NeumorphismCardContent.displayName = "NeumorphismCardContent"

const NeumorphismCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardActions
    ref={ref}
    className={cn("", className)}
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