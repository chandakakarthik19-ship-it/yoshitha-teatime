import './style.css'

const fallbackDashboard = {
  overview: { income: 18420, expenses: 6480, profit: 11940 },
  khata: [],
  recent: [
    { type: 'income', label: 'Counter sales', note: 'Today, 09:42 AM', amount: 3280 },
    { type: 'expense', label: 'Milk & dairy delivery', note: 'Today, 08:15 AM', amount: -1240 },
    { type: 'income', label: 'Counter sales', note: 'Yesterday, 06:38 PM', amount: 4120 },
    { type: 'expense', label: 'Bakery supplies', note: 'Yesterday, 04:10 PM', amount: -860 },
  ],
}

const currency = (value) => `₹${Math.abs(value).toLocaleString('en-IN')}`
const signedCurrency = (value) => `${value < 0 ? '-' : ''}${currency(value)}`
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const fallbackUsers = [{ name: 'Ravi Kumar', mobile: '9876543210' }, { name: 'Meera Shah', mobile: '9876543211' }, { name: 'Arjun Rao', mobile: '9876543212' }]
let menuItems = [
  { category: 'Tea', name: 'Dum tea', price: 10 }, { category: 'Tea', name: 'Black tea', price: 15 }, { category: 'Tea', name: 'Badam tea', price: 20 }, { category: 'Tea', name: 'Green tea', price: 20 }, { category: 'Tea', name: 'Masala tea', price: 20 }, { category: 'Tea', name: 'Lemon tea', price: 20 }, { category: 'Tea', name: 'Ginger tea', price: 20 }, { category: 'Tea', name: 'Ginger+lemon tea', price: 20 }, { category: 'Tea', name: 'Bellam tea', price: 20 }, { category: 'Tea', name: 'Ginger+bellam tea', price: 20 }, { category: 'Tea', name: 'Pepper tea', price: 20 }, { category: 'Tea', name: 'Elaichi tea', price: 20 }, { category: 'Tea', name: 'Sugar less tea', price: 15 }, { category: 'Tea', name: 'Immunity tea', price: 20 },
  { category: 'Coffee', name: 'Black coffee', price: 15 }, { category: 'Coffee', name: 'Coffee', price: 20 }, { category: 'Coffee', name: 'Bellam coffee', price: 20 }, { category: 'Coffee', name: 'Cold coffee', price: 50 },
  { category: 'Milk', name: 'Milk', price: 15 }, { category: 'Milk', name: 'Pepper milk', price: 20 }, { category: 'Milk', name: 'Horlicks', price: 20 }, { category: 'Milk', name: 'Boost', price: 20 }, { category: 'Milk', name: 'Bournvita', price: 20 }, { category: 'Milk', name: 'Dry fruits hot', price: 20 }, { category: 'Milk', name: 'Parcel extra', price: 5 },
]
const app = document.querySelector('#app')
const shopName = 'Yoshitha Tea Time'
const adminName = 'MVR'
let dashboard = fallbackDashboard
let currentView = 'Overview'
let currentRole = null
let activeUser = null
let userKhataEntries = []
let adminToken = null

function recalculateProfit() {
  dashboard.overview.profit = dashboard.overview.income - dashboard.overview.expenses
}

function applyBranding() {
  app.innerHTML = app.innerHTML.replaceAll('Corner Cup', shopName).replaceAll('daybreak', shopName).replaceAll('>d</span>', '>Y</span>').replaceAll('Akash S.', adminName).replaceAll('Akash', adminName)
}

