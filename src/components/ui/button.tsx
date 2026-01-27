import { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  className?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  className,
  ...props
}: ButtonProps) {
  const baseStyles =
    "body-text inline-flex items-center justify-center transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-sand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-washed-black";

  const variants = {
    primary:
      "bg-sand text-washed-black hover:bg-warm-white",
    secondary:
      "bg-charcoal text-sand border border-sand/20 hover:border-sand/40",
    outline:
      "bg-transparent border border-sand/40 text-sand hover:bg-sand/10 hover:border-sand/60",
    ghost:
      "bg-transparent text-sand hover:bg-sand/5",
  };

  const sizes = {
    sm: "px-5 py-2 text-sm tracking-wide",
    md: "px-7 py-3 text-sm tracking-wide",
    lg: "px-9 py-3.5 text-sm tracking-wide",
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
