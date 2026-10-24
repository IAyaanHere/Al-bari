"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "md",
}: DialogProps) {
  useEffectKeydown(isOpen, onClose);

  if (!isOpen) return null;

  const maxWidths = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full bg-white rounded-2xl shadow-2xl border border-slate-200/90 text-slate-900 transition-all flex flex-col max-h-[92vh] sm:max-h-[88vh] my-auto overflow-hidden",
          maxWidths[maxWidth]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div className="pr-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">{title}</h3>
            {description && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-1 -mt-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

function useEffectKeydown(isOpen: boolean, onClose: () => void) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);
}
