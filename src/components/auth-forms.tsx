"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { BookOpenCheck, Loader2, LogIn, UserPlus } from "lucide-react";
import { loginUser, registerUser, type AuthFormState } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: AuthFormState = {};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-md rounded-[2rem] border bg-card/90 p-6 shadow-soft backdrop-blur md:p-8">
        <div className="mb-8 flex items-center gap-3">
          <span className="rounded-2xl bg-gradient-to-br from-primary to-sky-400 p-3 text-white shadow-lg shadow-primary/25">
            <BookOpenCheck className="h-6 w-6" />
          </span>
          <div>
            <p className="font-bold tracking-tight">App de Estudos</p>
            <p className="text-xs text-muted-foreground">Sua biblioteca privada de aprendizagem</p>
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="mt-8">{children}</div>
      </section>
    </main>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginUser, initialState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (state.values?.email !== undefined) setEmail(state.values.email);
    setPassword("");
  }, [state.values?.email, state.message]);

  return (
    <form action={action} className="space-y-5" noValidate>
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          E-mail
        </label>
        <Input id="email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={!!state.errors?.email} />
        <FieldError message={state.errors?.email?.[0]} />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Senha
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={!!state.errors?.password}
        />
        <FieldError message={state.errors?.password?.[0]} />
      </div>

      {state.message && <p className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{state.message}</p>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        Entrar
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-semibold text-primary hover:underline">
          Criar cadastro
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerUser, initialState);
  const [values, setValues] = useState({ name: "", email: "" });
  const [passwords, setPasswords] = useState({ password: "", confirmPassword: "" });

  useEffect(() => {
    if (state.values) setValues({ name: state.values.name ?? "", email: state.values.email ?? "" });
    setPasswords({ password: "", confirmPassword: "" });
  }, [state.values, state.message]);

  return (
    <form action={action} className="space-y-5" noValidate>
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Nome <span className="text-muted-foreground">(opcional)</span>
        </label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          value={values.name}
          onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
          aria-invalid={!!state.errors?.name}
        />
        <FieldError message={state.errors?.name?.[0]} />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          E-mail
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
          aria-invalid={!!state.errors?.email}
        />
        <FieldError message={state.errors?.email?.[0]} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Senha
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={passwords.password}
            onChange={(event) => setPasswords((current) => ({ ...current, password: event.target.value }))}
            aria-invalid={!!state.errors?.password}
          />
          <FieldError message={state.errors?.password?.[0]} />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirmar
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={passwords.confirmPassword}
            onChange={(event) => setPasswords((current) => ({ ...current, confirmPassword: event.target.value }))}
            aria-invalid={!!state.errors?.confirmPassword}
          />
          <FieldError message={state.errors?.confirmPassword?.[0]} />
        </div>
      </div>

      {state.message && <p className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{state.message}</p>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        Criar conta
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Já tem cadastro?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Fazer login
        </Link>
      </p>
    </form>
  );
}
