import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, '..', 'src', 'data', 'apothecary.json');
const data = JSON.parse(readFileSync(dataPath, 'utf8'));

const requiredFeatured = new Set([
  'Nightshade Elixir',
  'Black Salt Antidote',
  'Wraithroot Oil',
  'Saintless Blood Tonic'
]);

const requiredCategories = new Set([
  'Potion',
  'Ingredient',
  'Remedy',
  'Cursed Item',
  'Oil',
  'Antidote'
]);

const requiredProductFields = [
  'id',
  'name',
  'category',
  'description',
  'price',
  'rarity',
  'riskLevel',
  'stock',
  'image'
];

const requiredImageFields = ['url', 'fallback', 'alt', 'credit', 'sourceUrl', 'license'];
const errors = [];

function fail(message) {
  errors.push(message);
}

if (!Array.isArray(data.products) || data.products.length < 12) {
  fail('The catalog must contain at least 12 products.');
}

if (!Array.isArray(data.cartItems) || data.cartItems.length === 0) {
  fail('At least one cart item is required.');
}

if (!Array.isArray(data.recommendations) || data.recommendations.length === 0) {
  fail('At least one recommendation is required.');
}

if (!Array.isArray(data.activity) || data.activity.length === 0) {
  fail('At least one apothecary activity entry is required.');
}

if (!Array.isArray(data.suppliers) || data.suppliers.length === 0) {
  fail('At least one supplier is required.');
}

if (!Array.isArray(data.imageCredits) || data.imageCredits.length === 0) {
  fail('Image credits are required.');
}

const products = Array.isArray(data.products) ? data.products : [];
const productIds = new Set();
const productNames = new Set();
const categories = new Set();
const supplierIds = new Set((data.suppliers ?? []).map((supplier) => supplier.id));

for (const product of products) {
  for (const field of requiredProductFields) {
    if (!(field in product)) {
      fail(`Product ${product.id ?? product.name ?? '<unknown>'} is missing required field: ${field}.`);
    }
  }

  if (productIds.has(product.id)) {
    fail(`Duplicate product id: ${product.id}.`);
  }

  productIds.add(product.id);
  productNames.add(product.name);
  categories.add(product.category);

  if (typeof product.id !== 'string' || !product.id.trim()) fail(`Invalid product id for ${product.name}.`);
  if (typeof product.name !== 'string' || !product.name.trim()) fail(`Invalid product name for ${product.id}.`);
  if (typeof product.category !== 'string' || !product.category.trim()) fail(`Invalid category for ${product.name}.`);
  if (typeof product.description !== 'string' || product.description.length < 24) fail(`Description too short for ${product.name}.`);
  if (typeof product.price !== 'number' || product.price <= 0) fail(`Invalid price for ${product.name}.`);
  if (typeof product.stock !== 'number' || product.stock < 0 || !Number.isInteger(product.stock)) fail(`Invalid stock for ${product.name}.`);
  if (typeof product.potency !== 'number' || product.potency < 0 || product.potency > 100) fail(`Invalid potency for ${product.name}.`);
  if (typeof product.riskScore !== 'number' || product.riskScore < 0 || product.riskScore > 100) fail(`Invalid risk score for ${product.name}.`);
  if (typeof product.preparationMinutes !== 'number' || product.preparationMinutes <= 0) fail(`Invalid preparation time for ${product.name}.`);
  if (!Array.isArray(product.effects) || product.effects.length === 0) fail(`Product ${product.name} must define at least one effect.`);
  if (!Array.isArray(product.needs) || product.needs.length === 0) fail(`Product ${product.name} must define at least one customer need.`);
  if (!supplierIds.has(product.supplierId)) fail(`Product ${product.name} points to unknown supplier: ${product.supplierId}.`);

  if (product.forbidden && (!product.warningMessage || !product.warningMessage.trim())) {
    fail(`Forbidden product ${product.name} must define a warning message.`);
  }

  for (const field of requiredImageFields) {
    if (!product.image || typeof product.image[field] !== 'string' || !product.image[field].trim()) {
      fail(`Product ${product.name} is missing image metadata field: ${field}.`);
    }
  }
}

for (const name of requiredFeatured) {
  if (!productNames.has(name)) {
    fail(`Required featured homepage product is missing: ${name}.`);
  }
}

for (const category of requiredCategories) {
  if (!categories.has(category)) {
    fail(`Required category is missing from catalog: ${category}.`);
  }
}

for (const cartItem of data.cartItems ?? []) {
  if (!productIds.has(cartItem.productId)) {
    fail(`Cart item points to unknown product: ${cartItem.productId}.`);
  }

  if (!Number.isInteger(cartItem.quantity) || cartItem.quantity <= 0) {
    fail(`Cart item for ${cartItem.productId} has invalid quantity.`);
  }
}

for (const savedItem of data.savedItems ?? []) {
  if (!productIds.has(savedItem)) {
    fail(`Saved item points to unknown product: ${savedItem}.`);
  }
}

for (const order of data.orders ?? []) {
  if (!Array.isArray(order.items) || order.items.length === 0) {
    fail(`Order ${order.id} must contain at least one item.`);
  }

  for (const productId of order.items ?? []) {
    if (!productIds.has(productId)) {
      fail(`Order ${order.id} points to unknown product: ${productId}.`);
    }
  }
}

for (const recommendation of data.recommendations ?? []) {
  if (!Array.isArray(recommendation.effects) || recommendation.effects.length === 0) {
    fail(`Recommendation ${recommendation.id} must point to at least one effect.`);
  }

  if (typeof recommendation.need !== 'string' || !recommendation.need.trim()) {
    fail(`Recommendation ${recommendation.id} must point to a valid customer need.`);
  }

  if (!Array.isArray(recommendation.productIds) || recommendation.productIds.length === 0) {
    fail(`Recommendation ${recommendation.id} must point to at least one product.`);
  }

  for (const productId of recommendation.productIds ?? []) {
    if (!productIds.has(productId)) {
      fail(`Recommendation ${recommendation.id} points to unknown product: ${productId}.`);
    }
  }
}

for (const credit of data.imageCredits ?? []) {
  for (const field of ['title', 'sourceUrl', 'credit', 'license']) {
    if (typeof credit[field] !== 'string' || !credit[field].trim()) {
      fail(`Image credit entry is missing field: ${field}.`);
    }
  }
}

if (errors.length > 0) {
  console.error('Apothecary data validation failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Validated ${products.length} products, ${data.recommendations.length} recommendations, and ${data.imageCredits.length} image credit entries.`);
