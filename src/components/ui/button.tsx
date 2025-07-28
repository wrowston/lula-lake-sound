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
  const baseStyles = "body-text transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sand/50";
  
  const variants = {
    primary: "bg-sand text-washed-black hover:bg-sand/90 focus:bg-sand/90",
    secondary: "bg-forest text-sand hover:bg-forest/80 focus:bg-forest/80",
    outline: "bg-transparent border-2 border-sand text-sand hover:bg-sand hover:text-washed-black focus:bg-sand focus:text-washed-black",
    ghost: "bg-transparent text-sand hover:bg-sand/10 focus:bg-sand/10"
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  return (
    <button
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
} 