/* ============================================================
   PaidAdsTech — Client-side search, filtering, load more,
   Swiper carousel, tab attention tricks
   ============================================================ */

(function () {
  'use strict';

  // --- Swiper carousel ---
  if (typeof Swiper !== 'undefined' && document.getElementById('favoriteSwiper')) {
    new Swiper('#favoriteSwiper', {
      direction: 'horizontal',
      slidesPerView: 'auto',
      spaceBetween: 12,
      breakpoints: {
        769: {
          slidesPerView: 4,
          spaceBetween: 16
        }
      }
    });
  }

  // --- Config ---
  var itemsPerPage = (typeof ITEMS_PER_PAGE !== 'undefined') ? ITEMS_PER_PAGE : 12;

  // --- DOM refs ---
  var searchInput = document.getElementById('searchInput');
  var grid = document.getElementById('toolGrid');
  var loadMoreWrap = document.getElementById('loadMoreWrap');
  var loadMoreBtn = document.getElementById('loadMoreBtn');
  var noResults = document.getElementById('noResults');
  var filterMenu = document.getElementById('filterMenu');
  var filterOverlay = document.getElementById('filterOverlay');
  var filterToggle = document.getElementById('filterToggle');
  var filterClose = document.getElementById('filterClose');
  var categoryList = document.getElementById('categoryList');

  if (!grid) return;

  var allCards = Array.from(grid.querySelectorAll('.content_item-cms'));
  var visibleCount = 0;
  var totalVisible = 0;

  // State
  var filters = { category: '', search: '' };

  // --- Category filter ---
  var categoryItems = categoryList ? categoryList.querySelectorAll('.content_menu-ltem') : [];
  Array.from(categoryItems).forEach(function (item) {
    item.addEventListener('click', function () {
      var value = item.getAttribute('data-filter-value') || '';
      filters.category = value;

      // Update active state
      Array.from(categoryItems).forEach(function (i) { i.classList.remove('is-active'); });
      item.classList.add('is-active');

      // Close mobile filter
      if (window.innerWidth <= 768 && filterMenu) {
        filterMenu.classList.remove('is-active');
        if (filterOverlay) filterOverlay.classList.remove('is-active');
      }

      applyFilters();
    });
  });

  // --- Mobile filter toggle ---
  if (filterToggle && filterMenu) {
    filterToggle.addEventListener('click', function () {
      filterMenu.classList.add('is-active');
      if (filterOverlay) filterOverlay.classList.add('is-active');
    });
  }
  if (filterClose && filterMenu) {
    filterClose.addEventListener('click', function () {
      filterMenu.classList.remove('is-active');
      if (filterOverlay) filterOverlay.classList.remove('is-active');
    });
  }
  if (filterOverlay) {
    filterOverlay.addEventListener('click', function () {
      if (filterMenu) filterMenu.classList.remove('is-active');
      filterOverlay.classList.remove('is-active');
    });
  }

  // --- Filter collapse toggle (desktop chevron) ---
  var filterCollapse = document.getElementById('filterCollapse');
  if (filterCollapse && categoryList) {
    filterCollapse.addEventListener('click', function () {
      categoryList.classList.toggle('collapsed');
      filterCollapse.classList.toggle('active');
    });
  }

  // --- Search ---
  var searchTimeout;
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(function () {
        filters.search = searchInput.value.trim().toLowerCase();
        applyFilters();
      }, 200);
    });
  }

  // --- Infinite scroll (IntersectionObserver) ---
  var loadMoreObserver = null;
  var sentinel = document.getElementById('loadMoreSentinel');

  if ('IntersectionObserver' in window && sentinel) {
    loadMoreObserver = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && visibleCount < totalVisible) {
        showMore();
      }
    }, { rootMargin: '400px' });
    loadMoreObserver.observe(sentinel);
  }

  // Fallback click handler
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function () { showMore(); });
  }

  // --- Core filter logic ---
  function applyFilters() {
    var matchingCards = [];

    allCards.forEach(function (card) {
      var show = true;

      if (filters.category) {
        if (card.getAttribute('data-category') !== filters.category) show = false;
      }
      if (filters.search) {
        var name = card.getAttribute('data-name') || '';
        var category = card.getAttribute('data-category') || '';
        var haystack = (name + ' ' + category).toLowerCase();
        if (haystack.indexOf(filters.search) === -1) show = false;
      }

      if (show) matchingCards.push(card);
      card.classList.add('hidden');
    });

    totalVisible = matchingCards.length;
    visibleCount = 0;

    matchingCards.forEach(function (card, i) {
      if (i < itemsPerPage) {
        card.classList.remove('hidden');
        visibleCount++;
      }
    });

    grid._matchingCards = matchingCards;
    updateUI();
    updateActiveFilters();
  }

  function updateActiveFilters() {
    var activeFiltersEl = document.getElementById('activeFilters');
    if (!activeFiltersEl) return;
    activeFiltersEl.innerHTML = '';

    if (filters.category) {
      var chip = document.createElement('button');
      chip.className = 'filter-chip';
      chip.innerHTML = filters.category + ' <span class="filter-chip__x">&times;</span>';
      chip.addEventListener('click', function () {
        filters.category = '';
        Array.from(categoryItems).forEach(function (b) { b.classList.remove('is-active'); });
        if (categoryItems[0]) categoryItems[0].classList.add('is-active');
        applyFilters();
      });
      activeFiltersEl.appendChild(chip);
    }

    if (filters.search) {
      var chip = document.createElement('button');
      chip.className = 'filter-chip';
      chip.innerHTML = '"' + filters.search + '" <span class="filter-chip__x">&times;</span>';
      chip.addEventListener('click', function () {
        filters.search = '';
        if (searchInput) searchInput.value = '';
        applyFilters();
      });
      activeFiltersEl.appendChild(chip);
    }
  }

  function showMore() {
    var matchingCards = grid._matchingCards || [];
    var nextBatch = matchingCards.slice(visibleCount, visibleCount + itemsPerPage);
    nextBatch.forEach(function (card) {
      card.classList.remove('hidden');
      visibleCount++;
    });
    updateUI();
  }

  function updateUI() {
    // Results count
    var resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
      var hasFilters = filters.category || filters.search;
      resultsCount.textContent = hasFilters ? totalVisible + ' tool' + (totalVisible !== 1 ? 's' : '') + ' found' : totalVisible + ' tool' + (totalVisible !== 1 ? 's' : '');
    }

    if (loadMoreWrap) {
      if (loadMoreObserver) {
        loadMoreWrap.style.display = 'none';
      } else {
        loadMoreWrap.style.display = visibleCount < totalVisible ? 'block' : 'none';
      }
    }

    if (loadMoreBtn) {
      var remaining = totalVisible - visibleCount;
      loadMoreBtn.textContent = remaining > 0 ? 'Load more tools (' + remaining + ' remaining)' : 'Load more tools';
    }

    if (noResults) {
      noResults.style.display = totalVisible === 0 ? 'block' : 'none';
    }
  }

  // --- Initial state ---
  totalVisible = allCards.length;
  visibleCount = 0;
  grid._matchingCards = allCards;

  allCards.forEach(function (card, i) {
    if (i < itemsPerPage) {
      visibleCount++;
    } else {
      card.classList.add('hidden');
    }
  });

  updateUI();

  // --- Footer year ---
  var footerYear = document.getElementById('footerYear');
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  // --- Back to top button ---
  var backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 800) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    });
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

})();


