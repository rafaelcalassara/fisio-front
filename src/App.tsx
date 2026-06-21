import { useEffect, useMemo, useState } from 'react';
import { getInitialSnapshot, login, logout, saveRemoteData, setupStudio } from './api';
import { adminTitles } from './constants';
import { cloneDefaultData, normalizeData, saveLocalData } from './data';
import { buildMetrics, buildQueue, getPatientName, getStudioInitials, getStudioName, getStudioSegment } from './domain';
import type {
  AdminSection,
  AppData,
  Appointment,
  AppointmentStatus,
  Evolution,
  FinanceEntry,
  FinanceStatus,
  Patient,
  Plan,
  StudioSetupPayload
} from './types';
import { downloadJson, formatLocalISO, fullDate, labelStatus, money, parseTags, shortDate, sortAppointments, statusTone, todayISO } from './utils';

type NoticeTone = 'neutral' | 'danger' | 'success';
type PageRoute = 'public' | 'login' | 'app';
const adminSections: AdminSection[] = ['dashboard', 'agenda', 'pacientes', 'evolucao', 'planos', 'financeiro', 'studio'];

interface RouteState {
  page: PageRoute;
  section: AdminSection;
}

interface NoticeState {
  message: string;
  tone: NoticeTone;
}

interface PatientFormState {
  id: string;
  name: string;
  age: string;
  complaint: string;
  frequency: string;
  tags: string;
}

interface AppointmentFormState {
  id: string;
  patientId: string;
  date: string;
  time: string;
  type: string;
  status: AppointmentStatus;
  fee: string;
  notes: string;
}

interface EvolutionFormState {
  id: string;
  patientId: string;
  date: string;
  pain: string;
  summary: string;
  next: string;
}

interface PlanFormState {
  id: string;
  patientId: string;
  title: string;
  goals: string;
  exercises: string;
}

interface FinanceFormState {
  id: string;
  patientId: string;
  description: string;
  date: string;
  amount: string;
  status: FinanceStatus;
}

interface SetupFormState extends StudioSetupPayload {
  passwordConfirm: string;
}

function emptyPatientForm(): PatientFormState {
  return { id: '', name: '', age: '', complaint: '', frequency: '', tags: '' };
}

function emptyAppointmentForm(): AppointmentFormState {
  return { id: '', patientId: '', date: todayISO(), time: '', type: '', status: 'confirmado', fee: '', notes: '' };
}

function emptyEvolutionForm(): EvolutionFormState {
  return { id: '', patientId: '', date: todayISO(), pain: '', summary: '', next: '' };
}

function emptyPlanForm(): PlanFormState {
  return { id: '', patientId: '', title: '', goals: '', exercises: '' };
}

function emptyFinanceForm(): FinanceFormState {
  return { id: '', patientId: '', description: '', date: todayISO(), amount: '', status: 'pendente' };
}

