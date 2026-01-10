import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const cardVariants = cva(
    "rounded-lg border text-stone-50 shadow-sm transition-all duration-300",
    {
        variants: {
            variant: {
                default: "border-stone-800 bg-stone-950/50 backdrop-blur-sm",
                glass: "bg-[rgba(15,10,10,0.85)] backdrop-blur-[12px] border-[rgba(192,160,96,0.15)] shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(0,0,0,0.2)]",
                blood: "bg-red-950/50 border-red-800/50 backdrop-blur-sm shadow-[0_0_15px_rgba(220,38,38,0.2)]",
                holy: "bg-amber-950/30 border-amber-600/30 backdrop-blur-sm shadow-[0_0_15px_rgba(251,191,36,0.15)]",
                dark: "bg-stone-950/80 border-stone-700/50 backdrop-blur-md",
                elevated: "bg-stone-900/90 border-stone-700 shadow-lg backdrop-blur-sm"
            },
            hover: {
                none: "",
                lift: "hover:-translate-y-1 hover:shadow-lg",
                glow: "hover:shadow-[0_0_20px_rgba(192,160,96,0.3)] hover:border-[rgba(192,160,96,0.3)]",
                blood: "hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:border-red-700/60",
                holy: "hover:shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:border-amber-500/60",
                scale: "hover:scale-[1.02]"
            },
            padding: {
                none: "",
                sm: "p-3",
                md: "p-4",
                lg: "p-6",
                xl: "p-8"
            }
        },
        defaultVariants: {
            variant: "default",
            hover: "none",
            padding: "none"
        }
    }
)

export interface CardProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant, hover, padding, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(cardVariants({ variant, hover, padding, className }))}
            {...props}
        />
    )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6", className)}
        {...props}
    />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            "text-2xl font-semibold leading-none tracking-tight font-cinzel text-amber-500",
            className
        )}
        {...props}
    />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-stone-400 font-serif italic", className)}
        {...props}
    />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center p-6 pt-0", className)}
        {...props}
    />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
