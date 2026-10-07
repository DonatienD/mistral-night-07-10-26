import { ForgotPasswordForm } from '@/components/forgot-password-form';

export const instant = false;;

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex flex-col items-center p-24">
      <div className="bg-background border border-foreground/20 rounded-md p-8 shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Mot de passe oublié</h1>
        <p className="text-foreground/80 mb-6">
          Entrez votre email pour recevoir un lien de réinitialisation
        </p>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
