"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Field, Input, PrimaryButton } from "@/components/ui";
import { registerUser } from "@/server/actions/auth";

export function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [values, setValues] = useState({ name: "", email: "", password: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    startTransition(async () => {
      const result = await registerUser(values);
      if (!result.success) {
        setFormError(result.error);
        return;
      }

      const signInResult = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (signInResult?.error) {
        setFormError("Compte créé. Merci de vous connecter.");
        router.push("/connexion");
        return;
      }

      router.push("/bienvenue");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="Prénom" htmlFor="name">
        <Input
          id="name"
          required
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          autoComplete="given-name"
        />
      </Field>
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
      <Field label="Mot de passe" htmlFor="password" error={formError ?? undefined}>
        <Input
          id="password"
          type="password"
          required
          minLength={10}
          value={values.password}
          onChange={(e) => setValues({ ...values, password: e.target.value })}
          autoComplete="new-password"
        />
      </Field>
      <PrimaryButton type="submit" disabled={isPending}>
        {isPending ? "Création..." : "Créer mon compte"}
      </PrimaryButton>
    </form>
  );
}
