"use client";

import type React from 'react';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

import { LoginSchema } from '@/lib/schemas';
import { login } from '@/lib/actions/auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Store } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function LoginForm() {
  const [error, setError] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");
    startTransition(async () => {
      try {
        const result = await login(values);
        if (result?.error) {
          setError(result.error);
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: result.error,
          });
        }
        // Redirect is handled by server action
      } catch (err) {
        setError("An unexpected error occurred.");
        toast({
          variant: "destructive",
          title: "Login Error",
          description: "An unexpected error occurred. Please try again.",
        });
      }
    });
  };

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <div className="inline-flex items-center justify-center mb-2">
            <Store className="w-10 h-10 text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold text-primary">Welcome Back!</CardTitle>
        <CardDescription>Log in to access MarketEase.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Logging in..." : "Login"} <LogIn className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Button variant="link" asChild className="p-0 text-primary">
                <Link href="/signup">Sign up</Link>
              </Button>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
