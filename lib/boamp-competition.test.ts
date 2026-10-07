/**
 * Tests pour la librairie boamp-competition.ts
 * Ces tests vérifient que les fonctions d'analyse de concurrence fonctionnent correctement
 */

import {
  calculateCompetitionMetrics,
  generateRecommendation,
  calculateCompetitionScore,
  calculatePMEFriendlyScore,
  calculateHistoricalScore,
  generateReasoning,
  getCPVLabel,
  AttributionRecord
} from './boamp-competition';

describe('boamp-competition library', () => {
  describe('calculateCompetitionMetrics', () => {
    it('should return zero metrics for empty awards', () => {
      const metrics = calculateCompetitionMetrics([]);
      expect(metrics.totalAwards).toBe(0);
      expect(metrics.uniqueWinners).toBe(0);
      expect(metrics.topWinners).toEqual([]);
      expect(metrics.competitionRatio).toBe(0);
    });

    it('should calculate correct metrics for single winner', () => {
      const awards: AttributionRecord[] = [
        { id: '1', idweb: '1', objet: 'Test', nomacheteur: 'Acheteur 1', titulaire: 'Entreprise A', dateparution: '2024-01-01', datelimitereponse: '2024-02-01', descripteur_code: ['90910000'], descripteur_libelle: ['Nettoyage'], code_departement: ['75'], url_avis: '' },
        { id: '2', idweb: '2', objet: 'Test 2', nomacheteur: 'Acheteur 2', titulaire: 'Entreprise A', dateparution: '2024-01-02', datelimitereponse: '2024-02-02', descripteur_code: ['90910000'], descripteur_libelle: ['Nettoyage'], code_departement: ['75'], url_avis: '' },
        { id: '3', idweb: '3', objet: 'Test 3', nomacheteur: 'Acheteur 3', titulaire: 'Entreprise A', dateparution: '2024-01-03', datelimitereponse: '2024-02-03', descripteur_code: ['90910000'], descripteur_libelle: ['Nettoyage'], code_departement: ['75'], url_avis: '' },
      ];
      
      const metrics = calculateCompetitionMetrics(awards);
      expect(metrics.totalAwards).toBe(3);
      expect(metrics.uniqueWinners).toBe(1);
      expect(metrics.topWinners).toHaveLength(1);
      expect(metrics.topWinners[0].company).toBe('ENTREPRISE A');
      expect(metrics.topWinners[0].count).toBe(3);
      expect(metrics.topWinners[0].percentage).toBe(100);
      // Monopole parfait = ratio de concurrence proche de 1
      expect(metrics.competitionRatio).toBeCloseTo(1, 1);
    });

    it('should calculate correct metrics for multiple winners', () => {
      const awards: AttributionRecord[] = [
        { id: '1', idweb: '1', objet: 'Test', nomacheteur: 'Acheteur 1', titulaire: 'Entreprise A', dateparution: '2024-01-01', datelimitereponse: '2024-02-01', descripteur_code: ['90910000'], descripteur_libelle: ['Nettoyage'], code_departement: ['75'], url_avis: '' },
        { id: '2', idweb: '2', objet: 'Test 2', nomacheteur: 'Acheteur 2', titulaire: 'Entreprise B', dateparution: '2024-01-02', datelimitereponse: '2024-02-02', descripteur_code: ['90910000'], descripteur_libelle: ['Nettoyage'], code_departement: ['75'], url_avis: '' },
        { id: '3', idweb: '3', objet: 'Test 3', nomacheteur: 'Acheteur 3', titulaire: 'Entreprise C', dateparution: '2024-01-03', datelimitereponse: '2024-02-03', descripteur_code: ['90910000'], descripteur_libelle: ['Nettoyage'], code_departement: ['75'], url_avis: '' },
        { id: '4', idweb: '4', objet: 'Test 4', nomacheteur: 'Acheteur 4', titulaire: 'Entreprise A', dateparution: '2024-01-04', datelimitereponse: '2024-02-04', descripteur_code: ['90910000'], descripteur_libelle: ['Nettoyage'], code_departement: ['75'], url_avis: '' },
      ];
      
      const metrics = calculateCompetitionMetrics(awards);
      expect(metrics.totalAwards).toBe(4);
      expect(metrics.uniqueWinners).toBe(3);
      expect(metrics.topWinners).toHaveLength(3);
      // Entreprise A a 2 marchés, B et C ont 1 chacun
      expect(metrics.topWinners[0].count).toBe(2);
      expect(metrics.topWinners[1].count).toBe(1);
      expect(metrics.topWinners[2].count).toBe(1);
      // Concurrence modérée
      expect(metrics.competitionRatio).toBeGreaterThan(1.5);
    });

    it('should handle case insensitivity in company names', () => {
      const awards: AttributionRecord[] = [
        { id: '1', idweb: '1', objet: 'Test', nomacheteur: 'Acheteur 1', titulaire: 'Entreprise A', dateparution: '2024-01-01', datelimitereponse: '2024-02-01', descripteur_code: ['90910000'], descripteur_libelle: ['Nettoyage'], code_departement: ['75'], url_avis: '' },
        { id: '2', idweb: '2', objet: 'Test 2', nomacheteur: 'Acheteur 2', titulaire: 'entreprise a', dateparution: '2024-01-02', datelimitereponse: '2024-02-02', descripteur_code: ['90910000'], descripteur_libelle: ['Nettoyage'], code_departement: ['75'], url_avis: '' },
      ];
      
      const metrics = calculateCompetitionMetrics(awards);
      expect(metrics.uniqueWinners).toBe(1);
      expect(metrics.topWinners[0].count).toBe(2);
    });
  });

  describe('generateRecommendation', () => {
    it('should recommend caution for highly concentrated market', () => {
      const metrics = {
        totalAwards: 100,
        uniqueWinners: 3,
        topWinners: [
          { company: 'A', count: 60, percentage: 60 },
          { company: 'B', count: 25, percentage: 25 },
          { company: 'C', count: 15, percentage: 15 },
        ],
        competitionRatio: 1.5,
      };
      
      const recommendation = generateRecommendation(metrics);
      expect(recommendation).toContain('80%');
      expect(recommendation).toContain('Difficile');
    });

    it('should recommend go for competitive market', () => {
      const metrics = {
        totalAwards: 100,
        uniqueWinners: 20,
        topWinners: [
          { company: 'A', count: 10, percentage: 10 },
          { company: 'B', count: 9, percentage: 9 },
          { company: 'C', count: 8, percentage: 8 },
        ],
        competitionRatio: 4.5,
      };
      
      const recommendation = generateRecommendation(metrics);
      expect(recommendation).toContain('concurrentiel');
      expect(recommendation).toContain('PME');
    });

    it('should handle empty metrics', () => {
      const metrics = {
        totalAwards: 0,
        uniqueWinners: 0,
        topWinners: [],
        competitionRatio: 0,
      };
      
      const recommendation = generateRecommendation(metrics);
      expect(recommendation).toContain('Insuffisance');
    });
  });

  describe('Score Calculations', () => {
    it('should calculate competition score correctly', () => {
      // Faible concurrence (monopole)
      const lowCompMetrics = {
        totalAwards: 10,
        uniqueWinners: 1,
        topWinners: [{ company: 'A', count: 10, percentage: 100 }],
        competitionRatio: 1,
      };
      expect(calculateCompetitionScore(lowCompMetrics)).toBeCloseTo(1, 0);
      
      // Forte concurrence
      const highCompMetrics = {
        totalAwards: 100,
        uniqueWinners: 30,
        topWinners: [],
        competitionRatio: 5,
      };
      expect(calculateCompetitionScore(highCompMetrics)).toBeCloseTo(5, 0);
    });

    it('should calculate PME-friendly score correctly', () => {
      // Dominé par une seule entreprise
      const dominatedMetrics = {
        totalAwards: 100,
        uniqueWinners: 10,
        topWinners: [
          { company: 'A', count: 70, percentage: 70 },
          { company: 'B', count: 10, percentage: 10 },
        ],
        competitionRatio: 1.5,
      };
      expect(calculatePMEFriendlyScore(dominatedMetrics)).toBeGreaterThan(4);
      
      // Très fragmenté
      const fragmentedMetrics = {
        totalAwards: 100,
        uniqueWinners: 25,
        topWinners: [
          { company: 'A', count: 5, percentage: 5 },
        ],
        competitionRatio: 4,
      };
      expect(calculatePMEFriendlyScore(fragmentedMetrics)).toBeLessThan(2);
    });

    it('should calculate historical score correctly', () => {
      // Peu de diversité
      const lowDiversityMetrics = {
        totalAwards: 100,
        uniqueWinners: 2,
        topWinners: [],
        competitionRatio: 1,
      };
      expect(calculateHistoricalScore(lowDiversityMetrics)).toBeCloseTo(1, 0);
      
      // Haute diversité
      const highDiversityMetrics = {
        totalAwards: 100,
        uniqueWinners: 50,
        topWinners: [],
        competitionRatio: 5,
      };
      expect(calculateHistoricalScore(highDiversityMetrics)).toBeCloseTo(2.5, 0.5);
    });
  });

  describe('generateReasoning', () => {
    it('should generate reasoning for concentrated market', () => {
      const metrics = {
        totalAwards: 100,
        uniqueWinners: 3,
        topWinners: [
          { company: 'A', count: 60, percentage: 60 },
          { company: 'B', count: 25, percentage: 25 },
          { company: 'C', count: 15, percentage: 15 },
        ],
        competitionRatio: 1.5,
      };
      
      const reasoning = generateReasoning(metrics, 2.5);
      expect(reasoning.length).toBeGreaterThan(0);
      expect(reasoning.some(r => r.includes('%'))).toBe(true);
    });

    it('should handle empty metrics', () => {
      const metrics = {
        totalAwards: 0,
        uniqueWinners: 0,
        topWinners: [],
        competitionRatio: 0,
      };
      
      const reasoning = generateReasoning(metrics, 3);
      expect(reasoning[0]).toContain('Données insuffisantes');
    });
  });

  describe('getCPVLabel', () => {
    it('should return correct label for known CPV codes', () => {
      expect(getCPVLabel('90910000')).toBe('Services de nettoyage industriel');
      expect(getCPVLabel('90911000')).toBe('Nettoyage de bâtiments');
      expect(getCPVLabel('34300000')).toBe('Pièces détachées pour véhicules');
    });

    it('should return generic label for unknown CPV codes', () => {
      expect(getCPVLabel('12345678')).toBe('Secteur 12345678');
    });
  });
});
