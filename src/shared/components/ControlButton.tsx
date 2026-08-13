import * as Tooltip from '@radix-ui/react-tooltip'
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

type ControlButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  icon: ReactNode
}

export const ControlButton = forwardRef<HTMLButtonElement, ControlButtonProps>(
  function ControlButton({ label, icon, className = '', ...buttonProps }, ref) {
    return (
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            ref={ref}
            type="button"
            className={`control-button ${className}`}
            aria-label={label}
            {...buttonProps}
          >
            <span aria-hidden="true">{icon}</span>
            <span>{label}</span>
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="tooltip-content" sideOffset={8}>
            {label}
            <Tooltip.Arrow className="tooltip-arrow" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    )
  },
)
