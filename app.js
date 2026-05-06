/* ============================================================
   Controle Doméstico — app.js
   ============================================================ */

const { createClient } = supabase;
const sb = createClient(window.APP_CONFIG.SUPABASE_URL, window.APP_CONFIG.SUPABASE_ANON_KEY);

// ============================================================ STATE

const state = {
  user: null,
  displayName: '',
  view: 'mes',
  mes: monthRefFromDate(new Date()),    // YYYY-MM-01
  categorias: [],                        // cached
  recorrentes: [],                       // cached
  lancamentos: [],                       // do mês atual
  lancamentosCompare: {},                // { 'YYYY-MM-01': [lancamentos] } pra view comparar
  chartInstance: null,
};

// ============================================================ HELPERS

function monthRefFromDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

function shiftMonth(monthRef, delta) {
  const [y, m] = monthRef.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthRefFromDate(d);
}

function formatMonthLong(monthRef) {
  const [y, m] = monthRef.split('-').map(Number);
  const names = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  return `${names[m - 1]} de ${y}`;
}

function formatMonthShort(monthRef) {
  const [y, m] = monthRef.split('-').map(Number);
  const names = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun',
                 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${names[m - 1]}/${String(y).slice(2)}`;
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
function fmtBRL(v) {
  if (v == null || isNaN(v)) return '—';
  return BRL.format(v);
}

function parseValor(s) {
  if (typeof s === 'number') return s;
  if (!s) return NaN;
  // Aceita "1.234,56" ou "1234.56"
  const cleaned = String(s).trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned);
}

function toast(msg, kind = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast' + (kind ? ' ' + kind : '');
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.hidden = true; }, 2400);
}

function $(sel, root = document) { return root.querySelector(sel); }
function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k in node) node[k] = v;
    else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

// ============================================================ AUTH

async function tryRestoreSession() {
  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) {
    onAuthSuccess(session.user);
  } else {
    showLogin();
  }
}

function showLogin() {
  $('#login-screen').hidden = false;
  $('#app').hidden = true;
}

function onAuthSuccess(user) {
  state.user = user;
  state.displayName = user.user_metadata?.display_name
                   || user.user_metadata?.full_name
                   || (user.email || '').split('@')[0];
  $('#user-name').textContent = state.displayName;
  $('#config-user').textContent = user.email;
  $('#login-screen').hidden = true;
  $('#app').hidden = false;
  bootstrap();
}

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const errEl = $('#login-error');
  errEl.hidden = true;
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  btn.textContent = 'Entrando…';
  try {
    const { data, error } = await sb.auth.signInWithPassword({
      email: f.get('email'),
      password: f.get('password'),
    });
    if (error) throw error;
    onAuthSuccess(data.user);
  } catch (err) {
    errEl.textContent = traduzErro(err.message);
    errEl.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Entrar';
  }
});

function traduzErro(msg) {
  const map = {
    'Invalid login credentials': 'Email ou senha incorretos.',
    'Email not confirmed': 'Email ainda não confirmado. Verifique sua caixa de entrada.',
  };
  return map[msg] || msg;
}

async function logout() {
  await sb.auth.signOut();
  location.reload();
}
$('#btn-logout').addEventListener('click', logout);
$('#btn-logout-2').addEventListener('click', logout);

// ============================================================ NAV

$$('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

function switchView(name) {
  state.view = name;
  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === name));
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + name));
  if (name === 'recorrentes') renderRecorrentes();
  if (name === 'categorias')  renderCategorias();
  if (name === 'comparar')    loadCompararData();
}

// ============================================================ DATA LOADING

async function loadCategorias() {
  const { data, error } = await sb
    .from('categorias').select('*')
    .order('tipo').order('ordem').order('nome');
  if (error) { toast('Erro ao carregar categorias', 'error'); console.error(error); return; }
  state.categorias = data;
}

async function loadRecorrentes() {
  const { data, error } = await sb
    .from('recorrentes')
    .select('*, categoria:categorias(*)')
    .order('ativa', { ascending: false })
    .order('dia_mes', { ascending: true, nullsFirst: false });
  if (error) { toast('Erro ao carregar recorrentes', 'error'); console.error(error); return; }
  state.recorrentes = data;
}

async function loadMes(monthRef = state.mes) {
  state.mes = monthRef;
  const { data, error } = await sb
    .from('lancamentos')
    .select('*, categoria:categorias(*)')
    .eq('mes_referencia', monthRef)
    .order('created_at');
  if (error) { toast('Erro ao carregar mês', 'error'); console.error(error); return; }
  state.lancamentos = data;
  renderMes();
}

async function bootstrap() {
  await Promise.all([loadCategorias(), loadRecorrentes()]);
  await loadMes(state.mes);
  setupRealtime();
}

// ============================================================ REALTIME

function setupRealtime() {
  sb.channel('public-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lancamentos' }, async () => {
      if (state.view === 'mes') await loadMes();
      if (state.view === 'comparar') loadCompararData();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'categorias' }, async () => {
      await loadCategorias();
      if (state.view === 'mes') renderMes();
      if (state.view === 'categorias') renderCategorias();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'recorrentes' }, async () => {
      await loadRecorrentes();
      if (state.view === 'mes') renderMes();
      if (state.view === 'recorrentes') renderRecorrentes();
    })
    .subscribe();
}

// ============================================================ VIEW: MÊS

$('#month-prev').addEventListener('click', () => loadMes(shiftMonth(state.mes, -1)));
$('#month-next').addEventListener('click', () => loadMes(shiftMonth(state.mes, +1)));
$('#month-input').addEventListener('change', (e) => {
  if (e.target.value) loadMes(e.target.value + '-01');
});

$$('.add-row').forEach(b => {
  b.addEventListener('click', () => openLancamentoModal({ tipo: b.dataset.tipo }));
});

function renderMes() {
  $('#month-title').textContent = formatMonthLong(state.mes);
  $('#month-input').value = state.mes.slice(0, 7);

  const totalEntrada = sum(state.lancamentos.filter(l => l.tipo === 'entrada'));
  const totalFixa    = sum(state.lancamentos.filter(l => l.tipo === 'fixa'));
  const totalCartao  = sum(state.lancamentos.filter(l => l.tipo === 'cartao'));
  const totalPontual = sum(state.lancamentos.filter(l => l.tipo === 'pontual'));

  const sobra = totalEntrada - totalFixa;
  const final_ = sobra - totalCartao - totalPontual;

  setSum('#sum-entrada', totalEntrada, totalEntrada > 0 ? 'pos' : '');
  setSum('#sum-fixas',   -totalFixa, totalFixa > 0 ? 'neg' : '');
  setSum('#sum-sobra',   sobra,    sobra >= 0 ? 'pos' : 'neg');
  setSum('#sum-cartao',  -(totalCartao + totalPontual), (totalCartao + totalPontual) > 0 ? 'neg' : '');
  setSum('#sum-final',   final_,   final_ >= 0 ? 'pos' : 'neg');

  renderRowGroup('#rows-fixas',   state.lancamentos.filter(l => l.tipo === 'fixa'));
  renderRowGroup('#rows-cartao',  state.lancamentos.filter(l => l.tipo === 'cartao'));
  renderRowGroup('#rows-entrada', state.lancamentos.filter(l => l.tipo === 'entrada'));

  const pontuais = state.lancamentos.filter(l => l.tipo === 'pontual');
  $('#pontuais-section').hidden = pontuais.length === 0;
  renderRowGroup('#rows-pontual', pontuais);

  // Recorrentes pendentes (existem mas ainda não foram lançadas neste mês)
  renderRecorrentesPendentes();
}

function setSum(sel, value, klass = '') {
  const node = $(sel);
  node.textContent = fmtBRL(value);
  node.className = 'sc-value' + (klass ? ' ' + klass : '');
}

function sum(arr) {
  return arr.reduce((acc, l) => acc + Number(l.valor || 0), 0);
}

function renderRowGroup(selector, items) {
  const root = $(selector);
  root.innerHTML = '';
  if (items.length === 0) {
    root.append(el('div', { class: 'row-empty', style: { padding: '8px 4px', color: 'var(--muted-2)', fontSize: '12px', fontStyle: 'italic' } }, '— vazio —'));
    return;
  }
  for (const lanc of items) {
    const cor = lanc.categoria?.cor || '#a39c8e';
    const nome = lanc.tipo === 'entrada' ? (lanc.descricao || 'entrada') : (lanc.categoria?.nome || lanc.descricao || '—');
    const desc = (lanc.tipo !== 'entrada' && lanc.descricao) ? lanc.descricao : '';
    const row = el('div', {
      class: 'row-item ' + lanc.tipo,
      onclick: () => openLancamentoModal(lanc),
    }, [
      el('span', { class: 'row-color', style: { background: cor } }),
      el('div', { class: 'row-label' }, [
        nome,
        desc ? el('span', { class: 'row-desc' }, '· ' + desc) : null,
      ]),
      el('span', { class: 'row-value' }, fmtBRL(Number(lanc.valor))),
    ]);
    root.append(row);
  }
}

function renderRecorrentesPendentes() {
  const fixaEl = $('#rec-pendentes-fixa');
  const cartaoEl = $('#rec-pendentes-cartao');
  fixaEl.innerHTML = '';
  cartaoEl.innerHTML = '';

  const lancCatIds = new Set(
    state.lancamentos
      .filter(l => l.categoria_id)
      .map(l => l.categoria_id)
  );

  for (const r of state.recorrentes) {
    if (!r.ativa) continue;
    if (!r.categoria) continue;
    if (lancCatIds.has(r.categoria_id)) continue;

    const target = r.categoria.tipo === 'fixa' ? fixaEl
                 : r.categoria.tipo === 'cartao' ? cartaoEl
                 : null;
    if (!target) continue;

    const row = el('div', {
      class: 'rec-pendente',
      title: 'Pendente — clique pra confirmar valor e lançar',
      onclick: () => openLancamentoFromRecorrente(r),
    }, [
      el('span', { class: 'row-color' }),
      el('div', { class: 'row-label' }, [
        r.categoria.nome,
        r.descricao ? el('span', { class: 'row-desc' }, '· ' + r.descricao) : null,
        r.dia_mes ? el('span', { class: 'row-desc' }, `· dia ${r.dia_mes}`) : null,
      ]),
      el('span', { class: 'row-value' }, r.valor_padrao ? fmtBRL(r.valor_padrao) : 'lançar →'),
    ]);
    target.append(row);
  }
}

// ============================================================ MODAL — Lançamento

function openModal(title, content) {
  $('#modal-title').textContent = title;
  const body = $('#modal-body');
  body.innerHTML = '';
  body.append(content);
  $('#modal-host').hidden = false;
}

function closeModal() {
  $('#modal-host').hidden = true;
}

$('#modal-close').addEventListener('click', closeModal);
$('.modal-backdrop').addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('#modal-host').hidden) closeModal();
});

function openLancamentoModal(seed) {
  const isEdit = !!seed.id;
  const tipo = seed.tipo || 'fixa';

  const tipoTabs = el('div', { class: 'tipo-tabs' });
  const tipos = ['entrada', 'fixa', 'cartao', 'pontual'];
  const tipoLabels = { entrada: 'Entrada', fixa: 'Fixa', cartao: 'Cartão', pontual: 'Pontual' };
  let currentTipo = tipo;

  tipos.forEach(t => {
    const b = el('button', {
      type: 'button',
      class: t === currentTipo ? 'active' : '',
      onclick: () => {
        currentTipo = t;
        $$('.tipo-tabs button', tipoTabs).forEach(x => x.classList.toggle('active', x.dataset.t === t));
        renderCategoriaSelect(catSelect, t, seed.categoria_id);
      },
      dataset: { t },
    }, tipoLabels[t]);
    tipoTabs.append(b);
  });

  const catSelect = el('select', { name: 'categoria_id' });
  renderCategoriaSelect(catSelect, currentTipo, seed.categoria_id);

  const valorInput = el('input', {
    type: 'text',
    name: 'valor',
    inputmode: 'decimal',
    placeholder: 'R$ 0,00',
    value: seed.valor != null ? String(seed.valor).replace('.', ',') : '',
    required: true,
  });

  const descInput = el('input', {
    type: 'text',
    name: 'descricao',
    placeholder: 'opcional',
    value: seed.descricao || '',
  });

  const dataInput = el('input', {
    type: 'date',
    name: 'data',
    value: seed.data || '',
  });

  const mesInput = el('input', {
    type: 'month',
    name: 'mes_referencia',
    value: (seed.mes_referencia || state.mes).slice(0, 7),
    required: true,
  });

  const form = el('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const valor = parseValor(f.get('valor'));
      if (isNaN(valor) || valor <= 0) { toast('Valor inválido', 'error'); return; }

      const payload = {
        mes_referencia: f.get('mes_referencia') + '-01',
        data: f.get('data') || null,
        tipo: currentTipo,
        categoria_id: currentTipo === 'entrada' ? null : (f.get('categoria_id') || null),
        descricao: f.get('descricao') || null,
        valor,
        usuario: state.displayName,
        created_by: state.user.id,
      };
      if (seed.recorrente_id) payload.recorrente_id = seed.recorrente_id;

      try {
        if (isEdit) {
          const { error } = await sb.from('lancamentos').update(payload).eq('id', seed.id);
          if (error) throw error;
          toast('Atualizado', 'ok');
        } else {
          const { error } = await sb.from('lancamentos').insert(payload);
          if (error) throw error;
          toast('Lançado', 'ok');
        }
        closeModal();
        loadMes();
      } catch (err) {
        toast('Erro: ' + err.message, 'error');
      }
    }
  }, [
    el('label', {}, [el('span', {}, 'Tipo'), tipoTabs]),
    el('label', {}, [el('span', {}, 'Categoria'), catSelect]),
    el('label', {}, [el('span', {}, 'Valor'), valorInput]),
    el('label', {}, [el('span', {}, 'Descrição'), descInput]),
    el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' } }, [
      el('label', {}, [el('span', {}, 'Mês de referência'), mesInput]),
      el('label', {}, [el('span', {}, 'Data'), dataInput]),
    ]),
    el('div', { class: 'modal-actions' }, [
      isEdit ? el('button', {
        type: 'button',
        class: 'btn-danger',
        onclick: async () => {
          if (!confirm('Excluir este lançamento?')) return;
          const { error } = await sb.from('lancamentos').delete().eq('id', seed.id);
          if (error) { toast('Erro: ' + error.message, 'error'); return; }
          toast('Excluído', 'ok');
          closeModal();
          loadMes();
        }
      }, 'excluir') : null,
      el('button', { type: 'button', class: 'btn-secondary', onclick: closeModal }, 'cancelar'),
      el('button', { type: 'submit', class: 'btn-primary' }, isEdit ? 'salvar' : 'lançar'),
    ]),
  ]);

  openModal(isEdit ? 'Editar lançamento' : 'Novo lançamento', form);
  setTimeout(() => valorInput.focus(), 50);
}

function renderCategoriaSelect(select, tipo, selectedId) {
  select.innerHTML = '';
  if (tipo === 'entrada') {
    select.append(el('option', { value: '' }, '— sem categoria —'));
    select.disabled = true;
    return;
  }
  select.disabled = false;
  select.append(el('option', { value: '' }, '— sem categoria —'));
  for (const c of state.categorias.filter(c => c.tipo === tipo && c.ativa)) {
    select.append(el('option', { value: c.id, selected: c.id === selectedId }, c.nome));
  }
}

function openLancamentoFromRecorrente(rec) {
  openLancamentoModal({
    tipo: rec.categoria.tipo,
    categoria_id: rec.categoria_id,
    descricao: rec.descricao || '',
    valor: rec.valor_padrao,
    mes_referencia: state.mes,
    recorrente_id: rec.id,
  });
}

// ============================================================ VIEW: RECORRENTES

$('#btn-add-recorrente').addEventListener('click', () => openRecorrenteModal({}));

function renderRecorrentes() {
  const root = $('#recorrentes-list');
  root.innerHTML = '';
  if (state.recorrentes.length === 0) {
    root.append(el('p', { style: { color: 'var(--muted)' } }, 'Nenhuma recorrente cadastrada ainda.'));
    return;
  }
  for (const r of state.recorrentes) {
    const cat = r.categoria;
    const card = el('div', {
      class: 'list-card' + (r.ativa ? '' : ' inactive'),
    }, [
      el('div', { class: 'lc-top' }, [
        el('span', { class: 'lc-color', style: { background: cat?.cor || '#a39c8e' } }),
        el('span', { class: 'lc-name' }, cat?.nome || '?'),
        el('span', { class: 'lc-tipo' }, cat?.tipo || ''),
      ]),
      r.descricao ? el('div', { style: { fontSize: '12px', color: 'var(--muted)' } }, r.descricao) : null,
      el('div', { class: 'lc-info' }, [
        r.valor_padrao != null ? `valor ${fmtBRL(r.valor_padrao)}` : 'sem valor padrão',
        r.dia_mes ? ` · dia ${r.dia_mes}` : '',
      ].join('')),
      el('div', { class: 'lc-actions' }, [
        el('button', { onclick: () => openRecorrenteModal(r) }, 'editar'),
        el('button', {
          onclick: async () => {
            const { error } = await sb.from('recorrentes').update({ ativa: !r.ativa }).eq('id', r.id);
            if (error) toast('Erro: ' + error.message, 'error');
            else { toast(r.ativa ? 'Desativada' : 'Ativada', 'ok'); loadRecorrentes().then(renderRecorrentes); }
          }
        }, r.ativa ? 'desativar' : 'ativar'),
        el('button', {
          onclick: async () => {
            if (!confirm('Excluir esta recorrente? Os lançamentos já feitos continuam preservados.')) return;
            const { error } = await sb.from('recorrentes').delete().eq('id', r.id);
            if (error) toast('Erro: ' + error.message, 'error');
            else { toast('Excluída', 'ok'); loadRecorrentes().then(renderRecorrentes); }
          }
        }, 'excluir'),
      ]),
    ]);
    root.append(card);
  }
}

function openRecorrenteModal(seed) {
  const isEdit = !!seed.id;
  const catSelect = el('select', { name: 'categoria_id', required: true });
  catSelect.append(el('option', { value: '' }, '— escolha —'));
  for (const c of state.categorias.filter(c => c.ativa && c.tipo !== 'pontual')) {
    catSelect.append(el('option', {
      value: c.id,
      selected: c.id === seed.categoria_id,
      dataset: { tipo: c.tipo },
    }, `${c.nome} (${c.tipo})`));
  }

  const form = el('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const valorRaw = f.get('valor_padrao');
      const payload = {
        categoria_id: f.get('categoria_id'),
        descricao: f.get('descricao') || null,
        valor_padrao: valorRaw ? parseValor(valorRaw) : null,
        dia_mes: f.get('dia_mes') ? Number(f.get('dia_mes')) : null,
        ativa: f.get('ativa') === 'on',
      };
      try {
        if (isEdit) {
          const { error } = await sb.from('recorrentes').update(payload).eq('id', seed.id);
          if (error) throw error;
        } else {
          const { error } = await sb.from('recorrentes').insert(payload);
          if (error) throw error;
        }
        toast(isEdit ? 'Atualizada' : 'Criada', 'ok');
        closeModal();
        await loadRecorrentes();
        renderRecorrentes();
        if (state.view === 'mes') renderMes();
      } catch (err) {
        toast('Erro: ' + err.message, 'error');
      }
    }
  }, [
    el('label', {}, [el('span', {}, 'Categoria'), catSelect]),
    el('label', {}, [el('span', {}, 'Descrição'),
      el('input', { type: 'text', name: 'descricao', value: seed.descricao || '', placeholder: 'opcional' })]),
    el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' } }, [
      el('label', {}, [el('span', {}, 'Valor padrão'),
        el('input', { type: 'text', name: 'valor_padrao', inputmode: 'decimal',
          value: seed.valor_padrao != null ? String(seed.valor_padrao).replace('.', ',') : '',
          placeholder: 'opcional' })]),
      el('label', {}, [el('span', {}, 'Dia do mês'),
        el('input', { type: 'number', name: 'dia_mes', min: '1', max: '31',
          value: seed.dia_mes || '', placeholder: 'opcional' })]),
    ]),
    el('label', { style: { flexDirection: 'row', alignItems: 'center', display: 'flex', gap: '8px' } }, [
      el('input', { type: 'checkbox', name: 'ativa', checked: seed.ativa !== false, style: { width: 'auto' } }),
      el('span', { style: { textTransform: 'none', letterSpacing: '0', color: 'var(--ink)' } }, 'ativa'),
    ]),
    el('div', { class: 'modal-actions' }, [
      el('button', { type: 'button', class: 'btn-secondary', onclick: closeModal }, 'cancelar'),
      el('button', { type: 'submit', class: 'btn-primary' }, isEdit ? 'salvar' : 'criar'),
    ]),
  ]);

  openModal(isEdit ? 'Editar recorrente' : 'Nova recorrente', form);
}

// ============================================================ VIEW: CATEGORIAS

$('#btn-add-categoria').addEventListener('click', () => openCategoriaModal({}));

function renderCategorias() {
  const root = $('#categorias-list');
  root.innerHTML = '';
  for (const tipo of ['fixa', 'cartao', 'pontual']) {
    const items = state.categorias.filter(c => c.tipo === tipo);
    if (items.length === 0) continue;
    root.append(el('h3', {
      style: { gridColumn: '1 / -1', fontFamily: 'var(--font-display)', fontWeight: '500', fontSize: '15px', margin: '12px 0 0', textTransform: 'lowercase', color: 'var(--muted)' }
    }, tipo === 'fixa' ? 'fixas' : tipo === 'cartao' ? 'cartões' : 'pontuais'));
    for (const c of items) {
      root.append(buildCategoriaCard(c));
    }
  }
}

function buildCategoriaCard(c) {
  return el('div', {
    class: 'list-card' + (c.ativa ? '' : ' inactive'),
  }, [
    el('div', { class: 'lc-top' }, [
      el('span', { class: 'lc-color', style: { background: c.cor } }),
      el('span', { class: 'lc-name' }, c.nome),
      el('span', { class: 'lc-tipo' }, c.tipo),
    ]),
    el('div', { class: 'lc-actions' }, [
      el('button', { onclick: () => openCategoriaModal(c) }, 'editar'),
      el('button', {
        onclick: async () => {
          const { error } = await sb.from('categorias').update({ ativa: !c.ativa }).eq('id', c.id);
          if (error) toast('Erro: ' + error.message, 'error');
          else { toast(c.ativa ? 'Desativada' : 'Ativada', 'ok'); loadCategorias().then(renderCategorias); }
        }
      }, c.ativa ? 'desativar' : 'ativar'),
    ]),
  ]);
}

function openCategoriaModal(seed) {
  const isEdit = !!seed.id;
  const form = el('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const payload = {
        nome: f.get('nome').trim().toLowerCase(),
        tipo: f.get('tipo'),
        cor: f.get('cor'),
        ordem: Number(f.get('ordem') || 100),
      };
      try {
        if (isEdit) {
          const { error } = await sb.from('categorias').update(payload).eq('id', seed.id);
          if (error) throw error;
        } else {
          const { error } = await sb.from('categorias').insert(payload);
          if (error) throw error;
        }
        toast(isEdit ? 'Atualizada' : 'Criada', 'ok');
        closeModal();
        await loadCategorias();
        renderCategorias();
      } catch (err) {
        toast('Erro: ' + err.message, 'error');
      }
    }
  }, [
    el('label', {}, [el('span', {}, 'Nome'),
      el('input', { type: 'text', name: 'nome', value: seed.nome || '', required: true })]),
    el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' } }, [
      el('label', {}, [el('span', {}, 'Tipo'),
        (() => {
          const s = el('select', { name: 'tipo', required: true });
          [['fixa', 'Fixa'], ['cartao', 'Cartão'], ['pontual', 'Pontual']].forEach(([v, l]) => {
            s.append(el('option', { value: v, selected: v === seed.tipo }, l));
          });
          return s;
        })()]),
      el('label', {}, [el('span', {}, 'Ordem'),
        el('input', { type: 'number', name: 'ordem', value: seed.ordem || 100 })]),
      el('label', {}, [el('span', {}, 'Cor'),
        el('input', { type: 'color', name: 'cor', value: seed.cor || '#7c8aa8', style: { padding: '2px', height: '38px' } })]),
    ]),
    el('div', { class: 'modal-actions' }, [
      isEdit ? el('button', {
        type: 'button',
        class: 'btn-danger',
        onclick: async () => {
          if (!confirm('Excluir categoria? (vai falhar se houver lançamentos vinculados)')) return;
          const { error } = await sb.from('categorias').delete().eq('id', seed.id);
          if (error) toast('Erro: ' + (error.message.includes('violates foreign key') ? 'há lançamentos usando esta categoria — desative ao invés de excluir' : error.message), 'error');
          else { toast('Excluída', 'ok'); closeModal(); loadCategorias().then(renderCategorias); }
        }
      }, 'excluir') : null,
      el('button', { type: 'button', class: 'btn-secondary', onclick: closeModal }, 'cancelar'),
      el('button', { type: 'submit', class: 'btn-primary' }, isEdit ? 'salvar' : 'criar'),
    ]),
  ]);
  openModal(isEdit ? 'Editar categoria' : 'Nova categoria', form);
}

// ============================================================ VIEW: COMPARAR

async function loadCompararData() {
  // Busca os últimos 12 meses (a partir do mês atual selecionado)
  const meses = [];
  for (let i = 11; i >= 0; i--) {
    meses.push(shiftMonth(state.mes, -i));
  }
  const { data, error } = await sb
    .from('lancamentos')
    .select('mes_referencia, tipo, valor')
    .in('mes_referencia', meses);
  if (error) { toast('Erro ao carregar comparativo', 'error'); console.error(error); return; }

  const agg = {};
  for (const m of meses) agg[m] = { entrada: 0, fixa: 0, cartao: 0, pontual: 0 };
  for (const l of data) {
    if (agg[l.mes_referencia]) agg[l.mes_referencia][l.tipo] += Number(l.valor || 0);
  }

  const labels = meses.map(formatMonthShort);
  const entradas = meses.map(m => agg[m].entrada);
  const fixas    = meses.map(m => agg[m].fixa);
  const cartoes  = meses.map(m => agg[m].cartao + agg[m].pontual);
  const finais   = meses.map(m => agg[m].entrada - agg[m].fixa - agg[m].cartao - agg[m].pontual);

  drawChart(labels, entradas, fixas, cartoes, finais);
  drawComparativoTable(meses, agg);
}

function drawChart(labels, entradas, fixas, cartoes, finais) {
  const ctx = document.getElementById('chart-meses').getContext('2d');
  if (state.chartInstance) state.chartInstance.destroy();
  state.chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'entrada', data: entradas, backgroundColor: '#5a7a5e', stack: 'a' },
        { label: 'fixas',   data: fixas.map(v => -v), backgroundColor: '#7c8aa8', stack: 'b' },
        { label: 'cartões/pontuais', data: cartoes.map(v => -v), backgroundColor: '#9c6b8e', stack: 'b' },
        { type: 'line', label: 'FINAL', data: finais, borderColor: '#1a1916', borderWidth: 2,
          backgroundColor: 'rgba(168,117,94,0.15)', tension: 0.2, pointRadius: 3, pointBackgroundColor: '#a8755e' },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: "'IBM Plex Sans'", size: 11 } } },
        tooltip: {
          callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmtBRL(Math.abs(ctx.parsed.y))}` }
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: "'IBM Plex Mono'", size: 10 } } },
        y: { grid: { color: '#efe7d4' }, ticks: { font: { family: "'IBM Plex Mono'", size: 10 }, callback: v => fmtBRL(v) } },
      },
    },
  });
}

