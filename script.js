const menuButton = document.querySelector('.menu-toggle');
const menuPanel = document.querySelector('.menu-panel');
const header = document.querySelector('.site-header');
const bagButton = document.querySelector('.bag-button');
const bagPanel = document.querySelector('.bag-panel');
const searchButton = document.querySelector('.search-button');
const searchPanel = document.querySelector('.search-panel');
const panelBackdrop = document.querySelector('.panel-backdrop');
const bagCount = document.querySelector('.bag-count');
const bagItems = document.querySelector('.bag-items');
const bagTotal = document.querySelector('.bag-total');
const clearBagButton = document.querySelector('.clear-bag');
const checkoutButton = document.querySelector('.checkout-button');
const searchInput = document.querySelector('.search-input');
const toast = document.querySelector('.toast');
const productCards = [...document.querySelectorAll('.product-card')];
const storageKey = 'hemanka-bag';
let activeOverlay = null;
let overlayTrigger = null;
let bag = loadBag();

function resetOverlays() {
  [menuPanel, searchPanel, bagPanel].forEach(panel => {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    panel.inert = true;
  });
  [menuButton, searchButton, bagButton].forEach(button => button.setAttribute('aria-expanded', 'false'));
  header.classList.remove('menu-open');
  document.body.classList.remove('overlay-open');
  delete document.body.dataset.overlay;
  panelBackdrop.hidden = true;
}

function loadBag() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveBag() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(bag));
  } catch {
    // Commerce remains functional when storage is unavailable.
  }
}

function formatPrice(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
}

function focusableElements(container) {
  return [...container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')];
}

// focusTrap keeps keyboard focus inside the currently open overlay.
function focusTrap(event) {
  if (event.key !== 'Tab' || !activeOverlay) return;
  const focusable = focusableElements(activeOverlay);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function closeOverlay({ restoreFocus = true } = {}) {
  if (!activeOverlay) return;
  const panel = activeOverlay;
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  panel.inert = true;
  document.body.classList.remove('overlay-open');
  delete document.body.dataset.overlay;
  panelBackdrop.hidden = true;

  if (panel === menuPanel) {
    header.classList.remove('menu-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open menu');
  }
  if (panel === bagPanel) bagButton.setAttribute('aria-expanded', 'false');
  if (panel === searchPanel) searchButton.setAttribute('aria-expanded', 'false');

  activeOverlay = null;
  const trigger = overlayTrigger;
  overlayTrigger = null;
  if (restoreFocus && trigger) trigger.focus();
}

function openOverlay(panel, trigger) {
  if (activeOverlay && activeOverlay !== panel) closeOverlay({ restoreFocus: false });
  activeOverlay = panel;
  overlayTrigger = trigger;
  panel.inert = false;
  panel.setAttribute('aria-hidden', 'false');
  panel.classList.add('open');
  document.body.classList.add('overlay-open');
  document.body.dataset.overlay = panel.id;
  panelBackdrop.hidden = false;

  if (panel === menuPanel) {
    header.classList.add('menu-open');
    menuButton.setAttribute('aria-expanded', 'true');
    menuButton.setAttribute('aria-label', 'Close menu');
  }
  if (panel === bagPanel) bagButton.setAttribute('aria-expanded', 'true');
  if (panel === searchPanel) searchButton.setAttribute('aria-expanded', 'true');

  requestAnimationFrame(() => {
    const target = panel === searchPanel ? searchInput : panel.querySelector('a[href], button, input');
    target?.focus();
  });
}

// menu-toggle
menuButton.addEventListener('click', () => {
  if (activeOverlay === menuPanel) closeOverlay();
  else openOverlay(menuPanel, menuButton);
});
menuPanel.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeOverlay({ restoreFocus: false })));

panelBackdrop.addEventListener('click', () => closeOverlay());
document.querySelectorAll('.panel-close').forEach(button => button.addEventListener('click', () => closeOverlay()));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && activeOverlay) closeOverlay();
  focusTrap(event);
});

function announce(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(announce.timer);
  announce.timer = window.setTimeout(() => toast.classList.remove('show'), 2400);
}

function renderBag() {
  const quantity = bag.reduce((sum, item) => sum + item.quantity, 0);
  const total = bag.reduce((sum, item) => sum + item.price * item.quantity, 0);
  bagCount.textContent = quantity;
  bagTotal.textContent = formatPrice(total);
  clearBagButton.disabled = bag.length === 0;
  checkoutButton.disabled = bag.length === 0;

  if (!bag.length) {
    bagItems.innerHTML = '<div class="empty-state"><p>Your bag is waiting.</p><a href="#arrivals">Explore new arrivals</a></div>';
    bagItems.querySelector('a').addEventListener('click', () => closeOverlay({ restoreFocus: false }));
    return;
  }

  bagItems.innerHTML = bag.map(item => `
    <article class="bag-item">
      <img src="${item.image}" alt="" width="88" height="110">
      <div>
        <h3>${item.name}</h3>
        <strong>${formatPrice(item.price * item.quantity)}</strong>
        <div class="bag-quantity" aria-label="Quantity for ${item.name}">
          <button class="bag-quantity-control" type="button" data-action="decrease" data-name="${item.name}" aria-label="Decrease ${item.name} quantity">−</button>
          <output aria-live="polite">${item.quantity}</output>
          <button class="bag-quantity-control" type="button" data-action="increase" data-name="${item.name}" aria-label="Increase ${item.name} quantity">+</button>
        </div>
      </div>
      <button class="remove-from-bag" type="button" data-name="${item.name}" aria-label="Remove ${item.name} from bag">Remove</button>
    </article>
  `).join('');
}

