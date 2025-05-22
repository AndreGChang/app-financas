import { LoginForm } from "@/components/auth/LoginForm";
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Login - MarketEase',
  description: 'Log in to your MarketEase account.',
};

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/30 p-4">
      <LoginForm />
    </div>
  );
}
