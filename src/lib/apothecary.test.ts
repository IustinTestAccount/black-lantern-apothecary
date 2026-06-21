import { describe, expect, it } from 'vitest';
import data from '../data/apothecary.json';
import {
  averagePotency,
  averageRisk,
  calculateCartSubtotal,
  calculateCartTotal,
  calculateDiscount,
  calculatePreparationTime,
  filterInventory,
  filterRecommendations,
  getRiskWarning,
  isRestrictedOrForbidden,
  sortProducts,
  topProductCategory,
  validateOrder,
  validateStock
} from './apothecary';
import type { CartItem, Product, Recommendation } from './types';

const products = data.products as Product[];
const recommendations = data.recommendations as Recommendation[];

describe('apothecary cart calculations', () => {
  it('calculates subtotal from cart quantities', () => {
    const cart: CartItem[] = [
      { productId: 'nightshade-elixir', quantity: 1 },
      { productId: 'black-salt-antidote', quantity: 2 }
    ];

    expect(calculateCartSubtotal(products, cart)).toBe(150);
  });

  it('applies service fee, discount, and forbidden surcharge when calculating total', () => {
    const cart: CartItem[] = [
      { productId: 'wraithroot-oil', quantity: 1 },
      { productId: 'saintless-blood-tonic', quantity: 2 }
    ];

    expect(calculateCartSubtotal(products, cart)).toBe(290);
    expect(calculateDiscount(290, 0)).toBe(29);
    expect(calculateCartTotal(products, cart, 0)).toBe(299.3);
  });

  it('calculates preparation time with a complexity buffer', () => {
    const cart: CartItem[] = [
      { productId: 'black-salt-antidote', quantity: 2 },
      { productId: 'wraithroot-oil', quantity: 1 }
    ];

    expect(calculatePreparationTime(products, cart)).toBe(115);
  });
});

describe('order validation', () => {
  it('rejects orders that exceed stock', () => {
    const result = validateStock(products, [{ productId: 'red-wax-sealed-vial', quantity: 2 }]);

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('only 1');
  });

  it('rejects forbidden product quantities above one', () => {
    const result = validateOrder(products, [{ productId: 'wraithroot-oil', quantity: 2 }]);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes('limited to one'))).toBe(true);
  });

  it('identifies restricted or forbidden products', () => {
    const wraithroot = products.find((product) => product.id === 'wraithroot-oil');
    const moonmilk = products.find((product) => product.id === 'moonmilk-draught');

    expect(wraithroot && isRestrictedOrForbidden(wraithroot)).toBe(true);
    expect(moonmilk && isRestrictedOrForbidden(moonmilk)).toBe(false);
  });
});

describe('inventory filtering and sorting', () => {
  it('filters inventory by search, category, effect, rarity, risk, and stock', () => {
    const result = filterInventory(products, {
      search: 'root',
      category: 'Oil',
      effect: 'spirit',
      rarity: 'Forbidden',
      riskLevel: 'Forbidden',
      inStockOnly: true
    });

    expect(result.map((product) => product.id)).toEqual(['wraithroot-oil']);
  });

  it('sorts products by potency descending', () => {
    const [first] = sortProducts(products, 'potency', 'desc');

    expect(first.name).toBe('Red Wax Sealed Vial');
  });

  it('calculates useful catalog aggregates', () => {
    expect(averagePotency(products)).toBeGreaterThan(70);
    expect(averageRisk(products)).toBeGreaterThan(50);
    expect(topProductCategory(products)).toBe('Elixir');
  });
});

describe('recommendations', () => {
  it('filters recommendations by need and effect', () => {
    const result = filterRecommendations(recommendations, products, {
      need: 'venom treatment',
      effect: 'venom'
    });

    expect(result.map((recommendation) => recommendation.id)).toEqual(['rec-venom']);
  });

  it('filters recommendations by maximum risk level', () => {
    const result = filterRecommendations(recommendations, products, {
      maxRiskLevel: 'Unstable'
    });

    expect(result.map((recommendation) => recommendation.id)).toEqual(['rec-venom', 'rec-blood']);
  });

  it('reports the highest risk in the cart', () => {
    const warning = getRiskWarning(products, [
      { productId: 'nightshade-elixir', quantity: 1 },
      { productId: 'wraithroot-oil', quantity: 1 }
    ]);

    expect(warning).toBe('Highest risk: Forbidden');
  });
});