function addProduct(card) {
  const name = card.dataset.name;
  const existing = bag.find(item => item.name === name);
  if (existing) existing.quantity += 1;
  else bag.push({
    name,
    price: Number(card.dataset.price),
    image: card.dataset.image,
    quantity: 1
  });
  saveBag();
  renderBag();
  announce(`${name} added to your bag.`);
}

document.querySelectorAll('.add-to-bag').forEach(button => {
  button.addEventListener('click', () => addProduct(button.closest('.product-card')));
});

bagItems.addEventListener('click', event => {
  const quantityButton = event.target.closest('.bag-quantity-control');
  if (quantityButton) {
    const item = bag.find(entry => entry.name === quantityButton.dataset.name);
    if (!item) return;
    if (quantityButton.dataset.action === 'increase') item.quantity += 1;
    if (quantityButton.dataset.action === 'decrease') item.quantity -= 1;
    if (item.quantity < 1) bag = bag.filter(entry => entry.name !== item.name);
    saveBag();
    renderBag();
    return;
  }

  const button = event.target.closest('.remove-from-bag');
  if (!button) return;
  const item = bag.find(entry => entry.name === button.dataset.name);
  if (!item) return;
  bag = bag.filter(entry => entry.name !== item.name);
  saveBag();
  renderBag();
  announce(`${item.name} removed from your bag.`);
});

clearBagButton.addEventListener('click', () => {
  if (!bag.length) return;
  bag = [];
  saveBag();
  renderBag();
  announce('Your bag has been cleared.');
});

bagButton.addEventListener('click', () => {
  renderBag();
  if (activeOverlay === bagPanel) closeOverlay();
  else openOverlay(bagPanel, bagButton);
});

checkoutButton.addEventListener('click', () => {
  announce('Checkout will be available when the collection launches.');
});

// Dynamic product search
const searchResults = document.querySelector('.search-results');
function renderSearch(query = '') {
  const normalized = query.trim().toLowerCase();
  const matches = productCards.filter(card => `${card.dataset.name} ${card.dataset.description}`.toLowerCase().includes(normalized));
  searchResults.innerHTML = matches.length ? matches.map(card => `
    <button class="search-result" type="button" data-product="${card.dataset.name}">
      <img src="${card.dataset.image}" alt="" width="64" height="80">
      <span><strong>${card.dataset.name}</strong><small>${card.querySelector('.product-info p').textContent}</small></span>
      <b>${formatPrice(Number(card.dataset.price))}</b>
    </button>
  `).join('') : '<p class="no-results">No pieces found. Try “silk” or “sari”.</p>';
}

searchButton.addEventListener('click', () => {
  renderSearch(searchInput.value);
  if (activeOverlay === searchPanel) closeOverlay();
  else openOverlay(searchPanel, searchButton);
});
searchInput.addEventListener('input', () => renderSearch(searchInput.value));
searchResults.addEventListener('click', event => {
  const result = event.target.closest('.search-result');
  if (!result) return;
  const card = productCards.find(item => item.dataset.name === result.dataset.product);
  closeOverlay({ restoreFocus: false });
  card?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
});

// newsletter-form
const newsletter = document.querySelector('.newsletter-form');
newsletter.addEventListener('submit', event => {
  event.preventDefault();
  const email = newsletter.querySelector('input');
  const status = newsletter.querySelector('.form-status');
  status.textContent = `Welcome to the House. A note is on its way to ${email.value}.`;
  email.value = '';
});

// custom-cursor
const cursor = document.querySelector('.custom-cursor');
let cursorIdleTimer;
if (window.matchMedia('(pointer: fine)').matches) {
  const hideCursor = () => {
    cursor.classList.remove('visible', 'active');
  };
  window.addEventListener('pointermove', event => {
    cursor.classList.add('visible');
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
    window.clearTimeout(cursorIdleTimer);
    cursorIdleTimer = window.setTimeout(hideCursor, 700);
  });
  window.addEventListener('scroll', hideCursor, { passive: true });
  document.documentElement.addEventListener('pointerleave', hideCursor);
  document.querySelectorAll('.image-hover, a, button').forEach(element => {
    element.addEventListener('pointerenter', () => cursor.classList.add('active'));
    element.addEventListener('pointerleave', () => cursor.classList.remove('active'));
  });
}

const revealTargets = document.querySelectorAll('.manifesto h2, .product-card, .craft-copy > *, .journal article');
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.animate(
          [{ opacity: 0, transform: 'translateY(35px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: 850, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' }
        );
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealTargets.forEach(target => observer.observe(target));
}

resetOverlays();
renderBag();
