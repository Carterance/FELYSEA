"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Field, Input, PrimaryButton } from "@/components/ui";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState({ email: "", password: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou mot de passe incorrect.");
        return;
      }

      router.push(searchParams.get("callbackUrl") ?? "/");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          type="email"
          required
          value={values.email}
          onChange={(e) => setValues({ ...values, email: e.target.value })}
          autoComplete="email"
        />
      </Field>
      <Field label="Mot de passe" htmlFor="password" error={error ?? undefined}>
        <Input
          id="password"
          type="password"
          required
          value={values.password}
          onChange={(e) => setValues({ ...values, password: e.target.value })}
          autoComplete="current-password"
        />
      </Field>
      <PrimaryButton type="submit" disabled={isPending}>
        {isPending ? "Connexion..." : "Se connecter"}
      </PrimaryButton>
    </form>
  );
}
