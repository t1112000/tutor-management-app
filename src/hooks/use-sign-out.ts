"use client";

import { useCallback, useState } from "react";
import { signOut } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { queryCachePersister } from "@/lib/query-cache-persistence";

/**
 * Signs out and returns to /signin.
 *
 * `redirect: false` + a relative `location.replace` is deliberate: next-auth's own
 * redirect sends the browser to an absolute URL, which breaks out of the app scope
 * in an iOS standalone PWA. The cached student/billing data in IndexedDB must be
 * dropped here too, otherwise it survives the sign-out.
 */
export function useSignOut() {
  const queryClient = useQueryClient();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);

    try {
      await signOut({ redirect: false });
    } catch {
      // Sign out locally even if the server call fails.
    }

    try {
      queryClient.clear();
      await queryCachePersister.removeClient();
    } catch {
      // Cache clearing is best-effort.
    }

    window.location.replace("/signin");
  }, [queryClient, signingOut]);

  return { signOut: handleSignOut, signingOut };
}
