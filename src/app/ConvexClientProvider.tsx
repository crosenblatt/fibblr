"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { type ReactNode, useMemo } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => {
    if (!convexUrl) {
      return null;
    }
    return new ConvexReactClient(convexUrl);
  }, []);

  if (!client) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center p-8 text-center">
        <p className="max-w-md text-sm text-[#d7d1c4]">
          Set <code className="font-mono text-[#c8b48a]">NEXT_PUBLIC_CONVEX_URL</code> after
          running <code className="font-mono text-[#c8b48a]">npx convex dev</code>, then
          restart the app.
        </p>
      </div>
    );
  }

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