function emptySetupForm(): SetupFormState {
  return {
    studioName: '',
    studioSegment: 'Pilates e Fisioterapia',
    email: '',
    password: '',
    passwordConfirm: ''
  };
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function parseRoute(): RouteState {
  const hash = window.location.hash || '#/';
  if (hash.startsWith('#/app')) {
    const [, query = ''] = hash.split('?');
    const params = new URLSearchParams(query);
    const requested = params.get('section');
    const section = adminSections.includes(requested as AdminSection) ? (requested as AdminSection) : 'dashboard';
    return { page: 'app', section };
  }
  if (hash.startsWith('#/login')) return { page: 'login', section: 'dashboard' };
  return { page: 'public', section: 'dashboard' };
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [usesRemote, setUsesRemote] = useState(false);
  const [data, setData] = useState<AppData>(cloneDefaultData());
  const [studioForm, setStudioForm] = useState(cloneDefaultData().studio);
  const [route, setRoute] = useState<RouteState>(() => parseRoute());
  const [notice, setNotice] = useState<NoticeState>({ message: '', tone: 'neutral' });
  const [busy, setBusy] = useState(false);
  const [setupForm, setSetupForm] = useState<SetupFormState>(emptySetupForm());
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [patientForm, setPatientForm] = useState<PatientFormState>(emptyPatientForm());
  const [appointmentForm, setAppointmentForm] = useState<AppointmentFormState>(emptyAppointmentForm());
  const [evolutionForm, setEvolutionForm] = useState<EvolutionFormState>(emptyEvolutionForm());
  const [planForm, setPlanForm] = useState<PlanFormState>(emptyPlanForm());
  const [financeForm, setFinanceForm] = useState<FinanceFormState>(emptyFinanceForm());
  const [studioSaving, setStudioSaving] = useState(false);

  useEffect(() => {
    void bootstrap();
  }, []);

  useEffect(() => {
    const onHashChange = () => setRoute(parseRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (!authenticated && route.page === 'app') {
      navigateTo('#/login');
    }
  }, [authenticated, route.page]);

  async function bootstrap() {
    setLoading(true);
    try {
      const snapshot = await getInitialSnapshot();
      setAuthenticated(snapshot.auth.status === 'authenticated');
      setAuthUserId(snapshot.auth.userId ?? null);
      setUserEmail(snapshot.auth.email ?? '');
      setUsesRemote(snapshot.usesRemote);
      setData(snapshot.data);
      setStudioForm(snapshot.data.studio);
      setSetupForm((current) => ({
        ...current,
        studioName: snapshot.data.studio.name || current.studioName,
        studioSegment: snapshot.data.studio.segment || current.studioSegment,
        email: snapshot.data.studio.email || current.email
      }));
      setLoginForm((current) => ({ ...current, email: snapshot.auth.email ?? snapshot.data.studio.email ?? current.email }));
    } catch (error) {
      console.error(error);
      setNotice({ message: 'Falha ao carregar o sistema.', tone: 'danger' });
    } finally {
      setLoading(false);
    }
  }

  function navigateTo(hash: string) {
    window.location.hash = hash;
    setRoute(parseRoute());
  }

  const metrics = useMemo(() => buildMetrics(data), [data]);
  const queue = useMemo(() => buildQueue(data), [data]);

  async function persist(next: AppData, successMessage?: string) {
    setData(next);
    try {
      await saveRemoteData(next);
      setUsesRemote(true);
      if (successMessage) setNotice({ message: successMessage, tone: 'success' });
    } catch (error) {
      console.error(error);
      saveLocalData(next, authUserId ?? undefined);
      setUsesRemote(false);
      setNotice({ message: 'Salvo localmente. Banco remoto ainda não está pronto.', tone: 'danger' });
    }
  }

  async function handleSetupSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (setupForm.password.length < 6) {
      setNotice({ message: 'A senha precisa ter pelo menos 6 caracteres.', tone: 'danger' });
      return;
    }
    if (setupForm.password !== setupForm.passwordConfirm) {
      setNotice({ message: 'As senhas não conferem.', tone: 'danger' });
      return;
    }

    try {
      setBusy(true);
      await setupStudio({
        studioName: setupForm.studioName.trim(),
        studioSegment: setupForm.studioSegment.trim(),
        email: setupForm.email.trim().toLowerCase(),
        password: setupForm.password
      });
      setNotice({ message: 'Estúdio configurado com sucesso.', tone: 'success' });
      await bootstrap();
      navigateTo('#/app');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao configurar o estúdio.';
      if (message.includes('sessão não foi iniciada automaticamente')) {
        setNotice({ message: 'Conta criada. Se o acesso não entrou sozinho, faça login com o e-mail e senha criados.', tone: 'success' });
        await bootstrap();
        navigateTo('#/login');
      } else {
        setNotice({ message, tone: 'danger' });
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setBusy(true);
      await login(loginForm.email.trim().toLowerCase(), loginForm.password);
      setNotice({ message: '', tone: 'neutral' });
      await bootstrap();
      navigateTo('#/app');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Credenciais inválidas.';
      setNotice({ message, tone: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error(error);
    }
    setAuthenticated(false);
    setAuthUserId(null);
    setUserEmail('');
    navigateTo('#/login');
  }

  function updateData(mutator: (current: AppData) => AppData, successMessage?: string) {
    const next = mutator(structuredClone(data));
    void persist(normalizeData(next), successMessage);
  }

  function openAdminSection(section: AdminSection) {
    navigateTo(section === 'dashboard' ? '#/app' : `#/app?section=${section}`);
  }

  function upsertPatient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: Patient = {
      id: patientForm.id || uid('patient'),
      name: patientForm.name.trim(),
      age: patientForm.age.trim(),
      complaint: patientForm.complaint.trim(),
      frequency: patientForm.frequency.trim(),
      tags: parseTags(patientForm.tags)
    };
    updateData((current) => {
      const index = current.patients.findIndex((item) => item.id === payload.id);
      if (index >= 0) current.patients[index] = payload;
      else current.patients.push(payload);
      return current;
    }, 'Paciente salvo.');
    setPatientForm(emptyPatientForm());
  }

  function upsertAppointment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data.patients.length) {
      setNotice({ message: 'Cadastre um paciente primeiro.', tone: 'danger' });
      return;
    }
    const payload: Appointment = {
      id: appointmentForm.id || uid('appointment'),
      patientId: appointmentForm.patientId,
      date: appointmentForm.date,
      time: appointmentForm.time,
      type: appointmentForm.type.trim(),
      status: appointmentForm.status,
      fee: appointmentForm.fee,
      notes: appointmentForm.notes.trim()
    };
    updateData((current) => {
      const index = current.appointments.findIndex((item) => item.id === payload.id);
      if (index >= 0) current.appointments[index] = payload;
      else current.appointments.push(payload);
      return current;
    }, 'Sessão salva.');
    setAppointmentForm(emptyAppointmentForm());
  }

  function upsertEvolution(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data.patients.length) {
      setNotice({ message: 'Cadastre um paciente primeiro.', tone: 'danger' });
      return;
    }
    const payload: Evolution = {
      id: evolutionForm.id || uid('evolution'),
      patientId: evolutionForm.patientId,
      date: evolutionForm.date,
      pain: evolutionForm.pain,
      summary: evolutionForm.summary.trim(),
      next: evolutionForm.next.trim()
    };
    updateData((current) => {
      const index = current.evolutions.findIndex((item) => item.id === payload.id);
      if (index >= 0) current.evolutions[index] = payload;
      else current.evolutions.push(payload);
      return current;
    }, 'Evolução salva.');
    setEvolutionForm(emptyEvolutionForm());
  }

  function upsertPlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data.patients.length) {
      setNotice({ message: 'Cadastre um paciente primeiro.', tone: 'danger' });
      return;
    }
    const payload: Plan = {
      id: planForm.id || uid('plan'),
      patientId: planForm.patientId,
      title: planForm.title.trim(),
      goals: planForm.goals.trim(),
      exercises: planForm.exercises.trim()
    };
    updateData((current) => {
      const index = current.plans.findIndex((item) => item.id === payload.id);
      if (index >= 0) current.plans[index] = payload;
      else current.plans.push(payload);
      return current;
    }, 'Plano salvo.');
    setPlanForm(emptyPlanForm());
  }

  function upsertFinance(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data.patients.length) {
      setNotice({ message: 'Cadastre um paciente primeiro.', tone: 'danger' });
      return;
    }
    const payload: FinanceEntry = {
      id: financeForm.id || uid('finance'),
      patientId: financeForm.patientId,
      description: financeForm.description.trim(),
      date: financeForm.date,
      amount: financeForm.amount,
      status: financeForm.status
    };
    updateData((current) => {
      const index = current.finances.findIndex((item) => item.id === payload.id);
      if (index >= 0) current.finances[index] = payload;
      else current.finances.push(payload);
      return current;
    }, 'Lançamento salvo.');
    setFinanceForm(emptyFinanceForm());
  }

  function saveStudio(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStudioSaving(true);
    updateData((current) => {
      current.studio = { ...studioForm };
      return current;
    }, 'Perfil do estúdio salvo.');
    setTimeout(() => setStudioSaving(false), 150);
  }

  function removePatient(id: string) {
    updateData((current) => {
      current.patients = current.patients.filter((item) => item.id !== id);
      current.appointments = current.appointments.filter((item) => item.patientId !== id);
      current.evolutions = current.evolutions.filter((item) => item.patientId !== id);
      current.plans = current.plans.filter((item) => item.patientId !== id);
      current.finances = current.finances.filter((item) => item.patientId !== id);
      return current;
    }, 'Paciente removido.');
  }

  function removeEntity<K extends keyof Pick<AppData, 'appointments' | 'evolutions' | 'plans' | 'finances'>>(collection: K, id: string, message: string) {
    updateData((current) => {
      current[collection] = current[collection].filter((item) => item.id !== id) as never;
      return current;
    }, message);
  }

  function importBackup(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        const normalized = normalizeData(parsed);
        void persist(normalized, 'Dados importados com sucesso.');
        setPatientForm(emptyPatientForm());
        setAppointmentForm(emptyAppointmentForm());
        setEvolutionForm(emptyEvolutionForm());
        setPlanForm(emptyPlanForm());
        setFinanceForm(emptyFinanceForm());
      } catch {
        setNotice({ message: 'Arquivo inválido.', tone: 'danger' });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  function exportBackup() {
    downloadJson(data, `pulse-studio-backup-${todayISO()}.json`);
  }

  function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1_200_000) {
      setNotice({ message: 'Use uma imagem de até 1,2 MB para o logo do estúdio.', tone: 'danger' });
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const logoDataUrl = String(reader.result || '');
      setStudioForm((current) => ({ ...current, logoDataUrl }));
      updateData((current) => {
        current.studio.logoDataUrl = logoDataUrl;
        return current;
      }, 'Logo do estúdio atualizada.');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  function studioMeta() {
    const bits = [getStudioSegment(data)];
    if (data.studio.email) bits.push(data.studio.email);
    if (data.studio.phone) bits.push(data.studio.phone);
    return bits.join(' • ') || 'Configure nome, contatos e logo na aba Estúdio.';
  }

  function renderLogo() {
    return data.studio.logoDataUrl ? (
      <img className="logo-image" src={data.studio.logoDataUrl} alt="Logo do estúdio" />
    ) : (
      <span className="logo-fallback">{getStudioInitials(data)}</span>
    );
  }

  if (loading) {
    return (
      <div className="auth-page-shell">
        <section className="auth-page-card card">
          <p>Carregando Pulse Studio…</p>
        </section>
      </div>
    );
  }

  if (route.page === 'public') {
    return <PublicLanding />;
  }

  if (route.page === 'login' || !authenticated) {
    return (
      <main className="auth-page-shell">
        <section className="auth-page-card card">
          <div className="auth-page-topbar">
            <a className="ghost-inline" href="#/">
              Voltar para o site
            </a>
          </div>
          <div className="auth-page-grid">
            <div className="auth-page-copy">
              <div className="marketing-brand">
                <div className="product-mark">P</div>
                <div>
                  <strong>Pulse Studio</strong>
                  <span>Acesso do estúdio</span>
                </div>
              </div>
              <h1 id="auth-title">Entrar ou configurar primeiro acesso</h1>
              <p id="auth-subtitle">Use o login se a conta já existir ou configure o primeiro acesso no Supabase.</p>
              <p className="muted">O ambiente operacional fica separado da landing e leva o gestor direto para o sistema.</p>
            </div>
            <div>
              <form className="entity-form" onSubmit={handleLoginSubmit}>
                <div className="form-grid single-column">
                  <label><span>E-mail</span><input type="email" value={loginForm.email} onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))} required /></label>
                  <label><span>Senha</span><input type="password" value={loginForm.password} onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))} required /></label>
                </div>
                <div className="form-actions">
                  <button className="primary-btn" type="submit" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
                </div>
              </form>

              <div className="section-heading compact auth-divider"><div><p className="eyebrow">PRIMEIRO ACESSO</p><h3>Configurar estúdio</h3></div></div>
              <form className="entity-form" onSubmit={handleSetupSubmit}>
                <div className="form-grid">
                  <label><span>Nome do estúdio</span><input value={setupForm.studioName} onChange={(event) => setSetupForm((current) => ({ ...current, studioName: event.target.value }))} required /></label>
                  <label><span>Segmento</span><input value={setupForm.studioSegment} onChange={(event) => setSetupForm((current) => ({ ...current, studioSegment: event.target.value }))} required /></label>
                  <label><span>E-mail de acesso</span><input type="email" value={setupForm.email} onChange={(event) => setSetupForm((current) => ({ ...current, email: event.target.value }))} required /></label>
                  <label><span>Senha</span><input type="password" minLength={6} value={setupForm.password} onChange={(event) => setSetupForm((current) => ({ ...current, password: event.target.value }))} required /></label>
                  <label><span>Confirmar senha</span><input type="password" minLength={6} value={setupForm.passwordConfirm} onChange={(event) => setSetupForm((current) => ({ ...current, passwordConfirm: event.target.value }))} required /></label>
                </div>
                <div className="form-actions">
                  <button className="ghost-btn" type="submit" disabled={busy}>{busy ? 'Configurando…' : 'Configurar estúdio'}</button>
                </div>
              </form>
              <p className="auth-note" data-tone={notice.tone}>{notice.message}</p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="admin-app">
      <aside className="sidebar admin-sidebar">
        <div>
          <div className="brand studio-branding">
            <div className="studio-logo-shell">{renderLogo()}</div>
            <div>
              <strong>{getStudioName(data)}</strong>
              <span>{getStudioSegment(data)}</span>
            </div>
          </div>
          <nav className="nav admin-nav">
            {(['dashboard', 'agenda', 'pacientes', 'evolucao', 'planos', 'financeiro', 'studio'] as AdminSection[]).map((section) => (
              <button
                key={section}
                className={`nav-link admin-link ${route.section === section ? 'active' : ''}`}
                onClick={() => openAdminSection(section)}
                type="button"
              >
                {adminTitles[section]}
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer admin-footer">
          <p>Ambiente interno do estúdio.</p>
          <span>{usesRemote ? 'Dados sincronizados com Supabase.' : 'Rodando com fallback local até o banco remoto ficar pronto.'}</span>
        </div>
      </aside>

      <main className="content admin-content">
        <header className="topbar admin-topbar">
          <div>
            <p className="eyebrow">PAINEL DE GESTÃO</p>
            <h1>{adminTitles[route.section]}</h1>
          </div>
          <div className="topbar-actions">
            <label className="ghost-btn" htmlFor="admin-import-file">Importar backup</label>
            <button className="ghost-btn" id="admin-export-button" type="button" onClick={exportBackup}>Exportar backup</button>
            <button className="primary-btn" id="logout-button" type="button" onClick={handleLogout}>Sair</button>
          </div>
          <input id="admin-import-file" type="file" accept="application/json" hidden onChange={importBackup} />
        </header>

        <p className="auth-note" data-tone={notice.tone}>{notice.message || `${userEmail} • ${usesRemote ? 'Supabase OK' : 'fallback local ativo'}`}</p>

        <section className={`admin-section ${route.section === 'dashboard' ? 'active' : ''}`} id="admin-section-dashboard">
          <div className="dashboard-grid">
            <article className="card span-3 studio-summary-card">
              <div className="studio-summary-row">
                <div className="studio-logo-shell large">{renderLogo()}</div>
                <div>
                  <p className="eyebrow">ESTÚDIO</p>
                  <h2>{getStudioName(data)}</h2>
                  <p className="muted">{studioMeta()}</p>
                </div>
              </div>
            </article>

            <article className="card span-2">
              <div className="section-heading compact"><div><p className="eyebrow">HOJE</p><h3>Agenda do dia</h3></div></div>
              <div className="agenda-list" id="agenda-list">
                {sortAppointments(data.appointments.filter((item) => item.date === todayISO())).map((item) => (
                  <article className="agenda-item" key={item.id}>
                    <div className="time-pill">{item.time}</div>
                    <div className="agenda-main">
                      <strong>{getPatientName(data, item.patientId)}</strong>
                      <div className="meta">{item.type}</div>
                      <div className="muted">{item.notes || 'Sem observações'}</div>
                    </div>
                    <span className={`status-chip ${statusTone(item.status)}`}>{labelStatus(item.status)}</span>
                  </article>
                ))}
                {!data.appointments.filter((item) => item.date === todayISO()).length && <div className="empty-state"><p>Nenhuma sessão cadastrada para hoje.</p></div>}
              </div>
            </article>

            <article className="card">
              <div className="section-heading compact"><div><p className="eyebrow">MÉTRICAS</p><h3>Status rápido</h3></div></div>
              <div className="patient-status" id="patient-status">
                {metrics.map((metric) => (
                  <div className="mini-metric" key={metric.label}>
                    <span className="muted">{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="card span-3">
              <div className="section-heading compact"><div><p className="eyebrow">OPERAÇÃO</p><h3>Fila de atenção</h3></div></div>
              <ul className="check-list" id="queue-list">
                {queue.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          </div>
        </section>

        <section className={`admin-section ${route.section === 'agenda' ? 'active' : ''}`} id="admin-section-agenda">
          <article className="card">
            <div className="section-heading compact"><div><p className="eyebrow">AGENDA</p><h3>Criar e gerenciar sessões</h3></div></div>
            <form className="entity-form" onSubmit={upsertAppointment}>
              <div className="form-grid">
                <label><span>Paciente</span><select value={appointmentForm.patientId} onChange={(event) => setAppointmentForm((current) => ({ ...current, patientId: event.target.value }))} required>{!data.patients.length ? <option value="">Cadastre um paciente primeiro</option> : <><option value="">Selecione</option>{data.patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}</>}</select></label>
                <label><span>Data</span><input type="date" value={appointmentForm.date} onChange={(event) => setAppointmentForm((current) => ({ ...current, date: event.target.value }))} required /></label>
                <label><span>Hora</span><input type="time" value={appointmentForm.time} onChange={(event) => setAppointmentForm((current) => ({ ...current, time: event.target.value }))} required /></label>
                <label><span>Tipo</span><input value={appointmentForm.type} onChange={(event) => setAppointmentForm((current) => ({ ...current, type: event.target.value }))} required /></label>
                <label><span>Status</span><select value={appointmentForm.status} onChange={(event) => setAppointmentForm((current) => ({ ...current, status: event.target.value as AppointmentStatus }))}><option value="confirmado">Confirmado</option><option value="pendente">Pendente</option><option value="faltou">Faltou</option><option value="concluido">Concluído</option><option value="cancelado">Cancelado</option></select></label>
                <label><span>Valor da sessão</span><input type="number" min="0" step="0.01" value={appointmentForm.fee} onChange={(event) => setAppointmentForm((current) => ({ ...current, fee: event.target.value }))} /></label>
              </div>
              <label><span>Observações</span><textarea rows={3} value={appointmentForm.notes} onChange={(event) => setAppointmentForm((current) => ({ ...current, notes: event.target.value }))} /></label>
              <div className="form-actions"><button className="primary-btn" id="appointment-submit" type="submit">{appointmentForm.id ? 'Atualizar sessão' : 'Salvar sessão'}</button><button className="ghost-btn" type="button" onClick={() => setAppointmentForm(emptyAppointmentForm())}>Cancelar edição</button></div>
            </form>

            <div className="week-grid" id="week-grid">
              {Array.from({ length: 5 }, (_, index) => {
                const day = new Date();
                day.setDate(day.getDate() + index);
                const iso = formatLocalISO(day);
                const list = sortAppointments(data.appointments.filter((item) => item.date === iso));
                const dayLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(day).replace('.', '');
                return (
                  <article className="day-column" key={iso}>
                    <h4>{dayLabel} • {shortDate(iso)}</h4>
                    {list.length ? <ul>{list.map((item) => <li key={item.id}>{item.time} • {getPatientName(data, item.patientId)}</li>)}</ul> : <p className="muted">Sem sessões.</p>}
                  </article>
                );
              })}
            </div>

            <div className="entity-list" id="appointments-table">
              {sortAppointments(data.appointments).map((item) => (
                <article className="entity-card" key={item.id}>
                  <div>
                    <strong>{getPatientName(data, item.patientId)}</strong>
                    <p>{fullDate(item.date)} • {item.time} • {item.type}</p>
                    <p>{item.notes || 'Sem observações'}{item.fee ? ` • ${money(item.fee)}` : ''}</p>
                  </div>
                  <div className="entity-actions">
                    <span className={`status-chip ${statusTone(item.status)}`}>{labelStatus(item.status)}</span>
                    <button className="ghost-inline" type="button" onClick={() => setAppointmentForm(item)}>Editar</button>
                    <button className="danger-inline" type="button" onClick={() => removeEntity('appointments', item.id, 'Sessão removida.')}>Excluir</button>
                  </div>
                </article>
              ))}
              {!data.appointments.length && <div className="empty-state"><p>Nenhuma sessão cadastrada ainda.</p></div>}
            </div>
          </article>
        </section>

        <section className={`admin-section ${route.section === 'pacientes' ? 'active' : ''}`} id="admin-section-pacientes">
          <article className="card">
            <div className="section-heading compact"><div><p className="eyebrow">PACIENTES</p><h3>Cadastro e acompanhamento</h3></div></div>
            <form className="entity-form" onSubmit={upsertPatient}>
              <div className="form-grid">
                <label><span>Nome</span><input value={patientForm.name} onChange={(event) => setPatientForm((current) => ({ ...current, name: event.target.value }))} required /></label>
                <label><span>Idade</span><input type="number" min="0" max="120" value={patientForm.age} onChange={(event) => setPatientForm((current) => ({ ...current, age: event.target.value }))} /></label>
                <label><span>Queixa principal</span><input value={patientForm.complaint} onChange={(event) => setPatientForm((current) => ({ ...current, complaint: event.target.value }))} required /></label>
                <label><span>Frequência</span><input value={patientForm.frequency} onChange={(event) => setPatientForm((current) => ({ ...current, frequency: event.target.value }))} /></label>
              </div>
              <label><span>Tags</span><input value={patientForm.tags} onChange={(event) => setPatientForm((current) => ({ ...current, tags: event.target.value }))} /></label>
              <div className="form-actions"><button className="primary-btn" id="patient-submit" type="submit">{patientForm.id ? 'Atualizar paciente' : 'Salvar paciente'}</button><button className="ghost-btn" type="button" onClick={() => setPatientForm(emptyPatientForm())}>Cancelar edição</button></div>
            </form>
            <div className="patient-cards" id="patient-cards">
              {data.patients.map((patient) => {
                const appointments = data.appointments.filter((item) => item.patientId === patient.id).length;
                const evolutions = data.evolutions.filter((item) => item.patientId === patient.id).length;
                return (
                  <article className="patient-card" key={patient.id}>
                    <strong>{patient.name}</strong>
                    <p>{patient.age ? `${patient.age} anos • ` : ''}{patient.complaint}{patient.frequency ? ` • ${patient.frequency}` : ''}</p>
                    <p className="muted">{appointments} sessão(ões) • {evolutions} evolução(ões)</p>
                    <div className="tags">{patient.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
                    <div className="entity-actions compact-actions">
                      <button className="ghost-inline" type="button" onClick={() => setPatientForm({ ...patient, tags: patient.tags.join(', ') })}>Editar</button>
                      <button className="danger-inline" type="button" onClick={() => removePatient(patient.id)}>Excluir</button>
                    </div>
                  </article>
                );
              })}
              {!data.patients.length && <div className="empty-state"><p>Nenhum paciente cadastrado ainda.</p></div>}
            </div>
          </article>
        </section>

        <section className={`admin-section ${route.section === 'evolucao' ? 'active' : ''}`} id="admin-section-evolucao">
          <article className="card">
            <div className="section-heading compact"><div><p className="eyebrow">EVOLUÇÃO</p><h3>Prontuário por atendimento</h3></div></div>
            <form className="entity-form" onSubmit={upsertEvolution}>
              <div className="form-grid">
                <label><span>Paciente</span><select value={evolutionForm.patientId} onChange={(event) => setEvolutionForm((current) => ({ ...current, patientId: event.target.value }))} required>{!data.patients.length ? <option value="">Cadastre um paciente primeiro</option> : <><option value="">Selecione</option>{data.patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}</>}</select></label>
                <label><span>Data</span><input type="date" value={evolutionForm.date} onChange={(event) => setEvolutionForm((current) => ({ ...current, date: event.target.value }))} required /></label>
                <label><span>Dor (0-10)</span><input type="number" min="0" max="10" value={evolutionForm.pain} onChange={(event) => setEvolutionForm((current) => ({ ...current, pain: event.target.value }))} /></label>
              </div>
              <label><span>Resumo clínico</span><textarea rows={4} value={evolutionForm.summary} onChange={(event) => setEvolutionForm((current) => ({ ...current, summary: event.target.value }))} required /></label>
              <label><span>Próximos passos</span><textarea rows={3} value={evolutionForm.next} onChange={(event) => setEvolutionForm((current) => ({ ...current, next: event.target.value }))} /></label>
              <div className="form-actions"><button className="primary-btn" id="evolution-submit" type="submit">{evolutionForm.id ? 'Atualizar evolução' : 'Salvar evolução'}</button><button className="ghost-btn" type="button" onClick={() => setEvolutionForm(emptyEvolutionForm())}>Cancelar edição</button></div>
            </form>
            <div className="timeline" id="timeline">
              {[...data.evolutions].sort((a, b) => `${b.date}${b.id}`.localeCompare(`${a.date}${a.id}`)).map((item) => (
                <article className="timeline-item" key={item.id}>
                  <div className="timeline-date">{fullDate(item.date)}</div>
                  <div>
                    <strong>{getPatientName(data, item.patientId)}{item.pain !== '' ? ` • dor ${item.pain}/10` : ''}</strong>
                    <p>{item.summary}</p>
                    <p className="muted">{item.next || 'Sem próximos passos registrados.'}</p>
                    <div className="entity-actions compact-actions">
                      <button className="ghost-inline" type="button" onClick={() => setEvolutionForm(item)}>Editar</button>
                      <button className="danger-inline" type="button" onClick={() => removeEntity('evolutions', item.id, 'Evolução removida.')}>Excluir</button>
                    </div>
                  </div>
                </article>
              ))}
              {!data.evolutions.length && <div className="empty-state"><p>Nenhuma evolução registrada ainda.</p></div>}
            </div>
          </article>
        </section>

        <section className={`admin-section ${route.section === 'planos' ? 'active' : ''}`} id="admin-section-planos">
          <article className="card">
            <div className="section-heading compact"><div><p className="eyebrow">PLANOS</p><h3>Planos terapêuticos</h3></div></div>
            <form className="entity-form" onSubmit={upsertPlan}>
              <div className="form-grid">
                <label><span>Paciente</span><select value={planForm.patientId} onChange={(event) => setPlanForm((current) => ({ ...current, patientId: event.target.value }))} required>{!data.patients.length ? <option value="">Cadastre um paciente primeiro</option> : <><option value="">Selecione</option>{data.patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}</>}</select></label>
                <label><span>Título do plano</span><input value={planForm.title} onChange={(event) => setPlanForm((current) => ({ ...current, title: event.target.value }))} required /></label>
              </div>
              <label><span>Objetivos</span><textarea rows={3} value={planForm.goals} onChange={(event) => setPlanForm((current) => ({ ...current, goals: event.target.value }))} required /></label>
              <label><span>Exercícios / protocolo</span><textarea rows={4} value={planForm.exercises} onChange={(event) => setPlanForm((current) => ({ ...current, exercises: event.target.value }))} /></label>
              <div className="form-actions"><button className="primary-btn" id="plan-submit" type="submit">{planForm.id ? 'Atualizar plano' : 'Salvar plano'}</button><button className="ghost-btn" type="button" onClick={() => setPlanForm(emptyPlanForm())}>Cancelar edição</button></div>
            </form>
            <div className="plan-grid" id="plan-grid">
              {data.plans.map((item) => (
                <article className="plan-card" key={item.id}>
                  <strong>{item.title}</strong>
                  <p>{getPatientName(data, item.patientId)}</p>
                  <p>{item.goals}</p>
                  <p className="muted">{item.exercises || 'Sem exercícios detalhados.'}</p>
                  <div className="entity-actions compact-actions">
                    <button className="ghost-inline" type="button" onClick={() => setPlanForm(item)}>Editar</button>
                    <button className="danger-inline" type="button" onClick={() => removeEntity('plans', item.id, 'Plano removido.')}>Excluir</button>
                  </div>
                </article>
              ))}
              {!data.plans.length && <div className="empty-state"><p>Nenhum plano terapêutico cadastrado ainda.</p></div>}
            </div>
          </article>
        </section>

        <section className={`admin-section ${route.section === 'financeiro' ? 'active' : ''}`} id="admin-section-financeiro">
          <article className="card">
            <div className="section-heading compact"><div><p className="eyebrow">FINANCEIRO</p><h3>Recebimentos e pendências</h3></div></div>
            <form className="entity-form" onSubmit={upsertFinance}>
              <div className="form-grid">
                <label><span>Paciente</span><select value={financeForm.patientId} onChange={(event) => setFinanceForm((current) => ({ ...current, patientId: event.target.value }))} required>{!data.patients.length ? <option value="">Cadastre um paciente primeiro</option> : <><option value="">Selecione</option>{data.patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}</>}</select></label>
                <label><span>Descrição</span><input value={financeForm.description} onChange={(event) => setFinanceForm((current) => ({ ...current, description: event.target.value }))} required /></label>
                <label><span>Vencimento</span><input type="date" value={financeForm.date} onChange={(event) => setFinanceForm((current) => ({ ...current, date: event.target.value }))} required /></label>
                <label><span>Valor</span><input type="number" min="0" step="0.01" value={financeForm.amount} onChange={(event) => setFinanceForm((current) => ({ ...current, amount: event.target.value }))} required /></label>
                <label><span>Status</span><select value={financeForm.status} onChange={(event) => setFinanceForm((current) => ({ ...current, status: event.target.value as FinanceStatus }))}><option value="pendente">Pendente</option><option value="pago">Pago</option><option value="atrasado">Atrasado</option></select></label>
              </div>
              <div className="form-actions"><button className="primary-btn" id="finance-submit" type="submit">{financeForm.id ? 'Atualizar lançamento' : 'Salvar lançamento'}</button><button className="ghost-btn" type="button" onClick={() => setFinanceForm(emptyFinanceForm())}>Cancelar edição</button></div>
            </form>
            <div className="finance-grid" id="finance-grid">
              {data.finances.map((item) => (
                <article className="finance-card" key={item.id}>
                  <strong>{item.description}</strong>
                  <p>{getPatientName(data, item.patientId)} • {fullDate(item.date)}</p>
                  <p>{money(item.amount)}</p>
                  <div className="entity-actions compact-actions">
                    <span className={`status-chip ${statusTone(item.status)}`}>{labelStatus(item.status)}</span>
                    <button className="ghost-inline" type="button" onClick={() => setFinanceForm(item)}>Editar</button>
                    <button className="danger-inline" type="button" onClick={() => removeEntity('finances', item.id, 'Lançamento removido.')}>Excluir</button>
                  </div>
                </article>
              ))}
              {!data.finances.length && <div className="empty-state"><p>Nenhum lançamento financeiro cadastrado ainda.</p></div>}
            </div>
          </article>
        </section>

        <section className={`admin-section ${route.section === 'studio' ? 'active' : ''}`} id="admin-section-studio">
          <article className="card">
            <div className="section-heading compact"><div><p className="eyebrow">ESTÚDIO</p><h3>Perfil e identidade do cliente</h3></div></div>
            <div className="studio-profile-grid">
              <div className="studio-logo-panel">
                <div className="studio-logo-shell xl">{studioForm.logoDataUrl ? <img className="logo-image" src={studioForm.logoDataUrl} alt="Logo do estúdio" /> : renderLogo()}</div>
                <p className="muted">O logo enviado aqui pertence ao estúdio e aparece só no ambiente de gestão dele.</p>
                <label className="upload-button" htmlFor="studio-logo-input">Subir logo do estúdio</label>
                <input id="studio-logo-input" type="file" accept="image/*" hidden onChange={handleLogoUpload} />
                <button className="ghost-inline" id="remove-studio-logo" type="button" onClick={() => {
                  setStudioForm((current) => ({ ...current, logoDataUrl: '' }));
                  updateData((current) => { current.studio.logoDataUrl = ''; return current; }, 'Logo removido.');
                }}>Remover logo</button>
              </div>
              <form className="entity-form" onSubmit={saveStudio}>
                <div className="form-grid">
                  <label><span>Nome do estúdio</span><input id="studio-name" value={studioForm.name} onChange={(event) => setStudioForm((current) => ({ ...current, name: event.target.value }))} required /></label>
                  <label><span>Segmento</span><input id="studio-segment" value={studioForm.segment} onChange={(event) => setStudioForm((current) => ({ ...current, segment: event.target.value }))} required /></label>
                  <label><span>E-mail</span><input id="studio-email" type="email" value={studioForm.email} onChange={(event) => setStudioForm((current) => ({ ...current, email: event.target.value }))} /></label>
                  <label><span>Telefone</span><input id="studio-phone" value={studioForm.phone} onChange={(event) => setStudioForm((current) => ({ ...current, phone: event.target.value }))} /></label>
                  <label className="span-2-field"><span>Endereço</span><input id="studio-address" value={studioForm.address} onChange={(event) => setStudioForm((current) => ({ ...current, address: event.target.value }))} /></label>
                </div>
                <label><span>Descrição interna</span><textarea id="studio-bio" rows={4} value={studioForm.bio} onChange={(event) => setStudioForm((current) => ({ ...current, bio: event.target.value }))} /></label>
                <div className="form-actions"><button className="primary-btn" id="studio-submit" type="submit">{studioSaving ? 'Salvando…' : 'Salvar perfil do estúdio'}</button></div>
              </form>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

function PublicLanding() {
  return (
    <div className="public-app page-shell">
      <header className="marketing-header">
        <div className="marketing-brand">
          <div className="product-mark">P</div>
          <div>
            <strong>Pulse Studio</strong>
            <span>Gestão para estúdios de pilates e fisioterapia</span>
          </div>
        </div>
        <div className="marketing-actions">
          <a className="ghost-btn" href="#/login">Acessar gerenciamento</a>
        </div>
      </header>

      <main className="marketing-main">
        <section className="marketing-hero card hero-surface">
          <div className="hero-copy">
            <p className="eyebrow">SOFTWARE DE OPERAÇÃO</p>
            <h1>Agenda, prontuário, planos e financeiro num sistema pensado para o estúdio.</h1>
            <p>O Pulse Studio organiza o operacional inteiro: paciente, sessão, evolução, cobranças e visão do estúdio em uma experiência simples.</p>
            <div className="hero-cta-row">
              <a className="primary-btn" href="#/login">Entrar no ambiente de gestão</a>
              <a className="ghost-btn" href="#features-section">Ver funcionalidades</a>
            </div>
          </div>
          <div className="hero-proof-grid">
            <article className="proof-card"><strong>Agenda organizada</strong><p>Controle diário, semanal e por paciente.</p></article>
            <article className="proof-card"><strong>Prontuário simples</strong><p>Evolução por sessão com histórico rápido.</p></article>
            <article className="proof-card"><strong>Financeiro operacional</strong><p>Pendências, lançamentos e visão prática do caixa.</p></article>
            <article className="proof-card"><strong>Perfil do estúdio</strong><p>Logo e dados próprios dentro do ambiente de gestão.</p></article>
          </div>
        </section>

        <section className="marketing-section" id="features-section">
          <div className="section-heading marketing-section-heading"><div><p className="eyebrow">FUNCIONALIDADES</p><h2>Tudo o que o sistema cobre na operação do estúdio</h2></div></div>
          <div className="feature-grid">
            <article className="feature-card card"><h3>Agenda operacional</h3><p>Criação, edição e acompanhamento de sessões com status e valor por atendimento.</p></article>
            <article className="feature-card card"><h3>Cadastro de pacientes</h3><p>Ficha rápida com dados principais, tags e visão resumida do histórico do paciente.</p></article>
            <article className="feature-card card"><h3>Evolução clínica</h3><p>Registro por sessão com dor, resumo clínico e próximos passos.</p></article>
            <article className="feature-card card"><h3>Planos terapêuticos</h3><p>Metas, protocolos e exercícios por paciente dentro do mesmo fluxo.</p></article>
            <article className="feature-card card"><h3>Financeiro básico</h3><p>Lançamentos, status de pagamento e visão de pendências sem planilha paralela.</p></article>
            <article className="feature-card card"><h3>Perfil do estúdio</h3><p>Upload da identidade visual do cliente e dados administrativos no painel interno.</p></article>
          </div>
        </section>
      </main>
    </div>
  );
}
