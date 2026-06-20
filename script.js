const data = {
  metrics: [
    { label: 'pacientes ativos', value: '48' },
    { label: 'sessões hoje', value: '12' },
    { label: 'inadimplentes', value: '5' },
    { label: 'ocupação da agenda', value: '83%' }
  ],
  requirements: [
    {
      title: 'Já mapeado de forma explícita',
      items: [
        'Existe um projeto de sistema de fisioterapia para o madrinho do Rafael.',
        'A aplicação precisa ser publicável no domínio rafaelcalassara.com.br.',
        'O subdomínio-alvo pedido agora é fisio.rafaelcalassara.com.br.',
        'A preferência geral é por operação simples, agentic-first e baixo custo.'
      ]
    },
    {
      title: 'Requisitos inferidos para o v1',
      items: [
        'Cadastro simples de pacientes.',
        'Agenda de atendimentos e visão diária/semanal.',
        'Prontuário/evolução por sessão.',
        'Planos terapêuticos/exercícios e visão financeira mínima.'
      ]
    }
  ],
  agenda: [
    { time: '08:00', patient: 'Marina Souza', type: 'Pilates clínico', status: 'Confirmado', tone: 'ok', note: 'Lombalgia • pacote mensal' },
    { time: '09:30', patient: 'João Pedro', type: 'Fisio pós-operatória', status: 'Pendente', tone: 'warn', note: 'Revisar liberação médica' },
    { time: '11:00', patient: 'Helena Costa', type: 'Avaliação inicial', status: 'Novo lead', tone: 'ok', note: 'Dor cervical • origem Instagram' },
    { time: '14:00', patient: 'Carlos Henrique', type: 'Sessão avulsa', status: 'Cobrança', tone: 'danger', note: 'Pagamento em aberto há 9 dias' }
  ],
  patientMetrics: [
    { label: 'Em tratamento', value: '31' },
    { label: 'Alta prevista', value: '7' },
    { label: 'Reavaliações', value: '6' },
    { label: 'Novos leads', value: '4' }
  ],
  queue: [
    'Confirmar os pacientes de amanhã até 18h.',
    'Fechar modelo padrão de evolução por sessão.',
    'Definir pacote, avulso e regra de falta.',
    'Validar quais dados entram na ficha inicial.'
  ],
  loop: [
    { title: 'Mapear', text: 'Capturar fluxo real da clínica: captação, agenda, sessão, evolução e cobrança.' },
    { title: 'Desenhar', text: 'Transformar o fluxo em telas simples e validar com o usuário da clínica.' },
    { title: 'Entregar', text: 'Publicar um slice útil, testar no uso real e ajustar antes de ampliar escopo.' },
    { title: 'Medir', text: 'Ver onde travou: faltas, retrabalho, cobrança, tempo de preenchimento.' },
    { title: 'Refinar', text: 'Corrigir gargalos primeiro, sem inflar o produto com features aleatórias.' },
    { title: 'Escalar', text: 'Só depois abrir financeiro completo, automações e relatórios mais pesados.' }
  ],
  week: [
    { day: 'Seg', items: ['8 sessões', '2 reavaliações', '1 encaixe'] },
    { day: 'Ter', items: ['7 sessões', 'Pilates em dupla', '1 lead novo'] },
    { day: 'Qua', items: ['9 sessões', '2 faltas recentes', 'revisão de plano'] },
    { day: 'Qui', items: ['6 sessões', '1 avaliação', 'fechamento parcial'] },
    { day: 'Sex', items: ['10 sessões', 'cobrança semanal', 'alta clínica'] }
  ],
  patients: [
    { name: 'Marina Souza', detail: '32 anos • lombalgia crônica • 2x/semana', tags: ['pilates', 'pacote mensal', 'evolução ok'] },
    { name: 'João Pedro', detail: '28 anos • pós-LCA • 3ª semana', tags: ['pós-op', 'reavaliação', 'atenção'] },
    { name: 'Helena Costa', detail: '41 anos • primeira avaliação marcada', tags: ['lead novo', 'dor cervical'] }
  ],
  timeline: [
    { date: 'Hoje', title: 'João Pedro • Sessão 08', text: 'Amplitude melhorou, mas ainda existe insegurança na descarga unilateral. Ajustar progressão.' },
    { date: 'Ontem', title: 'Marina Souza • Sessão 14', text: 'Dor caiu de 7 para 4/10. Manter mobilidade torácica e progressão de core.' },
    { date: '18 Jun', title: 'Helena Costa • Pré-triagem', text: 'Relata dor cervical com piora no fim do expediente. Avaliação completa pendente.' }
  ],
  plans: [
    { title: 'Pós-operatório joelho', text: 'Controle de dor/edema, ganho de ADM, força inicial e marcha.', tags: ['ADM', 'força', 'marcha'] },
    { title: 'Lombalgia recorrente', text: 'Mobilidade, estabilidade, rotina curta para casa e educação de carga.', tags: ['core', 'mobilidade', 'casa'] },
    { title: 'Cervical / escritório', text: 'Higiene postural, mobilidade, escapular e rotina de micropausas.', tags: ['escápula', 'postura', 'hábitos'] }
  ],
  finance: [
    { title: 'Receita prevista', text: 'R$ 12.400 no mês', tags: ['pacotes', 'avulsos'] },
    { title: 'Em aberto', text: 'R$ 1.580 pendente', tags: ['5 pacientes', 'cobrança'] },
    { title: 'Meta operacional', text: 'Reduzir no-show e retrabalho de agenda', tags: ['agenda', 'confirmação'] }
  ]
};

