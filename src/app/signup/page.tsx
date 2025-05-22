import { SignupForm } from "@/components/auth/SignupForm";
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sign Up - MarketEase',
  description: 'Create your MarketEase account.',
};

export default function SignupPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/30 p-4">
      <SignupForm />
    </div>
  );
}
