export const instant = false;;

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string; error_description?: string };
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-24">
      <div className="bg-background border border-foreground/20 rounded-md p-8 shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Erreur d'authentification</h1>
        <p className="text-foreground/80 mb-4">
          {searchParams.error || 'Une erreur est survenue lors de la connexion'}
        </p>
        {searchParams.error_description && (
          <p className="text-sm text-foreground/60">{searchParams.error_description}</p>
        )}
        <a href="/auth/login" className="text-accent hover:underline mt-4 inline-block">
          Retour à la connexion
        </a>
      </div>
    </main>
  );
}
