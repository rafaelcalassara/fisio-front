const STORAGE_KEY = 'pulse-studio-state-v2';
const LEGACY_STORAGE_KEY = 'fisio-app-state-v1';

const defaultState = {
  studio: {
    name: '',
    segment: 'Pilates e Fisioterapia',
    email: '',
    phone: '',
    address: '',
    bio: '',
    logoDataUrl: ''
  },
  auth: {
    email: '',
    password: ''
  },
  session: {
    loggedIn: false
  },
  patients: [],
  appointments: [],
  evolutions: [],
  plans: [],
  finances: []
};

const adminTitles = {
  dashboard: 'Dashboard operacional',
  agenda: 'Agenda do estúdio',
  pacientes: 'Pacientes',
  evolucao: 'Evolução clínica',
  planos: 'Planos terapêuticos',
  financeiro: 'Financeiro',
  studio: 'Perfil do estúdio'
};

let state = loadState();

const refs = {
  publicApp: document.getElementById('public-app'),
  authPanel: document.getElementById('auth-panel'),
  adminApp: document.getElementById('admin-app'),
  authTitle: document.getElementById('auth-title'),
  authSubtitle: document.getElementById('auth-subtitle'),
  authNote: document.getElementById('auth-note'),
  featuresSection: document.getElementById('features-section'),
  adminPageTitle: document.getElementById('admin-page-title'),
  agendaList: document.getElementById('agenda-list'),
  patientStatus: document.getElementById('patient-status'),
  queueList: document.getElementById('queue-list'),
  weekGrid: document.getElementById('week-grid'),
  appointmentsTable: document.getElementById('appointments-table'),
  patientCards: document.getElementById('patient-cards'),
  timeline: document.getElementById('timeline'),
  planGrid: document.getElementById('plan-grid'),
  financeGrid: document.getElementById('finance-grid'),
  openLoginButtons: [document.getElementById('open-login'), document.getElementById('hero-login')],
  closeAuth: document.getElementById('close-auth'),
  heroScrollFeatures: document.getElementById('hero-scroll-features'),
  logoutButton: document.getElementById('logout-button'),
  importButton: document.getElementById('admin-import-button'),
  exportButton: document.getElementById('admin-export-button'),
  importFile: document.getElementById('admin-import-file'),
  sidebarLogoShell: document.getElementById('sidebar-logo-shell'),
  dashboardLogoShell: document.getElementById('dashboard-logo-shell'),
  studioSettingsLogo: document.getElementById('studio-settings-logo'),
  sidebarStudioName: document.getElementById('sidebar-studio-name'),
  sidebarStudioSegment: document.getElementById('sidebar-studio-segment'),
  dashboardStudioName: document.getElementById('dashboard-studio-name'),
  dashboardStudioMeta: document.getElementById('dashboard-studio-meta'),
  studioLogoInput: document.getElementById('studio-logo-input'),
  removeStudioLogo: document.getElementById('remove-studio-logo')
};

const forms = {
  setup: document.getElementById('setup-form'),
  login: document.getElementById('login-form'),
  patient: document.getElementById('patient-form'),
  appointment: document.getElementById('appointment-form'),
  evolution: document.getElementById('evolution-form'),
  plan: document.getElementById('plan-form'),
  finance: document.getElementById('finance-form'),
  studio: document.getElementById('studio-form')
};

const inputs = {
  setup: {
    studioName: document.getElementById('setup-studio-name'),
    studioSegment: document.getElementById('setup-studio-segment'),
    email: document.getElementById('setup-email'),
    password: document.getElementById('setup-password'),
    passwordConfirm: document.getElementById('setup-password-confirm')
  },
  login: {
    email: document.getElementById('login-email'),
    password: document.getElementById('login-password')
  },
  patient: {
    id: document.getElementById('patient-id'),
    name: document.getElementById('patient-name'),
    age: document.getElementById('patient-age'),
    complaint: document.getElementById('patient-complaint'),
    frequency: document.getElementById('patient-frequency'),
    tags: document.getElementById('patient-tags'),
    submit: document.getElementById('patient-submit'),
    cancel: document.getElementById('patient-cancel')
  },
  appointment: {
    id: document.getElementById('appointment-id'),
    patientId: document.getElementById('appointment-patient'),
    date: document.getElementById('appointment-date'),
    time: document.getElementById('appointment-time'),
    type: document.getElementById('appointment-type'),
    status: document.getElementById('appointment-status'),
    fee: document.getElementById('appointment-fee'),
    notes: document.getElementById('appointment-notes'),
    submit: document.getElementById('appointment-submit'),
    cancel: document.getElementById('appointment-cancel')
  },
  evolution: {
    id: document.getElementById('evolution-id'),
    patientId: document.getElementById('evolution-patient'),
    date: document.getElementById('evolution-date'),
    pain: document.getElementById('evolution-pain'),
    summary: document.getElementById('evolution-summary'),
    next: document.getElementById('evolution-next'),
    submit: document.getElementById('evolution-submit'),
    cancel: document.getElementById('evolution-cancel')
  },
  plan: {
    id: document.getElementById('plan-id'),
    patientId: document.getElementById('plan-patient'),
    title: document.getElementById('plan-title'),
    goals: document.getElementById('plan-goals'),
    exercises: document.getElementById('plan-exercises'),
    submit: document.getElementById('plan-submit'),
    cancel: document.getElementById('plan-cancel')
  },
  finance: {
    id: document.getElementById('finance-id'),
    patientId: document.getElementById('finance-patient'),
    description: document.getElementById('finance-description'),
    date: document.getElementById('finance-date'),
    amount: document.getElementById('finance-amount'),
    status: document.getElementById('finance-status'),
    submit: document.getElementById('finance-submit'),
    cancel: document.getElementById('finance-cancel')
  },
  studio: {
    name: document.getElementById('studio-name'),
    segment: document.getElementById('studio-segment'),
    email: document.getElementById('studio-email'),
    phone: document.getElementById('studio-phone'),
    address: document.getElementById('studio-address'),
    bio: document.getElementById('studio-bio')
  }
};

