
"use server";

import { z } from 'zod';
import { LoginSchema, SignupSchema } from '@/lib/schemas';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';
import bcrypt from 'bcryptjs';
import type { User, Role } from "@/types";


// Esta é uma simulação. Em um app real, você gerenciaria sessões/cookies.
// Para esta demonstração, vamos simular que o usuário logado é "admin@marketease.com" para RBAC.
// E que uma sessão é estabelecida de alguma forma.
const SIMULATED_SESSION_USER_EMAIL_FOR_RBAC = "admin@marketease.com"; // Para simular admin

// Simulação: Armazena o email do usuário "logado" para fins de simulação de sessão e RBAC.
// Em um app real, isso seria gerenciado por cookies/tokens de sessão.
let simulatedLoggedInUserEmail: string | null = null;


export async function login(values: z.infer<typeof LoginSchema>) {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    await logAuditEvent("USER_LOGIN_FAILED", { details: { error: "Invalid fields", email: values.email } });
    return { error: "Invalid fields!" };
  }

  const { email, password } = validatedFields.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      await logAuditEvent("USER_LOGIN_FAILED", { details: { error: "User not found", email } });
      return { error: "Invalid email or password." };
    }

    const passwordsMatch = await bcrypt.compare(password, user.password);
    if (!passwordsMatch) {
      await logAuditEvent("USER_LOGIN_FAILED", { userId: user.id, details: { error: "Incorrect password", email } });
      return { error: "Invalid email or password." };
    }
    
    // Simular "setar" a sessão.
    simulatedLoggedInUserEmail = user.email; 
    console.log(`Login successful for ${email}. Role: ${user.role}. Session simulated.`);
    await logAuditEvent("USER_LOGIN_SUCCESS", { userId: user.id, details: { email } });
    
  } catch (error) {
    console.error("Login error:", error);
    simulatedLoggedInUserEmail = null; // Limpar em caso de erro
    await logAuditEvent("USER_LOGIN_EXCEPTION", { details: { error: "Server error during login", email } });
    return { error: "An unexpected error occurred during login." };
  }
  
  redirect('/app/dashboard');
}

export async function signup(values: z.infer<typeof SignupSchema>) {
  const validatedFields = SignupSchema.safeParse(values);

  if (!validatedFields.success) {
    await logAuditEvent("USER_SIGNUP_FAILED", { details: { error: "Invalid fields", email: values.email } });
    return { error: "Invalid fields!" };
  }
  
  const { name, email, password } = validatedFields.data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      await logAuditEvent("USER_SIGNUP_FAILED", { details: { error: "Email already in use", email } });
      return { error: "Email already in use." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: email === SIMULATED_SESSION_USER_EMAIL_FOR_RBAC ? 'ADMIN' : 'USER',
      },
    });

    await logAuditEvent("USER_SIGNUP_SUCCESS", { userId: newUser.id, details: { email } });
    console.log(`Signup for: Name: ${name}, Email: ${email}. Assigned role: ${newUser.role}`);
    
    // Simular login após signup bem-sucedido
    simulatedLoggedInUserEmail = newUser.email;
    
  } catch (error) {
    console.error("Signup error:", error);
    simulatedLoggedInUserEmail = null; // Limpar em caso de erro
    await logAuditEvent("USER_SIGNUP_EXCEPTION", { details: { error: "Server error during signup", email } });
    return { error: "An unexpected error occurred during signup." };
  }
  
  redirect('/app/dashboard');
}

export async function logout() {
  const user = await getSimulatedCurrentUser(); // Pega o usuário antes de "deslogar" para o log
  const userId = user?.id !== "guest" && user?.id !== "guest-error" ? user?.id : undefined;
  const userEmail = user?.email;

  simulatedLoggedInUserEmail = null; // "Limpa" a sessão simulada
  
  await logAuditEvent("USER_LOGOUT_SUCCESS", { userId, details: { message: `User ${userEmail || 'unknown'} logged out (simulated)`} });
  console.log(`User ${userEmail || 'unknown'} logged out (simulated)`);
  redirect('/login');
}


export async function getSimulatedCurrentUser(): Promise<User | null> {
  if (!simulatedLoggedInUserEmail) {
    // Se nenhum email simulado está "logado", tente carregar o admin padrão se ele existir,
    // caso contrário, retorne null (ou um usuário guest se preferir um fallback)
    try {
      const adminUser = await prisma.user.findUnique({
        where: { email: SIMULATED_SESSION_USER_EMAIL_FOR_RBAC },
      });
      // Se quisermos forçar um "auto-login" do admin para fins de desenvolvimento se ninguém estiver logado:
      // if (adminUser) {
      //   simulatedLoggedInUserEmail = adminUser.email;
      //   return adminUser;
      // }
      return adminUser; // Retorna o admin se encontrado, ou null
    } catch (error) {
      console.error("Error fetching default admin user:", error);
      return null;
    }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: simulatedLoggedInUserEmail },
    });
    return user; // Retorna o usuário "logado" ou null se não encontrado
  } catch (error) {
    console.error("Error fetching simulated current user:", error);
    return null; // Retorna null em caso de erro
  }
}
