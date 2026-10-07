import { UpdatePasswordForm } from '@/components/update-password-form';

export const instant = false;;

export default function UpdatePasswordPage() {
  return (
    <main className="min-h-screen flex flex-col items-center p-24">
      <div className="bg-background border border-foreground/20 rounded-md p-8 shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Mettre à jour le mot de passe</h1>
        <p className="text-foreground/80 mb-6">
          Entrez votre nouveau mot de passe
        </p>
        <UpdatePasswordForm />
      </div>
    </main>
  );
}