function drawComparativoTable(meses, agg) {
  const root = $('#tabela-comparativo');
  root.innerHTML = '';
  const tbl = el('table');
  const thead = el('thead');
  const headRow = el('tr', {}, [el('th', {}, ''), ...meses.map(m => el('th', {}, formatMonthShort(m)))]);
  thead.append(headRow);

  const tbody = el('tbody');
  const rows = [
    ['entrada', meses.map(m => agg[m].entrada)],
    ['fixas',   meses.map(m => -agg[m].fixa)],
    ['cartões', meses.map(m => -agg[m].cartao)],
    ['pontuais', meses.map(m => -agg[m].pontual)],
  ];
  for (const [label, vals] of rows) {
    tbody.append(el('tr', {}, [
      el('td', {}, label),
      ...vals.map(v => el('td', { class: 'num', style: { color: v < 0 ? 'var(--negative)' : (v > 0 ? 'var(--positive)' : 'var(--muted-2)') } }, fmtBRL(v))),
    ]));
  }
  const finais = meses.map(m => agg[m].entrada - agg[m].fixa - agg[m].cartao - agg[m].pontual);
  tbody.append(el('tr', { class: 'total' }, [
    el('td', {}, 'FINAL'),
    ...finais.map(v => el('td', { class: 'num', style: { color: v < 0 ? 'var(--negative)' : 'var(--positive)' } }, fmtBRL(v))),
  ]));

  tbl.append(thead, tbody);
  root.append(tbl);
}

