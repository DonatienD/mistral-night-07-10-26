// Librairie pour l'analyse de concurrence des marchés publics
// Basée sur l'API BOAMP (data.gouv.fr)

import { BOAMPRecord, BOAMPAvis, DashboardAAPC } from './boamp';

// Interface pour les données d'attribution (où on a les gagnants)
export interface AttributionRecord {
  id: string;
  idweb: string;
  objet: string;
  nomacheteur: string;
  titulaire: string;
  dateparution: string;
  datelimitereponse: string;
  montant?: string;
  descripteur_code: string[];
  descripteur_libelle: string[];
  code_departement: string[];
  url_avis: string;
}

// Interface pour les métriques de concurrence
export interface CompetitionMetrics {
  sector: string; // Code CPV ou libellé
  totalAwards: number; // Nombre total de marchés attribués
  uniqueWinners: number; // Nombre d'entreprises différentes ayant gagné
  topWinners: Array<{ company: string; count: number; percentage: number }>;
  competitionRatio: number; // Ratio moyen candidats/marché (si disponible)
  pmeSuccessRate?: number; // Taux de réussite des PME (à calculer)
  avgAwardAmount?: number; // Montant moyen des marchés attribués
}

// Interface pour le résultat de l'analyse de concurrence
export interface CompetitionAnalysis {
  cpvCode: string;
  cpvLabel: string;
  region?: string;
  timeRange: { start: string; end: string };
  metrics: CompetitionMetrics;
  recentAwards: AttributionRecord[];
  recommendation: string;
  confidenceScore: number; // 0-100
}

// Interface pour le score de pertinence d'un AAPC
export interface AAPCPertinenceScore {
  aapcId: string;
  title: string;
  buyer: string;
  cpvCodes: string[];
  amount?: number;
  scores: {
    competition: number; // 1-5 (1 = faible concurrence, 5 = forte concurrence)
    pmeFriendly: number; // 1-5 (1 = PME-friendly, 5 = favorise les grands groupes)
    historicalSuccess: number; // 1-5 (basé sur l'historique des gagnants)
    overall: number; // Score global 1-5
  };
  recommendation: 'GO' | 'CAUTION' | 'AVOID';
  reasoning: string[];
}

// URL de l'API BOAMP v2.1 (plus complète)
const BOAMP_API_V2_URL = 'https://boamp-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/boamp/records';

// Liste des codes CPV principaux pour le nettoyage industriel
const NETTOYAGE_CPV_CODES = [
  '90910000', // Services de nettoyage industriel
  '90911000', // Nettoyage de bâtiments
  '90912000', // Nettoyage de vitres
  '90919000', // Autres services de nettoyage
  '90900000', // Services de nettoyage
];

/**
 * Récupère les avis d'attribution (où on a les gagnants)
 */