/* ============================================================
   Favicon change + title flashing when tab is inactive
   ============================================================ */
(function () {
  'use strict';

  var originalTitle = document.title;
  var faviconDefault = (typeof FAVICON_DEFAULT !== 'undefined') ? FAVICON_DEFAULT : '';
  var faviconChanged = (typeof FAVICON_CHANGED !== 'undefined') ? FAVICON_CHANGED : '';
  var flashInterval = null;
  var preventFlashing = false;

  function getFaviconEl() {
    return document.querySelector('link[rel="shortcut icon"]')
      || document.querySelector('link[rel="icon"]');
  }

  function startFlashing() {
    if (preventFlashing) return;
    var isFlashing = false;
    if (!flashInterval) {
      // Swap favicon
      var favicon = getFaviconEl();
      if (favicon && faviconChanged) {
        favicon.href = faviconChanged;
      }

      flashInterval = setInterval(function () {
        document.title = isFlashing ? '(1) New Message!' : originalTitle;
        isFlashing = !isFlashing;
      }, 1000);
    }
  }

  function stopFlashing() {
    if (flashInterval) {
      clearInterval(flashInterval);
      flashInterval = null;
      document.title = originalTitle;
      var favicon = getFaviconEl();
      if (favicon && faviconDefault) {
        favicon.href = faviconDefault;
      }
    }
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden && !preventFlashing) {
      setTimeout(function () {
        if (document.hidden) startFlashing();
      }, 3000);
    } else {
      stopFlashing();
    }
  });

  // Prevent flashing when CTA buttons are clicked
  document.querySelectorAll("[data-stop-flashing='true']").forEach(function (btn) {
    btn.addEventListener('click', function () {
      preventFlashing = true;
      stopFlashing();
    });
  });
})();
