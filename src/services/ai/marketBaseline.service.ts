import { Product } from '../../entities/Product';

export interface MarketBaseline {
  productId: number;
  productName: string;
  category: string;
  laboratory?: string;
  expectedMonthlySales: number;
  confidence: number;
  source: 'market' | 'real';
}

const MARKET_BASELINE = {
  antibiotic: { monthly: 15, confidence: 60 },
  antiInflammatory: { monthly: 12, confidence: 60 },
  chronic: { monthly: 8, confidence: 70 },
  dermo: { monthly: 6, confidence: 50 },
  seasonal: { monthly: 5, confidence: 40 },
  default: { monthly: 3, confidence: 30 }
};

export class MarketBaselineService {
  
  getBaseline(product: Product): MarketBaseline {
    let baseline = { ...MARKET_BASELINE.default };

    if (this.isAntibiotic(product)) {
      baseline = MARKET_BASELINE.antibiotic;
    } else if (this.isAntiInflammatory(product)) {
      baseline = MARKET_BASELINE.antiInflammatory;
    } else if (this.isChronic(product)) {
      baseline = MARKET_BASELINE.chronic;
    } else if (this.isDermo(product)) {
      baseline = MARKET_BASELINE.dermo;
    } else if (this.isSeasonal(product)) {
      baseline = MARKET_BASELINE.seasonal;
    }

    return {
      productId: product.id,
      productName: product.name,
      category: product.category || '',
      laboratory: product.laboratory || undefined,
      expectedMonthlySales: baseline.monthly,
      confidence: baseline.confidence,
      source: 'market'
    };
  }

  getBaselines(products: Product[]): MarketBaseline[] {
    return products.map(p => this.getBaseline(p));
  }

  private isAntibiotic(product: Product): boolean {
    const text = `${product.category || ''}`.toLowerCase();
    return text.includes('antibiotique') || 
           text.includes('anti-infectieux') ||
           text.includes('pénicilline');
  }

  private isAntiInflammatory(product: Product): boolean {
    const text = `${product.category || ''}`.toLowerCase();
    return text.includes('anti-inflammatoire') || 
           text.includes('ains') ||
           text.includes('douleur');
  }

  private isChronic(product: Product): boolean {
    const text = `${product.category || ''}`.toLowerCase();
    return text.includes('antihypertenseur') ||
           text.includes('hypolipémiant') ||
           text.includes('antidiabétique');
  }

  private isDermo(product: Product): boolean {
    const text = `${product.category || ''}`.toLowerCase();
    return text.includes('dermocosmétique') ||
           text.includes('dermatologie') ||
           text.includes('solaire') ||
           product.category === 'Dermocosmétique';
  }

  private isSeasonal(product: Product): boolean {
    const text = `${product.category || ''}`.toLowerCase();
    return text.includes('antihistaminique') ||
           text.includes('allergie') ||
           text.includes('grippe') ||
           text.includes('rhume');
  }
}

export const marketBaselineService = new MarketBaselineService();