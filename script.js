const STORAGE_KEY = 'fisio-app-state-v1';

const requirements = [
  {
    title: 'Já mapeado de forma explícita',
    items: [
      'Existe um projeto de sistema de fisioterapia para o madrinho do Rafael.',
      'A aplicação precisa ser publicável no domínio rafaelcalassara.com.br.',
      'O subdomínio-alvo desta versão é fisio.rafaelcalassara.com.br.',
      'A preferência é por operação simples, barata e agentic-first.'
    ]
  },
  {
    title: 'Escopo funcional entregue agora',
    items: [
      'Cadastro real de pacientes com persistência local.',
      'Agenda com criação, edição e exclusão de sessões.',
      'Prontuário/evolução por atendimento.',
      'Planos terapêuticos e controle financeiro básico.'
    ]
  }
];

const loop = [
  { title: 'Mapear', text: 'Capturar o fluxo real da clínica: captação, agenda, sessão, evolução e cobrança.' },
  { title: 'Desenhar', text: 'Transformar o fluxo em telas mínimas e validar com o fisioterapeuta.' },
  { title: 'Entregar', text: 'Liberar um slice pequeno, funcional e usável no celular.' },
  { title: 'Usar', text: 'Rodar no dia a dia real e observar onde trava ou gera retrabalho.' },
  { title: 'Refinar', text: 'Ajustar primeiro os gargalos operacionais antes de ampliar escopo.' },
  { title: 'Escalar', text: 'Só depois entrar com automações, relatórios e integrações externas.' }
];

const defaultState = {
  patients: [],
  appointments: [],
  evolutions: [],
  plans: [],
  finances: []
};

let state = loadState();

const refs = {
  heroMetrics: document.getElementById('hero-metrics'),
  requirementsGrid: document.getElementById('requirements-grid'),
  agendaList: document.getElementById('agenda-list'),
  patientStatus: document.getElementById('patient-status'),
  queueList: document.getElementById('queue-list'),
  loopGrid: document.getElementById('loop-grid'),
  weekGrid: document.getElementById('week-grid'),
  appointmentsTable: document.getElementById('appointments-table'),
  patientCards: document.getElementById('patient-cards'),
  timeline: document.getElementById('timeline'),
  planGrid: document.getElementById('plan-grid'),
  financeGrid: document.getElementById('finance-grid'),
  importButton: document.getElementById('import-button'),
  exportButton: document.getElementById('export-button'),
  newPatientButton: document.getElementById('new-patient-button'),
  importFile: document.getElementById('import-file')
};

const forms = {
  patient: document.getElementById('patient-form'),
  appointment: document.getElementById('appointment-form'),
  evolution: document.getElementById('evolution-form'),
  plan: document.getElementById('plan-form'),
  finance: document.getElementById('finance-form')
};

const inputs = {
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
  }
};

const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');

boot();

function boot() {
  bindNavigation();
  bindTopbar();
  bindForms();
  renderAll();
}

function bindNavigation() {
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      openSection(link.dataset.section);
    });
  });
}

function bindTopbar() {
  refs.exportButton.addEventListener('click', exportState);
  refs.importButton.addEventListener('click', () => refs.importFile.click());
  refs.importFile.addEventListener('change', importState);
  refs.newPatientButton.addEventListener('click', () => {
    openSection('pacientes');
    forms.patient.scrollIntoView({ behavior: 'smooth', block: 'start' });
    inputs.patient.name.focus();
  });
}

function bindForms() {
  forms.patient.addEventListener('submit', handlePatientSubmit);
  forms.appointment.addEventListener('submit', handleAppointmentSubmit);
  forms.evolution.addEventListener('submit', handleEvolutionSubmit);
  forms.plan.addEventListener('submit', handlePlanSubmit);
  forms.finance.addEventListener('submit', handleFinanceSubmit);

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
    if (!raw) return structuredClone(defaultState);
    const parsed = JSON.parse(raw);
    return {
      patients: Array.isArray(parsed.patients) ? parsed.patients : [],
      appointments: Array.isArray(parsed.appointments) ? parsed.appointments : [],
      evolutions: Array.isArray(parsed.evolutions) ? parsed.evolutions : [],
      plans: Array.isArray(parsed.plans) ? parsed.plans : [],
      finances: Array.isArray(parsed.finances) ? parsed.finances : []
    };
  } catch {
    return structuredClone(defaultState);
  }
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

function fullDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

