// Product Discovery Dropins
import SearchResults from '@dropins/storefront-product-discovery/containers/SearchResults.js';
import Facets from '@dropins/storefront-product-discovery/containers/Facets.js';
import SortBy from '@dropins/storefront-product-discovery/containers/SortBy.js';
import Pagination from '@dropins/storefront-product-discovery/containers/Pagination.js';
import { render as provider } from '@dropins/storefront-product-discovery/render.js';
import { Button, Icon, provider as UI } from '@dropins/tools/components.js';
import { search } from '@dropins/storefront-product-discovery/api.js';
// Wishlist Dropin
import { WishlistToggle } from '@dropins/storefront-wishlist/containers/WishlistToggle.js';
import { render as wishlistRender } from '@dropins/storefront-wishlist/render.js';
// Cart Dropin
import * as cartApi from '@dropins/storefront-cart/api.js';
import { tryRenderAemAssetsImage } from '@dropins/tools/lib/aem/assets.js';
// Event Bus
import { events } from '@dropins/tools/event-bus.js';
// AEM
import { readBlockConfig } from '../../scripts/aem.js';
import { fetchPlaceholders, getProductLink } from '../../scripts/commerce.js';

// Initializers
import '../../scripts/initializers/search.js';
import '../../scripts/initializers/wishlist.js';

// let useZoomViewer = false;
// let useProductBadges = false;

