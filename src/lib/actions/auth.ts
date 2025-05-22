
"use server";

import { z } from 'zod';
import { LoginSchema, SignupSchema } from '@/lib/schemas';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';
// Em um app real, você usaria uma biblioteca para hashing de senhas como bcrypt
// import bcrypt from 'bcryptjs';

// Esta é uma simulação. Em um app real, você gerenciaria sessões/cookies.
// Para esta demonstração, vamos simular que o usuário logado é "admin@marketease.com" para RBAC.
// E que uma sessão é estabelecida de alguma forma.

const SIMULATED_SESSION_USER_EMAIL_FOR_RBAC = "admin@marketease.com"; // Para simular admin

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

    // Em um app real, compare a senha com hash:
    // const passwordsMatch = await bcrypt.compare(password, user.password);
    // if (!passwordsMatch) {
    //   await logAuditEvent("USER_LOGIN_FAILED", { userId: user.id, details: { error: "Incorrect password", email } });
    //   return { error: "Invalid email or password." };
    // }

    // Simulação de verificação de senha (NÃO USE EM PRODUÇÃO)
    if (user.password !== password) {
       await logAuditEvent("USER_LOGIN_FAILED", { userId: user.id, details: { error: "Incorrect password (simulated)", email } });
       return { error: "Invalid email or password." };
    }

    // Simular "setar" a sessão. Em um app real, você criaria um token JWT ou cookie de sessão.
    // Para esta demo, apenas logamos e redirecionamos.
    // A role será verificada no AppLayout com base no email simulado.
    console.log(`Login successful for ${email}. Role: ${user.role}`);
    await logAuditEvent("USER_LOGIN_SUCCESS", { userId: user.id, details: { email } });
    
  } catch (error) {
    console.error("Login error:", error);
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

    // Em um app real, faça o hash da senha:
    // const hashedPassword = await bcrypt.hash(password, 10);
    
    // Por enquanto, salvando senha como texto (NÃO FAÇA ISSO EM PRODUÇÃO)
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: password, // Deveria ser hashedPassword
        role: email === SIMULATED_SESSION_USER_EMAIL_FOR_RBAC ? 'ADMIN' : 'USER', // Atribui ADMIN se for o email simulado
      },
    });

    await logAuditEvent("USER_SIGNUP_SUCCESS", { userId: newUser.id, details: { email } });
    console.log(`Simulating signup for: Name: ${name}, Email: ${email}. Assigned role: ${newUser.role}`);
    
  } catch (error) {
    console.error("Signup error:", error);
    await logAuditEvent("USER_SIGNUP_EXCEPTION", { details: { error: "Server error during signup", email } });
    return { error: "An unexpected error occurred during signup." };
  }
  
  // Após o signup, geralmente você logaria o usuário ou pediria para ele logar.
  // Por simplicidade, vamos redirecionar para o dashboard.
  redirect('/app/dashboard');
}

export async function logout() {
  // Em um app real, você invalidaria a sessão/cookie.
  // Por agora, apenas simulamos.
  // O ID do usuário não está facilmente acessível aqui sem um sistema de sessão.
  await logAuditEvent("USER_LOGOUT_SUCCESS", { details: { message: "User logged out (simulated)"} });
  console.log("User logged out (simulated)");
  redirect('/login');
}

// Função auxiliar para obter o usuário atual (simulado)
// Em um app real, isso viria de um contexto de sessão/auth
export async function getSimulatedCurrentUser() {
  // Para esta demo, vamos assumir que se o admin logou, ele é o usuário atual
  // Esta é uma grande simplificação e não segura para produção.
  try {
    const user = await prisma.user.findUnique({
      where: { email: SIMULATED_SESSION_USER_EMAIL_FOR_RBAC }, // Poderia ser qualquer email que logou.
    });
    // Se nenhum usuário logou, ou se o login falhou, user será null.
    // Em um app real, se não houver sessão, você retornaria null ou lançaria um erro.
    if (user) return { id: user.id, email: user.email, name: user.name, role: user.role };
    
    // Fallback para um usuário "genérico" se o admin não estiver no DB ou não for o foco.
    // Isso é apenas para a UI do layout funcionar sem um login real.
    return { id: "guest", email: "guest@example.com", name: "Guest User", role: "USER" as const };

  } catch (error) {
    console.error("Error fetching simulated current user:", error);
    return { id: "guest-error", email: "guest-error@example.com", name: "Guest User (Error)", role: "USER" as const };
  }
}