function render() {
  if (!currentRole) return renderRoleGate()
  if (currentRole === 'user') return renderUserDashboard()
  if (currentView === 'Menu items') return renderMenuView()
  if (currentView === 'Customers') return renderCustomersView()
  if (currentView === 'Transactions') return renderTransactionsView()
  const { overview, khata, recent } = dashboard
  const dueTotal = khata.reduce((sum, account) => sum + account.amount, 0)
  app.innerHTML = `
    <aside class="sidebar">
      <div class="brand"><span class="brand-mark">d</span><span>daybreak</span></div>
      <div class="workspace-switcher"><span class="shop-dot"></span><span><strong>Yoshitha Tea Time</strong><small>Personal workspace</small></span><span class="chevron">⌄</span></div>
      <nav class="main-nav" aria-label="Main navigation">
        ${['Overview', 'Transactions', 'Khata book', 'Menu items', 'Customers'].map((item, index) => `<button class="nav-item ${currentView === item ? 'active' : ''}" data-view="${item}"><span class="nav-icon">${['◒', '↗', '▤', '✣', '♙'][index]}</span>${item}</button>`).join('')}
      </nav>
      <div class="sidebar-bottom"><button class="nav-item"><span class="nav-icon">⚙</span>Settings</button><div class="profile"><span class="avatar avatar-plum">MV</span><span><strong>MVR</strong><small>Admin</small></span><span class="more">···</span></div></div>
    </aside>
    <main class="main-content">
      <header class="topbar"><div class="mobile-brand"><span class="brand-mark">d</span>daybreak</div><div class="topbar-actions"><button class="role-switcher" data-action="logout">Log out</button><button class="icon-button" aria-label="Notifications">♢<span class="notification-dot"></span></button><div class="date-control">September 08, 2026 <span>⌄</span></div></div></header>
      <div class="page-wrap">
        <div class="page-heading"><div><p class="eyebrow">Tuesday, September 08, 2026</p><h1>Good morning, MVR <span class="wave">✦</span></h1><p class="subheading">Here’s what’s happening at Yoshitha Tea Time today.</p></div><button class="primary-button" data-action="add-expense"><span>＋</span> Add expense</button></div>
        <div class="summary-grid">
          <section class="summary-card accent-card"><div class="card-label"><span class="label-icon">↗</span>Today’s income <button class="tiny-menu">···</button></div><strong>${currency(overview.income)}</strong><div class="trend positive">↗ 12.8% <span>vs yesterday</span></div><div class="mini-bars income-bars"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></section>
          <section class="summary-card"><div class="card-label"><span class="label-icon expense-icon">↘</span>Today’s expenses <button class="tiny-menu">···</button></div><strong>${currency(overview.expenses)}</strong><div class="trend negative">↘ 4.2% <span>vs yesterday</span></div><div class="mini-bars expense-bars"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></section>
          <section class="summary-card profit-card"><div class="card-label"><span class="label-icon profit-icon">✦</span>Net profit <button class="tiny-menu">···</button></div><strong>${signedCurrency(overview.profit)}</strong><div class="trend positive">↗ 18.4% <span>vs yesterday</span></div><div class="profit-line"><span></span></div><small>Profit margin <b>64.8%</b></small></section>
        </div>
        <div class="content-grid">
          <section class="panel activity-panel"><div class="panel-heading"><div><h2>Recent activity</h2><p>Your latest income and expenses</p></div><button class="text-button" data-view="Transactions">View all <span>→</span></button></div><div class="activity-list">${recent.map((entry) => `<div class="activity-row"><span class="activity-icon ${entry.type}">${entry.type === 'income' ? '↗' : '↘'}</span><span class="activity-info"><strong>${entry.label}</strong><small>${entry.note}</small></span><strong class="activity-amount ${entry.type}">${entry.amount > 0 ? '+' : '-'}${currency(entry.amount)}</strong></div>`).join('')}</div><button class="add-row" data-action="add-income"><span>＋</span> Record a transaction</button></section>
          <section class="panel khata-panel"><div class="panel-heading"><div><h2>Khata book</h2><p>${khata.length ? 'Outstanding customer balances' : 'No customer entries yet'}</p></div><button class="text-button" data-view="Khata book">View all <span>→</span></button></div><div class="khata-total"><div><small>Total outstanding</small><strong>${currency(dueTotal)}</strong></div><span class="due-pill">${khata.length} customers</span></div><div class="customer-list">${khata.length ? khata.map((account) => `<div class="customer-row"><span class="avatar avatar-${account.tone}">${account.initials}</span><span class="customer-info"><strong>${account.name}</strong><small>${account.items} items · ${account.status === 'Paid' ? 'Settled' : 'Last purchase today'}</small></span><span class="customer-balance"><strong>${currency(account.amount)}</strong><small class="${account.status === 'Paid' ? 'paid' : ''}">${account.status}</small></span></div>`).join('') : '<p class="empty-state">Choose a customer to add the first item to their khata.</p>'}</div><button class="outline-button" data-action="add-khata">＋ Add to khata</button><button class="clear-button" data-action="clear-khata">Clear all khata entries</button></section>
        </div>
        <section class="bottom-strip"><div class="strip-copy"><span class="strip-icon">✣</span><div><strong>Keep your books light.</strong><p>Every entry keeps your daily picture clearer.</p></div></div><div class="strip-stat"><small>Weekly average</small><strong>₹14,280 <span>↗ 8.6%</span></strong></div><div class="strip-stat"><small>Open balances</small><strong>₹2,500 <span class="warm">3 people</span></strong></div></section>
      </div>
    </main>
    <div class="modal-backdrop" hidden><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button class="close-button" data-action="close-modal">×</button><p class="eyebrow">Corner Cup ledger</p><h2 id="modal-title">Record an expense</h2><p class="modal-copy">Add a new entry to keep today’s numbers current.</p><form id="entry-form"><label>Description<input name="description" required placeholder="e.g. Fresh milk delivery" /></label><label>Amount (₹)<input name="amount" type="number" min="1" required placeholder="0" /></label><label>Type<select name="type"><option value="expense">Expense</option><option value="income">Income</option></select></label><button class="primary-button modal-submit" type="submit">Save entry <span>→</span></button></form></div></div>
    <div class="modal-backdrop" id="khata-modal" hidden><div class="modal" role="dialog" aria-modal="true" aria-labelledby="khata-title"><button class="close-button" data-action="close-khata">×</button><p class="eyebrow">Admin · Khata book</p><h2 id="khata-title">Add customer entry</h2><p class="modal-copy">Choose a registered user and menu item. The built-in rate is applied automatically.</p><form id="khata-form"><label>Customer<select id="khata-user" name="customerName" required></select></label><label>Menu item<select id="khata-item" name="item" required>${menuItems.map((item) => `<option value="${item.name}" data-price="${item.price}">${item.category} · ${item.name} · ₹${item.price}</option>`).join('')}</select></label><label>Amount (₹)<input id="khata-amount" name="amount" type="number" min="1" required readonly /></label><label>Date and time<input name="dateTime" type="datetime-local" required /></label><button class="primary-button modal-submit" type="submit">Add to khata <span>→</span></button></form></div></div>
    <div class="modal-backdrop" id="register-modal" hidden><div class="modal" role="dialog" aria-modal="true" aria-labelledby="register-title"><button class="close-button" data-action="close-register">×</button><p class="eyebrow">New customer account</p><h2 id="register-title">Join Corner Cup</h2><p class="modal-copy">Create a login to view your personal khata balance.</p><form id="register-form"><label>Full name<input name="name" required placeholder="e.g. Ravi Kumar" /></label><label>Mobile number<input name="mobile" required inputmode="tel" placeholder="e.g. 9876543210" /></label><label>Password<input name="password" type="password" minlength="6" required placeholder="At least 6 characters" /></label><button class="primary-button modal-submit" type="submit">Create account <span>→</span></button></form></div></div>
    <div class="modal-backdrop" id="login-modal" hidden><div class="modal" role="dialog" aria-modal="true" aria-labelledby="login-title"><button class="close-button" data-action="close-login">×</button><p class="eyebrow">Customer account</p><h2 id="login-title">Welcome back</h2><p class="modal-copy">Log in to see your personal khata history.</p><form id="login-form"><label>Mobile number<input name="mobile" required inputmode="tel" placeholder="e.g. 9876543210" /></label><label>Password<input name="password" type="password" required placeholder="Your password" /></label><button class="primary-button modal-submit" type="submit">Log in <span>→</span></button></form></div></div>
  `
  bindEvents()
}