function parseTags(text) {
  return text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getPatientName(patientId) {
  return state.patients.find((item) => item.id === patientId)?.name || 'Paciente removido';
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

function saveAndRender() {
  persist();
  renderAll();
}

function renderAll() {
  renderRequirements();
  renderMetrics();
  renderDashboard();
  renderWeekOverview();
  renderAppointmentTable();
  renderPatientCards();
  renderEvolutions();
  renderPlans();
  renderFinances();
  populatePatientSelects();
  toggleCancelButtons();
}

function renderRequirements() {
  refs.requirementsGrid.innerHTML = requirements.map((group) => `
    <article class="requirement-item">
      <h4>${safe(group.title)}</h4>
      <ul>${group.items.map((item) => `<li>${safe(item)}</li>`).join('')}</ul>
    </article>
  `).join('');

  refs.loopGrid.innerHTML = loop.map((item, index) => `
    <article class="loop-step" data-step="0${index + 1}">
      <strong>${safe(item.title)}</strong>
      <p>${safe(item.text)}</p>
    </article>
  `).join('');
}

function renderMetrics() {
  const today = todayISO();
  const currentMonth = today.slice(0, 7);
  const sessionsToday = state.appointments.filter((item) => item.date === today).length;
  const pendingFinances = state.finances.filter((item) => item.status !== 'pago');
  const paidThisMonth = state.finances
    .filter((item) => item.status === 'pago' && item.date.startsWith(currentMonth))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const metrics = [
    { label: 'pacientes ativos', value: String(state.patients.length) },
    { label: 'sessões hoje', value: String(sessionsToday) },
    { label: 'pendências financeiras', value: String(pendingFinances.length) },
    { label: 'receita paga no mês', value: money(paidThisMonth) }
  ];

  refs.heroMetrics.innerHTML = metrics.map((metric) => `
    <div class="metric">
      <span>${safe(metric.label)}</span>
      <strong>${safe(metric.value)}</strong>
    </div>
  `).join('');
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

  const statusMetrics = [
    { label: 'Em tratamento', value: state.patients.length },
    { label: 'Sessões 7 dias', value: weeklyAppointments.length },
    { label: 'Evoluções 7 dias', value: weeklyEvolutions.length },
    { label: 'Planos ativos', value: state.plans.length }
  ];

  refs.patientStatus.innerHTML = statusMetrics.map((metric) => `
    <div class="mini-metric">
      <span class="muted">${safe(metric.label)}</span>
      <strong>${safe(metric.value)}</strong>
    </div>
  `).join('');

  const queue = buildQueue();
  refs.queueList.innerHTML = queue.map((item) => `<li>${safe(item)}</li>`).join('');
}

function buildQueue() {
  const queue = [];
  if (!state.patients.length) queue.push('Cadastre o primeiro paciente para começar a operar.');
  if (!state.appointments.length) queue.push('Crie a primeira sessão na agenda.');
  if (state.appointments.length && !state.evolutions.length) queue.push('Registrar a primeira evolução clínica.');
  const overdue = state.finances.filter((item) => item.status !== 'pago' && item.date < todayISO()).length;
  if (overdue) queue.push(`${overdue} cobrança(s) em atraso precisando ação.`);
  if (!state.plans.length && state.patients.length) queue.push('Definir pelo menos um plano terapêutico ativo.');
  return queue.length ? queue : ['Operação sem pendências críticas agora.'];
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

function upsert(collection, payload) {
  const index = state[collection].findIndex((item) => item.id === payload.id);
  if (index >= 0) {
    state[collection][index] = payload;
  } else {
    state[collection].push(payload);
  }
  saveAndRender();
}

function removeById(collection, id) {
  state[collection] = state[collection].filter((item) => item.id !== id);
  saveAndRender();
}

function editPatient(id) {
  const item = state.patients.find((patient) => patient.id === id);
  if (!item) return;
  openSection('pacientes');
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
  openSection('agenda');
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
  openSection('evolucao');
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
  openSection('planos');
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
  openSection('financeiro');
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

function sortAppointments(list) {
  return [...list].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
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
  anchor.download = `fisio-backup-${todayISO()}.json`;
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
      state = normalizeState(parsed);
      saveAndRender();
      resetAllForms();
      alert('Dados importados com sucesso.');
    } catch {
      alert('Arquivo inválido.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function normalizeState(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
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

function resetAllForms() {
  resetPatientForm();
  resetAppointmentForm();
  resetEvolutionForm();
  resetPlanForm();
  resetFinanceForm();
}

function openSection(target) {
  navLinks.forEach((item) => item.classList.toggle('active', item.dataset.section === target));
  sections.forEach((section) => section.classList.toggle('active', section.id === `section-${target}`));
}
