import Link from 'next/link';

export const instant = false;;

export default function SignUpSuccessPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-24">
      <div className="bg-background border border-foreground/20 rounded-md p-8 shadow-lg max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Inscription réussie !</h1>
        <p className="text-foreground/80 mb-6">
          Vérifiez votre boîte mail pour confirmer votre compte
        </p>
        <Link
          href="/auth/login"
          className="bg-accent text-accent-foreground px-6 py-3 rounded-md hover:bg-accent/80 transition-colors"
        >
          Se connecter
        </Link>
      </div>
    </main>
  );
}
