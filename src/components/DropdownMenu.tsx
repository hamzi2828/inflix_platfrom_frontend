"use client";

import React, { useLayoutEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

const GAP_PX = 4;

export type DropdownMenuAlign = "left" | "right";

interface DropdownMenuProps {
  open: boolean;
  onClose: () => void;
  /** Ref to the trigger element (e.g. the ⋮ button). Used to position the menu. */
  triggerRef: React.RefObject<HTMLElement | null>;
  align?: DropdownMenuAlign;
  /** Optional class for the menu panel (e.g. w-44, w-40). */
  className?: string;
  children: React.ReactNode;
}

/**
 * Renders dropdown menu content in a portal so it is never clipped by overflow containers.
 * Position is computed from triggerRef.getBoundingClientRect() and updated on scroll/resize.
 * Use for table row actions and any dropdown that may sit inside overflow-x-auto / overflow-hidden.
 */
export function DropdownMenu({
  open,
  onClose,
  triggerRef,
  align = "right",
  className = "w-44",
  children,
}: DropdownMenuProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuEl = menuRef.current;
    const menuWidth = menuEl ? menuEl.offsetWidth : 176;
    const menuHeight = menuEl ? menuEl.offsetHeight : 200;
    const top = rect.bottom + GAP_PX;
    let left: number;
    if (align === "right") {
      left = rect.right - menuWidth;
    } else {
      left = rect.left;
    }
    // Keep in viewport
    const maxLeft = window.innerWidth - menuWidth - 8;
    const maxTop = window.innerHeight - menuHeight - 8;
    setPosition({
      top: Math.min(top, Math.max(8, maxTop)),
      left: Math.min(Math.max(8, left), maxLeft),
    });
  }, [align, triggerRef]);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    updatePosition();
    const onScrollOrResize = () => updatePosition();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, updatePosition]);

  if (!open || typeof document === "undefined") return null;

  const overlay = (
    <div
      className="fixed inset-0"
      style={{ zIndex: "var(--z-dropdown-overlay, 9990)" }}
      onClick={onClose}
      aria-hidden="true"
    />
  );

  const menu = position && (
    <div
      ref={menuRef}
      className={`dropdown-menu bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-gray-900 ${className}`}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        zIndex: "var(--z-dropdown-menu, 9991)",
      }}
      role="menu"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );

  return createPortal(
    <>
      {overlay}
      {menu}
    </>,
    document.body
  );
}
