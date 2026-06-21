export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Forbidden';
export type RiskLevel = 'Safe' | 'Unstable' | 'Cursed' | 'Forbidden';

export type ProductCategory =
  | 'Potion'
  | 'Elixir'
  | 'Antidote'
  | 'Oil'
  | 'Tonic'
  | 'Ritual Powder'
  | 'Ingredient'
  | 'Cursed Item'
  | 'Remedy'
  | 'Tincture'
  | 'Salve'
  | 'Incense';

export type ImageMetadata = {
  url: string;
  fallback: string;
  alt: string;
  credit: string;
  sourceUrl: string;
  license: string;
};

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  price: number;
  rarity: Rarity;
  riskLevel: RiskLevel;
  riskScore: number;
  stock: number;
  potency: number;
  effects: string[];
  needs: string[];
  supplierId: string;
  restricted: boolean;
  forbidden: boolean;
  warningMessage: string;
  preparationMinutes: number;
  image: ImageMetadata;
};

export type CartItem = {
  productId: string;
  quantity: number;
};

export type Recommendation = {
  id: string;
  title: string;
  need: string;
  effects: string[];
  riskLevelMax: RiskLevel;
  category: string;
  productIds: string[];
};

export type ActivityEntry = {
  id: string;
  type: string;
  item: string;
  severity: 'safe' | 'notice' | 'danger';
  time: string;
};

export type Supplier = {
  id: string;
  name: string;
  reliability: number;
  region: string;
};

export type InventoryFilters = {
  search?: string;
  category?: ProductCategory | 'All';
  effect?: string | 'All';
  rarity?: Rarity | 'All';
  riskLevel?: RiskLevel | 'All';
  inStockOnly?: boolean;
  maxPrice?: number;
};

export type SortKey = 'price' | 'potency' | 'risk' | 'rarity' | 'stock';

export type OrderValidation = {
  valid: boolean;
  errors: string[];
};
