"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const FLAG = "mt:just-shipped";

/**
 * Renders a "← back to edit" button ONLY when the visitor just shipped this
 * meme from the editor — never when someone opens a shared link cold.
 * We rely on a sessionStorage flag set by MemeEditor at ship time.
 */
export default function ShareBackButton({ code }: { code: string }) {
  const [show, setShow] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = sessionStorage.getItem(FLAG);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (v === code) setShow(true);
  }, [code]);

  if (!show) return null;

  return (
    <button
      onClick={() => {
        sessionStorage.removeItem(FLAG);
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push("/");
        }
      }}
      className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-widest text-paper/60 hover:text-acid"
    >
      ← back to edit
    </button>
  );
}
