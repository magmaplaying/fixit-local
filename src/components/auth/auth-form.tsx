"use client";

import { useActionState } from "react";

type AuthState = { error?: string };
type Props = {
  mode: "login" | "register";
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  defaultRole?: "CUSTOMER" | "PROVIDER";
};

export function AuthForm({ mode, action, defaultRole = "CUSTOMER" }: Props) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, {});
  const isRegister = mode === "register";

  return (
    <form action={formAction} className="space-y-5">
      {isRegister && (
        <>
          <Field label="Име и фамилия">
            <div className="relative">
              <FieldIcon>
                <UserIcon />
              </FieldIcon>
              <input
                name="name"
                type="text"
                required
                autoComplete="name"
                className={inputClass}
                placeholder="Иван Петров"
              />
            </div>
          </Field>
          <fieldset>
            <legend className="mb-1.5 block text-sm font-medium text-black/70 dark:text-white/70">
              Какво търсите?
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <RoleOption
                value="CUSTOMER"
                defaultChecked={defaultRole === "CUSTOMER"}
                label="Търся услуги"
                hint="Намери и заяви майстори"
                icon={<SearchIcon />}
              />
              <RoleOption
                value="PROVIDER"
                defaultChecked={defaultRole === "PROVIDER"}
                label="Предлагам услуги"
                hint="Публикувай услугите си"
                icon={<ToolIcon />}
              />
            </div>
          </fieldset>
        </>
      )}

      <Field label="Имейл">
        <div className="relative">
          <FieldIcon>
            <MailIcon />
          </FieldIcon>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputClass}
            placeholder="you@example.com"
          />
        </div>
      </Field>

      <Field label="Парола" hint={isRegister ? "Поне 6 символа" : undefined}>
        <div className="relative">
          <FieldIcon>
            <LockIcon />
          </FieldIcon>
          <input
            name="password"
            type="password"
            required
            minLength={isRegister ? 6 : undefined}
            autoComplete={isRegister ? "new-password" : "current-password"}
            className={inputClass}
            placeholder="••••••••"
          />
        </div>
      </Field>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-cobble-600 px-4 py-3.5 text-base font-semibold text-white shadow-sm shadow-cobble-600/20 transition hover:bg-cobble-700 active:scale-[0.99] disabled:opacity-60"
      >
        {pending ? "Моля, изчакайте…" : isRegister ? "Създай акаунт" : "Вход"}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border-2 border-black/10 bg-black/[0.03] py-3.5 pl-11 pr-3 text-base outline-none transition placeholder:text-black/30 focus:border-cobble-500 focus:bg-white focus:ring-4 focus:ring-cobble-500/15 dark:border-white/10 dark:bg-white/5 dark:placeholder:text-white/30 dark:focus:bg-white/10";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-black/70 dark:text-white/70">{label}</span>
        {hint && <span className="text-xs text-black/40 dark:text-white/40">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function FieldIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-black/35 dark:text-white/35">
      {children}
    </span>
  );
}

function RoleOption({
  value,
  label,
  hint,
  icon,
  defaultChecked,
}: {
  value: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
  defaultChecked?: boolean;
}) {
  return (
    <label className="relative cursor-pointer">
      <input type="radio" name="role" value={value} defaultChecked={defaultChecked} className="peer sr-only" />
      <div className="rounded-xl border-2 border-black/10 bg-black/[0.02] p-3.5 text-sm transition peer-checked:border-cobble-500 peer-checked:bg-cobble-50 peer-checked:shadow-sm peer-checked:[&_.role-icon]:text-cobble-600 peer-focus-visible:ring-4 peer-focus-visible:ring-cobble-500/15 dark:border-white/10 dark:bg-white/[0.02] dark:peer-checked:border-cobble-400 dark:peer-checked:bg-cobble-950/30">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="role-icon text-black/40 dark:text-white/40">{icon}</span>
          <span className="hidden h-4 w-4 items-center justify-center rounded-full bg-cobble-600 text-white peer-checked:flex">
            <CheckIcon />
          </span>
        </div>
        <div className="font-semibold">{label}</div>
        <div className="text-xs text-black/50 dark:text-white/50">{hint}</div>
      </div>
    </label>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ToolIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