export default async function decorate(block) {
  const labels = await fetchPlaceholders();
  const config = readBlockConfig(block);

  const plpPromosJson = '/fragments/plp-promos/query-index.json';
  const plpBannersJson = '/fragments/plp-banners/query-index.json';

  if (window.location.href.includes('search?q=')) block.classList.add('search');

  let promosData;
  let bannersData;

  try {
    const res = await fetch(plpPromosJson);
    const resJson = await res.json();
    promosData = resJson.data;
    promosData.sort((a, b) => Number(a.row) - Number(b.row));
  } catch (e) {
    console.error('Failed to fetch promo JSON:', e);
    return;
  }

  try {
    const res = await fetch(plpBannersJson);
    const resJson = await res.json();
    bannersData = resJson.data;
  } catch (e) {
    console.error('Failed to fetch banner JSON:', e);
    return;
  }

  const fragment = document.createRange().createContextualFragment(`
    <div class="search__wrapper">
      <div class="search__result-info"></div>
      <div class="search__view-facets"></div>
      <div class="search__facets"></div>
      <div class="search__product-sort"></div>
      <div class="search__product-list"></div>
      <div class="search__pagination"></div>
    </div>
  `);

  const $resultInfo = fragment.querySelector('.search__result-info');
  const $viewFacets = fragment.querySelector('.search__view-facets');
  const $facets = fragment.querySelector('.search__facets');
  const $productSort = fragment.querySelector('.search__product-sort');
  const $productList = fragment.querySelector('.search__product-list');
  const $pagination = fragment.querySelector('.search__pagination');

  // useZoomViewer = config.zoom || 'false';
  // useProductBadges = config.badges || 'false';

  //block.innerHTML = '';
  block.appendChild(fragment);

  if (config.urlpath) {
    block.dataset.category = config.urlpath;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const { q, page, sort, filter } = Object.fromEntries(urlParams.entries());

  // Initial search request
  if (config.urlpath) {
    await search({
      phrase: '',
      currentPage: page ? Number(page) : 1,
      pageSize: 8,
      sort: sort ? getSortFromParams(sort) : [{ attribute: 'position', direction: 'DESC' }],
      filter: [
        { attribute: 'categoryPath', eq: config.urlpath },
        { attribute: 'visibility', in: ['Search', 'Catalog, Search'] },
        ...getFilterFromParams(filter),
      ],
    }).catch(() => console.error('Error searching for products'));
  } else {
    await search({
      phrase: q || config.searchterm || '',
      currentPage: page ? Number(page) : 1,
      pageSize: 8,
      sort: getSortFromParams(sort),
      filter: [
        { attribute: 'visibility', in: ['Search', 'Catalog, Search'] },
        ...getFilterFromParams(filter),
      ],
    }).catch(() => console.error('Error searching for products'));
  }

  const getAddToCartButton = (product) => {
    if (product.typename === 'ComplexProductView') {
      const button = document.createElement('div');
      UI.render(Button, {
        children: labels.Global?.AddProductToCart,
        icon: Icon({ source: 'Cart' }),
        href: getProductLink(product.urlKey, product.sku),
        variant: 'primary',
      })(button);
      return button;
    }
    const button = document.createElement('div');
    UI.render(Button, {
      children: labels.Global?.AddProductToCart,
      icon: Icon({ source: 'Cart' }),
      onClick: () => cartApi.addProductsToCart([{ sku: product.sku, quantity: 1 }]),
      variant: 'primary',
    })(button);
    return button;
  };

  // Render all dropins
  await Promise.all([
    provider.render(SortBy, {})($productSort),
    provider.render(Pagination, {
      onPageChange: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
    })($pagination),
    UI.render(Button, {
      children: labels.Global?.Filters,
      icon: Icon({ source: 'Burger' }),
      variant: 'secondary',
      onClick: () => $facets.classList.toggle('search__facets--visible'),
    })($viewFacets),
    provider.render(Facets, {})($facets),
    provider.render(SearchResults, {
      routeProduct: (product) => getProductLink(product.urlKey, product.sku),
      slots: {
        ProductImage: (ctx) => {
          const { product, defaultImageProps } = ctx;
          const anchorWrapper = document.createElement('a');
          anchorWrapper.href = getProductLink(product.urlKey, product.sku);
          tryRenderAemAssetsImage(ctx, {
            alias: product.sku,
            imageProps: defaultImageProps,
            wrapper: anchorWrapper,
            params: {
              width: defaultImageProps.width,
              height: defaultImageProps.height,
            },
          });
        },
        ProductActions: (ctx) => {
          // const actionsWrapper = document.createElement('div');
          // actionsWrapper.className = 'product-discovery-product-actions';

          // const addToCartBtn = getAddToCartButton(ctx.product);
          // addToCartBtn.className = 'product-discovery-product-actions__add-to-cart';

          // const $wishlistToggle = document.createElement('div');
          // $wishlistToggle.classList.add('product-discovery-product-actions__wishlist-toggle');
          // wishlistRender.render(WishlistToggle, {
          //   product: ctx.product,
          //   variant: 'tertiary',
          // })($wishlistToggle);

          // actionsWrapper.appendChild(addToCartBtn);
          // actionsWrapper.appendChild($wishlistToggle);
          // ctx.replaceWith(actionsWrapper);
        }
      },
    })($productList),
  ]);

  // Listen for search results (before render)
  events.on('search/result', (payload) => {
    console.log("payload: ", payload)
    const totalCount = payload.result?.totalCount || 0;
    block.classList.toggle('product-list-page--empty', totalCount === 0);

    $resultInfo.innerHTML = payload.request?.phrase
      ? `${totalCount} results found for <strong>"${payload.request.phrase}"</strong>.`
      : `${totalCount} results found.`;

    if (payload.request.filter.length > 0) {
      $viewFacets.querySelector('button').setAttribute('data-count', payload.request.filter.length);
    } else {
      $viewFacets.querySelector('button').removeAttribute('data-count');
    }

    // Wait until Drop-ins finish rendering the grid
    waitForGrid((grid) => {
      // ⬅ your existing logic
      insertPromo(block, promosData);
    });
  }, { eager: true });

  // Listen for search results (after render) — handles subsequent searches and updates
  events.on('search/result', (payload) => {
    // insert promo card
    insertPromo(block, promosData);

    // Update URL
    const url = new URL(window.location.href);
    if (payload.request?.phrase) url.searchParams.set('q', payload.request.phrase);
    if (payload.request?.currentPage) url.searchParams.set('page', payload.request.currentPage);
    if (payload.request?.sort) url.searchParams.set('sort', getParamsFromSort(payload.request.sort));
    if (payload.request?.filter) url.searchParams.set('filter', getParamsFromFilter(payload.request.filter));
    window.history.pushState({}, '', url.toString());
  }, { eager: false });

  insertBanner(bannersData);
}

function getSortFromParams(sortParam) {
  if (!sortParam) return [];
  return sortParam.split(',').map((item) => {
    const [attribute, direction] = item.split('_');
    return { attribute, direction };
  });
}

function getParamsFromSort(sort) {
  return sort.map((item) => `${item.attribute}_${item.direction}`).join(',');
}

function getFilterFromParams(filterParam) {
  if (!filterParam) return [];

  // Decode the URL-encoded parameter
  const decodedParam = decodeURIComponent(filterParam);
  const results = [];
  const filters = decodedParam.split('|');

  filters.forEach((filter) => {
    if (filter.includes(':')) {
      const [attribute, value] = filter.split(':');

      if (value.includes(',')) {
        // Handle array values (like categories)
        results.push({
          attribute,
          in: value.split(','),
        });
      } else if (value.includes('-')) {
        // Handle range values (like price)
        const [from, to] = value.split('-');
        results.push({
          attribute,
          range: {
            from: Number(from),
            to: Number(to),
          },
        });
      } else {
        // Handle single values (like categories with one value)
        results.push({
          attribute,
          in: [value],
        });
      }
    }
  });

  return results;
}

function getParamsFromFilter(filter) {
  if (!filter || filter.length === 0) return '';

  return filter.map(({ attribute, in: inValues, range }) => {
    if (inValues) {
      return `${attribute}:${inValues.join(',')}`;
    }

    if (range) {
      return `${attribute}:${range.from}-${range.to}`;
    }

    return null;
  }).filter(Boolean).join('|');
}

function insertPromo(block, promosData) {
  const currentURL = window.location.pathname;

  let resultList = block.querySelector('.product-discovery-product-list__grid');
  resultList.querySelectorAll('.dropin-product-item-card.promo-card').forEach((el) => el.remove());

  // if (useProductBadges === 'true') {
  //   fetch('/extras/badges.json').then((badges) => {
  //     badges.json().then((bd) => {
  //       resultList.querySelectorAll('.dropin-product-item-card').forEach((el) => {
  //         if (el.classList.contains('promo-card')) return;
  //         const anchor = el.querySelector('.dropin-product-item-card__title a');
  //         const href = anchor?.href;
  //         const card = bd.data.find((bdge) => href.includes(bdge.url));
  //         if (card) {
  //           const badge = document.createElement('div');
  //           badge.className = 'dropin-product-item-card__badge';
  //           badge.innerHTML = card?.badge;
  //           el.append(badge);
  //         }
  //       });
  //     });
  //   });
  // }

  // if (useZoomViewer === 'true') {
  //   resultList.querySelectorAll('.dropin-product-item-card__image').forEach((el) => {
  //     el.classList.add('zoom');
  //   });
  // }

  if (!resultList) return;

  // Helper to calculate responsive span
  function getResponsiveSpan(span) {
    const width = window.innerWidth;

    if (width >= 1280) {
      // Large Desktop: 4 columns
      return span;
    } else if (width >= 1024) {
      // Desktop: 3 columns
      return Math.min(span, 3);
    } else if (width >= 768) {
      // Tablet: 2 columns
      return Math.min(span, 2);
    } else {
      // Mobile: 1 column
      return 1;
    }
  }

  promosData.forEach((promo) => {
    const grid = block.querySelector('.product-discovery-product-list__grid');
    const items = Array.from(grid.children);

    if (currentURL === promo.category) {
      const fragmentPath = promo.path;
      const row = parseInt(promo.row, 10) || 1;
      const position = parseInt(promo.position, 10) || 1;
      const span = parseInt(promo.span, 10) || 1;

      const baseUrl = window.location.origin;

      // 4. Convert row & position into grid index
      // Grid is 4 columns on desktop
      const columns = 4;

      // Row 1 → indices 0–3
      // Row 2 → indices 4–7
      // Row N → ((row - 1) * 4)
      const rowStartIndex = (row - 1) * columns;

      // Position is 1-based, so subtract 1
      const insertIndex = rowStartIndex + (position - 1);

      // Create and insert the promo card
      const card = document.createElement('div');
      card.className = 'dropin-product-item-card promo-card';

      // Store original span for resize handling
      card.dataset.originalSpan = span;

      // Apply responsive span
      card.style.gridColumn = `span ${getResponsiveSpan(span)}`;

      // Build full fragment URL
      card.innerHTML = `<aem-embed url="${baseUrl}${fragmentPath}"></aem-embed>`;

      // Build full fragment URL
      const fullUrl = `${baseUrl}${fragmentPath}`;
      card.innerHTML = `
        <aem-embed url="${fullUrl}"></aem-embed>
      `;

      // 6. Insert at calculated index
      if (insertIndex >= items.length) {
        // Append if index is beyond product count
        grid.appendChild(card);
      } else {
        // Insert before existing item
        grid.insertBefore(card, items[insertIndex]);
      }
    }
  });

  // Update spans on window resize
  window.addEventListener('resize', () => {
    resultList.querySelectorAll('.promo-card').forEach(card => {
      const originalSpan = parseInt(card.dataset.originalSpan, 10);
      card.style.gridColumn = `span ${getResponsiveSpan(originalSpan)}`;
    });
  });
}

function waitForGrid(callback) {
  const selector = '.product-discovery-product-list__grid';

  const check = setInterval(() => {
    const grid = document.querySelector(selector);
    if (!grid) return;

    // Wait until children are fully rendered
    if (grid.children.length === 0) return;

    clearInterval(check);
    callback(grid);
  }, 100);
}

function insertBanner(data) {
  const plpWrapper = document.querySelector('.product-list-page-wrapper');
  const currentURL = window.location.pathname;

  if (!plpWrapper) {
    console.warn("plpWrapper not found — cannot insert banner.");
    return;
  }

  data.forEach((banner) => {
    if (currentURL === banner.category) {
      const position = parseInt(banner.position, 10) || 1;
      const fragmentPath = banner.path;
      const baseUrl = window.location.origin;

      // Build full fragment URL
      const fullUrl = `${baseUrl}${fragmentPath}`;

      // Build banner element
      const bannerEl = document.createElement('div');
      bannerEl.classList.add('plp-banner');
      bannerEl.innerHTML = `
        <aem-embed url="${fullUrl}"></aem-embed>
      `;

      if (position === 1) {
        // insert BEFORE PLP wrapper
        plpWrapper.parentNode.insertBefore(bannerEl, plpWrapper);
      } else if (position === 2) {
        // insert AFTER PLP wrapper
        plpWrapper.parentNode.insertBefore(bannerEl, plpWrapper.nextSibling);
      }
    }
  });
}
