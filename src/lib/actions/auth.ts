"use server";

import { z } from 'zod';
import { LoginSchema, SignupSchema } from '@/lib/schemas';
import { redirect } from 'next/navigation';

// This is a placeholder. In a real app, you'd interact with a database
// and manage sessions/cookies. For now, we'll simulate success/failure.

export async function login(values: z.infer<typeof LoginSchema>) {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password } = validatedFields.data;

  // Simulate database check
  if (email === "admin@marketease.com" && password === "password") {
    // Simulate setting a session cookie (not actually implemented here)
    console.log("Login successful for admin@marketease.com");
    // In a real app, you would set a cookie here, e.g., using iron-session or next-auth
  } else if (email === "employee@marketease.com" && password === "password") {
    console.log("Login successful for employee@marketease.com");
  }
  else {
    return { error: "Invalid email or password." };
  }
  
  redirect('/app/dashboard');
  // return { success: "Login successful!" }; // This won't be reached due to redirect
}

export async function signup(values: z.infer<typeof SignupSchema>) {
  const validatedFields = SignupSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }
  
  const { name, email, password } = validatedFields.data;

  // Simulate user creation
  console.log(`Simulating signup for: Name: ${name}, Email: ${email}`);
  
  // Simulate existing user
  if (email === "existing@marketease.com") {
    return { error: "Email already in use." };
  }

  // In a real app, create user in DB and then log them in (set cookie)
  redirect('/app/dashboard');
  // return { success: "Signup successful! Please login." };
}

export async function logout() {
  // Simulate clearing a session cookie
  console.log("User logged out");
  redirect('/login');
}
