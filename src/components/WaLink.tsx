"use client";
import { MessageCircle } from "lucide-react";
import { track } from "@/lib/track";
import type { WaChannel } from "@/lib/types";

export function WaLink({
  href, channel, productId, className, children, label, icon = true, onSent,
}: {
  href: string; channel: WaChannel; productId?: string; className?: string; children?: React.ReactNode; label?: string; icon?: boolean; onSent?: () => void;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={label}
      title={label}
      onClick={() => {
        track("wa_click", { channel, product_id: productId });
        onSent?.();
      }}
    >
      {icon && <MessageCircle aria-hidden />}
      {children}
    </a>
  );
}