const adminLinks = document.querySelectorAll('.admin-link');
const adminSections = document.querySelectorAll('.admin-section');

boot();

function boot() {
  bindMarketing();
  bindAuth();
  bindAdminNavigation();
  bindTopbar();
  bindForms();
  syncAuthMode();
  syncVisibility();
  renderAll();
}

function bindMarketing() {
  refs.openLoginButtons.forEach((button) => button?.addEventListener('click', openAuthPanel));
  refs.closeAuth?.addEventListener('click', closeAuthPanel);
  refs.heroScrollFeatures?.addEventListener('click', () => {
    refs.featuresSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function bindAuth() {
  forms.setup.addEventListener('submit', handleSetupSubmit);
  forms.login.addEventListener('submit', handleLoginSubmit);
  refs.logoutButton.addEventListener('click', logout);
}

function bindAdminNavigation() {
  adminLinks.forEach((link) => {
    link.addEventListener('click', () => openAdminSection(link.dataset.adminSection));
  });
}

function bindTopbar() {
  refs.exportButton.addEventListener('click', exportState);
  refs.importButton.addEventListener('click', () => refs.importFile.click());
  refs.importFile.addEventListener('change', importState);
  refs.studioLogoInput.addEventListener('change', handleStudioLogoUpload);
  refs.removeStudioLogo.addEventListener('click', removeStudioLogo);
}

function bindForms() {
  forms.patient.addEventListener('submit', handlePatientSubmit);
  forms.appointment.addEventListener('submit', handleAppointmentSubmit);
  forms.evolution.addEventListener('submit', handleEvolutionSubmit);
  forms.plan.addEventListener('submit', handlePlanSubmit);
  forms.finance.addEventListener('submit', handleFinanceSubmit);
  forms.studio.addEventListener('submit', handleStudioSubmit);

  wireSubmitButton(forms.patient, inputs.patient.submit);
  wireSubmitButton(forms.appointment, inputs.appointment.submit);
  wireSubmitButton(forms.evolution, inputs.evolution.submit);
  wireSubmitButton(forms.plan, inputs.plan.submit);
  wireSubmitButton(forms.finance, inputs.finance.submit);

  inputs.patient.cancel.addEventListener('click', resetPatientForm);
  inputs.appointment.cancel.addEventListener('click', resetAppointmentForm);
  inputs.evolution.cancel.addEventListener('click', resetEvolutionForm);
  inputs.plan.cancel.addEventListener('click', resetPlanForm);
  inputs.finance.cancel.addEventListener('click', resetFinanceForm);
}

function wireSubmitButton(form, button) {
  button.addEventListener('click', (event) => {
    event.preventDefault();
    form.requestSubmit();
  });
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!legacyRaw) return cloneDefaultState();
      const migrated = normalizeState(JSON.parse(legacyRaw));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return normalizeState(JSON.parse(raw));
  } catch {
    return cloneDefaultState();
  }
}

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(defaultState));
}

