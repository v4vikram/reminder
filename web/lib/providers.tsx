"use client";

import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeQueryClient } from "./query-client";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: ReactNode }) {
  // useState, not useMemo: React may discard a memo, and a discarded query
  // client would drop every in-flight request and cached response.
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delay={300}>{children}</TooltipProvider>
      <Toaster />
    </QueryClientProvider>
  );
}
