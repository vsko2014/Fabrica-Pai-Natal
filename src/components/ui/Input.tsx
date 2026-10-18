"use client";

import { forwardRef } from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, id, className = "", ...props }, ref) => {
    const errorId = id ? `${id}-error` : undefined;

    return (
      <div className="space-y-1">
        <label htmlFor={id} className="block text-sm text-fpn-cream">
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`w-full rounded-lg border bg-white/10 px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-fpn-gold ${error ? "border-red-500" : "border-fpn-gold/30"} ${className}`}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