// ============================================================ CONFIG: export/import

$('#btn-export').addEventListener('click', async () => {
  const [{ data: cats }, { data: recs }, { data: lancs }] = await Promise.all([
    sb.from('categorias').select('*'),
    sb.from('recorrentes').select('*'),
    sb.from('lancamentos').select('*'),
  ]);
  const blob = new Blob([JSON.stringify({
    exported_at: new Date().toISOString(),
    categorias: cats,
    recorrentes: recs,
    lancamentos: lancs,
  }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: `controle-domestico-${new Date().toISOString().slice(0,10)}.json` });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast('Backup baixado', 'ok');
});

$('#btn-import').addEventListener('click', () => $('#import-file').click());
$('#import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (!confirm('Atenção: importar SUBSTITUI os dados atuais. Continuar?')) return;
  try {
    const txt = await file.text();
    const data = JSON.parse(txt);
    if (!data.categorias || !data.lancamentos) throw new Error('arquivo inválido');
    // Apaga primeiro (em ordem de FK)
    await sb.from('lancamentos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await sb.from('recorrentes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await sb.from('categorias').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    // Reimporta
    if (data.categorias.length) {
      const { error } = await sb.from('categorias').insert(data.categorias);
      if (error) throw error;
    }
    if (data.recorrentes?.length) {
      const { error } = await sb.from('recorrentes').insert(data.recorrentes);
      if (error) throw error;
    }
    if (data.lancamentos.length) {
      const { error } = await sb.from('lancamentos').insert(data.lancamentos);
      if (error) throw error;
    }
    toast('Importação concluída', 'ok');
    bootstrap();
  } catch (err) {
    toast('Erro ao importar: ' + err.message, 'error');
  } finally {
    e.target.value = '';
  }
});

// ============================================================ INIT

tryRestoreSession();
