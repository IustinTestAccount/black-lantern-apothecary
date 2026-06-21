import type {
  CartItem,
  InventoryFilters,
  OrderValidation,
  Product,
  ProductCategory,
  Recommendation,
  RiskLevel,
  Rarity,
  SortKey
} from './types';

const riskRank: Record<RiskLevel, number> = {
  Safe: 1,
  Unstable: 2,
  Cursed: 3,
  Forbidden: 4
};

const rarityRank: Record<Rarity, number> = {
  Common: 1,
  Uncommon: 2,
  Rare: 3,
  Forbidden: 4
};

export const SERVICE_FEE_RATE = 0.07;
export const FORBIDDEN_ORDER_SURCHARGE = 18;

export function getProductById(products: Product[], productId: string): Product | undefined {
  return products.find((product) => product.id === productId);
}

export function calculateCartSubtotal(products: Product[], cartItems: CartItem[]): number {
  return cartItems.reduce((total, cartItem) => {
    const product = getProductById(products, cartItem.productId);
    return total + (product ? product.price * cartItem.quantity : 0);
  }, 0);
}

export function calculateServiceFee(subtotal: number): number {
  return roundMoney(subtotal * SERVICE_FEE_RATE);
}

export function calculateDiscount(subtotal: number, savedItemCount = 0): number {
  if (subtotal >= 250) {
    return roundMoney(subtotal * 0.1);
  }

  if (savedItemCount >= 4) {
    return roundMoney(subtotal * 0.05);
  }

  return 0;
}

export function calculateRiskSurcharge(products: Product[], cartItems: CartItem[]): number {
  const includesForbidden = cartItems.some((item) => {
    const product = getProductById(products, item.productId);
    return Boolean(product?.forbidden);
  });

  return includesForbidden ? FORBIDDEN_ORDER_SURCHARGE : 0;
}

export function calculateCartTotal(products: Product[], cartItems: CartItem[], savedItemCount = 0): number {
  const subtotal = calculateCartSubtotal(products, cartItems);
  const fee = calculateServiceFee(subtotal);
  const discount = calculateDiscount(subtotal, savedItemCount);
  const riskSurcharge = calculateRiskSurcharge(products, cartItems);

  return roundMoney(subtotal + fee + riskSurcharge - discount);
}

