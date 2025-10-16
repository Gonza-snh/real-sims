'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

import { cn } from '@/lib/utils'

const TooltipProvider = (props: React.ComponentProps<typeof TooltipPrimitive.Provider>) => (
  <TooltipPrimitive.Provider delayDuration={100} skipDelayDuration={0} {...props} />
);

const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 8, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 px-4 py-2 border-none shadow-lg flex items-center gap-2 bg-[var(--color-oscuro)] text-white",
      "text-[var(--font-etiqueta-size)]",
      className
    )}
    style={{ fontSize: 'var(--font-etiqueta-size)', background: 'var(--color-oscuro)', color: 'white', borderRadius: '16px', border: 'none', boxShadow: '0 4px 24px 0 rgba(23,34,59,0.12)', fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: 400, lineHeight: 1.2, overflow: 'visible' }}
    {...props}
  >
    {props.children}
    <TooltipPrimitive.Arrow
      className="fill-[var(--color-oscuro)]"
      style={{ width: 16, height: 8 }}
    />
  </TooltipPrimitive.Content>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };