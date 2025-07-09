"use client";

import { useEffect, useState } from "react";

// This wrapper prevents hydration issues by only rendering its children on the client
export function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? children : null;
}
