export interface SeasonalIndex {
  month: number; // 0-11 (Enero=0)
  factor: number; // 1.0 = normal, 1.4 = +40%
}

export interface CategorySeasonality {
  category: string;
  indexes: SeasonalIndex[];
  description: string;
}

// Mapeo de categorías a índices estacionales
export const SEASONAL_MAPPING: CategorySeasonality[] = [
  // ANTIGRIPALES / RESPIRATORIO (Invierno)
  {
    category: 'Antibiotique',
    indexes: [
      { month: 10, factor: 1.3 }, // Noviembre
      { month: 11, factor: 1.5 }, // Diciembre
      { month: 0, factor: 1.6 },  // Enero
      { month: 1, factor: 1.4 },  // Febrero
    ],
    description: 'Pic hivernal des infections respiratoires',
  },
  {
    category: 'Anti-inflammatoire non stéroïdien',
    indexes: [
      { month: 10, factor: 1.2 },
      { month: 11, factor: 1.3 },
      { month: 0, factor: 1.4 },
      { month: 1, factor: 1.3 },
    ],
    description: 'Douleurs et fièvre associées aux grippes',
  },
  {
    category: 'Dermocosmétique',
    indexes: [
      { month: 5, factor: 1.5 },  // Junio
      { month: 6, factor: 1.8 },  // Julio
      { month: 7, factor: 2.0 },  // Agosto
      { month: 8, factor: 1.3 },  // Septiembre
    ],
    description: 'Pics estival pour les solaires et soins',
  },
  {
    category: 'Antihistaminique H1',
    indexes: [
      { month: 3, factor: 1.3 },  // Abril
      { month: 4, factor: 1.4 },  // Mayo
      { month: 5, factor: 1.3 },  // Junio
      { month: 8, factor: 1.2 },  // Septiembre
    ],
    description: 'Allergies saisonnières (printemps/automne)',
  },
  {
    category: 'Antiulcéreux',
    indexes: [
      { month: 6, factor: 1.2 },  // Julio
      { month: 7, factor: 1.3 },  // Agosto
      { month: 11, factor: 1.4 }, // Diciembre
      { month: 0, factor: 1.3 },  // Enero
    ],
    description: 'Troubles digestifs (été + fêtes)',
  },
  {
    category: 'Hypolipémiant',
    indexes: [
      { month: 0, factor: 1.1 },
      { month: 1, factor: 1.1 },
    ],
    description: 'Traitements chroniques stables',
  },
  {
    category: 'Antihypertenseur',
    indexes: [],
    description: 'Traitements chroniques stables',
  },
  {
    category: 'Antidiabétique',
    indexes: [],
    description: 'Traitements chroniques stables',
  },
];

export class SeasonalMappingService {
  
  getSeasonalFactor(category: string, month: number): number {
    const mapping = SEASONAL_MAPPING.find(m => m.category === category);
    if (!mapping) return 1.0;

    const seasonalIndex = mapping.indexes.find(idx => idx.month === month);
    return seasonalIndex?.factor || 1.0;
  }

  getProductSeasonality(product: any): {
    currentMonth: number;
    nextMonth: number;
    nextQuarter: number;
  } {
    const currentMonth = new Date().getMonth();
    const nextMonth = (currentMonth + 1) % 12;
    
    const factorCurrent = this.getSeasonalFactor(
      product.category || '', 
      currentMonth
    );
    
    const factorNext = this.getSeasonalFactor(
      product.category || '', 
      nextMonth
    );

    let nextQuarterFactor = 0;
    for (let i = 1; i <= 3; i++) {
      const month = (currentMonth + i) % 12;
      nextQuarterFactor += this.getSeasonalFactor(
        product.category || '', 
        month
      );
    }
    nextQuarterFactor /= 3;

    return {
      currentMonth: factorCurrent,
      nextMonth: factorNext,
      nextQuarter: nextQuarterFactor,
    };
  }

  getHighRiskCategories(): string[] {
    const highRisk: string[] = [];
    const currentMonth = new Date().getMonth();

    SEASONAL_MAPPING.forEach(mapping => {
      const hasHighFactor = mapping.indexes.some(idx => 
        idx.month === currentMonth && idx.factor > 1.3
      );
      if (hasHighFactor) {
        highRisk.push(mapping.category);
      }
    });

    return highRisk;
  }
}

export const seasonalMappingService = new SeasonalMappingService();
