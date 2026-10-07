import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SignUpForm } from '@/components/sign-up-form';

export const instant = false;;

export default async function SignUpPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (data.user) {
    redirect('/');
  }

  return (
    <main className="min-h-screen flex flex-col items-center p-24">
      <div className="bg-background border border-foreground/20 rounded-md p-8 shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Inscription</h1>
        <p className="text-foreground/80 mb-6">Créez votre compte</p>
        <SignUpForm />
      </div>
    </main>
  );
}