export function validateStock(products: Product[], cartItems: CartItem[]): OrderValidation {
  const errors = cartItems.flatMap((cartItem) => {
    const product = getProductById(products, cartItem.productId);

    if (!product) {
      return [`Unknown product: ${cartItem.productId}`];
    }

    if (!Number.isInteger(cartItem.quantity) || cartItem.quantity <= 0) {
      return [`Invalid quantity for ${product.name}.`];
    }

    if (cartItem.quantity > product.stock) {
      return [`${product.name} has only ${product.stock} item(s) in stock.`];
    }

    return [];
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateOrder(products: Product[], cartItems: CartItem[]): OrderValidation {
  const stockValidation = validateStock(products, cartItems);
  const forbiddenErrors = cartItems.flatMap((cartItem) => {
    const product = getProductById(products, cartItem.productId);

    if (!product?.forbidden) {
      return [];
    }

    if (!product.warningMessage.trim()) {
      return [`${product.name} is forbidden but has no warning message.`];
    }

    if (cartItem.quantity > 1) {
      return [`${product.name} is forbidden and limited to one item per order.`];
    }

    return [];
  });

  const errors = [...stockValidation.errors, ...forbiddenErrors];

  return {
    valid: errors.length === 0,
    errors
  };
}

export function filterInventory(products: Product[], filters: InventoryFilters): Product[] {
  const search = filters.search?.trim().toLowerCase() ?? '';

  return products.filter((product) => {
    const searchMatches =
      !search ||
      product.name.toLowerCase().includes(search) ||
      product.description.toLowerCase().includes(search) ||
      product.effects.some((effect) => effect.toLowerCase().includes(search));

    const categoryMatches = !filters.category || filters.category === 'All' || product.category === filters.category;
    const effectMatches = !filters.effect || filters.effect === 'All' || product.effects.includes(filters.effect);
    const rarityMatches = !filters.rarity || filters.rarity === 'All' || product.rarity === filters.rarity;
    const riskMatches = !filters.riskLevel || filters.riskLevel === 'All' || product.riskLevel === filters.riskLevel;
    const stockMatches = !filters.inStockOnly || product.stock > 0;
    const priceMatches = filters.maxPrice === undefined || product.price <= filters.maxPrice;

    return searchMatches && categoryMatches && effectMatches && rarityMatches && riskMatches && stockMatches && priceMatches;
  });
}

export function sortProducts(products: Product[], sortKey: SortKey, direction: 'asc' | 'desc' = 'desc'): Product[] {
  const sorted = [...products].sort((a, b) => {
    const comparison = sortValue(a, sortKey) - sortValue(b, sortKey);
    return direction === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

export function averagePotency(products: Product[]): number {
  return average(products.map((product) => product.potency));
}

export function averageRisk(products: Product[]): number {
  return average(products.map((product) => product.riskScore));
}

export function topProductCategory(products: Product[]): ProductCategory | undefined {
  const counts = products.reduce<Map<ProductCategory, number>>((acc, product) => {
    acc.set(product.category, (acc.get(product.category) ?? 0) + 1);
    return acc;
  }, new Map());

  let topCategory: ProductCategory | undefined;
  let topCount = 0;

  counts.forEach((count, category) => {
    if (count > topCount) {
      topCategory = category;
      topCount = count;
    }
  });

  return topCategory;
}

export function isRestrictedOrForbidden(product: Product): boolean {
  return product.restricted || product.forbidden || product.riskLevel === 'Forbidden';
}

export function calculatePreparationTime(products: Product[], cartItems: CartItem[]): number {
  const baseMinutes = cartItems.reduce((total, cartItem) => {
    const product = getProductById(products, cartItem.productId);
    return total + (product ? product.preparationMinutes * cartItem.quantity : 0);
  }, 0);

  const complexityBuffer = Math.ceil(cartItems.length * 4.5);
  return baseMinutes + complexityBuffer;
}

export function filterRecommendations(
  recommendations: Recommendation[],
  products: Product[],
  options: { need?: string; effect?: string; maxRiskLevel?: RiskLevel; category?: ProductCategory | 'All' }
): Recommendation[] {
  return recommendations.filter((recommendation) => {
    const recommendationProducts = recommendation.productIds
      .map((productId) => getProductById(products, productId))
      .filter((product): product is Product => Boolean(product));

    const needMatches = !options.need || recommendation.need === options.need;
    const effectMatches = !options.effect || recommendation.effects.includes(options.effect);
    const riskMatches =
      !options.maxRiskLevel ||
      recommendationProducts.every((product) => riskRank[product.riskLevel] <= riskRank[options.maxRiskLevel as RiskLevel]);
    const categoryMatches =
      !options.category ||
      options.category === 'All' ||
      recommendationProducts.some((product) => product.category === options.category);

    return needMatches && effectMatches && riskMatches && categoryMatches;
  });
}

export function getRiskWarning(products: Product[], cartItems: CartItem[]): string {
  const selectedProducts = cartItems
    .map((item) => getProductById(products, item.productId))
    .filter((product): product is Product => Boolean(product));

  if (selectedProducts.some((product) => product.forbidden)) {
    return 'Highest risk: Forbidden';
  }

  if (selectedProducts.some((product) => product.riskLevel === 'Cursed')) {
    return 'Highest risk: Cursed';
  }

  if (selectedProducts.some((product) => product.riskLevel === 'Unstable')) {
    return 'Highest risk: Unstable';
  }

  return 'Risk cleared for satchel';
}

function sortValue(product: Product, sortKey: SortKey): number {
  switch (sortKey) {
    case 'price':
      return product.price;
    case 'potency':
      return product.potency;
    case 'risk':
      return product.riskScore;
    case 'rarity':
      return rarityRank[product.rarity];
    case 'stock':
      return product.stock;
    default:
      return product.potency;
  }
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
