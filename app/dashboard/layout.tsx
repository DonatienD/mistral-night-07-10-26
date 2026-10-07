import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MXW Decision Studio - Marchés Publics',
  description: 'Tableau de bord des appels d\'offres publics en temps réel',
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="dashboard-body antialiased">{children}</div>;
}
