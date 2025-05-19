"use client";

import type React from 'react';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

import { SignupSchema } from '@/lib/schemas';
import { signup } from '@/lib/actions/auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Store } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SignupForm() {
  const [error, setError] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof SignupSchema>>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: z.infer<typeof SignupSchema>) => {
    setError("");
    startTransition(async () => {
       try {
        const result = await signup(values);
        if (result?.error) {
          setError(result.error);
          toast({
            variant: "destructive",
            title: "Signup Failed",
            description: result.error,
          });
        } else if (result?.success) {
           toast({
            title: "Signup Successful",
            description: result.success,
          });
          // Redirect is handled by server action if successful, or user is prompted to login
        }
      } catch (err) {
        setError("An unexpected error occurred.");
        toast({
          variant: "destructive",
          title: "Signup Error",
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
        <CardTitle className="text-3xl font-bold text-primary">Create Account</CardTitle>
        <CardDescription>Join MarketEase today!</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
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
              {isPending ? "Signing up..." : "Sign Up"} <UserPlus className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Button variant="link" asChild className="p-0 text-primary">
                <Link href="/login">Login</Link>
              </Button>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