async function loadDashboard() {
  render()
}

function openModal(action = 'expense') {
  document.querySelector('.modal-backdrop').hidden = false
  document.querySelector('#modal-title').textContent = action === 'income' ? 'Record income' : action === 'khata' ? 'Add to khata' : 'Record an expense'
  document.querySelector('[name="type"]').value = action === 'income' ? 'income' : 'expense'
  document.querySelector('[name="description"]').placeholder = action === 'khata' ? 'e.g. Ravi Kumar · Masala chai' : action === 'income' ? 'e.g. Counter sales' : 'e.g. Fresh milk delivery'
}

function bindEvents() {
  applyBranding()
  document.querySelector('[data-action="logout"]').addEventListener('click', logout)
  document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => { if (button.dataset.view === 'Khata book') return openKhataModal(); currentView = button.dataset.view; render() }))
  document.querySelectorAll('[data-action="add-expense"], [data-action="add-income"]').forEach((button) => button.addEventListener('click', () => openModal(button.dataset.action.replace('add-', ''))))
  document.querySelector('[data-action="add-khata"]').addEventListener('click', openKhataModal)
  document.querySelector('[data-action="clear-khata"]').addEventListener('click', clearKhata)
  document.querySelector('[data-action="close-modal"]').addEventListener('click', () => { document.querySelector('.modal-backdrop').hidden = true })
  document.querySelector('[data-action="close-khata"]').addEventListener('click', () => { document.querySelector('#khata-modal').hidden = true })
  document.querySelector('#khata-item').addEventListener('change', (event) => { document.querySelector('#khata-amount').value = event.target.selectedOptions[0].dataset.price })
  document.querySelector('#khata-form').addEventListener('submit', handleKhataEntry)
  document.querySelector('#entry-form').addEventListener('submit', async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const entry = { description: formData.get('description'), amount: Number(formData.get('amount')), type: formData.get('type') }
    try { await fetch(`${apiUrl}/api/transactions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify(entry) }) } catch (error) { console.info('API unavailable; saved in this view only.') }
    dashboard.recent.unshift({ type: entry.type, label: entry.description, note: 'Just now', amount: entry.type === 'income' ? entry.amount : -entry.amount })
    dashboard.recent = dashboard.recent.slice(0, 4)
    dashboard.overview[entry.type === 'income' ? 'income' : 'expenses'] += entry.amount
    recalculateProfit()
    document.querySelector('.modal-backdrop').hidden = true
    render()
  })
}

function renderRoleGate() {
  app.innerHTML = `<main class="role-gate"><div class="gate-brand"><span class="brand-mark">d</span><span>daybreak</span></div><div class="gate-card"><p class="eyebrow">Corner Cup ledger</p><h1>Who’s signing in?</h1><p class="gate-copy">Choose your account type to continue.</p><div class="role-options"><button class="role-option" data-action="open-login"><span class="option-icon user-option">♙</span><span><strong>User login</strong><small>View your personal khata</small></span><b>→</b></button><button class="role-option" data-action="open-admin-login"><span class="option-icon admin-option">⌂</span><span><strong>Admin login</strong><small>Manage the complete shop ledger</small></span><b>→</b></button></div><button class="register-link" data-action="open-register">New customer? Register here</button></div><p class="gate-footer">Private workspace · Your records stay with Corner Cup</p><div class="modal-backdrop" id="login-modal" hidden><div class="modal" role="dialog" aria-modal="true" aria-labelledby="login-title"><button class="close-button" data-action="close-login">×</button><p class="eyebrow">Customer account</p><h2 id="login-title">Welcome back</h2><p class="modal-copy">Log in to see your personal khata history.</p><form id="login-form"><label>Mobile number<input name="mobile" required inputmode="tel" placeholder="e.g. 9876543210" /></label><label>Password<input name="password" type="password" required placeholder="Your password" /></label><button class="primary-button modal-submit" type="submit">Log in <span>→</span></button></form></div></div><div class="modal-backdrop" id="admin-login-modal" hidden><div class="modal" role="dialog" aria-modal="true" aria-labelledby="admin-login-title"><button class="close-button" data-action="close-admin-login">×</button><p class="eyebrow">Private workspace</p><h2 id="admin-login-title">Admin login</h2><p class="modal-copy">Use the shop administrator credentials.</p><form id="admin-login-form"><label>Admin email<input name="email" type="email" required placeholder="admin@cornercup.in" /></label><label>Password<input name="password" type="password" required placeholder="Admin password" /></label><button class="primary-button modal-submit" type="submit">Open dashboard <span>→</span></button></form></div></div><div class="modal-backdrop" id="register-modal" hidden><div class="modal" role="dialog" aria-modal="true" aria-labelledby="register-title"><button class="close-button" data-action="close-register">×</button><p class="eyebrow">New customer account</p><h2 id="register-title">Join Corner Cup</h2><p class="modal-copy">Create a login to view your personal khata balance.</p><form id="register-form"><label>Full name<input name="name" required placeholder="e.g. Ravi Kumar" /></label><label>Mobile number<input name="mobile" required inputmode="tel" placeholder="e.g. 9876543210" /></label><label>Password<input name="password" type="password" minlength="6" required placeholder="At least 6 characters" /></label><button class="primary-button modal-submit" type="submit">Create account <span>→</span></button></form></div></div></main>`
  applyBranding()
  document.querySelector('[data-action="open-login"]').addEventListener('click', () => { document.querySelector('#login-modal').hidden = false })
  document.querySelector('[data-action="close-login"]').addEventListener('click', () => { document.querySelector('#login-modal').hidden = true })
  document.querySelector('#login-form').addEventListener('submit', handleLogin)
  document.querySelector('[data-action="open-admin-login"]').addEventListener('click', () => { document.querySelector('#admin-login-modal').hidden = false })
  document.querySelector('[data-action="close-admin-login"]').addEventListener('click', () => { document.querySelector('#admin-login-modal').hidden = true })
  document.querySelector('#admin-login-form').addEventListener('submit', handleAdminLogin)
  document.querySelector('[data-action="open-register"]').addEventListener('click', () => { document.querySelector('#register-modal').hidden = false })
  document.querySelector('[data-action="close-register"]').addEventListener('click', () => { document.querySelector('#register-modal').hidden = true })
  document.querySelector('#register-form').addEventListener('submit', handleRegistration)
}

function openPaymentModal(customerName, balance) {
  const form = document.querySelector('#payment-form')
  form.elements.customerName.value = customerName
  form.elements.amount.max = Math.max(balance, 1)
  form.elements.amount.placeholder = balance ? `Up to ₹${balance}` : '0'
  form.elements.dateTime.value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  document.querySelector('#payment-title').textContent = `Payment · ${customerName}`
  document.querySelector('#payment-modal').hidden = false
}

async function handlePayment(event) {
  event.preventDefault()
  const formData = new FormData(event.currentTarget)
  const payment = { customerName: formData.get('customerName'), amount: Number(formData.get('amount')), dateTime: formData.get('dateTime') }
  try { await fetch(`${apiUrl}/api/payments`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify(payment) }) } catch (error) { console.info('Payment API unavailable; saved in this view only.') }
  document.querySelector('#payment-modal').hidden = true
  renderCustomersView()
}

function logout() {
  currentRole = null
  activeUser = null
  userKhataEntries = []
  adminToken = null
  render()
}

function renderMenuView(searchTerm = '') {
  const normalizedSearch = searchTerm.trim().toLowerCase()
  const matches = menuItems.filter((item) => `${item.name} ${item.category}`.toLowerCase().includes(normalizedSearch))
  app.innerHTML = `<aside class="sidebar"><div class="brand"><span class="brand-mark">d</span><span>daybreak</span></div><div class="workspace-switcher"><span class="shop-dot"></span><span><strong>Corner Cup</strong><small>Personal workspace</small></span><span class="chevron">⌄</span></div><nav class="main-nav" aria-label="Main navigation">${['Overview', 'Transactions', 'Khata book', 'Menu items', 'Customers'].map((item, index) => `<button class="nav-item ${currentView === item ? 'active' : ''}" data-view="${item}"><span class="nav-icon">${['◒', '↗', '▤', '✣', '♙'][index]}</span>${item}</button>`).join('')}</nav><div class="sidebar-bottom"><button class="nav-item" data-action="logout"><span class="nav-icon">↪</span>Log out</button></div></aside><main class="main-content"><header class="topbar"><div class="mobile-brand"><span class="brand-mark">d</span>daybreak</div><div class="topbar-actions"><span class="role-badge">Admin menu</span><div class="date-control">${menuItems.length} items <span>⌄</span></div></div></header><div class="page-wrap menu-wrap"><div class="page-heading"><div><p class="eyebrow">Corner Cup menu</p><h1>Find a menu item <span class="wave">✦</span></h1><p class="subheading">Search by item name or category to use the exact built-in rate in khata.</p></div><div class="menu-heading-actions"><button class="outline-button" data-action="open-new-item">＋ Add new item</button><button class="outline-button" data-view="Overview">← Back to overview</button></div></div><div class="menu-search"><span>⌕</span><input id="menu-search" type="search" value="${searchTerm}" placeholder="Type to search: dum tea, coffee, milk..." autofocus /><kbd>⌘ K</kbd></div><div class="menu-results"><div class="results-heading"><strong>${matches.length} matching item${matches.length === 1 ? '' : 's'}</strong><span>${normalizedSearch ? `Results for “${searchTerm}”` : 'All menu rates'}</span></div><div class="menu-grid">${matches.length ? matches.map((item) => `<article class="menu-item-card" data-action="open-item-khata" data-item="${item.name}"><div><span class="menu-category ${item.category.toLowerCase()}">${item.category}</span><h2>${item.name}</h2></div><strong>₹${item.price}</strong><div class="menu-card-actions"><button class="menu-use" data-action="use-menu-item" data-item="${item.name}">Use in khata →</button>${item._id ? `<button class="menu-delete" data-action="delete-menu-item" data-id="${item._id}" data-name="${item.name}">Delete</button>` : ''}</div></article>`).join('') : '<p class="empty-state menu-empty">No matching menu items. Try tea, coffee, or milk.</p>'}</div></div></div></main><div class="modal-backdrop" id="new-item-modal" hidden><div class="modal" role="dialog" aria-modal="true" aria-labelledby="new-item-title"><button class="close-button" data-action="close-new-item">×</button><p class="eyebrow">Admin · Menu items</p><h2 id="new-item-title">Add new item</h2><p class="modal-copy">Create a custom menu item with its built-in khata rate.</p><form id="new-item-form"><label>Item name<input name="name" required placeholder="e.g. Special tea" /></label><label>Category<select name="category"><option>Tea</option><option>Coffee</option><option>Milk</option><option>Snacks</option><option>Other</option></select></label><label>Price (₹)<input name="price" type="number" min="1" required placeholder="10" /></label><button class="primary-button modal-submit" type="submit">Save menu item <span>→</span></button></form></div></div>`
  const deletableItems = menuItems.filter((item) => item._id)
  const deletePanel = document.createElement('div')
  deletePanel.className = 'menu-delete-panel'
  deletePanel.innerHTML = `<label for="delete-menu-select">Select an item to remove</label><select id="delete-menu-select"><option value="">Select an item</option>${menuItems.map((item) => { const itemId = item._id?.toString?.() || item._id || ''; return `<option value="${itemId}" ${itemId ? '' : 'disabled'}>${item.category} · ${item.name} · ₹${item.price}</option>` }).join('')}</select><button class="outline-button" data-action="delete-selected-menu-item" type="button" ${deletableItems.length ? '' : 'disabled'}>Delete selected</button><span class="menu-delete-status" role="status" aria-live="polite"></span>`
  document.querySelector('.menu-results').before(deletePanel)
  document.querySelector('[data-action="delete-selected-menu-item"]').addEventListener('click', async () => {
    const select = document.querySelector('#delete-menu-select')
    const item = deletableItems.find((entry) => String(entry._id) === select.value)
    if (!item) return
    const button = document.querySelector('[data-action="delete-selected-menu-item"]')
    const status = document.querySelector('.menu-delete-status')
    button.disabled = true
    status.textContent = 'Removing...'
    try {
      const response = await fetch(`${apiUrl}/api/menu/${item._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } })
      if (!response.ok) throw new Error((await response.json()).error || 'Could not remove item')
    } catch (error) {
      button.disabled = false
      status.textContent = error.message
      return
    }
    menuItems = menuItems.filter((entry) => String(entry._id) !== String(item._id))
    renderMenuView(searchTerm)
  })
  applyBranding()
  document.querySelector('[data-action="logout"]').addEventListener('click', logout)
  document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => { currentView = button.dataset.view; render() }))
  document.querySelector('#menu-search').addEventListener('input', (event) => { const value = event.target.value; renderMenuView(value); requestAnimationFrame(() => { const input = document.querySelector('#menu-search'); input.focus(); input.setSelectionRange(value.length, value.length) }) })
  document.querySelector('[data-action="open-new-item"]').addEventListener('click', () => { document.querySelector('#new-item-modal').hidden = false })
  document.querySelector('[data-action="close-new-item"]').addEventListener('click', () => { document.querySelector('#new-item-modal').hidden = true })
  document.querySelector('#new-item-form').addEventListener('submit', handleNewMenuItem)
  document.querySelector('[data-view="Overview"]').addEventListener('click', () => { currentView = 'Overview'; render() })
  document.querySelectorAll('[data-action="use-menu-item"]').forEach((button) => button.addEventListener('click', () => { currentView = 'Overview'; render(); setTimeout(() => openKhataModal(button.dataset.item), 0) }))
  document.querySelectorAll('[data-action="open-item-khata"]').forEach((card) => card.addEventListener('click', (event) => { if (event.target.closest('button')) return; currentView = 'Overview'; render(); setTimeout(() => openKhataModal(card.dataset.item), 0) }))
  document.querySelectorAll('[data-action="delete-menu-item"]').forEach((button) => button.addEventListener('click', async (event) => { event.stopPropagation(); if (!window.confirm(`Delete ${button.dataset.name}?`)) return; await fetch(`${apiUrl}/api/menu/${button.dataset.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } }); menuItems = menuItems.filter((item) => String(item._id) !== button.dataset.id); renderMenuView(document.querySelector('#menu-search').value) }))
}

async function renderCustomersView() {
  let customers = []
  try {
    const response = await fetch(`${apiUrl}/api/customers`, { headers: { Authorization: `Bearer ${adminToken}` } })
    if (response.ok) customers = await response.json()
  } catch (error) { console.info('Customer list unavailable.') }
  app.innerHTML = `<aside class="sidebar"><div class="brand"><span class="brand-mark">d</span><span>daybreak</span></div><div class="workspace-switcher"><span class="shop-dot"></span><span><strong>Corner Cup</strong><small>Personal workspace</small></span><span class="chevron">⌄</span></div><nav class="main-nav" aria-label="Main navigation">${['Overview', 'Transactions', 'Khata book', 'Menu items', 'Customers'].map((item, index) => `<button class="nav-item ${currentView === item ? 'active' : ''}" data-view="${item}"><span class="nav-icon">${['◒', '↗', '▤', '✣', '♙'][index]}</span>${item}</button>`).join('')}</nav><div class="sidebar-bottom"><button class="nav-item" data-action="logout"><span class="nav-icon">↪</span>Log out</button></div></aside><main class="main-content"><header class="topbar"><div class="mobile-brand"><span class="brand-mark">d</span>daybreak</div><div class="topbar-actions"><span class="role-badge">Admin customers</span><div class="date-control">${customers.length} users <span>⌄</span></div></div></header><div class="page-wrap customers-wrap"><div class="page-heading"><div><p class="eyebrow">Corner Cup accounts</p><h1>All customers <span class="wave">✦</span></h1><p class="subheading">See every registered customer and their current khata balance.</p></div><button class="primary-button" data-action="open-register"><span>＋</span> Register user</button></div><section class="panel customer-directory"><div class="directory-head"><div><h2>Customer directory</h2><p>Balances include all recorded menu purchases</p></div><strong>${customers.reduce((total, customer) => total + customer.khataAmount, 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })} total khata</strong></div><div class="directory-table"><div class="directory-row directory-label"><span>Customer</span><span>Mobile</span><span>Khata items</span><span>Amount due</span><span></span></div>${customers.length ? customers.map((customer) => `<div class="directory-row"><span class="directory-customer"><span class="avatar avatar-orange">${customer.initials}</span><strong>${customer.name}</strong></span><span class="directory-muted">${customer.mobile}</span><span class="directory-muted">${customer.khataItems} item${customer.khataItems === 1 ? '' : 's'}</span><strong class="directory-amount">₹${customer.khataAmount.toLocaleString('en-IN')}</strong><span class="directory-actions"><button class="text-button" data-action="customer-khata" data-name="${customer.name}">View khata →</button><button class="pay-button" data-action="open-payment" data-name="${customer.name}" data-balance="${customer.khataAmount}">＋ Pay</button></span></div>`).join('') : '<p class="empty-state">No registered customers yet. Register a user to get started.</p>'}</div></section></div></main><div class="modal-backdrop" id="payment-modal" hidden><div class="modal" role="dialog" aria-modal="true" aria-labelledby="payment-title"><button class="close-button" data-action="close-payment">×</button><p class="eyebrow">Admin · Customer payment</p><h2 id="payment-title">Record payment</h2><p class="modal-copy">Enter the amount received. It will reduce the customer’s remaining khata.</p><form id="payment-form"><input type="hidden" name="customerName" /><label>Amount received (₹)<input name="amount" type="number" min="1" required placeholder="100" /></label><label>Date and time<input name="dateTime" type="datetime-local" required /></label><button class="primary-button modal-submit" type="submit">Save payment <span>→</span></button></form></div></div><div class="modal-backdrop" id="register-modal" hidden><div class="modal" role="dialog" aria-modal="true" aria-labelledby="register-title"><button class="close-button" data-action="close-register">×</button><p class="eyebrow">New customer account</p><h2 id="register-title">Join Corner Cup</h2><p class="modal-copy">Create a login to view a personal khata balance.</p><form id="register-form"><label>Full name<input name="name" required placeholder="e.g. Ravi Kumar" /></label><label>Mobile number<input name="mobile" required inputmode="tel" placeholder="e.g. 9876543210" /></label><label>Password<input name="password" type="password" minlength="6" required placeholder="At least 6 characters" /></label><button class="primary-button modal-submit" type="submit">Create account <span>→</span></button></form></div></div>`
  applyBranding()
  document.querySelector('[data-action="logout"]').addEventListener('click', logout)
  document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => { currentView = button.dataset.view; render() }))
  document.querySelector('[data-action="open-register"]').addEventListener('click', () => { document.querySelector('#register-modal').hidden = false })
  document.querySelector('[data-action="close-register"]').addEventListener('click', () => { document.querySelector('#register-modal').hidden = true })
  document.querySelector('#register-form').addEventListener('submit', handleRegistration)
  document.querySelectorAll('[data-action="open-payment"]').forEach((button) => button.addEventListener('click', () => openPaymentModal(button.dataset.name, Number(button.dataset.balance))))
  document.querySelector('[data-action="close-payment"]').addEventListener('click', () => { document.querySelector('#payment-modal').hidden = true })
  document.querySelector('#payment-form').addEventListener('submit', handlePayment)
}

async function renderTransactionsView(period = 'day') {
  let report = { overview: { income: 0, expenses: 0, profit: 0 }, rows: [] }
  try {
    const response = await fetch(`${apiUrl}/api/transactions?period=${period}`, { headers: { Authorization: `Bearer ${adminToken}` } })
    if (response.ok) report = await response.json()
  } catch (error) { console.info('Transaction report unavailable.') }
  app.innerHTML = `<aside class="sidebar"><div class="brand"><span class="brand-mark">d</span><span>daybreak</span></div><div class="workspace-switcher"><span class="shop-dot"></span><span><strong>Corner Cup</strong><small>Personal workspace</small></span><span class="chevron">⌄</span></div><nav class="main-nav" aria-label="Main navigation">${['Overview', 'Transactions', 'Khata book', 'Menu items', 'Customers'].map((item, index) => `<button class="nav-item ${currentView === item ? 'active' : ''}" data-view="${item}"><span class="nav-icon">${['◒', '↗', '▤', '✣', '♙'][index]}</span>${item}</button>`).join('')}</nav><div class="sidebar-bottom"><button class="nav-item" data-action="logout"><span class="nav-icon">↪</span>Log out</button></div></aside><main class="main-content"><header class="topbar"><div class="mobile-brand"><span class="brand-mark">d</span>daybreak</div><div class="topbar-actions"><span class="role-badge">Admin reports</span><div class="date-control">${report.rows.length} records <span>⌄</span></div></div></header><div class="page-wrap transactions-wrap"><div class="page-heading"><div><p class="eyebrow">Corner Cup ledger</p><h1>Transactions <span class="wave">✦</span></h1><p class="subheading">Income, expenses, khata sales, and payments in one place.</p></div><button class="primary-button" data-action="add-expense"><span>＋</span> Add transaction</button></div><div class="period-tabs" role="tablist">${[['day', 'Today'], ['week', 'This week'], ['month', 'This month']].map(([value, label]) => `<button class="period-tab ${period === value ? 'active' : ''}" data-period="${value}">${label}</button>`).join('')}</div><div class="summary-grid transaction-summary"><section class="summary-card accent-card"><div class="card-label"><span class="label-icon">↗</span>Income</div><strong>${currency(report.overview.income)}</strong><div class="trend positive">${period === 'day' ? 'Today' : period === 'week' ? 'Last 7 days' : 'This month'}</div></section><section class="summary-card"><div class="card-label"><span class="label-icon expense-icon">↘</span>Expenses</div><strong>${currency(report.overview.expenses)}</strong><div class="trend negative">${report.rows.filter((row) => row.type === 'expense').length} expense records</div></section><section class="summary-card profit-card"><div class="card-label"><span class="label-icon profit-icon">✦</span>Net profit</div><strong>${currency(report.overview.profit)}</strong><div class="trend positive">Income − expenses</div></section></div><section class="panel transaction-panel"><div class="panel-heading"><div><h2>All transactions</h2><p>Khata sales and payments are included automatically</p></div><span class="date-control">${period === 'day' ? 'Today' : period === 'week' ? 'Last 7 days' : 'This month'}</span></div><div class="transaction-table"><div class="transaction-row transaction-label"><span>Details</span><span>Type</span><span>Date & time</span><span>Amount</span><span></span></div>${report.rows.length ? report.rows.map((row) => `<div class="transaction-row"><span class="transaction-detail"><span class="transaction-dot ${row.type}">${row.type === 'income' ? '↗' : row.type === 'payment' ? '✓' : '↘'}</span><strong>${row.label}</strong></span><span class="transaction-type ${row.type}">${row.type}</span><span class="transaction-date">${new Date(row.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span><strong class="transaction-amount ${row.type}">${row.type === 'expense' ? '-' : row.type === 'payment' ? '−' : '+'}${currency(row.amount)}</strong><button class="delete-transaction" data-action="delete-transaction" data-source="${row.source}" data-id="${row.id}" aria-label="Delete ${row.label}">×</button></div>`).join('') : '<p class="empty-state">No transactions in this period.</p>'}</div></section></div></main>`
  const profitValue = document.querySelector('.transaction-summary .profit-card strong')
  const profitTrend = document.querySelector('.transaction-summary .profit-card .trend')
  if (profitValue) profitValue.textContent = signedCurrency(report.overview.profit)
  if (profitTrend) profitTrend.classList.toggle('negative', report.overview.profit < 0)
  if (profitTrend) profitTrend.classList.toggle('positive', report.overview.profit >= 0)
  applyBranding()
  document.querySelector('[data-action="logout"]').addEventListener('click', logout)
  document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => { currentView = button.dataset.view; render() }))
  document.querySelectorAll('[data-period]').forEach((button) => button.addEventListener('click', () => renderTransactionsView(button.dataset.period)))
  document.querySelector('[data-action="add-expense"]').addEventListener('click', () => { currentView = 'Overview'; render(); setTimeout(() => openModal('expense'), 0) })
  document.querySelectorAll('[data-action="delete-transaction"]').forEach((button) => button.addEventListener('click', async () => { if (!window.confirm('Delete this transaction?')) return; await fetch(`${apiUrl}/api/transactions/${button.dataset.source}/${button.dataset.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } }); renderTransactionsView(period) }))
}

