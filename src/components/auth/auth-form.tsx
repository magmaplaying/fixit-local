"use client";

import { useActionState } from "react";

type AuthState = { error?: string };
type Props = {
  mode: "login" | "register";
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
};

export function AuthForm({ mode, action }: Props) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, {});
  const isRegister = mode === "register";

  return (
    <form action={formAction} className="space-y-4">
      {isRegister && (
        <>
          <Field label="Full name">
            <input name="name" type="text" required autoComplete="name" className={inputClass} placeholder="Ivan Petrov" />
          </Field>
          <fieldset className="grid grid-cols-2 gap-3">
            <RoleOption value="CUSTOMER" defaultChecked label="I need services" hint="Find & book local pros" />
            <RoleOption value="PROVIDER" label="I offer services" hint="List my services" />
          </fieldset>
        </>
      )}

      <Field label="Email">
        <input name="email" type="email" required autoComplete="email" className={inputClass} placeholder="you@example.com" />
      </Field>

      <Field label="Password">
        <input
          name="password"
          type="password"
          required
          autoComplete={isRegister ? "new-password" : "current-password"}
          className={inputClass}
          placeholder="••••••••"
        />
      </Field>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-teal-600 px-4 py-2.5 font-medium text-white transition hover:bg-teal-700 disabled:opacity-60"
      >
        {pending ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-white/15 dark:bg-white/5";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-black/70 dark:text-white/70">{label}</span>
      {children}
    </label>
  );
}

function RoleOption({
  value,
  label,
  hint,
  defaultChecked,
}: {
  value: string;
  label: string;
  hint: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="relative cursor-pointer">
      <input type="radio" name="role" value={value} defaultChecked={defaultChecked} className="peer sr-only" />
      <div className="rounded-lg border border-black/10 p-3 text-sm transition peer-checked:border-teal-500 peer-checked:bg-teal-50 dark:border-white/15 dark:peer-checked:bg-teal-950/30">
        <div className="font-medium">{label}</div>
        <div className="text-xs text-black/50 dark:text-white/50">{hint}</div>
      </div>
    </label>
  );
}
