"use client";

import { IconLoader2 } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-bg p-5 text-text">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-border bg-surface p-6"
      >
        <p className="mb-1 text-lg font-semibold">Zone Lark</p>
        <p className="mb-5 text-[13px] text-muted">Sign in to your facilities dashboard.</p>

        <div className="mb-3">
          <div className="mb-0.5 text-[11px] text-muted">Email</div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-[7px] border border-border bg-bg px-2.5 py-2 text-[13px] text-text outline-none transition-[border-color] focus:border-green"
          />
        </div>
        <div className="mb-4">
          <div className="mb-0.5 text-[11px] text-muted">Password</div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-[7px] border border-border bg-bg px-2.5 py-2 text-[13px] text-text outline-none transition-[border-color] focus:border-green"
          />
        </div>

        {error && <p className="mb-3 text-[12.5px] text-red-600">{error}</p>}

        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? (
            <>
              <IconLoader2 size={16} className="animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>

        <p className="mt-4 text-[12px] text-hint">
          New accounts are created by an administrator via the Admin console.
        </p>
      </form>
    </div>
  );
}
