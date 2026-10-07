// Types pour les AAPC (Avis d'Appel Public à la Concurrence)
export interface BOAMPRecord {
  id: string;
  idweb: string;
  objet: string;
  nomacheteur: string;
  type_marche: string;
  type_marche_libelle: string;
  nature: string;
  nature_libelle: string;
  dateparution: string;
  datelimitereponse: string;
  datefindiffusion: string;
  code_departement: string;
  code_departement_prestation: string;
  descripteur_libelle: string;
  descripteur_code: string;
  famille: string;
  famille_libelle: string;
  url_avis: string;
  donnees: BOAMPData;
}

export interface BOAMPData {
  IDENTITE?: {
    DENOMINATION: string;
    ADRESSE: string;
    CP: string;
    VILLE: string;
    TEL: string;
    MEL: string;
  };
  OBJET?: {
    TITRE_MARCHE: string;
    TYPE_MARCHE: any;
    OBJET_COMPLET: string;
    CPV: Array<{ PRINCIPAL: string }>;
    LIEU_EXEC_LIVR: {
      ADRESSE: string;
      CODE_NUTS: string;
    };
    CARACTERISTIQUES?: {
      QUANTITE: string;
    };
  };
  PROCEDURE?: {
    CRITERES_ATTRIBUTION?: {
      CRITERES_LIBRE: string;
    };
    CONDITION_PARTICIPATION?: {
      SITUATION_JURIDIQUE: string;
      CAP_ECO: string;
      CAP_TECH: string;
    };
    CONDITION_ADMINISTRATIVE?: {
      REFERENCE_MARCHE: string;
    };
  };
  CONDITION_DELAI?: {
    RECEPT_CANDIDAT: string;
  };
  DIV_EN_LOTS?: {
    OUI: string;
  };
  RENSEIGNEMENTS_COMPLEMENTAIRES?: {
    RENS_COMPLEMENT: string;
  };
  ADRESSES_COMPLEMENTAIRES?: {
    ADRESSE: Array<{
      TYPE: any;
      DENOMINATION: string;
      ADRESSE: string;
      CP: string;
      VILLE: string;
      TEL: string;
      FAX?: string;
      MEL: string;
    }>;
  };
}

export interface BOAMPAvis {
  records: BOAMPRecord[];
  nhits: number;
}

// URL de l'API BOAMP
const BOAMP_API_URL = 'https://boamp-datadila.opendatasoft.com/api/records/1.0/search/';

// Paramètres par défaut pour récupérer les AAPC
export const defaultBOAMPParams = {
  dataset: 'boamp',
  refine: {
    type: 'Appel d\'offres ouvert',
    statut: 'En cours',
  },
  rows: 50,
  sort: '-dateparution',
};

// Fonction pour récupérer les AAPC depuis l'API BOAMP
export async function fetchAAPC(params: {
  rows?: number;
  start?: number;
  refine?: Record<string, string>;
} = {}): Promise<BOAMPAvis> {
  const queryParams = new URLSearchParams();
  
  // Paramètres de base
  queryParams.set('dataset', 'boamp');
  
  // Fusionner avec les paramètres par défaut
  const mergedParams = { ...defaultBOAMPParams, ...params };
  
  // Ajouter les paramètres de filtre
  if (mergedParams.refine) {
    Object.entries(mergedParams.refine).forEach(([key, value]) => {
      queryParams.set(`refine.${key}`, value);
    });
  }
  
  // Autres paramètres
  if (mergedParams.rows) {
    queryParams.set('rows', mergedParams.rows.toString());
  }
  if (mergedParams.start) {
    queryParams.set('start', mergedParams.start.toString());
  }
  if (mergedParams.sort) {
    queryParams.set('sort', mergedParams.sort);
  }
  
  // Construire l'URL
  const url = `${BOAMP_API_URL}?${queryParams.toString()}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erreur API BOAMP: ${response.status}`);
    }
    const data = await response.json();
    return data as BOAMPAvis;
  } catch (error) {
    console.error('Erreur lors de la récupération des AAPC:', error);
    throw error;
  }
}

// Fonction pour formater les données pour le dashboard
export interface DashboardAAPC {
  id: string;
  title: string;
  buyer: string;
  buyerCity: string;
  type: string;
  publicationDate: string;
  deadline: string;
  amount?: string;
  cpvCodes: string[];
  url: string;
}

export function formatAAPCForDashboard(record: BOAMPRecord): DashboardAAPC {
  const donnees = record.donnees;
  
  return {
    id: record.idweb || record.id,
    title: record.objet || donnees?.OBJET?.TITRE_MARCHE || 'Titre non disponible',
    buyer: record.nomacheteur || donnees?.IDENTITE?.DENOMINATION || 'Acheteur inconnu',
    buyerCity: donnees?.IDENTITE?.VILLE || '',
    type: record.type_marche_libelle || record.type_marche || 'Type inconnu',
    publicationDate: record.dateparution,
    deadline: record.datelimitereponse,
    cpvCodes: donnees?.OBJET?.CPV?.map(c => c.PRINCIPAL) || [],
    url: record.url_avis,
  };
}

// Fonction pour récupérer les AAPC formatés pour le dashboard
export async function fetchDashboardAAPC(limit: number = 20): Promise<DashboardAAPC[]> {
  try {
    const data = await fetchAAPC({ rows: limit });
    return data.records.map(formatAAPCForDashboard);
  } catch (error) {
    console.error('Erreur lors du chargement des AAPC:', error);
    return [];
  }
}
