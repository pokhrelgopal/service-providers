"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLogin, useMe } from "@/features/auth";
import type { ApiError } from "@/lib/axios";

const schema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(6, "Enter your password"),
});
type Values = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const login = useLogin();
  const { data: user } = useMe();

  // Already signed in as admin → straight to the panel.
  useEffect(() => {
    if (user?.roles.includes("admin")) router.replace("/admin");
  }, [user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, { onSuccess: () => router.replace("/admin") });
  });

  return (
    <main className="flex min-h-dvh items-center justify-center bg-neutral-100">
      <Container className="flex max-w-md flex-col">
        <Card className="bg-white">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Servio Admin</CardTitle>
            <CardDescription>Sign in to the admin panel.</CardDescription>
          </CardHeader>
          <form onSubmit={onSubmit} className="flex flex-col gap-4 px-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            {login.isError && (
              <p className="text-sm text-destructive">
                {(login.error as unknown as ApiError).message}
              </p>
            )}
            <Button type="submit" size="lg" disabled={login.isPending}>
              {login.isPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </Card>
      </Container>
    </main>
  );
}