async function handleNewMenuItem(event) {
  event.preventDefault()
  const formData = new FormData(event.currentTarget)
  const item = { name: formData.get('name').trim(), category: formData.get('category'), price: Number(formData.get('price')) }
  try {
    const response = await fetch(`${apiUrl}/api/menu`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify(item) })
    if (!response.ok) throw new Error('Could not save menu item')
    menuItems.push(await response.json())
  } catch (error) { menuItems.push(item); console.info(error.message) }
  document.querySelector('#new-item-modal').hidden = true
  renderMenuView(item.name)
}

async function clearKhata() {
  try { await fetch(`${apiUrl}/api/khata`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } }) } catch (error) { console.info('API unavailable; cleared this view only.') }
  dashboard.khata = []
  render()
}

async function openKhataModal(selectedItem = menuItems[0].name) {
  const modal = document.querySelector('#khata-modal')
  const userSelect = document.querySelector('#khata-user')
  let users = fallbackUsers
  try {
    const response = await fetch(`${apiUrl}/api/users`, { headers: { Authorization: `Bearer ${adminToken}` } })
    if (response.ok) users = await response.json()
  } catch (error) { console.info('Showing demo users until the API is available.') }
  userSelect.innerHTML = users.map((user) => `<option value="${user.name}">${user.name} · ${user.mobile || 'customer'}</option>`).join('')
  document.querySelector('#khata-item').value = selectedItem
  document.querySelector('#khata-amount').value = menuItems.find((item) => item.name === selectedItem)?.price || menuItems[0].price
  const dateInput = document.querySelector('#khata-form [name="dateTime"]')
  dateInput.value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  modal.hidden = false
}