export async function fetchAttributionAwards(
  limit: number = 100,
  cpvCode?: string,
  department?: string,
  startDate?: string
): Promise<AttributionRecord[]> {
  const params = new URLSearchParams();
  
  params.set('limit', limit.toString());
  params.set('sort', '-dateparution');
  
  // Filtrer par type d'avis qui contient les attributions
  // On cherche les avis où titulaire n'est pas null
  params.set('refine', 'titulaire:!null');
  
  // Filtrer par CPV si spécifié
  if (cpvCode) {
    params.set('refine', `${params.get('refine') || ''} AND descripteur_code:${cpvCode}`);
  }
  
  // Filtrer par département si spécifié
  if (department) {
    params.set('refine', `${params.get('refine') || ''} AND code_departement:${department}`);
  }
  
  // Filtrer par date de début si spécifié
  if (startDate) {
    params.set('refine', `${params.get('refine') || ''} AND dateparution>=${startDate}`);
  }
  
  const url = `${BOAMP_API_V2_URL}?${params.toString()}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Erreur API BOAMP: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    const results = data.results || [];
    
    // Mapper les résultats vers notre interface
    return results.map(mapToAttributionRecord);
  } catch (error) {
    console.error('Erreur lors de la récupération des avis d\'attribution:', error);
    throw error;
  }
}

/**
 * Mappe un record de l'API BOAMP vers AttributionRecord
 */
function mapToAttributionRecord(record: any): AttributionRecord {
  return {
    id: record.id || record.recordid || '',
    idweb: record.idweb || '',
    objet: record.objet || '',
    nomacheteur: record.nomacheteur || '',
    titulaire: record.titulaire || '',
    dateparution: record.dateparution || '',
    datelimitereponse: record.datelimitereponse || '',
    montant: record.montant,
    descripteur_code: record.descripteur_code || [],
    descripteur_libelle: record.descripteur_libelle || [],
    code_departement: record.code_departement || [],
    url_avis: record.url_avis || '',
  };
}

/**
 * Récupère les AAPC (appels d'offres) pour un secteur donné
 */
export async function fetchAAPCBySector(
  cpvCode: string,
  limit: number = 50,
  department?: string
): Promise<DashboardAAPC[]> {
  const params = new URLSearchParams();
  
  params.set('limit', limit.toString());
  params.set('sort', '-dateparution');
  
  // Filtrer par type d'avis = AAPC (Appel d'offres)
  params.set('refine', 'nature_categorise:appeloffre/standard');
  
  // Filtrer par CPV
  if (cpvCode) {
    params.set('refine', `${params.get('refine') || ''} AND descripteur_code:${cpvCode}`);
  }
  
  // Filtrer par département
  if (department) {
    params.set('refine', `${params.get('refine') || ''} AND code_departement:${department}`);
  }
  
  const url = `${BOAMP_API_V2_URL}?${params.toString()}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erreur API BOAMP: ${response.status}`);
    }
    
    const data = await response.json();
    const results = data.results || [];
    
    // Mapper vers DashboardAAPC
    return results.map(mapToDashboardAAPC);
  } catch (error) {
    console.error('Erreur lors de la récupération des AAPC:', error);
    return [];
  }
}

/**
 * Mappe un record API vers DashboardAAPC
 */
function mapToDashboardAAPC(record: any): DashboardAAPC {
  // Extraire les données du champ 'donnees' si c'est une string JSON
  let donnees: any = {};
  if (record.donnees && typeof record.donnees === 'string') {
    try {
      donnees = JSON.parse(record.donnees);
    } catch (e) {
      console.warn('Impossible de parser le champ donnees:', e);
    }
  } else if (record.donnees && typeof record.donnees === 'object') {
    donnees = record.donnees;
  }
  
  return {
    id: record.idweb || record.id || '',
    title: record.objet || donnees?.OBJET?.TITRE_MARCHE || 'Titre non disponible',
    buyer: record.nomacheteur || donnees?.IDENTITE?.DENOMINATION || 'Acheteur inconnu',
    buyerCity: donnees?.IDENTITE?.VILLE || '',
    type: record.nature_libelle || 'Type inconnu',
    publicationDate: record.dateparution || '',
    deadline: record.datelimitereponse || '',
    cpvCodes: donnees?.OBJET?.CPV?.map((c: any) => c.PRINCIPAL) || record.descripteur_code || [],
    url: record.url_avis || '',
  };
}

/**
 * Analyse la concurrence pour un code CPV donné
 */
export async function analyzeCompetition(
  cpvCode: string,
  region?: string,
  timeRange: { start: string; end: string } = { start: '2023-01-01', end: new Date().toISOString().split('T')[0] }
): Promise<CompetitionAnalysis> {
  try {
    // Récupérer les avis d'attribution pour ce secteur
    const awards = await fetchAttributionAwards(
      200, // Récupérer plus de données pour une analyse robuste
      cpvCode,
      region,
      timeRange.start
    );
    
    // Filtrer par plage de dates
    const filteredAwards = awards.filter(award => {
      const awardDate = new Date(award.dateparution);
      const endDate = new Date(timeRange.end);
      return awardDate <= endDate;
    });
    
    // Calculer les métriques
    const metrics = calculateCompetitionMetrics(filteredAwards);
    
    // Déterminer la recommandation
    const recommendation = generateRecommendation(metrics);
    
    // Calculer le score de confiance (basé sur le nombre de données)
    const confidenceScore = Math.min(100, filteredAwards.length * 2);
    
    // Trouver le libellé CPV
    const cpvLabel = getCPVLabel(cpvCode);
    
    return {
      cpvCode,
      cpvLabel,
      region,
      timeRange,
      metrics,
      recentAwards: filteredAwards.slice(0, 10), // Retourner les 10 plus récents
      recommendation,
      confidenceScore,
    };
  } catch (error) {
    console.error('Erreur lors de l\'analyse de concurrence:', error);
    throw error;
  }
}

/**
 * Calcule les métriques de concurrence à partir des avis d'attribution
 */
export function calculateCompetitionMetrics(awards: AttributionRecord[]): CompetitionMetrics {
  if (awards.length === 0) {
    return {
      sector: '',
      totalAwards: 0,
      uniqueWinners: 0,
      topWinners: [],
      competitionRatio: 0,
    };
  }
  
  // Compter les occurrences par entreprise
  const winnerCounts: Record<string, number> = {};
  awards.forEach(award => {
    if (award.titulaire) {
      const company = award.titulaire.trim().toUpperCase();
      winnerCounts[company] = (winnerCounts[company] || 0) + 1;
    }
  });
  
  // Trier par nombre de victoires
  const sortedWinners = Object.entries(winnerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10); // Top 10
  
  // Calculer les pourcentages
  const totalAwards = awards.length;
  const topWinners = sortedWinners.map(([company, count]) => ({
    company,
    count,
    percentage: (count / totalAwards) * 100,
  }));
  
  // Calculer le ratio de concurrence (simplifié : 1 = monopolistique, 5+ = très concurrentiel)
  // Ici, on utilise l'inverse du coefficient de Herfindahl
  const uniqueWinners = sortedWinners.length;
  const herfindahlIndex = sortedWinners.reduce((sum, [, count]) => {
    const share = count / totalAwards;
    return sum + share * share;
  }, 0);
  
  // Ratio de concurrence (plus c'est élevé, plus la concurrence est forte)
  // 1 / Herfindahl donne une mesure de diversité
  const competitionRatio = 1 / herfindahlIndex;
  
  return {
    sector: awards[0]?.descripteur_libelle?.join(', ') || '',
    totalAwards,
    uniqueWinners,
    topWinners,
    competitionRatio,
  };
}

/**
 * Génère une recommandation basée sur les métriques
 */
export function generateRecommendation(metrics: CompetitionMetrics): string {
  const { totalAwards, uniqueWinners, topWinners, competitionRatio } = metrics;
  
  if (totalAwards === 0) {
    return 'Insuffisance de données pour générer une recommandation.';
  }
  
  // Calculer la concentration (top 3 entreprises)
  const top3Share = topWinners.slice(0, 3).reduce((sum, w) => sum + w.percentage, 0);
  
  if (top3Share > 80) {
    return '⚠️ Secteur très concentré : Les 3 premiers acteurs dominent plus de 80% du marché. Difficile de percer sans différenciation forte.';
  } else if (top3Share > 60) {
    return '⚠️ Secteur concentré : Les leaders détiennent une part importante. Une stratégie ciblée est nécessaire.';
  } else if (uniqueWinners > 10 && competitionRatio > 3) {
    return '✅ Secteur concurrentiel : Nombreuses entreprises en compétition. Bonne opportunité pour les PME.';
  } else {
    return '✅ Secteur équilibré : Concurrence modérée. Opportunités intéressantes.';
  }
}

/**
 * Calcule le score de pertinence pour un AAPC spécifique
 */
export async function calculateAAPCPertinence(
  aapc: DashboardAAPC,
  sectorAnalysis?: CompetitionAnalysis
): Promise<AAPCPertinenceScore> {
  // Si on n'a pas d'analyse de secteur, on la fait
  const analysis = sectorAnalysis || 
    (aapc.cpvCodes.length > 0 ? 
      await analyzeCompetition(aapc.cpvCodes[0]) : 
      await analyzeCompetition('90910000'));
  
  const { metrics } = analysis;
  
  // Calculer les scores individuels (1-5)
  const competitionScore = calculateCompetitionScore(metrics);
  const pmeFriendlyScore = calculatePMEFriendlyScore(metrics);
  const historicalScore = calculateHistoricalScore(metrics);
  
  // Score global (moyenne pondérée)
  const overallScore = (
    competitionScore * 0.4 + 
    pmeFriendlyScore * 0.3 + 
    historicalScore * 0.3
  );
  
  // Déterminer la recommandation
  let recommendation: 'GO' | 'CAUTION' | 'AVOID';
  if (overallScore >= 3.5) {
    recommendation = 'GO';
  } else if (overallScore >= 2.5) {
    recommendation = 'CAUTION';
  } else {
    recommendation = 'AVOID';
  }
  
  // Générer les raisonnements
  const reasoning = generateReasoning(metrics, overallScore);
  
  return {
    aapcId: aapc.id,
    title: aapc.title,
    buyer: aapc.buyer,
    cpvCodes: aapc.cpvCodes,
    scores: {
      competition: Math.round(competitionScore * 10) / 10,
      pmeFriendly: Math.round(pmeFriendlyScore * 10) / 10,
      historicalSuccess: Math.round(historicalScore * 10) / 10,
      overall: Math.round(overallScore * 10) / 10,
    },
    recommendation,
    reasoning,
  };
}

/**
 * Calcule le score de concurrence (1-5)
 * 1 = faible concurrence (bon pour les nouveaux entrants)
 * 5 = forte concurrence (difficile)
 */
export function calculateCompetitionScore(metrics: CompetitionMetrics): number {
  const { uniqueWinners, competitionRatio, totalAwards } = metrics;
  
  if (totalAwards === 0) return 3; // Score neutre par défaut
  
  // Normaliser le ratio de concurrence sur une échelle 1-5
  // competitionRatio > 4 = très concurrentiel (score 5)
  // competitionRatio < 1.5 = peu concurrentiel (score 1)
  const normalizedCompetition = Math.min(5, Math.max(1, competitionRatio / 0.8));
  
  // Plus il y a d'entreprises uniques, plus la concurrence est forte
  const uniqueFactor = Math.min(5, uniqueWinners / 3);
  
  // Score moyen
  return (normalizedCompetition + uniqueFactor) / 2;
}

/**
 * Calcule le score PME-friendly (1-5)
 * 1 = très PME-friendly
 * 5 = pas du tout PME-friendly
 */
export function calculatePMEFriendlyScore(metrics: CompetitionMetrics): number {
  const { topWinners, uniqueWinners } = metrics;
  
  if (topWinners.length === 0) return 3;
  
  // Si le top 1 a plus de 50%, c'est pas PME-friendly
  const top1Share = topWinners[0]?.percentage || 0;
  
  if (top1Share > 50) {
    return 4.5; // Très dominé par un acteur
  } else if (top1Share > 30) {
    return 3.5;
  } else if (uniqueWinners > 15) {
    return 1.5; // Très fragmenté, bon pour les PME
  } else {
    return 2.5; // Équilibré
  }
}

/**
 * Calcule le score historique (1-5)
 * Basé sur la capacité des PME à gagner dans ce secteur
 */
export function calculateHistoricalScore(metrics: CompetitionMetrics): number {
  const { uniqueWinners, totalAwards } = metrics;
  
  if (totalAwards === 0) return 3;
  
  // Ratio de diversité : plus il y a d'entreprises différentes, plus c'est bon
  const diversityRatio = uniqueWinners / totalAwards;
  
  // Score inversé : plus de diversité = meilleur score
  return Math.min(5, Math.max(1, diversityRatio * 5));
}

/**
 * Génère les raisonnements pour le score
 */
export function generateReasoning(metrics: CompetitionMetrics, overallScore: number): string[] {
  const { totalAwards, uniqueWinners, topWinners, competitionRatio } = metrics;
  const reasoning: string[] = [];
  
  if (totalAwards === 0) {
    reasoning.push('⚠️ Données insuffisantes pour une analyse précise.');
    return reasoning;
  }
  
  // Raisonnement sur la concentration
  const top3Share = topWinners.slice(0, 3).reduce((sum, w) => sum + w.percentage, 0);
  
  if (top3Share > 80) {
    reasoning.push(`❌ Top 3 des entreprises contrôlent ${Math.round(top3Share)}% du marché`);
  } else if (top3Share > 60) {
    reasoning.push(`⚠️ Top 3 contrôlent ${Math.round(top3Share)}% du marché`);
  } else {
    reasoning.push(`✅ Marché fragmenté : ${uniqueWinners} entreprises différentes ont gagné`);
  }
  
  // Raisonnement sur la concurrence
  if (competitionRatio > 3) {
    reasoning.push('✅ Forte concurrence : bonnes opportunités pour les nouveaux entrants');
  } else if (competitionRatio < 1.5) {
    reasoning.push('❌ Faible concurrence : marché probablement verrouillé');
  } else {
    reasoning.push('✅ Niveau de concurrence modéré');
  }
  
  // Raisonnement sur le score global
  if (overallScore >= 4) {
    reasoning.push('🎯 Excellente opportunité : secteur favorable aux nouveaux entrants');
  } else if (overallScore >= 3) {
    reasoning.push('🎯 Bonne opportunité : secteur avec des chances raisonnables');
  } else if (overallScore >= 2) {
    reasoning.push('⚠️ Opportunité moyenne : nécessite une stratégie solide');
  } else {
    reasoning.push('❌ Opportunité faible : secteur très concurrentiel ou dominé');
  }
  
  return reasoning;
}

/**
 * Retourne le libellé pour un code CPV
 */
export function getCPVLabel(cpvCode: string): string {
  const cpvLabels: Record<string, string> = {
    '90910000': 'Services de nettoyage industriel',
    '90911000': 'Nettoyage de bâtiments',
    '90912000': 'Nettoyage de vitres',
    '90919000': 'Autres services de nettoyage',
    '90900000': 'Services de nettoyage',
    '34300000': 'Pièces détachées pour véhicules',
    '44000000': 'Construction',
    '71000000': 'Services architecturaux',
    '79000000': 'Services de conseil',
  };
  
  return cpvLabels[cpvCode] || `Secteur ${cpvCode}`;
}

/**
 * Récupère les données historiques pour un secteur
 */
export async function getHistoricalWinners(
  cpvCode: string,
  limit: number = 50
): Promise<AttributionRecord[]> {
  return fetchAttributionAwards(limit, cpvCode);
}

/**
 * Analyse comparative entre plusieurs secteurs
 */
export async function compareSectors(
  cpvCodes: string[]
): Promise<Record<string, CompetitionMetrics>> {
  const results: Record<string, CompetitionMetrics> = {};
  
  for (const cpvCode of cpvCodes) {
    try {
      const awards = await fetchAttributionAwards(100, cpvCode);
      results[cpvCode] = calculateCompetitionMetrics(awards);
    } catch (error) {
      console.error(`Erreur pour le code CPV ${cpvCode}:`, error);
      results[cpvCode] = {
        sector: cpvCode,
        totalAwards: 0,
        uniqueWinners: 0,
        topWinners: [],
        competitionRatio: 0,
      };
    }
  }
  
  return results;
}
