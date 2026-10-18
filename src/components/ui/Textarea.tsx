"use client";

import { forwardRef } from "react";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  showCount?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(
  ({ label, error, id, maxLength, showCount, className = "", value, ...props }, ref) => {
    const errorId = id ? `${id}-error` : undefined;
    const countId = id ? `${id}-count` : undefined;
    const currentLength = typeof value === "string" ? value.length : 0;

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="block text-sm text-fpn-cream">
            {label}
          </label>
          {showCount && maxLength && (
            <span id={countId} className="text-xs text-fpn-snow/50">
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
        <textarea
          ref={ref}
          id={id}
          value={value}
          maxLength={maxLength}
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

Textarea.displayName = "Textarea";