async function handleKhataEntry(event) {
  event.preventDefault()
  const formData = new FormData(event.currentTarget)
  const customerName = formData.get('customerName')
  const entry = { customerName, item: formData.get('item'), amount: Number(formData.get('amount')), dateTime: formData.get('dateTime') }
  const initials = customerName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  try { await fetch(`${apiUrl}/api/khata`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ ...entry, initials }) }) } catch (error) { console.info('API unavailable; saved in this view only.') }
  const existingAccount = dashboard.khata.find((account) => account.name === customerName)
  if (existingAccount) {
    existingAccount.items += 1
    existingAccount.amount += entry.amount
  } else {
    dashboard.khata.push({ name: customerName, initials, items: 1, amount: entry.amount, status: 'Due', tone: 'orange' })
  }
  const entryDate = new Date(entry.dateTime)
  const now = new Date()
  const isToday = entryDate.toDateString() === now.toDateString()
  if (isToday) {
    dashboard.overview.income += entry.amount
    recalculateProfit()
  }
  document.querySelector('#khata-modal').hidden = true
  render()
}

async function handleRegistration(event) {
  event.preventDefault()
  const formData = new FormData(event.currentTarget)
  const name = formData.get('name')
  const registration = { name, mobile: formData.get('mobile'), password: formData.get('password'), role: 'user' }
  try {
    const response = await fetch(`${apiUrl}/api/users/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(registration) })
    if (!response.ok) throw new Error('Registration failed')
  } catch (error) { console.info('API unavailable; continuing in demo mode.') }
  document.querySelector('#register-modal').hidden = true
  currentRole = null
  render()
}

async function handleLogin(event) {
  event.preventDefault()
  const formData = new FormData(event.currentTarget)
  try {
    const response = await fetch(`${apiUrl}/api/users/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mobile: formData.get('mobile'), password: formData.get('password') }) })
    if (!response.ok) throw new Error('Invalid mobile number or password')
    activeUser = await response.json()
    const khataResponse = await fetch(`${apiUrl}/api/users/${encodeURIComponent(activeUser.mobile)}/khata`, { headers: { Authorization: `Bearer ${activeUser.token}` } })
    userKhataEntries = khataResponse.ok ? (await khataResponse.json()).entries : []
    document.querySelector('#login-modal').hidden = true
    currentRole = 'user'
    renderUserDashboard(activeUser.name)
  } catch (error) {
    document.querySelector('#login-modal').hidden = true
    window.alert(error.message)
  }
}