const setHTML = (id, html) => {
  document.getElementById(id).innerHTML = html;
};

setHTML('hero-metrics', data.metrics.map(metric => `
  <div class="metric">
    <span>${metric.label}</span>
    <strong>${metric.value}</strong>
  </div>
`).join(''));

setHTML('requirements-grid', data.requirements.map(group => `
  <article class="requirement-item">
    <h4>${group.title}</h4>
    <ul>${group.items.map(item => `<li>${item}</li>`).join('')}</ul>
  </article>
`).join(''));

setHTML('agenda-list', data.agenda.map(item => `
  <article class="agenda-item">
    <div class="time-pill">${item.time}</div>
    <div class="agenda-main">
      <strong>${item.patient}</strong>
      <div class="meta">${item.type}</div>
      <div class="muted">${item.note}</div>
    </div>
    <span class="status-chip ${item.tone}">${item.status}</span>
  </article>
`).join(''));

setHTML('patient-status', data.patientMetrics.map(metric => `
  <div class="mini-metric">
    <span class="muted">${metric.label}</span>
    <strong>${metric.value}</strong>
  </div>
`).join(''));

setHTML('queue-list', data.queue.map(item => `<li>${item}</li>`).join(''));

setHTML('loop-grid', data.loop.map((item, index) => `
  <article class="loop-step" data-step="0${index + 1}">
    <strong>${item.title}</strong>
    <p>${item.text}</p>
  </article>
`).join(''));

setHTML('week-grid', data.week.map(day => `
  <article class="day-column">
    <h4>${day.day}</h4>
    <ul>${day.items.map(item => `<li>${item}</li>`).join('')}</ul>
  </article>
`).join(''));

setHTML('patient-cards', data.patients.map(patient => `
  <article class="patient-card">
    <strong>${patient.name}</strong>
    <p>${patient.detail}</p>
    <div class="tags">${patient.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>
  </article>
`).join(''));

setHTML('timeline', data.timeline.map(item => `
  <article class="timeline-item">
    <div class="timeline-date">${item.date}</div>
    <div>
      <strong>${item.title}</strong>
      <p>${item.text}</p>
    </div>
  </article>
`).join(''));

setHTML('plan-grid', data.plans.map(plan => `
  <article class="plan-card">
    <strong>${plan.title}</strong>
    <p>${plan.text}</p>
    <div class="tags">${plan.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>
  </article>
`).join(''));

setHTML('finance-grid', data.finance.map(card => `
  <article class="finance-card">
    <strong>${card.title}</strong>
    <p>${card.text}</p>
    <div class="tags">${card.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>
  </article>
`).join(''));

const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    const target = link.dataset.section;
    navLinks.forEach(item => item.classList.remove('active'));
    sections.forEach(section => section.classList.remove('active'));
    link.classList.add('active');
    document.getElementById(`section-${target}`).classList.add('active');
  });
});
