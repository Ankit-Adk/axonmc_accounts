(() => {
  'use strict';
  const KEYS = { users: 'ledgerly_users', income: 'ledgerly_income', expenses: 'ledgerly_expenses', session: 'ledgerly_session', theme: 'ledgerly_theme' };
  const $ = (selector) => document.querySelector(selector);
  const byId = (id) => document.getElementById(id);
  const today = () => new Date().toISOString().slice(0, 10);
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const read = (key, fallback = []) => { try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const session = () => read(KEYS.session, null);
  const isAdmin = () => session()?.role === 'admin';
  const escapeText = (value) => String(value ?? '');
  const setMessage = (text, kind = 'success', target = byId('app-message')) => { target.textContent = text; target.className = `message ${kind}`; target.hidden = false; setTimeout(() => { target.hidden = true; }, 4500); };

  function seedData() {
    let users = read(KEYS.users);
    users = users.filter(user => !['admin@ledgerly.local', 'user@ledgerly.local'].includes(String(user.email).toLowerCase()));
    if (!users.some(user => String(user.email).toLowerCase() === 'adhikariankit45@gmail.com')) {
      users.push({ id: uid(), name: 'Ankit Adhikari', email: 'adhikariankit45@gmail.com', password: '1234567890', role: 'admin' });
    }
    write(KEYS.users, users);
    if (session() && !users.some(user => user.id === session().id)) localStorage.removeItem(KEYS.session);
    if (!localStorage.getItem(KEYS.income)) write(KEYS.income, []);
    if (!localStorage.getItem(KEYS.expenses)) write(KEYS.expenses, []);
  }

  const records = (type) => read(type === 'income' ? KEYS.income : KEYS.expenses);
  const saveRecords = (type, rows) => write(type === 'income' ? KEYS.income : KEYS.expenses, rows);
  const money = (amount) => Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const sortRecords = (rows) => [...rows].sort((a, b) => `${b.date}${b.createdAt || ''}`.localeCompare(`${a.date}${a.createdAt || ''}`));

  function renderSimpleRows(target, rows, emptyText) {
    target.replaceChildren();
    if (!rows.length) { const tr = document.createElement('tr'); const td = document.createElement('td'); td.colSpan = 5; td.className = 'empty'; td.textContent = emptyText; tr.append(td); target.append(tr); return; }
    rows.forEach(row => { const tr = document.createElement('tr'); [row.date, row.party, money(row.amount), row.currency, row.reason].forEach(value => { const td = document.createElement('td'); td.textContent = escapeText(value); tr.append(td); }); target.append(tr); });
  }

  function renderManageRows(target, type) {
    const rows = sortRecords(records(type)); target.replaceChildren();
    if (!rows.length) { const tr = document.createElement('tr'); const td = document.createElement('td'); td.colSpan = 6; td.className = 'empty'; td.textContent = `No ${type} records.`; tr.append(td); target.append(tr); return; }
    rows.forEach(row => {
      const tr = document.createElement('tr'); [row.date, row.party, money(row.amount), row.currency, row.reason].forEach(value => { const td = document.createElement('td'); td.textContent = escapeText(value); tr.append(td); });
      const actions = document.createElement('td'); actions.className = 'actions';
      const edit = document.createElement('button'); edit.className = 'small-button'; edit.textContent = 'Edit'; edit.addEventListener('click', () => openRecordDialog(type, row));
      const remove = document.createElement('button'); remove.className = 'small-button delete'; remove.textContent = 'Delete'; remove.addEventListener('click', () => deleteRecord(type, row.id));
      actions.append(edit, remove); tr.append(actions); target.append(tr);
    });
  }

  function render() {
    const income = records('income'), expenses = records('expenses');
    const incomeTotal = income.reduce((sum, row) => sum + Number(row.amount), 0), expenseTotal = expenses.reduce((sum, row) => sum + Number(row.amount), 0);
    byId('total-income').textContent = money(incomeTotal); byId('total-expenses').textContent = money(expenseTotal); byId('total-balance').textContent = money(incomeTotal - expenseTotal); byId('total-transactions').textContent = income.length + expenses.length;
    const query = byId('search-input').value.trim().toLowerCase(), date = byId('date-input').value;
    const matches = (row) => (!date || row.date === date) && (!query || [row.party, row.currency, row.reason].some(value => String(value).toLowerCase().includes(query)));
    const shownIncome = sortRecords(income.filter(matches)), shownExpenses = sortRecords(expenses.filter(matches));
    renderSimpleRows(byId('income-table'), shownIncome, 'No income records found.'); renderSimpleRows(byId('expense-table'), shownExpenses, 'No expense records found.');
    byId('income-count').textContent = `${shownIncome.length} records`; byId('expense-count').textContent = `${shownExpenses.length} records`;
    if (isAdmin()) { renderManageRows(byId('manage-income'), 'income'); renderManageRows(byId('manage-expense'), 'expenses'); }
  }

  function showSection(name) {
    const manage = name === 'manage' && isAdmin();
    byId('dashboard-section').hidden = manage; byId('manage-section').hidden = !manage;
    byId('page-title').textContent = manage ? 'Manage accounting' : 'Dashboard';
    document.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('active', link.getAttribute('href') === (manage ? '#manage' : '#dashboard')));
    byId('sidebar').classList.remove('open');
  }

  function openRecordDialog(type, record = null) {
    if (!isAdmin()) return;
    byId('record-form').reset(); byId('record-id').value = record?.id || ''; byId('record-type').value = type;
    byId('record-modal-title').textContent = `${record ? 'Edit' : 'Add'} ${type === 'income' ? 'income' : 'expense'}`;
    byId('party-label').childNodes[0].nodeValue = type === 'income' ? 'Sender' : 'Paid to';
    byId('record-date').value = record?.date || today(); byId('record-party').value = record?.party || ''; byId('record-amount').value = record?.amount || ''; byId('record-currency').value = record?.currency || 'USD'; byId('record-reason').value = record?.reason || '';
    byId('record-dialog').showModal();
  }

  function deleteRecord(type, id) {
    if (!isAdmin() || !confirm('Delete this record? This cannot be undone.')) return;
    saveRecords(type, records(type).filter(row => row.id !== id)); render(); setMessage('Record deleted.');
  }

  function exportData() {
    const backup = { app: 'Axon MC Accounts', version: 1, exportedAt: new Date().toISOString(), users: read(KEYS.users), income: records('income'), expenses: records('expenses') };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `axon-mc-accounts-backup-${today()}.json`; link.click(); URL.revokeObjectURL(url); setMessage('Backup downloaded.');
  }

  function importData(file) {
    if (!file || !isAdmin()) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const backup = JSON.parse(reader.result);
        if (!Array.isArray(backup.users) || !Array.isArray(backup.income) || !Array.isArray(backup.expenses)) throw new Error();
        if (!confirm('Restore this backup? It replaces all current accounts and records.')) return;
        write(KEYS.users, backup.users); write(KEYS.income, backup.income); write(KEYS.expenses, backup.expenses);
        const active = backup.users.find(user => user.id === session()?.id); if (!active) { localStorage.removeItem(KEYS.session); location.reload(); return; }
        localStorage.setItem(KEYS.session, JSON.stringify({ id: active.id, name: active.name, role: active.role })); render(); setMessage('Backup restored successfully.');
      } catch { setMessage('That file is not a valid Axon MC Accounts backup.', 'error'); }
    };
    reader.readAsText(file);
  }

  function enterApp() {
    const user = session(); if (!user) return;
    byId('login-view').hidden = true; byId('app-view').hidden = false; byId('user-name').textContent = user.name; byId('user-role').textContent = user.role === 'admin' ? 'Administrator' : 'Read-only user'; byId('today').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());
    document.querySelectorAll('.admin-only').forEach(el => { el.hidden = !isAdmin(); }); render(); showSection(location.hash === '#manage' && isAdmin() ? 'manage' : 'dashboard');
  }

  function showAuth(view) {
    byId('login-form').hidden = view !== 'login';
    byId('register-form').hidden = view !== 'register';
  }

  function bindEvents() {
    byId('login-form').addEventListener('submit', event => { event.preventDefault(); const email = byId('login-email').value.trim().toLowerCase(), password = byId('login-password').value; const user = read(KEYS.users).find(item => item.email.toLowerCase() === email && item.password === password); if (!user) { setMessage('Incorrect email address or password.', 'error', byId('login-message')); return; } localStorage.setItem(KEYS.session, JSON.stringify({ id: user.id, name: user.name, role: user.role })); enterApp(); });
    byId('register-form').addEventListener('submit', event => { event.preventDefault(); const name = byId('register-name').value.trim(), email = byId('register-email').value.trim().toLowerCase(), password = byId('register-password').value, confirmation = byId('register-confirm-password').value; if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) { setMessage('Enter a name, valid email, and password of at least 8 characters.', 'error', byId('register-message')); return; } if (password !== confirmation) { setMessage('Passwords do not match.', 'error', byId('register-message')); return; } const users = read(KEYS.users); if (users.some(user => String(user.email).toLowerCase() === email)) { setMessage('An account already uses that email.', 'error', byId('register-message')); return; } users.push({ id: uid(), name, email, password, role: 'user' }); write(KEYS.users, users); byId('register-form').reset(); showAuth('login'); byId('login-email').value = email; setMessage('Account created. Please sign in.', 'success', byId('login-message')); });
    byId('show-register').addEventListener('click', () => showAuth('register')); byId('show-login').addEventListener('click', () => showAuth('login'));
    byId('logout-button').addEventListener('click', () => { localStorage.removeItem(KEYS.session); byId('app-view').hidden = true; byId('login-view').hidden = false; byId('login-form').reset(); showAuth('login'); });
    byId('theme-button').addEventListener('click', () => { document.body.classList.toggle('dark'); localStorage.setItem(KEYS.theme, document.body.classList.contains('dark') ? 'dark' : 'light'); });
    byId('search-input').addEventListener('input', render); byId('date-input').addEventListener('change', render); byId('clear-filters').addEventListener('click', () => { byId('search-input').value = ''; byId('date-input').value = ''; render(); });
    byId('add-income').addEventListener('click', () => openRecordDialog('income')); byId('add-expense').addEventListener('click', () => openRecordDialog('expenses'));
    byId('record-form').addEventListener('submit', event => { event.preventDefault(); if (!isAdmin()) return; const type = byId('record-type').value, id = byId('record-id').value, date = byId('record-date').value, party = byId('record-party').value.trim(), amount = Number(byId('record-amount').value), currency = byId('record-currency').value.trim().toUpperCase(), reason = byId('record-reason').value.trim(); if (!date || !party || !Number.isFinite(amount) || amount <= 0 || !/^[A-Z]{3,10}$/.test(currency) || !reason) { setMessage('Please provide valid values for every record field.', 'error'); return; } const row = { id: id || uid(), date, party, amount: Math.round(amount * 100) / 100, currency, reason, createdAt: new Date().toISOString() }, rows = records(type), existing = rows.findIndex(item => item.id === id); if (existing >= 0) rows[existing] = { ...rows[existing], ...row }; else rows.push(row); saveRecords(type, rows); byId('record-dialog').close(); render(); setMessage('Record saved.'); });
    document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => byId('record-dialog').close()));
    byId('export-button').addEventListener('click', exportData); byId('import-input').addEventListener('change', event => { importData(event.target.files[0]); event.target.value = ''; });
    document.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', event => { event.preventDefault(); showSection(link.getAttribute('href') === '#manage' ? 'manage' : 'dashboard'); }));
    byId('menu-button').addEventListener('click', () => byId('sidebar').classList.add('open')); byId('close-menu').addEventListener('click', () => byId('sidebar').classList.remove('open'));
  }

  seedData(); if (localStorage.getItem(KEYS.theme) === 'dark') document.body.classList.add('dark'); bindEvents(); if (session()) enterApp();
})();
