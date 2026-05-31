import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline";
  size?: "default" | "sm";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "ui-button",
        `ui-button-variant-${variant}`,
        `ui-button-size-${size}`,
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";
