<script lang="ts">
  import data from './data/apothecary.json';
  import {
    averagePotency,
    averageRisk,
    calculateCartSubtotal,
    calculateCartTotal,
    calculateDiscount,
    calculatePreparationTime,
    filterInventory,
    getProductById,
    getRiskWarning,
    sortProducts,
    validateOrder
  } from './lib/apothecary';
  import type {
    ActivityEntry,
    CartItem,
    InventoryFilters,
    Product,
    ProductCategory,
    Recommendation,
    RiskLevel,
    Rarity,
    SortKey,
    Supplier
  } from './lib/types';

  const products = data.products as Product[];
  const featuredNames = data.featuredProductNames as string[];
  const recommendations = data.recommendations as Recommendation[];
  const activity = data.activity as ActivityEntry[];
  const suppliers = data.suppliers as Supplier[];
  const savedSeed = data.savedItems as string[];

  const categories = ['All', ...new Set(products.map((product) => product.category))] as Array<ProductCategory | 'All'>;
  const effects = ['All', ...new Set(products.flatMap((product) => product.effects))];
  const rarities: Array<Rarity | 'All'> = ['All', 'Common', 'Uncommon', 'Rare', 'Forbidden'];
  const riskLevels: Array<RiskLevel | 'All'> = ['All', 'Safe', 'Unstable', 'Cursed', 'Forbidden'];
  const customerNeeds = [...new Set(recommendations.map((recommendation) => recommendation.need))];

  let cartItems = [...(data.cartItems as CartItem[])];
  let savedIds = new Set(savedSeed);
  let selectedNeed = 'curse cleansing';
  let sortKey: SortKey = 'potency';
  let sortDirection: 'asc' | 'desc' = 'desc';
  let filters: InventoryFilters = {
    search: '',
    category: 'All',
    effect: 'All',
    rarity: 'All',
    riskLevel: 'All',
    inStockOnly: true
  };

  $: featuredProducts = products.filter((product) => featuredNames.includes(product.name));
  $: filteredProducts = sortProducts(filterInventory(products, filters), sortKey, sortDirection);
  $: recommendedPanel = recommendations.find((recommendation) => recommendation.need === selectedNeed) ?? recommendations[0];
  $: recommendedProducts = recommendedPanel.productIds
    .map((productId) => getProductById(products, productId))
    .filter((product): product is Product => Boolean(product));
  $: subtotal = calculateCartSubtotal(products, cartItems);
  $: discount = calculateDiscount(subtotal, savedIds.size);
  $: total = calculateCartTotal(products, cartItems, savedIds.size);
  $: preparationTime = calculatePreparationTime(products, cartItems);
  $: orderValidation = validateOrder(products, cartItems);
  $: averageCatalogPotency = averagePotency(products);
  $: averageCatalogRisk = averageRisk(products);
  $: restrictedCount = products.filter((product) => product.restricted || product.forbidden).length;
  $: cartProductRows = cartItems
    .map((cartItem) => ({ product: getProductById(products, cartItem.productId), quantity: cartItem.quantity }))
    .filter((row): row is { product: Product; quantity: number } => Boolean(row.product));
  $: riskWarning = getRiskWarning(products, cartItems);

  function addToCart(product: Product): void {
    const existingItem = cartItems.find((item) => item.productId === product.id);
    const currentQuantity = existingItem?.quantity ?? 0;

    if (currentQuantity + 1 > product.stock) {
      return;
    }

    if (product.forbidden && currentQuantity >= 1) {
      return;
    }

    if (existingItem) {
      cartItems = cartItems.map((item) =>
        item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
      return;
    }

    cartItems = [...cartItems, { productId: product.id, quantity: 1 }];
  }

  function toggleSaved(productId: string): void {
    const nextSaved = new Set(savedIds);

    if (nextSaved.has(productId)) {
      nextSaved.delete(productId);
    } else {
      nextSaved.add(productId);
    }

    savedIds = nextSaved;
  }

  function updateFilter<K extends keyof InventoryFilters>(key: K, value: InventoryFilters[K]): void {
    filters = {
      ...filters,
      [key]: value
    };
  }

  function handleImageError(event: Event, fallback: string): void {
    const image = event.currentTarget as HTMLImageElement;

    if (!image.src.endsWith(fallback)) {
      image.src = fallback;
    }
  }

  function supplierName(supplierId: string): string {
    return suppliers.find((supplier) => supplier.id === supplierId)?.name ?? 'Unlisted supplier';
  }
</script>

<svelte:head>
  <title>Black Lantern Apothecary</title>
</svelte:head>

<div class="app-shell">
  <header class="topbar" aria-label="Primary navigation">
    <a class="brand" href="#inventory" aria-label="Black Lantern Apothecary home">
      <span class="brand-mark" aria-hidden="true"></span>
      <span>
        <strong>Black Lantern</strong>
        <small>Apothecary</small>
      </span>
    </a>

    <nav>
      <a href="#inventory">Inventory</a>
      <a href="#remedies">Remedies</a>
      <a href="#orders">Orders</a>
      <a href="#ledger">Ledger</a>
    </nav>

    <div class="user-chip" aria-label="Signed in user">
      <span>Iustin Mitu</span>
      <span class="seal" aria-hidden="true"></span>
    </div>
  </header>

  <main>
    <section class="opening-panel" aria-labelledby="opening-title">
      <div class="intro-line">
        <span>Potent remedies for perilous times.</span>
        <span class="ornament" aria-hidden="true"></span>
        <span>Prepared in secrecy. Trusted in shadows.</span>
      </div>

      <div class="shop-stage">
        <aside class="atmosphere" aria-label="Candlelit apothecary room">
          <img
            src="/images/apothecary-room.svg"
            alt="Candlelit gothic apothecary room with shelves, bottles, and a moonlit window"
            onerror={(event) => handleImageError(event, '/images/apothecary-room.svg')}
          />
          <div class="atmosphere-copy">
            <p class="eyebrow">Open after sundown</p>
            <h1 id="opening-title">Ledger for remedies, oils, and forbidden tonics.</h1>
          </div>
        </aside>

        <div class="featured-rail" aria-label="Featured apothecary products">
          {#each featuredProducts as product}
            <article class="featured-card risk-{product.riskLevel.toLowerCase()}" aria-label={product.name}>
              <div class="image-frame">
                <img
                  src={product.image.url}
                  alt={product.image.alt}
                  onerror={(event) => handleImageError(event, product.image.fallback)}
                />
                <span class="badge">{product.riskLevel}</span>
              </div>
              <div class="card-foot">
                <div>
                  <h2>{product.name}</h2>
                  <span>Potency {product.potency}</span>
                </div>
                <strong>${product.price}</strong>
                <button class="round-action" type="button" onclick={() => addToCart(product)} aria-label={`Add ${product.name} to satchel`}>
                  +
                </button>
              </div>
            </article>
          {/each}
        </div>

        <aside class="satchel-card" aria-label="Customer satchel summary">
          <div class="satchel-heading">
            <span class="tiny-icon" aria-hidden="true"></span>
            <h2>Your Satchel</h2>
            <span class="wax-seal" aria-hidden="true"></span>
          </div>

          <div class="cart-lines">
            {#each cartProductRows as row}
              <div>
                <span>{row.quantity} × {row.product.name}</span>
                <strong>${row.product.price * row.quantity}</strong>
              </div>
            {/each}
          </div>

          <div class="satchel-total">
            <span>Total</span>
            <strong>${total.toFixed(2)}</strong>
          </div>

          <button class="primary-button" type="button" disabled={!orderValidation.valid}>Prepare Order</button>

          <div class="risk-note">
            <strong>{riskWarning}</strong>
            <span>Preparation: ~{preparationTime} min</span>
            <span>Discount: ${discount.toFixed(2)}</span>
          </div>
        </aside>
      </div>

      <div class="compact-stats" aria-label="Catalog statistics">
        <div>
          <strong>{products.filter((product) => product.stock > 0).length}</strong>
          <span>available goods</span>
        </div>
        <div>
          <strong>{restrictedCount}</strong>
          <span>restricted items</span>
        </div>
        <div>
          <strong>{averageCatalogPotency}</strong>
          <span>avg potency</span>
        </div>
        <div>
          <strong>{averageCatalogRisk}</strong>
          <span>avg risk</span>
        </div>
        <div>
          <strong>{savedIds.size}</strong>
          <span>saved satchel</span>
        </div>
      </div>
    </section>

    <section class="workbench" id="inventory" aria-labelledby="inventory-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Inventory</p>
          <h2 id="inventory-title">Find the right mixture without opening every drawer.</h2>
        </div>
        <span>{filteredProducts.length} results</span>
      </div>

      <div class="filter-ribbon" aria-label="Inventory filters">
        <label class="search-box">
          <span>Search</span>
          <input
            type="search"
            placeholder="curse, venom, oil..."
            value={filters.search}
            oninput={(event) => updateFilter('search', event.currentTarget.value)}
          />
        </label>

        <label>
          <span>Category</span>
          <select value={filters.category} onchange={(event) => updateFilter('category', event.currentTarget.value as ProductCategory | 'All')}>
            {#each categories as category}
              <option value={category}>{category}</option>
            {/each}
          </select>
        </label>

        <label>
          <span>Effect</span>
          <select value={filters.effect} onchange={(event) => updateFilter('effect', event.currentTarget.value)}>
            {#each effects as effect}
              <option value={effect}>{effect}</option>
            {/each}
          </select>
        </label>

        <label>
          <span>Rarity</span>
          <select value={filters.rarity} onchange={(event) => updateFilter('rarity', event.currentTarget.value as Rarity | 'All')}>
            {#each rarities as rarity}
              <option value={rarity}>{rarity}</option>
            {/each}
          </select>
        </label>

        <label>
          <span>Risk</span>
          <select value={filters.riskLevel} onchange={(event) => updateFilter('riskLevel', event.currentTarget.value as RiskLevel | 'All')}>
            {#each riskLevels as riskLevel}
              <option value={riskLevel}>{riskLevel}</option>
            {/each}
          </select>
        </label>

        <label>
          <span>Sort</span>
          <select value={sortKey} onchange={(event) => (sortKey = event.currentTarget.value as SortKey)}>
            <option value="potency">Potency</option>
            <option value="price">Price</option>
            <option value="risk">Risk</option>
            <option value="rarity">Rarity</option>
            <option value="stock">Stock</option>
          </select>
        </label>

        <button
          class:active={filters.inStockOnly}
          class="stock-toggle"
          type="button"
          onclick={() => updateFilter('inStockOnly', !filters.inStockOnly)}
        >
          In stock only
        </button>

        <button class="stock-toggle" type="button" onclick={() => (sortDirection = sortDirection === 'asc' ? 'desc' : 'asc')}>
          {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
        </button>
      </div>

      <div class="inventory-grid">
        {#each filteredProducts.slice(0, 10) as product}
          <article class="inventory-card">
            <div class="mini-image">
              <img
                src={product.image.url}
                alt={product.image.alt}
                loading="lazy"
                onerror={(event) => handleImageError(event, product.image.fallback)}
              />
            </div>
            <div class="inventory-copy">
              <div class="inventory-title-row">
                <h3>{product.name}</h3>
                <span>{product.rarity}</span>
              </div>
              <p>{product.description}</p>
              <div class="metrics">
                <span>Risk {product.riskScore}</span>
                <span>Potency {product.potency}</span>
                <span>Stock {product.stock}</span>
              </div>
              <div class="actions-row">
                <button type="button" onclick={() => addToCart(product)}>Add to satchel</button>
                <button type="button" class:active={savedIds.has(product.id)} onclick={() => toggleSaved(product.id)}>
                  {savedIds.has(product.id) ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>
          </article>
        {/each}
      </div>
    </section>

    <section class="remedy-section" id="remedies" aria-labelledby="remedy-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Recommended remedies</p>
          <h2 id="remedy-title">Choose by affliction, then compare risk and preparation time.</h2>
        </div>
      </div>

      <div class="need-tabs" role="list" aria-label="Customer needs">
        {#each customerNeeds as need}
          <button type="button" class:active={selectedNeed === need} onclick={() => (selectedNeed = need)}>{need}</button>
        {/each}
      </div>

      <div class="recommendation-layout">
        <article class="recommendation-card">
          <p class="eyebrow">Apothecary suggestion</p>
          <h3>{recommendedPanel.title}</h3>
          <p>{recommendedPanel.category}. Effects: {recommendedPanel.effects.join(', ')}.</p>
          <div class="recommendation-items">
            {#each recommendedProducts as product}
              <div>
                <img
                  src={product.image.url}
                  alt={product.image.alt}
                  loading="lazy"
                  onerror={(event) => handleImageError(event, product.image.fallback)}
                />
                <span>{product.name}</span>
                <strong>${product.price}</strong>
              </div>
            {/each}
          </div>
        </article>

        <article class="ledger-card" id="ledger">
          <p class="eyebrow">Apothecary ledger</p>
          <h3>Recent activity</h3>
          <div class="activity-list">
            {#each activity as entry}
              <div class="activity-row severity-{entry.severity}">
                <span>{entry.type}</span>
                <strong>{entry.item}</strong>
                <small>{entry.time}</small>
              </div>
            {/each}
          </div>
        </article>
      </div>
    </section>

    <section class="orders-section" id="orders" aria-labelledby="orders-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Orders and suppliers</p>
          <h2 id="orders-title">The shop stays practical beneath the smoke.</h2>
        </div>
      </div>

      <div class="lower-grid">
        <article class="order-card">
          <h3>Current order check</h3>
          <p>Subtotal ${subtotal.toFixed(2)}. The order is {orderValidation.valid ? 'valid' : 'blocked'}.</p>
          {#if !orderValidation.valid}
            <ul>
              {#each orderValidation.errors as error}
                <li>{error}</li>
              {/each}
            </ul>
          {/if}
        </article>

        <article class="supplier-card">
          <h3>Supplier notes</h3>
          <div class="supplier-list">
            {#each suppliers.slice(0, 4) as supplier}
              <div>
                <strong>{supplier.name}</strong>
                <span>{supplier.region}</span>
                <small>{supplier.reliability}% reliability</small>
              </div>
            {/each}
          </div>
        </article>

        <article class="satchel-list-card">
          <h3>Saved satchel</h3>
          {#each [...savedIds].slice(0, 5) as productId}
            {@const product = getProductById(products, productId)}
            {#if product}
              <div class="saved-line">
                <span>{product.name}</span>
                <small>{supplierName(product.supplierId)}</small>
              </div>
            {/if}
          {/each}
        </article>
      </div>
    </section>
  </main>
</div>