async function handleAdminLogin(event) {
  event.preventDefault()
  const formData = new FormData(event.currentTarget)
  try {
    const response = await fetch(`${apiUrl}/api/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: formData.get('email'), password: formData.get('password') }) })
    if (!response.ok) throw new Error('Invalid admin email or password')
    adminToken = (await response.json()).token
    dashboard = await (await fetch(`${apiUrl}/api/dashboard`, { headers: { Authorization: `Bearer ${adminToken}` } })).json()
    const menuResponse = await fetch(`${apiUrl}/api/menu`, { headers: { Authorization: `Bearer ${adminToken}` } })
    if (menuResponse.ok) menuItems = await menuResponse.json()
    currentRole = 'admin'
    document.querySelector('#admin-login-modal').hidden = true
    render()
  } catch (error) { document.querySelector('#admin-login-modal').hidden = true; window.alert(error.message) }
}

function renderUserDashboard(customerName = 'Ravi Kumar') {
  app.innerHTML = `
    <main class="user-shell">
      <header class="user-topbar"><div class="brand"><span class="brand-mark">d</span><span>daybreak</span></div><div class="user-actions"><button class="role-switcher" data-action="logout">Log out</button><div class="profile user-profile"><span class="avatar avatar-orange">RK</span><span><strong>${customerName}</strong><small>Customer account</small></span></div></div></header>
      <div class="user-wrap">
        <div class="user-heading"><div><p class="eyebrow">My account · September 08, 2026</p><h1>Welcome back, ${customerName.split(' ')[0]} <span class="wave">✦</span></h1><p class="subheading">Here’s your Corner Cup khata, all in one place.</p></div><button class="outline-button print-button" data-action="print-statement">⇩ Download statement</button></div>
        <section class="user-balance"><div><span class="balance-label">Total amount due</span><strong>₹${userKhataEntries.reduce((total, entry) => total + entry.amount, 0).toLocaleString('en-IN')}</strong><p>${userKhataEntries.length ? `${userKhataEntries.length} purchases recorded` : 'No khata entries yet · Add purchases from the admin view'}</p></div><div class="balance-mark">₹</div></section>
        <section class="user-ledger panel"><div class="panel-heading"><div><h2>Your khata history</h2><p>Purchases and payments recorded by Corner Cup</p></div><span class="date-control">September 2026</span></div><div class="ledger-table"><div class="ledger-head"><span>Date & time</span><span>Item</span><span>Amount</span></div>${userKhataEntries.length ? userKhataEntries.map((entry) => `<div class="ledger-row"><span><strong>${new Date(entry.dateTime || entry.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong><small>${new Date(entry.dateTime || entry.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</small></span><span class="ledger-item ${entry.kind === 'payment' ? 'payment-item' : ''}"><i>${entry.kind === 'payment' ? '✓' : '☕'}</i>${entry.item}</span><strong class="${entry.kind === 'payment' ? 'payment-amount' : ''}">${entry.amount < 0 ? '-' : ''}₹${Math.abs(entry.amount).toLocaleString('en-IN')}</strong></div>`).join('') : '<div class="empty-state">No entries yet. Your purchases will appear here.</div>'}</div><div class="ledger-total"><span>Remaining amount</span><strong>₹${userKhataEntries.reduce((total, entry) => total + entry.amount, 0).toLocaleString('en-IN')}</strong></div></section>
        <section class="user-note"><span class="strip-icon">✣</span><div><strong>Need a correction?</strong><p>Talk to MVR at Yoshitha Tea Time and we’ll check it together.</p></div><button class="text-button">Contact shop →</button></section>
      </div>
    </main>
    <div class="modal-backdrop" id="register-modal" hidden><div class="modal" role="dialog" aria-modal="true" aria-labelledby="register-title"><button class="close-button" data-action="close-register">×</button><p class="eyebrow">New customer account</p><h2 id="register-title">Join Corner Cup</h2><p class="modal-copy">Create a login to view your personal khata balance.</p><form id="register-form"><label>Full name<input name="name" required placeholder="e.g. Ravi Kumar" /></label><label>Mobile number<input name="mobile" required inputmode="tel" placeholder="e.g. 9876543210" /></label><label>Password<input name="password" type="password" minlength="6" required placeholder="At least 6 characters" /></label><button class="primary-button modal-submit" type="submit">Create account <span>→</span></button></form></div></div>
    <div class="modal-backdrop" id="login-modal" hidden><div class="modal" role="dialog" aria-modal="true" aria-labelledby="login-title"><button class="close-button" data-action="close-login">×</button><p class="eyebrow">Customer account</p><h2 id="login-title">Welcome back</h2><p class="modal-copy">Log in to see your personal khata history.</p><form id="login-form"><label>Mobile number<input name="mobile" required inputmode="tel" placeholder="e.g. 9876543210" /></label><label>Password<input name="password" type="password" required placeholder="Your password" /></label><button class="primary-button modal-submit" type="submit">Log in <span>→</span></button></form></div></div>
  `
  applyBranding()
  document.querySelector('[data-action="logout"]').addEventListener('click', logout)
  document.querySelector('[data-action="print-statement"]').addEventListener('click', () => window.print())
}

loadDashboard()