function normalizeState(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const studio = source.studio && typeof source.studio === 'object' ? source.studio : {};
  const auth = source.auth && typeof source.auth === 'object' ? source.auth : {};
  const session = source.session && typeof source.session === 'object' ? source.session : {};

  return {
    studio: {
      name: String(studio.name || ''),
      segment: String(studio.segment || 'Pilates e Fisioterapia'),
      email: String(studio.email || ''),
      phone: String(studio.phone || ''),
      address: String(studio.address || ''),
      bio: String(studio.bio || ''),
      logoDataUrl: String(studio.logoDataUrl || '')
    },
    auth: {
      email: String(auth.email || ''),
      password: String(auth.password || '')
    },
    session: {
      loggedIn: Boolean(session.loggedIn)
    },
    patients: Array.isArray(source.patients)
      ? source.patients.map((item) => ({
          id: String(item?.id || uid('patient')),
          name: String(item?.name || 'Paciente sem nome'),
          age: String(item?.age || ''),
          complaint: String(item?.complaint || ''),
          frequency: String(item?.frequency || ''),
          tags: Array.isArray(item?.tags) ? item.tags.map((tag) => String(tag)) : []
        }))
      : [],
    appointments: Array.isArray(source.appointments)
      ? source.appointments.map((item) => ({
          id: String(item?.id || uid('appointment')),
          patientId: String(item?.patientId || ''),
          date: normalizeDate(item?.date),
          time: String(item?.time || ''),
          type: String(item?.type || ''),
          status: String(item?.status || 'pendente'),
          fee: String(item?.fee || ''),
          notes: String(item?.notes || '')
        }))
      : [],
    evolutions: Array.isArray(source.evolutions)
      ? source.evolutions.map((item) => ({
          id: String(item?.id || uid('evolution')),
          patientId: String(item?.patientId || ''),
          date: normalizeDate(item?.date),
          pain: String(item?.pain || ''),
          summary: String(item?.summary || ''),
          next: String(item?.next || '')
        }))
      : [],
    plans: Array.isArray(source.plans)
      ? source.plans.map((item) => ({
          id: String(item?.id || uid('plan')),
          patientId: String(item?.patientId || ''),
          title: String(item?.title || ''),
          goals: String(item?.goals || ''),
          exercises: String(item?.exercises || '')
        }))
      : [],
    finances: Array.isArray(source.finances)
      ? source.finances.map((item) => ({
          id: String(item?.id || uid('finance')),
          patientId: String(item?.patientId || ''),
          description: String(item?.description || ''),
          date: normalizeDate(item?.date),
          amount: String(item?.amount || ''),
          status: String(item?.status || 'pendente')
        }))
      : []
  };
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function todayISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function money(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
}

function shortDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(`${value}T00:00:00`));
}

function fullDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

function formatLocalISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeDate(value) {
  const text = String(value || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

function parseTags(text) {
  return String(text || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safe(value) {
  return escapeHtml(value);
}

function hasConfiguredAccess() {
  return Boolean(state.auth.email && state.auth.password);
}

function getStudioName() {
  return state.studio.name || 'Seu estúdio';
}

function getStudioSegment() {
  return state.studio.segment || 'Painel de gestão';
}

function getStudioInitials() {
  const base = getStudioName().trim();
  if (!base) return 'S';
  const parts = base.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]).join('').toUpperCase();
}

function openAuthPanel() {
  syncAuthMode();
  refs.authPanel.classList.remove('hidden');
}

function closeAuthPanel() {
  refs.authPanel.classList.add('hidden');
}

function syncAuthMode() {
  const configured = hasConfiguredAccess();
  forms.setup.classList.toggle('hidden', configured);
  forms.login.classList.toggle('hidden', !configured);
  refs.authTitle.textContent = configured ? 'Entrar no painel' : 'Configurar primeiro acesso';
  refs.authSubtitle.textContent = configured
    ? 'Acesso restrito ao gestor do estúdio.'
    : 'Defina o perfil inicial do estúdio e crie o login local deste ambiente.';
  if (!configured) {
    inputs.setup.studioName.value = state.studio.name || '';
    inputs.setup.studioSegment.value = state.studio.segment || 'Pilates e Fisioterapia';
    inputs.setup.email.value = state.auth.email || state.studio.email || '';
  } else {
    inputs.login.email.value = state.auth.email || '';
  }
}

function syncVisibility() {
  const loggedIn = Boolean(state.session.loggedIn && hasConfiguredAccess());
  refs.publicApp.classList.toggle('hidden', loggedIn);
  refs.adminApp.classList.toggle('hidden', !loggedIn);
  if (loggedIn) {
    closeAuthPanel();
  }
}

function setAuthNote(message, tone = 'neutral') {
  refs.authNote.textContent = message;
  refs.authNote.dataset.tone = tone;
}

function handleSetupSubmit(event) {
  event.preventDefault();
  const password = inputs.setup.password.value;
  const confirmPassword = inputs.setup.passwordConfirm.value;
  if (password.length < 6) {
    setAuthNote('A senha precisa ter pelo menos 6 caracteres.', 'danger');
    return;
  }
  if (password !== confirmPassword) {
    setAuthNote('As senhas não conferem.', 'danger');
    return;
  }

  state.studio.name = inputs.setup.studioName.value.trim();
  state.studio.segment = inputs.setup.studioSegment.value.trim() || 'Pilates e Fisioterapia';
  state.studio.email = inputs.setup.email.value.trim();
  state.auth.email = inputs.setup.email.value.trim().toLowerCase();
  state.auth.password = password;
  state.session.loggedIn = true;
  persist();
  forms.setup.reset();
  setAuthNote('Estúdio configurado com sucesso.', 'success');
  syncAuthMode();
  syncVisibility();
  renderAll();
}

function handleLoginSubmit(event) {
  event.preventDefault();
  const email = inputs.login.email.value.trim().toLowerCase();
  const password = inputs.login.password.value;
  if (email !== state.auth.email.toLowerCase() || password !== state.auth.password) {
    setAuthNote('Credenciais inválidas.', 'danger');
    return;
  }
  state.session.loggedIn = true;
  persist();
  forms.login.reset();
  setAuthNote('Login realizado.', 'success');
  syncVisibility();
  renderAll();
}

function logout() {
  state.session.loggedIn = false;
  persist();
  syncVisibility();
  syncAuthMode();
  openAuthPanel();
}

function renderAll() {
  renderStudioBranding();
  renderStudioForm();
  renderDashboard();
  renderWeekOverview();
  renderAppointmentTable();
  renderPatientCards();
  renderEvolutions();
  renderPlans();
  renderFinances();
  populatePatientSelects();
  toggleCancelButtons();
  syncVisibility();
  updateAdminTitle();
}

function renderStudioBranding() {
  refs.sidebarStudioName.textContent = getStudioName();
  refs.sidebarStudioSegment.textContent = getStudioSegment();
  refs.dashboardStudioName.textContent = getStudioName();

  const dashboardBits = [getStudioSegment()];
  if (state.studio.email) dashboardBits.push(state.studio.email);
  if (state.studio.phone) dashboardBits.push(state.studio.phone);
  refs.dashboardStudioMeta.textContent = dashboardBits.join(' • ') || 'Configure nome, contatos e logo na aba Estúdio.';

  [refs.sidebarLogoShell, refs.dashboardLogoShell, refs.studioSettingsLogo].forEach((shell) => {
    shell.innerHTML = state.studio.logoDataUrl
      ? `<img class="logo-image" src="${safe(state.studio.logoDataUrl)}" alt="Logo do estúdio" />`
      : `<span class="logo-fallback">${safe(getStudioInitials())}</span>`;
  });
}

function renderStudioForm() {
  inputs.studio.name.value = state.studio.name;
  inputs.studio.segment.value = state.studio.segment;
  inputs.studio.email.value = state.studio.email;
  inputs.studio.phone.value = state.studio.phone;
  inputs.studio.address.value = state.studio.address;
  inputs.studio.bio.value = state.studio.bio;
}

function renderDashboard() {
  const today = todayISO();
  const appointmentsToday = sortAppointments(state.appointments.filter((item) => item.date === today));

  refs.agendaList.innerHTML = appointmentsToday.length
    ? appointmentsToday.map((item) => `
        <article class="agenda-item">
          <div class="time-pill">${safe(item.time)}</div>
          <div class="agenda-main">
            <strong>${safe(getPatientName(item.patientId))}</strong>
            <div class="meta">${safe(item.type)}</div>
            <div class="muted">${safe(item.notes || 'Sem observações')}</div>
          </div>
          <span class="status-chip ${safe(statusTone(item.status))}">${safe(labelStatus(item.status))}</span>
        </article>
      `).join('')
    : emptyState('Nenhuma sessão cadastrada para hoje.');

  const startWeek = new Date();
  startWeek.setHours(0, 0, 0, 0);
  const endWeek = new Date(startWeek);
  endWeek.setDate(endWeek.getDate() + 6);
  endWeek.setHours(23, 59, 59, 999);

  const weeklyAppointments = state.appointments.filter((item) => {
    const date = new Date(`${item.date}T00:00:00`);
    return date >= startWeek && date <= endWeek;
  });
  const weeklyEvolutions = state.evolutions.filter((item) => {
    const date = new Date(`${item.date}T00:00:00`);
    return date >= startWeek && date <= endWeek;
  });

  const currentMonth = today.slice(0, 7);
  const paidThisMonth = state.finances
    .filter((item) => item.status === 'pago' && item.date.startsWith(currentMonth))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const statusMetrics = [
    { label: 'Pacientes ativos', value: state.patients.length },
    { label: 'Sessões 7 dias', value: weeklyAppointments.length },
    { label: 'Evoluções 7 dias', value: weeklyEvolutions.length },
    { label: 'Receita paga no mês', value: money(paidThisMonth) }
  ];

  refs.patientStatus.innerHTML = statusMetrics.map((metric) => `
    <div class="mini-metric">
      <span class="muted">${safe(metric.label)}</span>
      <strong>${safe(metric.value)}</strong>
    </div>
  `).join('');

  refs.queueList.innerHTML = buildQueue().map((item) => `<li>${safe(item)}</li>`).join('');
}

function buildQueue() {
  const queue = [];
  if (!state.studio.name) queue.push('Complete o perfil do estúdio na aba Estúdio.');
  if (!state.studio.logoDataUrl) queue.push('Suba o logo do estúdio para personalizar o painel interno.');
  if (!state.patients.length) queue.push('Cadastre o primeiro paciente para começar a operar.');
  if (!state.appointments.length) queue.push('Crie a primeira sessão na agenda.');
  if (state.appointments.length && !state.evolutions.length) queue.push('Registrar a primeira evolução clínica.');
  const overdue = state.finances.filter((item) => item.status !== 'pago' && item.date < todayISO()).length;
  if (overdue) queue.push(`${overdue} cobrança(s) em atraso precisando ação.`);
  if (!state.plans.length && state.patients.length) queue.push('Definir pelo menos um plano terapêutico ativo.');
  return queue.length ? queue : ['Operação organizada sem pendências críticas agora.'];
}

function renderWeekOverview() {
  const base = new Date();
  refs.weekGrid.innerHTML = Array.from({ length: 5 }, (_, index) => {
    const day = new Date(base);
    day.setDate(base.getDate() + index);
    const iso = formatLocalISO(day);
    const list = sortAppointments(state.appointments.filter((item) => item.date === iso));
    const dayLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(day).replace('.', '');
    return `
      <article class="day-column">
        <h4>${safe(dayLabel)} • ${safe(shortDate(iso))}</h4>
        ${list.length ? `<ul>${list.map((item) => `<li>${safe(item.time)} • ${safe(getPatientName(item.patientId))}</li>`).join('')}</ul>` : '<p class="muted">Sem sessões.</p>'}
      </article>
    `;
  }).join('');
}

function renderAppointmentTable() {
  const sorted = sortAppointments(state.appointments);
  refs.appointmentsTable.innerHTML = sorted.length
    ? sorted.map((item) => `
        <article class="entity-card">
          <div>
            <strong>${safe(getPatientName(item.patientId))}</strong>
            <p>${safe(fullDate(item.date))} • ${safe(item.time)} • ${safe(item.type)}</p>
            <p>${safe(item.notes || 'Sem observações')}${item.fee ? ` • ${safe(money(item.fee))}` : ''}</p>
          </div>
          <div class="entity-actions">
            <span class="status-chip ${safe(statusTone(item.status))}">${safe(labelStatus(item.status))}</span>
            <button class="ghost-inline" type="button" data-action="edit-appointment" data-id="${safe(item.id)}">Editar</button>
            <button class="danger-inline" type="button" data-action="delete-appointment" data-id="${safe(item.id)}">Excluir</button>
          </div>
        </article>
      `).join('')
    : emptyState('Nenhuma sessão cadastrada ainda.');

  bindEntityActions('[data-action="edit-appointment"]', editAppointment);
  bindEntityActions('[data-action="delete-appointment"]', deleteAppointment);
}

function renderPatientCards() {
  refs.patientCards.innerHTML = state.patients.length
    ? state.patients.map((patient) => {
        const appointments = state.appointments.filter((item) => item.patientId === patient.id).length;
        const evolutions = state.evolutions.filter((item) => item.patientId === patient.id).length;
        return `
          <article class="patient-card">
            <strong>${safe(patient.name)}</strong>
            <p>${safe(patient.age ? `${patient.age} anos • ` : '')}${safe(patient.complaint)}${patient.frequency ? ` • ${safe(patient.frequency)}` : ''}</p>
            <p class="muted">${safe(appointments)} sessão(ões) • ${safe(evolutions)} evolução(ões)</p>
            <div class="tags">${patient.tags.map((tag) => `<span class="tag">${safe(tag)}</span>`).join('')}</div>
            <div class="entity-actions compact-actions">
              <button class="ghost-inline" type="button" data-action="edit-patient" data-id="${safe(patient.id)}">Editar</button>
              <button class="danger-inline" type="button" data-action="delete-patient" data-id="${safe(patient.id)}">Excluir</button>
            </div>
          </article>
        `;
      }).join('')
    : emptyState('Nenhum paciente cadastrado ainda.');

  bindEntityActions('[data-action="edit-patient"]', editPatient);
  bindEntityActions('[data-action="delete-patient"]', deletePatient);
}

function renderEvolutions() {
  const sorted = [...state.evolutions].sort((a, b) => `${b.date}${b.id}`.localeCompare(`${a.date}${a.id}`));
  refs.timeline.innerHTML = sorted.length
    ? sorted.map((item) => `
        <article class="timeline-item">
          <div class="timeline-date">${safe(fullDate(item.date))}</div>
          <div>
            <strong>${safe(getPatientName(item.patientId))}${item.pain !== '' ? ` • dor ${safe(item.pain)}/10` : ''}</strong>
            <p>${safe(item.summary)}</p>
            <p class="muted">${safe(item.next || 'Sem próximos passos registrados.')}</p>
            <div class="entity-actions compact-actions">
              <button class="ghost-inline" type="button" data-action="edit-evolution" data-id="${safe(item.id)}">Editar</button>
              <button class="danger-inline" type="button" data-action="delete-evolution" data-id="${safe(item.id)}">Excluir</button>
            </div>
          </div>
        </article>
      `).join('')
    : emptyState('Nenhuma evolução registrada ainda.');

  bindEntityActions('[data-action="edit-evolution"]', editEvolution);
  bindEntityActions('[data-action="delete-evolution"]', deleteEvolution);
}

function renderPlans() {
  refs.planGrid.innerHTML = state.plans.length
    ? state.plans.map((item) => `
        <article class="plan-card">
          <strong>${safe(item.title)}</strong>
          <p>${safe(getPatientName(item.patientId))}</p>
          <p>${safe(item.goals)}</p>
          <p class="muted">${safe(item.exercises || 'Sem exercícios detalhados.')}</p>
          <div class="entity-actions compact-actions">
            <button class="ghost-inline" type="button" data-action="edit-plan" data-id="${safe(item.id)}">Editar</button>
            <button class="danger-inline" type="button" data-action="delete-plan" data-id="${safe(item.id)}">Excluir</button>
          </div>
        </article>
      `).join('')
    : emptyState('Nenhum plano terapêutico cadastrado ainda.');

  bindEntityActions('[data-action="edit-plan"]', editPlan);
  bindEntityActions('[data-action="delete-plan"]', deletePlan);
}

function renderFinances() {
  refs.financeGrid.innerHTML = state.finances.length
    ? state.finances.map((item) => `
        <article class="finance-card">
          <strong>${safe(item.description)}</strong>
          <p>${safe(getPatientName(item.patientId))} • ${safe(fullDate(item.date))}</p>
          <p>${safe(money(item.amount))}</p>
          <div class="entity-actions compact-actions">
            <span class="status-chip ${safe(statusTone(item.status))}">${safe(labelStatus(item.status))}</span>
            <button class="ghost-inline" type="button" data-action="edit-finance" data-id="${safe(item.id)}">Editar</button>
            <button class="danger-inline" type="button" data-action="delete-finance" data-id="${safe(item.id)}">Excluir</button>
          </div>
        </article>
      `).join('')
    : emptyState('Nenhum lançamento financeiro cadastrado ainda.');

  bindEntityActions('[data-action="edit-finance"]', editFinance);
  bindEntityActions('[data-action="delete-finance"]', deleteFinance);
}

function bindEntityActions(selector, handler) {
  document.querySelectorAll(selector).forEach((button) => {
    button.addEventListener('click', () => handler(button.dataset.id));
  });
}

function populatePatientSelects() {
  const selects = [inputs.appointment.patientId, inputs.evolution.patientId, inputs.plan.patientId, inputs.finance.patientId];
  const options = state.patients.map((patient) => `<option value="${safe(patient.id)}">${safe(patient.name)}</option>`).join('');

  selects.forEach((select) => {
    const current = select.value;
    select.innerHTML = state.patients.length
      ? `<option value="" disabled ${current ? '' : 'selected'}>Selecione</option>${options}`
      : '<option value="" selected>Cadastre um paciente primeiro</option>';
    select.disabled = !state.patients.length;
    if (current && state.patients.some((patient) => patient.id === current)) {
      select.value = current;
    }
  });
}

function toggleCancelButtons() {
  [
    [inputs.patient.id.value, inputs.patient.cancel],
    [inputs.appointment.id.value, inputs.appointment.cancel],
    [inputs.evolution.id.value, inputs.evolution.cancel],
    [inputs.plan.id.value, inputs.plan.cancel],
    [inputs.finance.id.value, inputs.finance.cancel]
  ].forEach(([id, button]) => {
    button.style.display = id ? 'inline-flex' : 'none';
  });
}

function handlePatientSubmit(event) {
  event.preventDefault();
  const payload = {
    id: inputs.patient.id.value || uid('patient'),
    name: inputs.patient.name.value.trim(),
    age: inputs.patient.age.value.trim(),
    complaint: inputs.patient.complaint.value.trim(),
    frequency: inputs.patient.frequency.value.trim(),
    tags: parseTags(inputs.patient.tags.value)
  };
  upsert('patients', payload);
  resetPatientForm();
}

function handleAppointmentSubmit(event) {
  event.preventDefault();
  if (!state.patients.length) return alert('Cadastre um paciente primeiro.');
  const payload = {
    id: inputs.appointment.id.value || uid('appointment'),
    patientId: inputs.appointment.patientId.value,
    date: inputs.appointment.date.value,
    time: inputs.appointment.time.value,
    type: inputs.appointment.type.value.trim(),
    status: inputs.appointment.status.value,
    fee: inputs.appointment.fee.value,
    notes: inputs.appointment.notes.value.trim()
  };
  upsert('appointments', payload);
  resetAppointmentForm();
}

function handleEvolutionSubmit(event) {
  event.preventDefault();
  if (!state.patients.length) return alert('Cadastre um paciente primeiro.');
  const payload = {
    id: inputs.evolution.id.value || uid('evolution'),
    patientId: inputs.evolution.patientId.value,
    date: inputs.evolution.date.value,
    pain: inputs.evolution.pain.value,
    summary: inputs.evolution.summary.value.trim(),
    next: inputs.evolution.next.value.trim()
  };
  upsert('evolutions', payload);
  resetEvolutionForm();
}

function handlePlanSubmit(event) {
  event.preventDefault();
  if (!state.patients.length) return alert('Cadastre um paciente primeiro.');
  const payload = {
    id: inputs.plan.id.value || uid('plan'),
    patientId: inputs.plan.patientId.value,
    title: inputs.plan.title.value.trim(),
    goals: inputs.plan.goals.value.trim(),
    exercises: inputs.plan.exercises.value.trim()
  };
  upsert('plans', payload);
  resetPlanForm();
}

function handleFinanceSubmit(event) {
  event.preventDefault();
  if (!state.patients.length) return alert('Cadastre um paciente primeiro.');
  const payload = {
    id: inputs.finance.id.value || uid('finance'),
    patientId: inputs.finance.patientId.value,
    description: inputs.finance.description.value.trim(),
    date: inputs.finance.date.value,
    amount: inputs.finance.amount.value,
    status: inputs.finance.status.value
  };
  upsert('finances', payload);
  resetFinanceForm();
}

function handleStudioSubmit(event) {
  event.preventDefault();
  state.studio.name = inputs.studio.name.value.trim();
  state.studio.segment = inputs.studio.segment.value.trim() || 'Pilates e Fisioterapia';
  state.studio.email = inputs.studio.email.value.trim();
  state.studio.phone = inputs.studio.phone.value.trim();
  state.studio.address = inputs.studio.address.value.trim();
  state.studio.bio = inputs.studio.bio.value.trim();
  persist();
  renderAll();
  alert('Perfil do estúdio salvo.');
}

function handleStudioLogoUpload(event) {
  const [file] = event.target.files;
  if (!file) return;
  if (file.size > 1_200_000) {
    alert('Use uma imagem de até 1,2 MB para o logo do estúdio.');
    event.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    state.studio.logoDataUrl = String(reader.result || '');
    persist();
    renderAll();
    alert('Logo do estúdio atualizada.');
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}

function removeStudioLogo() {
  if (!state.studio.logoDataUrl) return;
  if (!confirm('Remover o logo atual do estúdio?')) return;
  state.studio.logoDataUrl = '';
  persist();
  renderAll();
}

function upsert(collection, payload) {
  const index = state[collection].findIndex((item) => item.id === payload.id);
  if (index >= 0) {
    state[collection][index] = payload;
  } else {
    state[collection].push(payload);
  }
  saveAndRender();
}

function saveAndRender() {
  persist();
  renderAll();
}

function removeById(collection, id) {
  state[collection] = state[collection].filter((item) => item.id !== id);
  saveAndRender();
}

function editPatient(id) {
  const item = state.patients.find((patient) => patient.id === id);
  if (!item) return;
  openAdminSection('pacientes');
  inputs.patient.id.value = item.id;
  inputs.patient.name.value = item.name;
  inputs.patient.age.value = item.age;
  inputs.patient.complaint.value = item.complaint;
  inputs.patient.frequency.value = item.frequency;
  inputs.patient.tags.value = item.tags.join(', ');
  inputs.patient.submit.textContent = 'Atualizar paciente';
  inputs.patient.cancel.style.display = 'inline-flex';
}

function deletePatient(id) {
  if (!confirm('Excluir paciente e todos os registros ligados a ele?')) return;
  removeById('patients', id);
  state.appointments = state.appointments.filter((item) => item.patientId !== id);
  state.evolutions = state.evolutions.filter((item) => item.patientId !== id);
  state.plans = state.plans.filter((item) => item.patientId !== id);
  state.finances = state.finances.filter((item) => item.patientId !== id);
  saveAndRender();
}

function editAppointment(id) {
  const item = state.appointments.find((entry) => entry.id === id);
  if (!item) return;
  openAdminSection('agenda');
  inputs.appointment.id.value = item.id;
  inputs.appointment.patientId.value = item.patientId;
  inputs.appointment.date.value = item.date;
  inputs.appointment.time.value = item.time;
  inputs.appointment.type.value = item.type;
  inputs.appointment.status.value = item.status;
  inputs.appointment.fee.value = item.fee;
  inputs.appointment.notes.value = item.notes;
  inputs.appointment.submit.textContent = 'Atualizar sessão';
  inputs.appointment.cancel.style.display = 'inline-flex';
}

function deleteAppointment(id) {
  if (!confirm('Excluir esta sessão?')) return;
  removeById('appointments', id);
}

function editEvolution(id) {
  const item = state.evolutions.find((entry) => entry.id === id);
  if (!item) return;
  openAdminSection('evolucao');
  inputs.evolution.id.value = item.id;
  inputs.evolution.patientId.value = item.patientId;
  inputs.evolution.date.value = item.date;
  inputs.evolution.pain.value = item.pain;
  inputs.evolution.summary.value = item.summary;
  inputs.evolution.next.value = item.next;
  inputs.evolution.submit.textContent = 'Atualizar evolução';
  inputs.evolution.cancel.style.display = 'inline-flex';
}

function deleteEvolution(id) {
  if (!confirm('Excluir esta evolução?')) return;
  removeById('evolutions', id);
}

function editPlan(id) {
  const item = state.plans.find((entry) => entry.id === id);
  if (!item) return;
  openAdminSection('planos');
  inputs.plan.id.value = item.id;
  inputs.plan.patientId.value = item.patientId;
  inputs.plan.title.value = item.title;
  inputs.plan.goals.value = item.goals;
  inputs.plan.exercises.value = item.exercises;
  inputs.plan.submit.textContent = 'Atualizar plano';
  inputs.plan.cancel.style.display = 'inline-flex';
}

function deletePlan(id) {
  if (!confirm('Excluir este plano?')) return;
  removeById('plans', id);
}

function editFinance(id) {
  const item = state.finances.find((entry) => entry.id === id);
  if (!item) return;
  openAdminSection('financeiro');
  inputs.finance.id.value = item.id;
  inputs.finance.patientId.value = item.patientId;
  inputs.finance.description.value = item.description;
  inputs.finance.date.value = item.date;
  inputs.finance.amount.value = item.amount;
  inputs.finance.status.value = item.status;
  inputs.finance.submit.textContent = 'Atualizar lançamento';
  inputs.finance.cancel.style.display = 'inline-flex';
}

function deleteFinance(id) {
  if (!confirm('Excluir este lançamento?')) return;
  removeById('finances', id);
}

function resetPatientForm() {
  forms.patient.reset();
  inputs.patient.id.value = '';
  inputs.patient.submit.textContent = 'Salvar paciente';
  inputs.patient.cancel.style.display = 'none';
}

function resetAppointmentForm() {
  forms.appointment.reset();
  inputs.appointment.id.value = '';
  inputs.appointment.submit.textContent = 'Salvar sessão';
  inputs.appointment.cancel.style.display = 'none';
  populatePatientSelects();
}

function resetEvolutionForm() {
  forms.evolution.reset();
  inputs.evolution.id.value = '';
  inputs.evolution.submit.textContent = 'Salvar evolução';
  inputs.evolution.cancel.style.display = 'none';
  populatePatientSelects();
}

function resetPlanForm() {
  forms.plan.reset();
  inputs.plan.id.value = '';
  inputs.plan.submit.textContent = 'Salvar plano';
  inputs.plan.cancel.style.display = 'none';
  populatePatientSelects();
}

function resetFinanceForm() {
  forms.finance.reset();
  inputs.finance.id.value = '';
  inputs.finance.submit.textContent = 'Salvar lançamento';
  inputs.finance.cancel.style.display = 'none';
  populatePatientSelects();
}

function resetAllForms() {
  resetPatientForm();
  resetAppointmentForm();
  resetEvolutionForm();
  resetPlanForm();
  resetFinanceForm();
}

function sortAppointments(list) {
  return [...list].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}

function getPatientName(patientId) {
  return state.patients.find((item) => item.id === patientId)?.name || 'Paciente removido';
}

function statusTone(status) {
  if (['pago', 'confirmado', 'concluido'].includes(status)) return 'ok';
  if (['pendente'].includes(status)) return 'warn';
  return 'danger';
}

function labelStatus(status) {
  const labels = {
    confirmado: 'Confirmado',
    pendente: 'Pendente',
    faltou: 'Faltou',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
    pago: 'Pago',
    atrasado: 'Atrasado'
  };
  return labels[status] || status;
}

function emptyState(text) {
  return `<div class="empty-state"><p>${safe(text)}</p></div>`;
}

function exportState() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `pulse-studio-backup-${todayISO()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function importState(event) {
  const [file] = event.target.files;
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const currentLogin = state.session.loggedIn;
      state = normalizeState(parsed);
      state.session.loggedIn = currentLogin && hasConfiguredAccess();
      persist();
      renderAll();
      resetAllForms();
      alert('Dados importados com sucesso.');
    } catch {
      alert('Arquivo inválido.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function openAdminSection(target) {
  adminLinks.forEach((item) => item.classList.toggle('active', item.dataset.adminSection === target));
  adminSections.forEach((section) => section.classList.toggle('active', section.id === `admin-section-${target}`));
  updateAdminTitle();
}

function updateAdminTitle() {
  const active = document.querySelector('.admin-link.active')?.dataset.adminSection || 'dashboard';
  refs.adminPageTitle.textContent = adminTitles[active] || 'Painel de gestão';
}
