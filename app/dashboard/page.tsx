'use client';

import { useState, useEffect, useMemo } from 'react';
import { Icon } from '@/components/dashboard/Icons';
import { fetchDashboardAAPC, DashboardAAPC } from '@/lib/boamp';

// Types pour le dashboard
type Page = 'dashboard' | 'aapc';

type AppData = {
  firstName: string;
  role: string;
};

const initialData: AppData = {
  firstName: 'Alexandre',
  role: 'Dirigeant',
};

const navigation: { id: Page; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Accueil', icon: 'grid' },
  { id: 'aapc', label: 'AAPC', icon: 'file' },
];

// Fonction pour formater l'argent
const money = (value: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

const shortMoney = (value: number) => `${(value / 1000000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} M€`;

// Fonction utilitaire pour calculer les jours restants
const getDaysRemaining = (deadline: string) => {
  if (!deadline) return null;
  try {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  } catch {
    return null;
  }
};

// Composant KpiCard
function KpiCard({ label, value, change, icon, tone, sublabel }: {
  label: string;
  value: string;
  change?: number;
  icon: any;
  tone: string;
  sublabel?: string;
}) {
  const positive = (change ?? 0) >= 0;
  return (
    <article className="card kpi-card">
      <div className={`kpi-icon ${tone}`}>
        <Icon name={icon} size={19} />
      </div>
      <div className="kpi-copy">
        <span className="eyebrow">{label}</span>
        <strong>{value}</strong>
        {change !== undefined ? (
          <span className={`trend ${positive ? 'positive' : 'negative'}`}>
            <Icon name={positive ? 'arrow-up' : 'arrow-down'} size={13} />
            {Math.abs(change).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}% <em>vs N-1</em>
          </span>
        ) : (
          <span className="muted-small">{sublabel}</span>
        )}
      </div>
    </article>
  );
}

// Composant Button
function Button({
  children,
  variant = 'primary',
  type = 'button',
  onClick,
  className = '',
}: {
  children: any;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  type?: 'button' | 'submit';
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button className={`button button-${variant} ${className}`} type={type} onClick={onClick}>
      {children}
    </button>
  );
}

// Composant AAPC Card
function AAPCCard({ aapc, index }: { aapc: DashboardAAPC; index: number }) {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Non spécifié';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const daysRemaining = getDaysRemaining(aapc.deadline);
  const isUrgent = daysRemaining !== null && daysRemaining <= 7;

  return (
    <article className="card report-row aapc-row">
      <div className="report-year">
        <span>N°</span>
        <strong>{index + 1}</strong>
        {index === 0 && <em>Le plus récent</em>}
      </div>
      <div className="report-metric aapc-title">
        <span>Titre</span>
        <strong>{aapc.title}</strong>
        <small>{aapc.type}</small>
      </div>
      <div className="report-metric">
        <span>Acheteur</span>
        <strong>{aapc.buyer}</strong>
        <small>{aapc.buyerCity}</small>
      </div>
      <div className="report-metric">
        <span>Publication</span>
        <strong>{formatDate(aapc.publicationDate)}</strong>
        <small>Date limite</small>
      </div>
      <div className="report-metric">
        <span>Deadline</span>
        <strong className={isUrgent ? 'negative' : ''}>{formatDate(aapc.deadline)}</strong>
        {daysRemaining !== null && (
          <small className={isUrgent ? 'negative' : ''}>
            {daysRemaining} jours restant{daysRemaining > 1 ? 's' : ''}
          </small>
        )}
      </div>
      <div className="aapc-actions">
        <a href={aapc.url} target="_blank" rel="noopener noreferrer" className="icon-button" aria-label="Voir l'avis">
          <Icon name="chevron" size={17} />
        </a>
      </div>
    </article>
  );
}

// Composant Dashboard principal
function Dashboard({ data }: { data: AppData }) {
  const [aapcs, setAapcs] = useState<DashboardAAPC[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les AAPC au chargement
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchDashboardAAPC(20);
        setAapcs(data);
      } catch (err) {
        setError('Erreur lors du chargement des appels d\'offres. Veuillez réessayer.');
        console.error('Erreur API BOAMP:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Statistiques calculées
  const stats = useMemo(() => {
    const total = aapcs.length;
    const urgent = aapcs.filter(a => {
      const daysRemaining = getDaysRemaining(a.deadline);
      return daysRemaining !== null && daysRemaining <= 7;
    }).length;
    const recent = aapcs.filter(a => {
      const pubDate = new Date(a.publicationDate);
      const today = new Date();
      const diffDays = (today.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    }).length;

    return { total, urgent, recent };
  }, [aapcs]);

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <span className="date-label">SYNTHÈSE · APPels D'OFFRES PUBLICS</span>
          <h1>Bonjour {data.firstName},</h1>
          <p>Voici les derniers appels d'offres publics disponibles.</p>
        </div>
        <Button onClick={() => window.location.reload()}>
          <Icon name="arrow-up" size={17} /> Rafraîchir
        </Button>
      </header>

      {/* KPI Cards */}
      <section className="kpi-grid">
        <KpiCard 
          label="Total AAPC" 
          value={String(stats.total)} 
          icon="file" 
          tone="blue"
          sublabel="Appels d'offres ouverts"
        />
        <KpiCard 
          label="Urgents" 
          value={String(stats.urgent)} 
          change={stats.urgent > 0 ? ((stats.urgent / Math.max(stats.total, 1)) * 100) : 0}
          icon="alert" 
          tone="amber"
        />
        <KpiCard 
          label="Récents (7j)" 
          value={String(stats.recent)} 
          icon="spark" 
          tone="green"
        />
        <KpiCard 
          label="Statut API" 
          value={loading ? 'Chargement...' : error ? 'Erreur' : 'OK'}
          icon="check" 
          tone={error ? 'amber' : 'green'}
        />
      </section>

      {/* Error State */}
      {error && (
        <section className="card empty-state-card">
          <div className="empty-state">
            <Icon name="alert" size={24} />
            <strong>{error}</strong>
            <p>Impossible de récupérer les données depuis l'API BOAMP.</p>
            <Button onClick={() => window.location.reload()}>Réessayer</Button>
          </div>
        </section>
      )}

      {/* Loading State */}
      {loading && !error && (
        <section className="card empty-state-card">
          <div className="empty-state">
            <Icon name="spark" size={24} />
            <strong>Chargement en cours...</strong>
            <p>Récupération des appels d'offres depuis data.gouv.fr</p>
          </div>
        </section>
      )}

      {/* AAPC List */}
      {!loading && !error && (
        <section className="reports-list aapc-list">
          {aapcs.length > 0 ? (
            aapcs.map((aapc, index) => (
              <AAPCCard key={aapc.id} aapc={aapc} index={index} />
            ))
          ) : (
            <div className="empty-state">
              <Icon name="file" size={24} />
              <strong>Aucun appel d'offres trouvé</strong>
              <p>Il n'y a actuellement aucun appel d'offres public ouvert.</p>
            </div>
          )}
        </section>
      )}

      {/* Company Strip */}
      <section className="card company-strip">
        <div className="company-monogram">MX</div>
        <div className="company-main">
          <span className="eyebrow">VOTRE ESPACE</span>
          <h2>MXW Decision Studio</h2>
          <p>Tableau de bord des marchés publics</p>
        </div>
        <div className="company-stat">
          <span>Données</span>
          <strong>En temps réel</strong>
        </div>
        <div className="company-stat">
          <span>Source</span>
          <strong>BOAMP / data.gouv.fr</strong>
        </div>
        <div className="status-badge">
          <i />
          <span>API connectée</span>
        </div>
      </section>
    </main>
  );
}

// Composant principal de la page
export default function DashboardPage() {
  const [page, setPage] = useState<Page>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [data, setData] = useState<AppData>(initialData);

  const navigate = (next: Page) => {
    setPage(next);
    setMenuOpen(false);
  };

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">M</div>
          <div>
            <strong>MXW</strong>
            <span>Decision Studio</span>
          </div>
        </div>
        <button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Fermer le menu">
          <Icon name="close" />
        </button>
        <nav>
          <span className="nav-label">MARCHÉS PUBLICS</span>
          {navigation.map((item) => (
            <button 
              key={item.id} 
              className={page === item.id ? 'active' : ''} 
              onClick={() => navigate(item.id)}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {page === item.id && <i />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="progress-card">
            <div className="progress-icon">
              <Icon name="spark" size={18} />
            </div>
            <strong>Données en direct</strong>
            <span>API BOAMP connectée</span>
            <div className="progress-bar">
              <i />
            </div>
            <small>Live</small>
          </div>
          <div className="user-card">
            <div className="avatar">{data.firstName.slice(0, 1)}D</div>
            <div>
              <strong>{data.firstName} Dubois</strong>
              <span>{data.role}</span>
            </div>
            <Icon name="chevron" size={15} />
          </div>
        </div>
      </aside>

      {/* Content Shell */}
      <div className="content-shell">
        {/* Topbar */}
        <div className="topbar">
          <button className="icon-button menu-button" onClick={() => setMenuOpen(true)} aria-label="Ouvrir le menu">
            <Icon name="menu" />
          </button>
          <div className="top-company">
            <div className="mini-logo">MX</div>
            <div>
              <strong>MXW Studio</strong>
              <span>Marchés Publics</span>
            </div>
          </div>
          <div className="top-actions">
            <span className="top-status">
              <i /> Données actualisées
            </span>
            <div className="top-avatar">{data.firstName.slice(0, 1)}D</div>
          </div>
        </div>

        {/* Page Content */}
        {page === 'dashboard' && <Dashboard data={data} />}
        {page === 'aapc' && (
          <main className="page narrow-page">
            <header className="page-header">
              <div>
                <span className="date-label">LISTE COMPLÈTE</span>
                <h1>Tous les AAPC</h1>
                <p>Accédez à tous les appels d'offres publics disponibles.</p>
              </div>
            </header>
            <section className="card form-card">
              <p>Cette page affichera la liste complète des appels d'offres avec des filtres avancés.</p>
              <p>À développer selon vos besoins.</p>
            </section>
          </main>
        )}
      </div>

      {/* Backdrop */}
      {menuOpen && (
        <button className="backdrop" onClick={() => setMenuOpen(false)} aria-label="Fermer le menu" />
      )}
    </div>
  );
}
