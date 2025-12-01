import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "../../lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 font-cinzel tracking-wide",
    {
        variants: {
            variant: {
                default: "bg-stone-900 text-stone-50 hover:bg-stone-900/90 border border-stone-700 shadow-lg",
                destructive:
                    "bg-red-900 text-red-50 hover:bg-red-900/90 border border-red-800 shadow-[0_0_10px_rgba(220,38,38,0.3)]",
                outline:
                    "border border-stone-600 bg-transparent hover:bg-stone-800 hover:text-stone-50 text-stone-300",
                secondary:
                    "bg-stone-800 text-stone-50 hover:bg-stone-700 border border-stone-600",
                ghost: "hover:bg-stone-800/50 hover:text-stone-50 text-stone-400",
                link: "text-amber-500 underline-offset-4 hover:underline",
                gold: "bg-gradient-to-br from-amber-600 to-amber-800 text-white border border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:brightness-110",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8 text-base",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
    loading?: boolean
}

// Wrap with motion
const Button = React.forwardRef<HTMLButtonElement, ButtonProps & HTMLMotionProps<"button">>(
    ({ className, variant, size, asChild = false, loading = false, children, ...props }, ref) => {
        const Comp = asChild ? Slot : motion.button

        // Animation props only if not asChild (Slot doesn't support motion props directly easily without composition)
        // For simplicity, we apply motion to the default button usage
        const motionProps = !asChild ? {
            whileHover: { scale: 1.02 },
            whileTap: { scale: 0.95 },
            transition: { type: "spring", stiffness: 400, damping: 17 }
        } : {}

        return (
            // @ts-ignore
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={loading || props.disabled}
                {...motionProps}
                {...props}
            >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </Comp>
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }



