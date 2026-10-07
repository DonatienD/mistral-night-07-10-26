import Link from 'next/link';

export default function InstrumentsPage() {
  return (
    <main className="min-h-screen flex flex-col items-center p-24">
      <div className="bg-background border border-foreground/20 rounded-md p-8 shadow-lg max-w-2xl w-full">
        <h1 className="text-2xl font-bold mb-4">Instruments</h1>
        <p className="text-foreground/80 mb-6">
          Cette page sera développée pour gérer vos instruments.
        </p>
        <Link
          href="/dashboard"
          className="bg-accent text-accent-foreground px-6 py-3 rounded-md hover:bg-accent/80 transition-colors"
        >
          Aller au Dashboard AAPC
        </Link>
      </div>
    </main>
  );
}
