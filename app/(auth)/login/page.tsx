"use client";

import { IconLoader2 } from "@tabler/icons-react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { MIN_PASSWORD_LENGTH } from "@/lib/auth/constants";
import { Button } from "@/components/ui/Button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }
      const next = searchParams.get("callbackUrl") || "/";
      router.push(next.startsWith("/") ? next : "/");
      router.refresh();
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
            autoComplete="email"
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
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="current-password"
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
          The first sign-in on a new database creates the organization and an organization-admin
          account. After that, new accounts are created by an organization administrator.
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 items-center justify-center bg-bg text-[13px] text-muted">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
