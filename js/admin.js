/* =============================================================
   Müllerhof CMS – Admin Logic
   ============================================================= */
const SUPABASE_URL = 'https://rcnmnthscvfippedgmuu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_EbLVUn9ckvKSLkpKkq5dTQ_UufHkMMG';
const STORAGE_BUCKET = 'cms-media';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const toast = (msg, kind = '') => {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast' + (kind ? ' toast--' + kind : '');
  setTimeout(() => t.classList.add('hidden'), 3500);
};

const fmtDate = (s) => {
  if (!s) return '';
  const d = new Date(s);
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/* =============================================================
   AUTH
   ============================================================= */
async function init() {
  const { data: { session } } = await sb.auth.getSession();
  if (session) showApp(session.user);
  else showLogin();

  sb.auth.onAuthStateChange((_e, sess) => {
    if (sess) showApp(sess.user);
    else showLogin();
  });
}

function showLogin() {
  $('#loginScreen').classList.remove('hidden');
  $('#adminApp').classList.add('hidden');
}

function showApp(user) {
  $('#loginScreen').classList.add('hidden');
  $('#adminApp').classList.remove('hidden');
  $('#userInfo').textContent = user.email;
  switchView('overview');
  loadCounts();
}

$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('#loginError').textContent = '';
  const email = $('#loginEmail').value.trim();
  const password = $('#loginPassword').value;
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) $('#loginError').textContent = 'Login fehlgeschlagen: ' + error.message;
});

$('#logoutBtn').addEventListener('click', async () => {
  await sb.auth.signOut();
});

/* =============================================================
   VIEW SWITCHING
   ============================================================= */
const viewTitles = {
  overview:   'Übersicht',
  anfragen:   'Anfragen-Eingang',
  events:     'Events verwalten',
  sections:   'Seiten-Texte verwalten',
  menu:       'Speisekarte verwalten',
  oeffnung:   'Öffnungszeiten verwalten',
  news:       'News & Aktuelles',
  karten:     'Karten & PDFs zuweisen',
  zimmer:     'Hotel-Zimmer verwalten',
  team:       'Team / Mitarbeitende',
  stellen:    'Offene Stellen',
  partner:    'Kooperationen / Partner',
  community:  'Community-Posts moderieren',
  medien:     'Medien-Bibliothek',
};

function switchView(view, opts = {}) {
  $$('.nav-item').forEach(b => b.classList.remove('active'));
  if (opts.clickedEl) opts.clickedEl.classList.add('active');

  $$('.view').forEach(v => v.classList.add('hidden'));
  const targetView = $('#view-' + view);
  if (targetView) targetView.classList.remove('hidden');
  if ($('#viewTitle')) $('#viewTitle').textContent = viewTitles[view] || '';

  // Filter pre-set, bevor Load läuft
  if (opts.filter && view === 'sections') {
    const sel = $('#pageFilter'); if (sel) sel.value = opts.filter;
  }
  if (opts.list && view === 'cards') {
    const sel = $('#cardsListFilter'); if (sel) sel.value = opts.list;
  }
  if (opts.typ && view === 'anfragen') {
    const sel = $('#anfragenTypFilter'); if (sel) sel.value = opts.typ;
  }
  if (opts.page && view === 'bilder') {
    const sel = $('#bilderPageFilter'); if (sel) sel.value = opts.page;
  }

  if (view === 'events')    loadEvents();
  if (view === 'sections')  loadSections();
  if (view === 'menu')      loadMenu();
  if (view === 'oeffnung')  loadOz();
  if (view === 'news')      loadNews();
  if (view === 'karten')    loadKarten();
  if (view === 'medien')    loadMedia();
  if (view === 'anfragen')  loadAnfragen();
  if (view === 'zimmer')    loadZimmer();
  if (view === 'team')      loadTeam();
  if (view === 'stellen')   loadStellen();
  if (view === 'partner')   loadPartner();
  if (view === 'landingpages') loadLandingpages();
  if (view === 'community') loadCommunity();
  if (view === 'cards')     loadCards();
  if (view === 'bilder')    loadBilder();
}

/* =============================================================
   BILDER ÄNDERN – Hero/Split/Bereich-BG-Slots pro Seite
   ============================================================= */
const BG_SLOTS_BY_PAGE = {
  'index': [
    { key:'hero_bg',          label:'① Hauptbild oben (Hero)',
      position:'Ganz oben der Seite, hinter dem grossen Logo + Claim',
      nearText:'„Das Wohnzimmer von Frick. / Wo Begegnung zuhause ist."',
      fallback:'images/wohnzimmer.png' },
    { key:'bereich_card_bg',  label:'② Bereich-Card 1 (links)',
      position:'Im Block „Drei Bereiche · Ein Haus", erste Karte',
      nearText:'„Alte Höfli – Frühstück, Znüni, Mittag."',
      fallback:'images/alte-hoefli.png' },
    { key:'bereich_card_bg_2',label:'③ Bereich-Card 2 (Mitte)',
      position:'Im Block „Drei Bereiche · Ein Haus", zweite Karte',
      nearText:'„Das Wohnzimmer – Apéro, Austausch, Ankommen."',
      fallback:'images/wohnzimmer.png' },
    { key:'bereich_card_bg_3',label:'④ Bereich-Card 3 (rechts)',
      position:'Im Block „Drei Bereiche · Ein Haus", dritte Karte',
      nearText:'„Das Stübli – À la carte, klassisch, gepflegt."',
      fallback:'images/stuebli.png' },
    { key:'split_bg',         label:'⑤ Story-Bild (Garten)',
      position:'Im „Unsere Geschichte"-Abschnitt, links neben dem Text',
      nearText:'„Vom Bauernhaus zum Begegnungsort."',
      fallback:'images/garten.png' },
    { key:'split_bg_2',       label:'⑥ Generationen-Bild (Aula)',
      position:'Im „Generationen verbinden"-Abschnitt, rechts neben dem Text',
      nearText:'„Wissen teilen. Geschichten austauschen."',
      fallback:'images/aula-anlass.png' },
    { key:'split_bg_3',       label:'⑦ Karriere-Teaser-Bild',
      position:'Im „Karriere"-Teaser ganz unten, rechts neben dem Text',
      nearText:'„Wir suchen Menschen, die mitgestalten wollen."',
      fallback:'images/stuebli-anlass.png' },
  ],
  'restaurant': [
    { key:'hero_bg', label:'① Hauptbild oben (Hero)',
      position:'Ganz oben, hinter dem Restaurant-Titel',
      nearText:'(Hero der Restaurant-Seite)',
      fallback:'images/alte-hoefli.png' },
    { key:'split_bg', label:'② Split-Bild',
      position:'Unter dem Hero, neben einem grossen Text',
      nearText:'Restaurant-Beschreibung',
      fallback:'images/stuebli.png' },
  ],
  'hotel': [
    { key:'hero_bg', label:'① Hauptbild oben (Hero)',
      position:'Ganz oben der Hotel-Seite',
      nearText:'„Sieben Zimmer. Ein Zuhause."',
      fallback:'images/stuebli.png' },
  ],
  'events': [
    { key:'hero_bg',          label:'① Hauptbild oben (Hero)',
      position:'Ganz oben der Events-Seite',
      nearText:'„Anlässe mit Wirkung."',
      fallback:'images/aula-anlass.png' },
    { key:'bereich_card_bg',  label:'② Eventkategorie 1',
      position:'Block „Drei Arten von Anlässen", erste Karte',
      nearText:'„Private Anlässe – Hochzeiten, Geburtstage…"',
      fallback:'images/aula-anlass.png' },
    { key:'bereich_card_bg_2',label:'③ Eventkategorie 2',
      position:'Block „Drei Arten von Anlässen", zweite Karte',
      nearText:'„Regelmässig – Sonntagsbrunch, Jass, Workshops."',
      fallback:'images/wohnzimmer.png' },
    { key:'bereich_card_bg_3',label:'④ Eventkategorie 3',
      position:'Block „Drei Arten von Anlässen", dritte Karte',
      nearText:'„Saisonal – Specials & Workshops."',
      fallback:'images/gewoelbekeller.png' },
    { key:'split_bg',         label:'⑤ Garten-Split-Bild',
      position:'Im „Feiern unter freiem Himmel"-Abschnitt',
      nearText:'„Feiern unter freiem Himmel."',
      fallback:'images/garten.png' },
  ],
  'seminare': [
    { key:'hero_bg', label:'① Hauptbild oben (Hero)',
      position:'Ganz oben der Seminare-Seite',
      nearText:'„Tagen. Lernen. Wirken."',
      fallback:'images/aula-seminar.png' },
    { key:'split_bg', label:'② Split-Bild',
      position:'Unter dem Hero, neben „Alles, was dein Seminar braucht"',
      nearText:'Ausstattungs-Liste',
      fallback:'images/aula-seminar.png' },
  ],
  'community': [
    { key:'hero_bg', label:'① Hauptbild oben (Hero)',
      position:'Ganz oben der Community-Seite',
      nearText:'Community-Hero',
      fallback:'images/wohnzimmer.png' },
  ],
  'ueber-uns': [
    { key:'hero_bg',    label:'① Hauptbild oben (Hero)',
      position:'Ganz oben der Über uns-Seite',
      nearText:'„Von Frick. Für Frick."',
      fallback:'images/alte-hoefli.png' },
    { key:'split_bg',   label:'② Split 1 – Gemeinschaft',
      position:'Erster Split-Block links',
      nearText:'„Gemeinschaft wieder selbstverständlich machen."',
      fallback:'images/stuebli.png' },
    { key:'split_bg_2', label:'③ Split 2 – Von Frick',
      position:'Zweiter Split-Block rechts',
      nearText:'„Von Frick. Für Frick."',
      fallback:'images/wohnzimmer.png' },
    { key:'split_bg_3', label:'④ Split 3 – Lage',
      position:'Unter der Timeline, vor dem Team',
      nearText:'„Mittendrin im Fricktal."',
      fallback:'images/garten.png' },
  ],
  'karriere': [
    { key:'hero_bg', label:'① Hauptbild oben (Hero)',
      position:'Ganz oben der Karriere-Seite',
      nearText:'„Werde Teil unseres Teams."',
      fallback:'images/stuebli-anlass.png' },
    { key:'split_bg', label:'② Split-Bild',
      position:'Unter „Wir suchen"-Block',
      nearText:'„Wir freuen uns auf deine Bewerbung!"',
      fallback:'images/garten.png' },
  ],
  'kontakt': [
    { key:'hero_bg', label:'① Hauptbild oben (Hero)',
      position:'Ganz oben der Kontakt-Seite',
      nearText:'„Schreib uns. Ruf uns an."',
      fallback:'images/wohnzimmer.png' },
  ],
  'kooperationen': [
    { key:'hero_bg', label:'① Hauptbild oben (Hero)',
      position:'Ganz oben der Kooperationen-Seite',
      nearText:'„Gemeinsam für Frick."',
      fallback:'images/aula-anlass.png' },
  ],
  'galerie': [
    { key:'hero_bg', label:'① Hauptbild oben (Hero)',
      position:'Ganz oben der Galerie-Seite',
      nearText:'Galerie-Hero',
      fallback:'images/aula-anlass.png' },
  ],
};

async function loadBilder() {
  console.log('[Bilder] loadBilder() called');
  const filterSel = $('#bilderPageFilter');
  const container = $('#bilderContainer');
  if (!container) { console.warn('[Bilder] container missing'); return; }
  const page = filterSel ? filterSel.value : 'index';
  const slots = BG_SLOTS_BY_PAGE[page] || [];
  console.log('[Bilder] page:', page, 'slots:', slots.length);

  // SOFORT die Slots rendern (mit Fallback-Bildern), DB-Werte werden später überschrieben
  if (!slots.length) {
    container.innerHTML = '<div class="info-box"><p>Keine Bild-Slots für diese Seite definiert.</p></div>';
    return;
  }
  renderBilderSlots(container, page, slots, {});

  // Dann DB abfragen und überschreiben
  try {
    const res = await sb.from('cms_sections').select('*').eq('page_slug', page).eq('kind', 'image');
    if (res.error) throw res.error;
    const byKey = {};
    (res.data || []).forEach(s => byKey[s.section_key] = s);
    renderBilderSlots(container, page, slots, byKey);
  } catch (err) {
    console.warn('[Bilder] DB-Fehler', err);
    const banner = document.createElement('div');
    banner.className = 'info-box';
    banner.style.borderLeftColor = 'var(--c-danger)';
    banner.style.marginBottom = '1rem';
    banner.innerHTML = `<p><strong>Hinweis:</strong> ${escapeHtml(err.message || String(err))}. Slot-Vorschauen werden mit Fallback-Bildern angezeigt; Speichern braucht eine funktionierende DB.</p>`;
    container.insertBefore(banner, container.firstChild);
  }
}

function renderBilderSlots(container, page, slots, byKey) {
  container.innerHTML = slots.map(slot => {
    const cur = byKey[slot.key];
    const url = cur?.content || slot.fallback || '';
    return `
      <div class="menu-cat" data-slot="${slot.key}">
        <div class="menu-cat__head" style="display:block;">
          <h3>${escapeHtml(slot.label)}</h3>
          ${slot.position ? `<div style="margin-top:0.3rem;font-size:0.85rem;color:var(--c-text-soft);"><strong>📍 Position:</strong> ${escapeHtml(slot.position)}</div>` : ''}
          ${slot.nearText ? `<div style="margin-top:0.2rem;font-size:0.85rem;color:var(--c-brown);font-style:italic;"><strong>📝 Neben Text:</strong> ${escapeHtml(slot.nearText)}</div>` : ''}
        </div>
        <div style="padding:1.25rem;display:grid;grid-template-columns:160px 1fr;gap:1.25rem;align-items:start;">
          <div style="width:160px;height:120px;background-image:url('${escapeAttr(url)}');background-size:cover;background-position:center;border-radius:4px;border:1px solid var(--c-line);"></div>
          <div>
            <label style="font-size:0.75rem;font-weight:600;color:var(--c-text-soft);text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:0.3rem;">Aktuelle Bild-URL</label>
            <input type="text" value="${escapeAttr(url)}" data-bilder-url="${slot.key}" style="width:100%;padding:0.5rem 0.7rem;border:1px solid var(--c-line);border-radius:4px;margin-bottom:0.5rem;">
            <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
              <label class="btn-primary" style="cursor:pointer;">
                📷 Neues Bild hochladen
                <input type="file" accept="image/*" hidden data-bilder-upload="${slot.key}">
              </label>
              <button class="btn-secondary" data-bilder-save="${slot.key}">Speichern</button>
              <span class="img-drop__hint" data-bilder-hint="${slot.key}"></span>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');

  // Listener für Save + Upload
  container.querySelectorAll('[data-bilder-save]').forEach(btn => {
    btn.addEventListener('click', () => saveBildSlot(page, btn.dataset.bilderSave));
  });
  container.querySelectorAll('[data-bilder-upload]').forEach(input => {
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const slot = input.dataset.bilderUpload;
      const hint = container.querySelector(`[data-bilder-hint="${slot}"]`);
      if (hint) { hint.textContent = 'Lade hoch…'; hint.style.color = 'var(--c-accent)'; }
      try {
        const ext = file.name.split('.').pop();
        const name = `${Date.now()}-${Math.round(Math.random()*1e6)}.${ext}`;
        const { error: upErr } = await sb.storage.from(STORAGE_BUCKET).upload(name, file);
        if (upErr) throw upErr;
        const { data: pub } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(name);
        await sb.from('cms_medien').insert({ filename: file.name, url: pub.publicUrl, alt: file.name });
        const urlInput = container.querySelector(`[data-bilder-url="${slot}"]`);
        if (urlInput) urlInput.value = pub.publicUrl;
        await saveBildSlot(page, slot);
      } catch (err) {
        if (hint) { hint.textContent = 'Fehler: '+err.message; hint.style.color = 'var(--c-danger)'; }
      }
    });
  });
}

async function saveBildSlot(page, key) {
  const urlInput = $(`[data-bilder-url="${key}"]`);
  const hint = $(`[data-bilder-hint="${key}"]`);
  if (!urlInput) return;
  const slot = (BG_SLOTS_BY_PAGE[page]||[]).find(s => s.key === key);
  const url = urlInput.value;
  // upsert in cms_sections (page_slug, section_key, kind='image', content=url)
  const { data: existing } = await sb.from('cms_sections')
    .select('id').eq('page_slug', page).eq('section_key', key).maybeSingle();
  let res;
  if (existing) res = await sb.from('cms_sections').update({ content: url, kind: 'image', label: slot?.label||key }).eq('id', existing.id);
  else res = await sb.from('cms_sections').insert({ page_slug: page, section_key: key, kind: 'image', label: slot?.label||key, content: url });
  if (res.error) {
    if (hint) { hint.textContent = 'Fehler: '+res.error.message; hint.style.color='var(--c-danger)'; }
    return;
  }
  if (hint) { hint.textContent = '✓ Gespeichert · live auf der Webseite'; hint.style.color='var(--c-success)'; }
  setTimeout(loadBilder, 1500);
}

$('#bilderPageFilter') && $('#bilderPageFilter').addEventListener('change', loadBilder);

/* =============================================================
   GENERISCHE SORTIERUNG: macht eine <tbody> draggable.
   Aktualisiert sort_order in der angegebenen Tabelle nach drop.
   ============================================================= */
/**
 * Nimmt eine bestehende Tabelle und macht sie sortable:
 * - Holt die Item-IDs aus den Rows (data-id) oder aus onclick-Handlern
 * - Fügt eine Drag-Handle-Spalte links ein
 * - Aktiviert Sortable.js
 */
function enhanceTableForSorting(tableId, tableName, idExtractor) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;
  const rows = [...tbody.querySelectorAll('tr')];
  rows.forEach(tr => {
    if (tr.dataset.id) return; // schon verarbeitet
    // Extrahiere ID aus onclick="editXxx(123)" Pattern
    const btn = tr.querySelector('button[onclick]');
    if (!btn) return;
    const m = /\((\d+)\)/.exec(btn.getAttribute('onclick') || '');
    if (!m) return;
    tr.dataset.id = m[1];
    // Füge Drag-Handle als erste Zelle ein
    const handleTd = document.createElement('td');
    handleTd.className = 'drag-handle';
    handleTd.innerHTML = '⋮⋮';
    handleTd.title = 'Ziehen zum Sortieren';
    tr.insertBefore(handleTd, tr.firstChild);
  });
  // Header: leere erste Spalte hinzufügen
  const thead = document.querySelector(`#${tableId} thead tr`);
  if (thead && !thead.querySelector('.drag-handle-th')) {
    const th = document.createElement('th');
    th.className = 'drag-handle-th';
    th.style.width = '28px';
    thead.insertBefore(th, thead.firstChild);
  }
  makeSortable(tbody, tableName);
}

function makeSortable(tbodyEl, tableName) {
  if (!window.Sortable || !tbodyEl) return;
  if (tbodyEl._sortable) tbodyEl._sortable.destroy();
  tbodyEl._sortable = window.Sortable.create(tbodyEl, {
    animation: 180,
    handle: '.drag-handle',
    ghostClass: 'drag-ghost',
    chosenClass: 'drag-chosen',
    onEnd: async () => {
      // Sammle IDs in neuer Reihenfolge und schreibe sort_order
      const rows = [...tbodyEl.querySelectorAll('tr[data-id]')];
      const updates = rows.map((tr, i) => ({ id: Number(tr.dataset.id), sort_order: i + 1 }));
      try {
        // Pro Eintrag ein UPDATE (Supabase REST hat kein BULK-Update für PK-spezifische Werte)
        await Promise.all(updates.map(u =>
          sb.from(tableName).update({ sort_order: u.sort_order }).eq('id', u.id)
        ));
        toast('Reihenfolge gespeichert', 'success');
      } catch (e) {
        toast('Fehler beim Sortieren: ' + e.message, 'error');
      }
    }
  });
}

$$('.nav-item').forEach(b => b.addEventListener('click', () => {
  // Falls Sub-Item: Eltern-Gruppe sicher offen halten
  const group = b.closest('.nav-group');
  if (group) group.classList.add('open');
  switchView(b.dataset.view, {
    clickedEl: b,
    filter: b.dataset.filter,
    list: b.dataset.list,
    typ: b.dataset.typ,
    page: b.dataset.page,
  });
}));

/* Toggle für Gruppen-Überschriften (Akkordeon-Verhalten) */
$$('.nav-group-toggle').forEach(t => t.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  const group = t.closest('.nav-group');
  if (!group) return;
  const wasOpen = group.classList.contains('open');
  // Alle Gruppen zumachen
  $$('.nav-group').forEach(g => g.classList.remove('open'));
  // Diese öffnen wenn vorher zu war
  if (!wasOpen) group.classList.add('open');
}));

/* Beim Laden: alle Gruppen zu (nur Top-Level Items wie Übersicht/Anfragen sichtbar) */
$$('.nav-group').forEach(g => g.classList.remove('open'));
$$('[data-view-link]').forEach(c => c.addEventListener('click', () => switchView(c.dataset.viewLink)));

/* =============================================================
   OVERVIEW COUNTS
   ============================================================= */
async function loadCounts() {
  const tables = [
    ['cms_events',     '#countEvents'],
    ['cms_sections',   '#countSections'],
    ['cms_menu_items', '#countMenu'],
    ['cms_zimmer',     '#countZimmer'],
    ['cms_team',       '#countTeam'],
    ['cms_stellen',    '#countStellen'],
    ['posts',          '#countCommunity'],
  ];
  for (const [tbl, sel] of tables) {
    const el = $(sel);
    if (!el) continue;
    const { count } = await sb.from(tbl).select('id', { count: 'exact', head: true });
    el.textContent = count ?? '–';
  }
  // Anfragen NUR neue
  const { count: nAnfr } = await sb.from('cms_anfragen')
    .select('id', { count: 'exact', head: true }).eq('status', 'neu');
  if ($('#countAnfragen')) $('#countAnfragen').textContent = nAnfr ?? '–';
}

/* =============================================================
   MODAL HELPER
   ============================================================= */
let modalOnSave = null;
function openModal(title, bodyHtml, onSave) {
  $('#modalTitle').textContent = title;
  $('#modalBody').innerHTML = bodyHtml;
  modalOnSave = onSave;
  $('#modal').classList.remove('hidden');
  // ALLE Bild-URL / Logo-URL / PDF-URL Felder zu Drag&Drop-Upload-Feldern aufwerten
  setTimeout(() => {
    enhanceImageInputs($('#modalBody'));
    setupMultiImageFields();
  }, 10);
}

/* =============================================================
   Drag&Drop Bild/PDF-Upload für alle "*_url" Felder im Modal
   ============================================================= */
function enhanceImageInputs(root) {
  if (!root) return;
  const inputs = [...root.querySelectorAll(
    'input[name="bild_url"], input[name="logo_url"], input[name="hero_bild_url"], input[name="pdf_url"]'
  )];
  inputs.forEach(input => {
    if (input.dataset.enhanced) return;
    input.dataset.enhanced = '1';
    const isPdf = input.name === 'pdf_url';
    const acceptStr = isPdf ? 'application/pdf' : 'image/*';
    const placeholder = isPdf ? 'https://… oder PDF hier ablegen' : 'https://… oder Bild hier ablegen';
    input.placeholder = placeholder;

    // Bestehenden input in einen img-drop wrap einpacken
    const wrap = document.createElement('div');
    wrap.className = 'img-drop';
    wrap.innerHTML = `
      <div class="img-drop__preview" data-preview>${isPdf ? 'PDF' : 'Kein Bild'}</div>
      <div class="img-drop__main">
        <div class="img-drop__row" data-input-row></div>
        <div class="img-drop__row">
          <label class="img-drop__btn">
            ${isPdf ? '📄 PDF wählen' : '📷 Bild wählen'}
            <input type="file" accept="${acceptStr}" hidden data-file>
          </label>
          <span class="img-drop__hint" data-hint>${isPdf ? 'oder PDF hier hin ziehen' : 'oder Bild hier hin ziehen'}</span>
        </div>
      </div>`;

    // Original Input in die Row verschieben
    input.parentNode.insertBefore(wrap, input);
    wrap.querySelector('[data-input-row]').appendChild(input);
    input.style.flex = '1';

    const preview = wrap.querySelector('[data-preview]');
    const fileInput = wrap.querySelector('[data-file]');
    const hint = wrap.querySelector('[data-hint]');

    function setPreview(url) {
      if (!url) { preview.textContent = isPdf ? 'PDF' : 'Kein Bild'; preview.style.backgroundImage = ''; return; }
      if (isPdf) { preview.textContent = 'PDF ✓'; preview.style.backgroundImage = ''; preview.style.background = 'linear-gradient(135deg,#f5e0d4,#e9c8b6)'; preview.style.color = 'var(--c-accent)'; preview.style.fontWeight = '700'; }
      else { preview.textContent = ''; preview.style.backgroundImage = `url('${url}')`; }
    }
    setPreview(input.value);
    input.addEventListener('input', () => setPreview(input.value));

    async function uploadFile(file) {
      if (!file) return;
      hint.textContent = 'Lade hoch…';
      hint.classList.add('img-drop__hint--upload');
      try {
        const ext = file.name.split('.').pop();
        const name = `${Date.now()}-${Math.round(Math.random()*1e6)}.${ext}`;
        const { error: upErr } = await sb.storage.from(STORAGE_BUCKET).upload(name, file);
        if (upErr) throw upErr;
        const { data: pub } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(name);
        const url = pub.publicUrl;
        // Auch in cms_medien eintragen für die Medien-Bibliothek
        await sb.from('cms_medien').insert({ filename: file.name, url, alt: file.name });
        input.value = url;
        setPreview(url);
        hint.textContent = '✓ Hochgeladen';
        hint.classList.remove('img-drop__hint--upload');
        setTimeout(() => { hint.textContent = isPdf ? 'oder PDF hier hin ziehen' : 'oder Bild hier hin ziehen'; }, 2000);
      } catch (err) {
        hint.textContent = 'Fehler: ' + err.message;
        hint.style.color = 'var(--c-danger)';
      }
    }

    fileInput.addEventListener('change', e => uploadFile(e.target.files[0]));

    // Drag & Drop
    ['dragenter','dragover'].forEach(ev => wrap.addEventListener(ev, e => {
      e.preventDefault(); e.stopPropagation();
      wrap.classList.add('img-drop--hover');
    }));
    ['dragleave','drop'].forEach(ev => wrap.addEventListener(ev, e => {
      e.preventDefault(); e.stopPropagation();
      wrap.classList.remove('img-drop--hover');
    }));
    wrap.addEventListener('drop', e => {
      const f = e.dataTransfer?.files?.[0];
      if (f) uploadFile(f);
    });
  });
}
function closeModal() {
  $('#modal').classList.add('hidden');
  modalOnSave = null;
}
$('#modalClose').addEventListener('click', closeModal);
$('#modalCancel').addEventListener('click', closeModal);
$('#modal .modal__backdrop').addEventListener('click', closeModal);
$('#modalSave').addEventListener('click', async () => {
  if (modalOnSave) {
    try {
      await modalOnSave();
      closeModal();
    } catch (e) {
      toast('Fehler: ' + e.message, 'error');
    }
  }
});

/* =============================================================
   EVENTS
   ============================================================= */
async function loadEvents() {
  const tbody = $('#eventsTable tbody');
  tbody.innerHTML = '<tr><td colspan="6">Lädt…</td></tr>';
  const { data, error } = await sb.from('cms_events').select('*').order('sort_order').order('datum', { ascending: true });
  if (error) { tbody.innerHTML = `<tr><td colspan="6">Fehler: ${error.message}</td></tr>`; return; }
  if (!data.length) { tbody.innerHTML = '<tr><td colspan="6">Noch keine Events.</td></tr>'; return; }
  tbody.innerHTML = data.map(e => `
    <tr>
      <td>${fmtDate(e.datum)}</td>
      <td>${e.zeit || ''}</td>
      <td><strong>${escapeHtml(e.titel)}</strong></td>
      <td>${escapeHtml(e.kategorie || '')}</td>
      <td>${e.aktiv ? '<span class="badge badge--ok">Aktiv</span>' : '<span class="badge badge--off">Inaktiv</span>'}</td>
      <td class="actions">
        <button onclick="editEvent(${e.id})">Bearbeiten</button>
        <button class="danger" onclick="deleteEvent(${e.id})">Löschen</button>
      </td>
    </tr>`).join('');
  enhanceTableForSorting('eventsTable', 'cms_events');
}

function eventFormHtml(e = {}) {
  return `
    <div class="form-grid">
      <div class="form-row">
        <div><label>Datum *</label><input type="date" name="datum" value="${e.datum || ''}" required></div>
        <div><label>Zeit</label><input type="text" name="zeit" placeholder="19:00" value="${e.zeit || ''}"></div>
      </div>
      <div><label>Titel *</label><input type="text" name="titel" value="${escapeAttr(e.titel || '')}" required></div>
      <div class="form-row">
        <div><label>Kategorie</label><input type="text" name="kategorie" placeholder="Konzert, Brunch, Anlass…" value="${escapeAttr(e.kategorie || '')}"></div>
        <div><label>Ort</label><input type="text" name="ort" placeholder="Aula, Stübli, Garten…" value="${escapeAttr(e.ort || '')}"></div>
      </div>
      <div><label>Beschreibung</label><textarea name="beschreibung" rows="3">${escapeHtml(e.beschreibung || '')}</textarea></div>
      ${multiImagesFieldHtml(e.bilder || e.bild_url || '', 'Bilder (mehrere möglich, sortierbar)')}
      <div><label>Link-URL (optional)</label><input type="text" name="link_url" value="${escapeAttr(e.link_url || '')}"></div>
      <div class="form-row">
        <div><label>Sortierung</label><input type="number" name="sort_order" value="${e.sort_order ?? 0}"></div>
        <div style="display:flex;align-items:end;"><label class="form-check"><input type="checkbox" name="aktiv" ${e.aktiv !== false ? 'checked' : ''}> Aktiv (auf Webseite sichtbar)</label></div>
      </div>
    </div>`;
}

function readForm() {
  const form = {};
  $$('#modalBody [name]').forEach(el => {
    const k = el.name;
    if (el.type === 'checkbox') form[k] = el.checked;
    else if (el.type === 'number') form[k] = el.value === '' ? null : Number(el.value);
    else form[k] = el.value || null;
  });
  return form;
}

$('#newEventBtn').addEventListener('click', () => {
  openModal('Neues Event', eventFormHtml(), async () => {
    const f = readForm();
    if (!f.datum || !f.titel) throw new Error('Datum und Titel sind Pflicht.');
    const { error } = await sb.from('cms_events').insert(f);
    if (error) throw error;
    toast('Event gespeichert', 'success');
    loadEvents(); loadCounts();
  });
});

window.editEvent = async (id) => {
  const { data, error } = await sb.from('cms_events').select('*').eq('id', id).single();
  if (error) return toast('Fehler: ' + error.message, 'error');
  openModal('Event bearbeiten', eventFormHtml(data), async () => {
    const f = readForm();
    const { error } = await sb.from('cms_events').update(f).eq('id', id);
    if (error) throw error;
    toast('Event aktualisiert', 'success');
    loadEvents();
  });
};

window.deleteEvent = async (id) => {
  if (!confirm('Event wirklich löschen?')) return;
  const { error } = await sb.from('cms_events').delete().eq('id', id);
  if (error) return toast('Fehler: ' + error.message, 'error');
  toast('Event gelöscht', 'success');
  loadEvents(); loadCounts();
};

/* =============================================================
   SEITEN-TEXTE (Sections)
   ============================================================= */
async function loadSections() {
  const tbody = $('#sectionsTable tbody');
  const filter = $('#pageFilter').value;
  tbody.innerHTML = '<tr><td colspan="5">Lädt…</td></tr>';
  let q = sb.from('cms_sections').select('*').order('page_slug').order('sort_order');
  if (filter) q = q.eq('page_slug', filter);
  const { data, error } = await q;
  if (error) { tbody.innerHTML = `<tr><td colspan="5">Fehler: ${error.message}</td></tr>`; return; }
  if (!data.length) { tbody.innerHTML = '<tr><td colspan="5">Noch keine Text-Blöcke.</td></tr>'; return; }
  tbody.innerHTML = data.map(s => `
    <tr>
      <td><strong>${escapeHtml(s.page_slug)}</strong></td>
      <td><code>${escapeHtml(s.section_key)}</code></td>
      <td>${escapeHtml(s.label || '')}</td>
      <td><div class="truncate">${escapeHtml((s.content || '').substring(0, 80))}</div></td>
      <td class="actions">
        <button onclick="editSection(${s.id})">Bearbeiten</button>
        <button class="danger" onclick="deleteSection(${s.id})">Löschen</button>
      </td>
    </tr>`).join('');
  enhanceTableForSorting('sectionsTable', 'cms_sections');
}

$('#pageFilter').addEventListener('change', loadSections);

function sectionFormHtml(s = {}) {
  return `
    <div class="form-grid">
      <div class="form-row">
        <div><label>Seite (slug) *</label><input type="text" name="page_slug" value="${escapeAttr(s.page_slug || '')}" placeholder="index, restaurant, …" required></div>
        <div><label>Schlüssel (technisch) *</label><input type="text" name="section_key" value="${escapeAttr(s.section_key || '')}" placeholder="hero_claim" required></div>
      </div>
      <div><label>Beschreibung (was ist das?)</label><input type="text" name="label" value="${escapeAttr(s.label || '')}" placeholder="z.B. Hero – Hauptclaim"></div>
      <div><label>Typ</label>
        <select name="kind">
          <option value="text"  ${s.kind==='text'  ? 'selected' : ''}>Einfacher Text</option>
          <option value="html"  ${s.kind==='html'  ? 'selected' : ''}>HTML (mit Tags &lt;br&gt;, &lt;strong&gt;…)</option>
          <option value="image" ${s.kind==='image' ? 'selected' : ''}>Bild-URL</option>
        </select>
      </div>
      <div><label>Inhalt</label><textarea name="content" rows="6">${escapeHtml(s.content || '')}</textarea></div>
      <div><label>Sortierung</label><input type="number" name="sort_order" value="${s.sort_order ?? 0}"></div>
      <p class="form-help">Im HTML deiner Seite einbauen mit: <code>&lt;span data-cms="seite:schluessel"&gt;Fallback&lt;/span&gt;</code></p>
    </div>`;
}

$('#newSectionBtn').addEventListener('click', () => {
  openModal('Neuer Text-Block', sectionFormHtml(), async () => {
    const f = readForm();
    if (!f.page_slug || !f.section_key) throw new Error('Seite und Schlüssel sind Pflicht.');
    const { error } = await sb.from('cms_sections').insert(f);
    if (error) throw error;
    toast('Text gespeichert', 'success');
    loadSections(); loadCounts();
  });
});

window.editSection = async (id) => {
  const { data, error } = await sb.from('cms_sections').select('*').eq('id', id).single();
  if (error) return toast('Fehler: ' + error.message, 'error');
  openModal('Text bearbeiten – ' + (data.label || data.section_key), sectionFormHtml(data), async () => {
    const f = readForm();
    const { error } = await sb.from('cms_sections').update(f).eq('id', id);
    if (error) throw error;
    toast('Text aktualisiert', 'success');
    loadSections();
  });
};

window.deleteSection = async (id) => {
  if (!confirm('Text-Block wirklich löschen?')) return;
  const { error } = await sb.from('cms_sections').delete().eq('id', id);
  if (error) return toast('Fehler: ' + error.message, 'error');
  toast('Gelöscht', 'success');
  loadSections(); loadCounts();
};

/* =============================================================
   SPEISEKARTE / GETRÄNKE / WEIN
   ============================================================= */
async function loadMenu() {
  const typ = $('#menuTypeFilter').value;
  const container = $('#menuContainer');
  container.innerHTML = 'Lädt…';
  const [{ data: cats, error: e1 }, { data: items, error: e2 }] = await Promise.all([
    sb.from('cms_menu_kategorien').select('*').eq('typ', typ).order('sort_order'),
    sb.from('cms_menu_items').select('*').order('sort_order'),
  ]);
  if (e1 || e2) { container.innerHTML = 'Fehler: ' + (e1?.message || e2?.message); return; }
  if (!cats.length) { container.innerHTML = '<div class="info-box"><p>Noch keine Kategorien. Erstelle zuerst eine Kategorie.</p></div>'; return; }
  container.innerHTML = cats.map(cat => {
    const its = items.filter(i => i.kategorie_id === cat.id);
    return `
      <div class="menu-cat">
        <div class="menu-cat__head">
          <h3>${escapeHtml(cat.name)}</h3>
          <div>
            <button class="btn-ghost" onclick="editMenuCat(${cat.id})">Kategorie bearbeiten</button>
            <button class="btn-ghost" onclick="deleteMenuCat(${cat.id})" style="color:var(--c-danger)">Kategorie löschen</button>
          </div>
        </div>
        <table class="data-table">
          <tbody>
            ${its.length ? its.map(i => `
              <tr>
                <td><strong>${escapeHtml(i.name)}</strong>
                ${i.beschreibung ? `<div style="color:var(--c-text-soft);font-size:0.85rem;">${escapeHtml(i.beschreibung)}</div>` : ''}</td>
                <td style="text-align:right;white-space:nowrap;">
                  ${i.preis ? 'CHF ' + Number(i.preis).toFixed(2) : ''}
                  ${i.preis_dl ? '<div style="font-size:0.8rem;color:var(--c-text-soft)">' + Number(i.preis_dl).toFixed(2) + ' / dl</div>' : ''}
                  ${i.preis_flasche ? '<div style="font-size:0.8rem;color:var(--c-text-soft)">' + Number(i.preis_flasche).toFixed(2) + ' / Flasche</div>' : ''}
                </td>
                <td class="actions">
                  <button onclick="editMenuItem(${i.id})">Bearbeiten</button>
                  <button class="danger" onclick="deleteMenuItem(${i.id})">Löschen</button>
                </td>
              </tr>`).join('') : '<tr><td colspan="3" style="color:var(--c-text-soft);font-style:italic;">Noch keine Einträge in dieser Kategorie.</td></tr>'}
          </tbody>
        </table>
      </div>`;
  }).join('');
}

$('#menuTypeFilter').addEventListener('change', loadMenu);

function menuCatFormHtml(c = {}) {
  const typ = c.typ || $('#menuTypeFilter').value;
  return `
    <div class="form-grid">
      <div><label>Typ</label>
        <select name="typ">
          <option value="speise"   ${typ==='speise'  ?'selected':''}>Speisen</option>
          <option value="getraenk" ${typ==='getraenk'?'selected':''}>Getränke</option>
          <option value="wein"     ${typ==='wein'    ?'selected':''}>Weine</option>
        </select>
      </div>
      <div><label>Name *</label><input type="text" name="name" value="${escapeAttr(c.name||'')}" placeholder="Vorspeisen, Hauptgang, Weisswein…" required></div>
      <div><label>Beschreibung (optional)</label><textarea name="beschreibung" rows="2">${escapeHtml(c.beschreibung||'')}</textarea></div>
      <div><label>Sortierung</label><input type="number" name="sort_order" value="${c.sort_order ?? 0}"></div>
    </div>`;
}

$('#newMenuCatBtn').addEventListener('click', () => {
  openModal('Neue Kategorie', menuCatFormHtml(), async () => {
    const f = readForm();
    if (!f.name) throw new Error('Name ist Pflicht.');
    const { error } = await sb.from('cms_menu_kategorien').insert(f);
    if (error) throw error;
    toast('Kategorie erstellt', 'success');
    loadMenu();
  });
});

window.editMenuCat = async (id) => {
  const { data, error } = await sb.from('cms_menu_kategorien').select('*').eq('id', id).single();
  if (error) return toast(error.message, 'error');
  openModal('Kategorie bearbeiten', menuCatFormHtml(data), async () => {
    const f = readForm();
    const { error } = await sb.from('cms_menu_kategorien').update(f).eq('id', id);
    if (error) throw error;
    toast('Aktualisiert', 'success');
    loadMenu();
  });
};

window.deleteMenuCat = async (id) => {
  if (!confirm('Kategorie und ALLE zugehörigen Einträge löschen?')) return;
  const { error } = await sb.from('cms_menu_kategorien').delete().eq('id', id);
  if (error) return toast(error.message, 'error');
  toast('Gelöscht', 'success');
  loadMenu();
};

async function menuItemFormHtml(i = {}) {
  const typ = $('#menuTypeFilter').value;
  const { data: cats } = await sb.from('cms_menu_kategorien').select('id, name').eq('typ', typ).order('sort_order');
  const catOpts = cats.map(c => `<option value="${c.id}" ${i.kategorie_id == c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('');
  const isWein = typ === 'wein';
  return `
    <div class="form-grid">
      <div><label>Kategorie *</label><select name="kategorie_id" required>${catOpts}</select></div>
      <div><label>Name *</label><input type="text" name="name" value="${escapeAttr(i.name||'')}" required></div>
      <div><label>Beschreibung</label><textarea name="beschreibung" rows="2">${escapeHtml(i.beschreibung||'')}</textarea></div>
      ${isWein ? `
        <div class="form-row cols-3">
          <div><label>Jahrgang</label><input type="text" name="jahrgang" value="${escapeAttr(i.jahrgang||'')}"></div>
          <div><label>Preis / dl</label><input type="number" step="0.10" name="preis_dl" value="${i.preis_dl ?? ''}"></div>
          <div><label>Preis / Flasche</label><input type="number" step="0.10" name="preis_flasche" value="${i.preis_flasche ?? ''}"></div>
        </div>
        <div><label>Herkunft</label><input type="text" name="herkunft" value="${escapeAttr(i.herkunft||'')}"></div>
      ` : `
        <div class="form-row">
          <div><label>Preis (CHF)</label><input type="number" step="0.10" name="preis" value="${i.preis ?? ''}"></div>
          <div><label>Allergene</label><input type="text" name="allergene" value="${escapeAttr(i.allergene||'')}" placeholder="G, L, Nuss…"></div>
        </div>
      `}
      <div class="form-row">
        <div><label>Sortierung</label><input type="number" name="sort_order" value="${i.sort_order ?? 0}"></div>
        <div style="display:flex;align-items:end;"><label class="form-check"><input type="checkbox" name="aktiv" ${i.aktiv !== false ? 'checked' : ''}> Aktiv</label></div>
      </div>
    </div>`;
}

$('#newMenuItemBtn').addEventListener('click', async () => {
  openModal('Neue Position', await menuItemFormHtml(), async () => {
    const f = readForm();
    if (!f.name || !f.kategorie_id) throw new Error('Kategorie und Name sind Pflicht.');
    const { error } = await sb.from('cms_menu_items').insert(f);
    if (error) throw error;
    toast('Eintrag gespeichert', 'success');
    loadMenu(); loadCounts();
  });
});

window.editMenuItem = async (id) => {
  const { data, error } = await sb.from('cms_menu_items').select('*').eq('id', id).single();
  if (error) return toast(error.message, 'error');
  openModal('Eintrag bearbeiten', await menuItemFormHtml(data), async () => {
    const f = readForm();
    const { error } = await sb.from('cms_menu_items').update(f).eq('id', id);
    if (error) throw error;
    toast('Aktualisiert', 'success');
    loadMenu();
  });
};

window.deleteMenuItem = async (id) => {
  if (!confirm('Eintrag wirklich löschen?')) return;
  const { error } = await sb.from('cms_menu_items').delete().eq('id', id);
  if (error) return toast(error.message, 'error');
  toast('Gelöscht', 'success');
  loadMenu(); loadCounts();
};

/* =============================================================
   ÖFFNUNGSZEITEN
   ============================================================= */
async function loadOz() {
  const tbody = $('#ozTable tbody');
  tbody.innerHTML = '<tr><td colspan="7">Lädt…</td></tr>';
  const { data, error } = await sb.from('cms_oeffnungszeiten').select('*').order('bereich').order('sort_order');
  if (error) { tbody.innerHTML = `<tr><td colspan="7">Fehler: ${error.message}</td></tr>`; return; }
  if (!data.length) { tbody.innerHTML = '<tr><td colspan="7">Noch keine Einträge.</td></tr>'; return; }
  tbody.innerHTML = data.map(o => `
    <tr>
      <td><strong>${escapeHtml(o.bereich)}</strong></td>
      <td>${escapeHtml(o.tag_label)}</td>
      <td>${escapeHtml(o.von || '')}</td>
      <td>${escapeHtml(o.bis || '')}</td>
      <td>${escapeHtml(o.hinweis || '')}</td>
      <td>${o.aktiv ? '<span class="badge badge--ok">Aktiv</span>' : '<span class="badge badge--off">Inaktiv</span>'}</td>
      <td class="actions">
        <button onclick="editOz(${o.id})">Bearbeiten</button>
        <button class="danger" onclick="deleteOz(${o.id})">Löschen</button>
      </td>
    </tr>`).join('');
  enhanceTableForSorting('ozTable', 'cms_oeffnungszeiten');
}

function ozFormHtml(o = {}) {
  return `
    <div class="form-grid">
      <div class="form-row">
        <div><label>Bereich *</label><input type="text" name="bereich" value="${escapeAttr(o.bereich||'')}" placeholder="Restaurant, Hotel-Rezeption…" required></div>
        <div><label>Tag(e) *</label><input type="text" name="tag_label" value="${escapeAttr(o.tag_label||'')}" placeholder="Mo–Fr, Sa, So…" required></div>
      </div>
      <div class="form-row cols-3">
        <div><label>Von</label><input type="text" name="von" value="${escapeAttr(o.von||'')}" placeholder="08:00"></div>
        <div><label>Bis</label><input type="text" name="bis" value="${escapeAttr(o.bis||'')}" placeholder="23:00"></div>
        <div><label>Sortierung</label><input type="number" name="sort_order" value="${o.sort_order ?? 0}"></div>
      </div>
      <div><label>Hinweis (optional)</label><input type="text" name="hinweis" value="${escapeAttr(o.hinweis||'')}" placeholder="Brunch bis 14:00 / Ruhetag / …"></div>
      <label class="form-check"><input type="checkbox" name="aktiv" ${o.aktiv !== false ? 'checked' : ''}> Aktiv</label>
    </div>`;
}

$('#newOzBtn').addEventListener('click', () => {
  openModal('Neue Öffnungszeit', ozFormHtml(), async () => {
    const f = readForm();
    if (!f.bereich || !f.tag_label) throw new Error('Bereich und Tag sind Pflicht.');
    const { error } = await sb.from('cms_oeffnungszeiten').insert(f);
    if (error) throw error;
    toast('Gespeichert', 'success');
    loadOz();
  });
});

window.editOz = async (id) => {
  const { data, error } = await sb.from('cms_oeffnungszeiten').select('*').eq('id', id).single();
  if (error) return toast(error.message, 'error');
  openModal('Bearbeiten', ozFormHtml(data), async () => {
    const f = readForm();
    const { error } = await sb.from('cms_oeffnungszeiten').update(f).eq('id', id);
    if (error) throw error;
    toast('Aktualisiert', 'success');
    loadOz();
  });
};

window.deleteOz = async (id) => {
  if (!confirm('Eintrag wirklich löschen?')) return;
  const { error } = await sb.from('cms_oeffnungszeiten').delete().eq('id', id);
  if (error) return toast(error.message, 'error');
  toast('Gelöscht', 'success');
  loadOz();
};

/* =============================================================
   NEWS
   ============================================================= */
async function loadNews() {
  const tbody = $('#newsTable tbody');
  tbody.innerHTML = '<tr><td colspan="6">Lädt…</td></tr>';
  const { data, error } = await sb.from('cms_news').select('*').order('gueltig_ab', { ascending: false });
  if (error) { tbody.innerHTML = `<tr><td colspan="6">Fehler: ${error.message}</td></tr>`; return; }
  if (!data.length) { tbody.innerHTML = '<tr><td colspan="6">Noch keine News.</td></tr>'; return; }
  tbody.innerHTML = data.map(n => `
    <tr>
      <td><strong>${escapeHtml(n.titel)}</strong></td>
      <td>${escapeHtml(n.kategorie || '')}</td>
      <td>${fmtDate(n.gueltig_ab)}</td>
      <td>${n.gueltig_bis ? fmtDate(n.gueltig_bis) : '–'}</td>
      <td>${n.aktiv ? '<span class="badge badge--ok">Aktiv</span>' : '<span class="badge badge--off">Inaktiv</span>'}</td>
      <td class="actions">
        <button onclick="editNews(${n.id})">Bearbeiten</button>
        <button class="danger" onclick="deleteNews(${n.id})">Löschen</button>
      </td>
    </tr>`).join('');
  enhanceTableForSorting('newsTable', 'cms_news');
}

function newsFormHtml(n = {}) {
  const today = new Date().toISOString().split('T')[0];
  return `
    <div class="form-grid">
      <div><label>Titel *</label><input type="text" name="titel" value="${escapeAttr(n.titel||'')}" required></div>
      <div><label>Kategorie</label>
        <select name="kategorie">
          <option value="Aktuelles"    ${n.kategorie==='Aktuelles'    ? 'selected':''}>Aktuelles</option>
          <option value="Tagesangebot" ${n.kategorie==='Tagesangebot' ? 'selected':''}>Tagesangebot</option>
          <option value="Saisonal"     ${n.kategorie==='Saisonal'     ? 'selected':''}>Saisonal</option>
          <option value="Wichtig"      ${n.kategorie==='Wichtig'      ? 'selected':''}>Wichtig</option>
        </select>
      </div>
      <div><label>Text</label><textarea name="text" rows="4">${escapeHtml(n.text||'')}</textarea></div>
      ${multiImagesFieldHtml(n.bilder || n.bild_url || '', 'Bilder (mehrere möglich)')}
      <div class="form-row">
        <div><label>Gültig ab</label><input type="date" name="gueltig_ab" value="${n.gueltig_ab || today}"></div>
        <div><label>Gültig bis (optional)</label><input type="date" name="gueltig_bis" value="${n.gueltig_bis || ''}"></div>
      </div>
      <div class="form-row">
        <div><label>Sortierung</label><input type="number" name="sort_order" value="${n.sort_order ?? 0}"></div>
        <div style="display:flex;align-items:end;"><label class="form-check"><input type="checkbox" name="aktiv" ${n.aktiv !== false ? 'checked' : ''}> Aktiv</label></div>
      </div>
    </div>`;
}

$('#newNewsBtn').addEventListener('click', () => {
  openModal('Neue News', newsFormHtml(), async () => {
    const f = readForm();
    if (!f.titel) throw new Error('Titel ist Pflicht.');
    const { error } = await sb.from('cms_news').insert(f);
    if (error) throw error;
    toast('News gespeichert', 'success');
    loadNews(); loadCounts();
  });
});

window.editNews = async (id) => {
  const { data, error } = await sb.from('cms_news').select('*').eq('id', id).single();
  if (error) return toast(error.message, 'error');
  openModal('News bearbeiten', newsFormHtml(data), async () => {
    const f = readForm();
    const { error } = await sb.from('cms_news').update(f).eq('id', id);
    if (error) throw error;
    toast('Aktualisiert', 'success');
    loadNews();
  });
};

window.deleteNews = async (id) => {
  if (!confirm('News wirklich löschen?')) return;
  const { error } = await sb.from('cms_news').delete().eq('id', id);
  if (error) return toast(error.message, 'error');
  toast('Gelöscht', 'success');
  loadNews(); loadCounts();
};

/* =============================================================
   KARTEN & PDFs (Zuweisung Speisekarte / Getränke / Wein / Bankett etc.)
   Speichert PDF-URL in cms_sections mit kind='pdf'.
   ============================================================= */
const KARTEN_SLOTS = [
  { key: 'speisekarte',              label: 'Aktuelle Speisekarte (Hauptbereich)',  beschreibung: 'Wird überall als "Speisekarte" verlinkt.' },
  { key: 'getraenkekarte',           label: 'Getränkekarte (Hauptbereich)',          beschreibung: 'Wird überall als "Getränkekarte" verlinkt.' },
  { key: 'weinkarte',                label: 'Weinkarte',                              beschreibung: 'Hauptbereich Weinkarte.' },
  { key: 'mittagskarte',             label: 'Mittagskarte / Tagesangebot',           beschreibung: 'Aktuelle Mittagskarte (wöchentlich).' },
  // 6 Bereich-spezifische Karten für restaurant.html
  { key: 'speisekarte_alte_hoefli',   label: 'Alte Höfli – Speisekarte',              beschreibung: 'Kachel auf der Restaurant-Seite (Karten-Übersicht).' },
  { key: 'getraenkekarte_alte_hoefli',label: 'Alte Höfli – Getränkekarte',            beschreibung: 'Kachel auf der Restaurant-Seite.' },
  { key: 'speisekarte_wohnzimmer',    label: 'Wohnzimmer – Speisekarte',              beschreibung: 'Kachel auf der Restaurant-Seite.' },
  { key: 'getraenkekarte_wohnzimmer', label: 'Wohnzimmer – Getränkekarte',            beschreibung: 'Kachel auf der Restaurant-Seite.' },
  { key: 'speisekarte_stuebli',       label: 'Stübli – Speisekarte',                  beschreibung: 'Kachel auf der Restaurant-Seite.' },
  { key: 'weinkarte_stuebli',         label: 'Stübli – Weinkarte',                    beschreibung: 'Kachel auf der Restaurant-Seite.' },
  // Dokumentationen
  { key: 'bankettdokumentation',     label: 'Bankettdokumentation',                   beschreibung: 'Wird auf der Events-Seite verlinkt.' },
  { key: 'seminardokumentation',     label: 'Seminardokumentation',                   beschreibung: 'Wird auf der Seminare-Seite verlinkt.' },
  { key: 'hotelpauschalen',          label: 'Hotelpauschalen-PDF',                    beschreibung: 'Wird auf der Hotel-Seite verlinkt.' },
];

async function loadKarten() {
  const container = $('#kartenContainer');
  container.innerHTML = 'Lädt…';
  // Alle PDF-Sections holen + alle hochgeladenen PDFs
  const [{ data: secs }, { data: media }] = await Promise.all([
    sb.from('cms_sections').select('*').eq('page_slug', 'karten'),
    sb.from('cms_medien').select('*').order('uploaded_at', { ascending: false }),
  ]);
  const pdfs = (media || []).filter(m => /\.pdf$/i.test(m.filename));
  const secMap = {};
  (secs || []).forEach(s => secMap[s.section_key] = s);

  container.innerHTML = KARTEN_SLOTS.map(slot => {
    const cur = secMap[slot.key];
    const currentUrl = cur?.content || '';
    return `
      <div class="menu-cat">
        <div class="menu-cat__head">
          <div>
            <h3>${escapeHtml(slot.label)}</h3>
            <div style="font-size:0.8rem;color:var(--c-text-soft);margin-top:0.2rem;">${escapeHtml(slot.beschreibung)}</div>
          </div>
        </div>
        <div style="padding:1rem 1.25rem;">
          <label style="font-size:0.75rem;font-weight:600;color:var(--c-text-soft);text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:0.3rem;">PDF auswählen</label>
          <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
            <select class="karten-select" data-slot="${slot.key}" style="flex:1;min-width:240px;padding:0.5rem 0.7rem;border:1px solid var(--c-line);border-radius:4px;">
              <option value="">— kein PDF zugewiesen —</option>
              ${pdfs.map(p => `<option value="${escapeAttr(p.url)}" ${p.url === currentUrl ? 'selected' : ''}>${escapeHtml(p.filename)}</option>`).join('')}
            </select>
            <button class="btn-primary" onclick="saveKarte('${slot.key}', '${escapeAttr(slot.label)}')">Speichern</button>
            ${currentUrl ? `<a href="${escapeAttr(currentUrl)}" target="_blank" rel="noopener" class="btn-secondary">Vorschau ↗</a>` : ''}
          </div>
          ${currentUrl ? `<div style="margin-top:0.5rem;font-size:0.8rem;color:var(--c-text-soft);">Aktuell: <code>${escapeHtml(currentUrl.split('/').slice(-1)[0])}</code></div>` : ''}
        </div>
      </div>`;
  }).join('') + (pdfs.length === 0 ? '<div class="info-box" style="margin-top:1rem;"><p><strong>Noch keine PDFs hochgeladen.</strong> Gehe links zu <strong>Medien</strong> und lade dort deine PDFs (z.B. Speisekarte) hoch.</p></div>' : '');
}

window.saveKarte = async (slotKey, slotLabel) => {
  const sel = document.querySelector(`.karten-select[data-slot="${slotKey}"]`);
  const url = sel.value;
  // Existiert die Section schon?
  const { data: existing } = await sb.from('cms_sections')
    .select('id').eq('page_slug', 'karten').eq('section_key', slotKey).maybeSingle();
  let result;
  if (existing) {
    result = await sb.from('cms_sections').update({ content: url, kind: 'pdf', label: slotLabel })
      .eq('id', existing.id);
  } else {
    result = await sb.from('cms_sections').insert({
      page_slug: 'karten', section_key: slotKey, kind: 'pdf', label: slotLabel, content: url
    });
  }
  if (result.error) return toast('Fehler: ' + result.error.message, 'error');
  toast('Gespeichert · auf der Webseite sofort live', 'success');
  loadKarten();
};

/* =============================================================
   MEDIEN (Bilder + PDFs hochladen)
   ============================================================= */
async function loadMedia() {
  const grid = $('#mediaGrid');
  grid.innerHTML = 'Lädt…';
  const { data, error } = await sb.from('cms_medien').select('*').order('uploaded_at', { ascending: false });
  if (error) { grid.innerHTML = 'Fehler: ' + error.message; return; }
  if (!data.length) { grid.innerHTML = '<div class="info-box"><p>Noch keine Medien hochgeladen. Klicke oben auf <strong>+ Datei hochladen</strong>.</p></div>'; return; }
  grid.innerHTML = data.map(m => {
    const isPdf = /\.pdf$/i.test(m.filename);
    return `
    <div class="media-tile">
      ${isPdf
        ? `<a href="${escapeAttr(m.url)}" target="_blank" rel="noopener" class="media-tile__pdf">
             <div class="media-tile__pdficon">PDF</div>
           </a>`
        : `<a href="${escapeAttr(m.url)}" target="_blank" rel="noopener"><img src="${escapeAttr(m.url)}" alt="${escapeAttr(m.alt || m.filename)}"></a>`}
      <div class="media-tile__body">
        <span class="media-tile__name" title="${escapeAttr(m.filename)}">${escapeHtml(m.filename)}</span>
        <button class="media-tile__copy" onclick="copyUrl('${escapeAttr(m.url)}')">URL</button>
        <button class="media-tile__copy" onclick="deleteMedia(${m.id}, '${escapeAttr(m.filename)}')" style="color:var(--c-danger)">×</button>
      </div>
    </div>`;
  }).join('');
}

window.deleteMedia = async (id, filename) => {
  if (!confirm(`"${filename}" wirklich löschen?`)) return;
  // Datei aus dem Bucket löschen (Pfad ist der filename mit timestamp)
  const { data } = await sb.from('cms_medien').select('url').eq('id', id).single();
  if (data) {
    const path = data.url.split('/').slice(-1)[0];
    await sb.storage.from(STORAGE_BUCKET).remove([path]);
  }
  const { error } = await sb.from('cms_medien').delete().eq('id', id);
  if (error) return toast(error.message, 'error');
  toast('Gelöscht', 'success');
  loadMedia();
};

window.copyUrl = (url) => {
  navigator.clipboard.writeText(url);
  toast('URL kopiert', 'success');
};

$('#mediaUpload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const ext = file.name.split('.').pop();
  const name = `${Date.now()}-${Math.round(Math.random()*1e6)}.${ext}`;
  toast('Lade hoch…');
  const { error: upErr } = await sb.storage.from(STORAGE_BUCKET).upload(name, file);
  if (upErr) { toast('Upload-Fehler: ' + upErr.message, 'error'); return; }
  const { data: pub } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(name);
  const { error: insErr } = await sb.from('cms_medien').insert({
    filename: file.name,
    url: pub.publicUrl,
    alt: file.name,
  });
  if (insErr) { toast('Datenbank-Fehler: ' + insErr.message, 'error'); return; }
  toast('Hochgeladen', 'success');
  e.target.value = '';
  loadMedia();
});

/* =============================================================
   HELPER
   ============================================================= */
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }

/* =============================================================
   ANFRAGEN (Eingangsbox)
   ============================================================= */
const TYP_LABELS = {
  reservation:'Reservation', event:'Event', hotel:'Hotel',
  seminar:'Seminar', bankett:'Bankett', kontakt:'Kontakt', karriere:'Bewerbung'
};
const STATUS_BADGES = {
  neu:'<span class="badge badge--info">Neu</span>',
  gelesen:'<span class="badge badge--off">Gelesen</span>',
  bearbeitet:'<span class="badge badge--info">In Arbeit</span>',
  erledigt:'<span class="badge badge--ok">Erledigt</span>',
};

async function loadAnfragen() {
  const tbody = $('#anfragenTable tbody');
  tbody.innerHTML = '<tr><td colspan="6">Lädt…</td></tr>';
  let q = sb.from('cms_anfragen').select('*').order('created_at', { ascending: false });
  const typ = $('#anfragenTypFilter').value;
  const status = $('#anfragenStatusFilter').value;
  if (typ) q = q.eq('typ', typ);
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) { tbody.innerHTML = `<tr><td colspan="6">Fehler: ${error.message}</td></tr>`; return; }
  if (!data.length) { tbody.innerHTML = '<tr><td colspan="6">Keine Anfragen in dieser Auswahl.</td></tr>'; return; }
  tbody.innerHTML = data.map(a => `
    <tr>
      <td>${fmtDate(a.created_at)}<div style="font-size:0.8rem;color:var(--c-text-soft)">${new Date(a.created_at).toLocaleTimeString('de-CH',{hour:'2-digit',minute:'2-digit'})}</div></td>
      <td><strong>${escapeHtml(TYP_LABELS[a.typ] || a.typ)}</strong></td>
      <td>${escapeHtml(a.name || '')}</td>
      <td style="font-size:0.85rem">${a.email ? `<a href="mailto:${escapeAttr(a.email)}">${escapeHtml(a.email)}</a><br>` : ''}${a.telefon ? `<a href="tel:${escapeAttr(a.telefon)}">${escapeHtml(a.telefon)}</a>` : ''}</td>
      <td>${STATUS_BADGES[a.status] || a.status}</td>
      <td class="actions">
        <button onclick="viewAnfrage(${a.id})">Öffnen</button>
        <button class="danger" onclick="deleteAnfrage(${a.id})">Löschen</button>
      </td>
    </tr>`).join('');
}

$('#anfragenTypFilter').addEventListener('change', loadAnfragen);
$('#anfragenStatusFilter').addEventListener('change', loadAnfragen);

window.viewAnfrage = async (id) => {
  const { data, error } = await sb.from('cms_anfragen').select('*').eq('id', id).single();
  if (error) return toast(error.message, 'error');
  // Status auf gelesen, falls noch neu
  if (data.status === 'neu') {
    await sb.from('cms_anfragen').update({ status: 'gelesen' }).eq('id', id);
    loadCounts();
  }
  const daten = data.daten || {};
  const datenRows = Object.entries(daten).map(([k,v]) =>
    `<tr><td style="padding:0.3rem 0.5rem;color:var(--c-text-soft);font-size:0.85rem">${escapeHtml(k)}</td><td style="padding:0.3rem 0.5rem">${escapeHtml(String(v ?? ''))}</td></tr>`
  ).join('');
  openModal(`Anfrage #${data.id} – ${TYP_LABELS[data.typ] || data.typ}`, `
    <div class="form-grid">
      <div class="form-row">
        <div><label>Eingang</label><div style="padding:0.55rem 0">${escapeHtml(new Date(data.created_at).toLocaleString('de-CH'))}</div></div>
        <div><label>Status</label>
          <select name="status">
            <option value="neu" ${data.status==='neu'?'selected':''}>Neu</option>
            <option value="gelesen" ${data.status==='gelesen'?'selected':''}>Gelesen</option>
            <option value="bearbeitet" ${data.status==='bearbeitet'?'selected':''}>In Bearbeitung</option>
            <option value="erledigt" ${data.status==='erledigt'?'selected':''}>Erledigt</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div><label>Name</label><input type="text" name="name" value="${escapeAttr(data.name||'')}"></div>
        <div><label>E-Mail</label><input type="text" name="email" value="${escapeAttr(data.email||'')}"></div>
      </div>
      <div class="form-row">
        <div><label>Telefon</label><input type="text" name="telefon" value="${escapeAttr(data.telefon||'')}"></div>
        <div><label>Betreff</label><input type="text" name="betreff" value="${escapeAttr(data.betreff||'')}"></div>
      </div>
      <div><label>Nachricht</label><textarea name="nachricht" rows="3">${escapeHtml(data.nachricht||'')}</textarea></div>
      ${datenRows ? `<div><label>Alle Formularfelder</label><table style="width:100%;border-collapse:collapse">${datenRows}</table></div>` : ''}
      <div><label>Interne Notiz</label><textarea name="notiz" rows="2" placeholder="z.B. Tisch reserviert, Bestätigung gesendet…">${escapeHtml(data.notiz||'')}</textarea></div>
    </div>`,
    async () => {
      const f = readForm();
      const { error } = await sb.from('cms_anfragen').update(f).eq('id', id);
      if (error) throw error;
      toast('Aktualisiert', 'success');
      loadAnfragen(); loadCounts();
    }
  );
};

window.deleteAnfrage = async (id) => {
  if (!confirm('Anfrage wirklich löschen?')) return;
  const { error } = await sb.from('cms_anfragen').delete().eq('id', id);
  if (error) return toast(error.message, 'error');
  toast('Gelöscht', 'success'); loadAnfragen(); loadCounts();
};

/* =============================================================
   HOTEL-ZIMMER
   ============================================================= */
async function loadZimmer() {
  const tbody = $('#zimmerTable tbody');
  tbody.innerHTML = '<tr><td colspan="6">Lädt…</td></tr>';
  const { data, error } = await sb.from('cms_zimmer').select('*').order('sort_order');
  if (error) { tbody.innerHTML = `<tr><td colspan="6">Fehler: ${error.message}</td></tr>`; return; }
  if (!data.length) { tbody.innerHTML = '<tr><td colspan="6">Noch keine Zimmer.</td></tr>'; return; }
  tbody.innerHTML = data.map(z => `
    <tr>
      <td><strong>${escapeHtml(z.name)}</strong></td>
      <td>${escapeHtml(z.zimmertyp || '')}</td>
      <td>${z.anzahl_personen || ''}</td>
      <td>${z.preis_ab ? 'CHF ' + Number(z.preis_ab).toFixed(2) : ''}</td>
      <td>${z.aktiv ? '<span class="badge badge--ok">Aktiv</span>' : '<span class="badge badge--off">Inaktiv</span>'}</td>
      <td class="actions">
        <button onclick="editZimmer(${z.id})">Bearbeiten</button>
        <button class="danger" onclick="deleteZimmer(${z.id})">Löschen</button>
      </td>
    </tr>`).join('');
  enhanceTableForSorting('zimmerTable', 'cms_zimmer');
}

function zimmerFormHtml(z = {}) {
  return `<div class="form-grid">
    <div class="form-row">
      <div><label>Name *</label><input type="text" name="name" value="${escapeAttr(z.name||'')}" required></div>
      <div><label>Zimmertyp</label><input type="text" name="zimmertyp" value="${escapeAttr(z.zimmertyp||'')}" placeholder="Doppelzimmer, Suite…"></div>
    </div>
    <div class="form-row cols-3">
      <div><label>Personen</label><input type="number" name="anzahl_personen" value="${z.anzahl_personen ?? 2}"></div>
      <div><label>Grösse (m²)</label><input type="number" name="groesse_qm" value="${z.groesse_qm ?? ''}"></div>
      <div><label>Preis ab (CHF)</label><input type="number" step="1" name="preis_ab" value="${z.preis_ab ?? ''}"></div>
    </div>
    <div><label>Beschreibung</label><textarea name="beschreibung" rows="3">${escapeHtml(z.beschreibung||'')}</textarea></div>
    <div><label>Ausstattung</label><textarea name="ausstattung" rows="2" placeholder="Doppelbett, eigenes Bad, WLAN, Föhn…">${escapeHtml(z.ausstattung||'')}</textarea></div>
    ${multiImagesFieldHtml(z.bilder || z.bild_url || '', 'Zimmer-Bilder (mehrere möglich)')}
    <div class="form-row">
      <div><label>Sortierung</label><input type="number" name="sort_order" value="${z.sort_order ?? 0}"></div>
      <div style="display:flex;align-items:end;gap:1rem;">
        <label class="form-check"><input type="checkbox" name="buchbar" ${z.buchbar !== false ? 'checked' : ''}> Buchbar</label>
        <label class="form-check"><input type="checkbox" name="aktiv" ${z.aktiv !== false ? 'checked' : ''}> Aktiv</label>
      </div>
    </div>
  </div>`;
}

$('#newZimmerBtn').addEventListener('click', () => {
  openModal('Neues Zimmer', zimmerFormHtml(), async () => {
    const f = readForm();
    if (!f.name) throw new Error('Name ist Pflicht.');
    const { error } = await sb.from('cms_zimmer').insert(f);
    if (error) throw error;
    toast('Zimmer gespeichert', 'success'); loadZimmer(); loadCounts();
  });
});

window.editZimmer = async (id) => {
  const { data, error } = await sb.from('cms_zimmer').select('*').eq('id', id).single();
  if (error) return toast(error.message, 'error');
  openModal('Zimmer bearbeiten', zimmerFormHtml(data), async () => {
    const f = readForm();
    const { error } = await sb.from('cms_zimmer').update(f).eq('id', id);
    if (error) throw error;
    toast('Aktualisiert', 'success'); loadZimmer();
  });
};

window.deleteZimmer = async (id) => {
  if (!confirm('Zimmer wirklich löschen?')) return;
  const { error } = await sb.from('cms_zimmer').delete().eq('id', id);
  if (error) return toast(error.message, 'error');
  toast('Gelöscht', 'success'); loadZimmer(); loadCounts();
};

/* =============================================================
   TEAM / MITARBEITENDE
   ============================================================= */
async function loadTeam() {
  const tbody = $('#teamTable tbody');
  tbody.innerHTML = '<tr><td colspan="5">Lädt…</td></tr>';
  const { data, error } = await sb.from('cms_team').select('*').order('sort_order');
  if (error) { tbody.innerHTML = `<tr><td colspan="5">Fehler: ${error.message}</td></tr>`; return; }
  if (!data.length) { tbody.innerHTML = '<tr><td colspan="5">Noch keine Team-Mitglieder.</td></tr>'; return; }
  tbody.innerHTML = data.map(t => `
    <tr>
      <td><strong>${escapeHtml(t.name)}</strong></td>
      <td>${escapeHtml(t.position || '')}</td>
      <td>${escapeHtml(t.bereich || '')}</td>
      <td>${t.aktiv ? '<span class="badge badge--ok">Aktiv</span>' : '<span class="badge badge--off">Inaktiv</span>'}</td>
      <td class="actions">
        <button onclick="editTeam(${t.id})">Bearbeiten</button>
        <button class="danger" onclick="deleteTeam(${t.id})">Löschen</button>
      </td>
    </tr>`).join('');
  enhanceTableForSorting('teamTable', 'cms_team');
}

function teamFormHtml(t = {}) {
  return `<div class="form-grid">
    <div><label>Name *</label><input type="text" name="name" value="${escapeAttr(t.name||'')}" required></div>
    <div class="form-row">
      <div><label>Position</label><input type="text" name="position" value="${escapeAttr(t.position||'')}" placeholder="Betriebsleiter, Service…"></div>
      <div><label>Bereich</label><input type="text" name="bereich" value="${escapeAttr(t.bereich||'')}" placeholder="Service, Küche, Hotel…"></div>
    </div>
    <div><label>Bio / kurze Beschreibung</label><textarea name="bio" rows="3">${escapeHtml(t.bio||'')}</textarea></div>
    <div><label>E-Mail (optional)</label><input type="email" name="email" value="${escapeAttr(t.email||'')}"></div>
    ${multiImagesFieldHtml(t.bilder || t.bild_url || '', 'Foto(s) – meist 1 reicht')}
    <div class="form-row">
      <div><label>Sortierung</label><input type="number" name="sort_order" value="${t.sort_order ?? 0}"></div>
      <div style="display:flex;align-items:end;"><label class="form-check"><input type="checkbox" name="aktiv" ${t.aktiv !== false ? 'checked' : ''}> Aktiv</label></div>
    </div>
  </div>`;
}

$('#newTeamBtn').addEventListener('click', () => {
  openModal('Neue Person', teamFormHtml(), async () => {
    const f = readForm(); if (!f.name) throw new Error('Name ist Pflicht.');
    const { error } = await sb.from('cms_team').insert(f);
    if (error) throw error;
    toast('Gespeichert', 'success'); loadTeam(); loadCounts();
  });
});
window.editTeam = async (id) => {
  const { data, error } = await sb.from('cms_team').select('*').eq('id', id).single();
  if (error) return toast(error.message, 'error');
  openModal('Person bearbeiten', teamFormHtml(data), async () => {
    const f = readForm();
    const { error } = await sb.from('cms_team').update(f).eq('id', id);
    if (error) throw error;
    toast('Aktualisiert', 'success'); loadTeam();
  });
};
window.deleteTeam = async (id) => {
  if (!confirm('Eintrag löschen?')) return;
  const { error } = await sb.from('cms_team').delete().eq('id', id);
  if (error) return toast(error.message, 'error');
  toast('Gelöscht', 'success'); loadTeam(); loadCounts();
};

/* =============================================================
   OFFENE STELLEN
   ============================================================= */
async function loadStellen() {
  const tbody = $('#stellenTable tbody');
  tbody.innerHTML = '<tr><td colspan="6">Lädt…</td></tr>';
  const { data, error } = await sb.from('cms_stellen').select('*').order('sort_order');
  if (error) { tbody.innerHTML = `<tr><td colspan="6">Fehler: ${error.message}</td></tr>`; return; }
  if (!data.length) { tbody.innerHTML = '<tr><td colspan="6">Noch keine Stellen.</td></tr>'; return; }
  tbody.innerHTML = data.map(s => `
    <tr>
      <td><strong>${escapeHtml(s.titel)}</strong></td>
      <td>${escapeHtml(s.pensum||'')}</td>
      <td>${escapeHtml(s.bereich||'')}</td>
      <td>${escapeHtml(s.eintritt||'')}</td>
      <td>${s.aktiv ? '<span class="badge badge--ok">Aktiv</span>' : '<span class="badge badge--off">Inaktiv</span>'}</td>
      <td class="actions">
        <button onclick="editStelle(${s.id})">Bearbeiten</button>
        <button class="danger" onclick="deleteStelle(${s.id})">Löschen</button>
      </td>
    </tr>`).join('');
  enhanceTableForSorting('stellenTable', 'cms_stellen');
}

function stelleFormHtml(s = {}) {
  return `<div class="form-grid">
    <div><label>Titel *</label><input type="text" name="titel" value="${escapeAttr(s.titel||'')}" required></div>
    <div class="form-row cols-3">
      <div><label>Pensum</label><input type="text" name="pensum" value="${escapeAttr(s.pensum||'')}" placeholder="80–100%"></div>
      <div><label>Bereich</label><input type="text" name="bereich" value="${escapeAttr(s.bereich||'')}" placeholder="Service, Küche…"></div>
      <div><label>Eintritt</label><input type="text" name="eintritt" value="${escapeAttr(s.eintritt||'')}" placeholder="ab sofort"></div>
    </div>
    <div><label>Beschreibung</label><textarea name="beschreibung" rows="4">${escapeHtml(s.beschreibung||'')}</textarea></div>
    <div><label>Anforderungen</label><textarea name="anforderungen" rows="3">${escapeHtml(s.anforderungen||'')}</textarea></div>
    <div class="form-row">
      <div><label>Ansprechperson</label><input type="text" name="ansprechperson" value="${escapeAttr(s.ansprechperson||'')}"></div>
      <div><label>Ansprech-E-Mail</label><input type="email" name="ansprech_email" value="${escapeAttr(s.ansprech_email||'')}"></div>
    </div>
    <div><label>PDF-URL (Stelleninserat)</label><input type="text" name="pdf_url" value="${escapeAttr(s.pdf_url||'')}"></div>
    <div class="form-row">
      <div><label>Sortierung</label><input type="number" name="sort_order" value="${s.sort_order ?? 0}"></div>
      <div style="display:flex;align-items:end;"><label class="form-check"><input type="checkbox" name="aktiv" ${s.aktiv !== false ? 'checked' : ''}> Aktiv</label></div>
    </div>
  </div>`;
}

$('#newStelleBtn').addEventListener('click', () => {
  openModal('Neue Stelle', stelleFormHtml(), async () => {
    const f = readForm(); if (!f.titel) throw new Error('Titel ist Pflicht.');
    const { error } = await sb.from('cms_stellen').insert(f);
    if (error) throw error;
    toast('Gespeichert', 'success'); loadStellen(); loadCounts();
  });
});
window.editStelle = async (id) => {
  const { data, error } = await sb.from('cms_stellen').select('*').eq('id', id).single();
  if (error) return toast(error.message, 'error');
  openModal('Stelle bearbeiten', stelleFormHtml(data), async () => {
    const f = readForm();
    const { error } = await sb.from('cms_stellen').update(f).eq('id', id);
    if (error) throw error;
    toast('Aktualisiert', 'success'); loadStellen();
  });
};
window.deleteStelle = async (id) => {
  if (!confirm('Stelle löschen?')) return;
  const { error } = await sb.from('cms_stellen').delete().eq('id', id);
  if (error) return toast(error.message, 'error');
  toast('Gelöscht', 'success'); loadStellen(); loadCounts();
};

/* =============================================================
   PARTNER / KOOPERATIONEN
   ============================================================= */
async function loadPartner() {
  const tbody = $('#partnerTable tbody');
  tbody.innerHTML = '<tr><td colspan="6">Lädt…</td></tr>';
  const { data, error } = await sb.from('cms_partner').select('*').order('sort_order');
  if (error) { tbody.innerHTML = `<tr><td colspan="6">Fehler: ${error.message}</td></tr>`; return; }
  if (!data.length) { tbody.innerHTML = '<tr><td colspan="6">Noch keine Partner.</td></tr>'; return; }
  tbody.innerHTML = data.map(p => `
    <tr>
      <td><strong>${escapeHtml(p.name)}</strong></td>
      <td>${escapeHtml(p.kategorie || '')}</td>
      <td>${p.website_url ? `<a href="${escapeAttr(p.website_url)}" target="_blank" rel="noopener">↗</a>` : ''}</td>
      <td>${p.highlight ? '⭐' : ''}</td>
      <td>${p.aktiv ? '<span class="badge badge--ok">Aktiv</span>' : '<span class="badge badge--off">Inaktiv</span>'}</td>
      <td class="actions">
        <button onclick="editPartner(${p.id})">Bearbeiten</button>
        <button class="danger" onclick="deletePartner(${p.id})">Löschen</button>
      </td>
    </tr>`).join('');
  enhanceTableForSorting('partnerTable', 'cms_partner');
}

function partnerFormHtml(p = {}) {
  return `<div class="form-grid">
    <div><label>Name *</label><input type="text" name="name" value="${escapeAttr(p.name||'')}" required></div>
    <div><label>Kategorie</label><input type="text" name="kategorie" value="${escapeAttr(p.kategorie||'')}" placeholder="Verein, Lieferant, Institution"></div>
    <div><label>Beschreibung</label><textarea name="beschreibung" rows="3">${escapeHtml(p.beschreibung||'')}</textarea></div>
    <div><label>Logo-URL</label><input type="text" name="logo_url" value="${escapeAttr(p.logo_url||'')}"></div>
    ${multiImagesFieldHtml(p.bilder || p.bild_url || '', 'Bilder (mehrere möglich)')}
    <div><label>Website-URL</label><input type="text" name="website_url" value="${escapeAttr(p.website_url||'')}" placeholder="https://…"></div>
    <div class="form-row">
      <div><label>Sortierung</label><input type="number" name="sort_order" value="${p.sort_order ?? 0}"></div>
      <div style="display:flex;align-items:end;gap:1rem;">
        <label class="form-check"><input type="checkbox" name="highlight" ${p.highlight ? 'checked' : ''}> Highlight</label>
        <label class="form-check"><input type="checkbox" name="aktiv" ${p.aktiv !== false ? 'checked' : ''}> Aktiv</label>
      </div>
    </div>
  </div>`;
}

$('#newPartnerBtn').addEventListener('click', () => {
  openModal('Neuer Partner', partnerFormHtml(), async () => {
    const f = readForm(); if (!f.name) throw new Error('Name ist Pflicht.');
    const { error } = await sb.from('cms_partner').insert(f);
    if (error) throw error;
    toast('Gespeichert', 'success'); loadPartner();
  });
});
window.editPartner = async (id) => {
  const { data, error } = await sb.from('cms_partner').select('*').eq('id', id).single();
  if (error) return toast(error.message, 'error');
  openModal('Partner bearbeiten', partnerFormHtml(data), async () => {
    const f = readForm();
    const { error } = await sb.from('cms_partner').update(f).eq('id', id);
    if (error) throw error;
    toast('Aktualisiert', 'success'); loadPartner();
  });
};
window.deletePartner = async (id) => {
  if (!confirm('Partner löschen?')) return;
  const { error } = await sb.from('cms_partner').delete().eq('id', id);
  if (error) return toast(error.message, 'error');
  toast('Gelöscht', 'success'); loadPartner();
};

/* =============================================================
   COMMUNITY-MODERATION (löscht von `posts`-Tabelle)
   ============================================================= */
async function loadCommunity() {
  const tbody = $('#communityTable tbody');
  tbody.innerHTML = '<tr><td colspan="6">Lädt…</td></tr>';
  const { data, error } = await sb.from('posts').select('*').order('created_at', { ascending: false });
  if (error) { tbody.innerHTML = `<tr><td colspan="6">Fehler oder Tabelle "posts" nicht gefunden: ${error.message}</td></tr>`; return; }
  if (!data.length) { tbody.innerHTML = '<tr><td colspan="6">Noch keine Posts.</td></tr>'; return; }
  tbody.innerHTML = data.map(p => `
    <tr>
      <td>${fmtDate(p.created_at)}<div style="font-size:0.8rem;color:var(--c-text-soft)">${new Date(p.created_at).toLocaleTimeString('de-CH',{hour:'2-digit',minute:'2-digit'})}</div></td>
      <td><strong>${escapeHtml(p.name || 'Anonym')}</strong></td>
      <td>${p.rating ? '★'.repeat(p.rating) + '☆'.repeat(5-p.rating) : ''}</td>
      <td><div class="truncate">${escapeHtml(p.text || '')}</div></td>
      <td>${p.photo_url ? `<a href="${escapeAttr(p.photo_url)}" target="_blank"><img src="${escapeAttr(p.photo_url)}" style="height:40px;width:40px;object-fit:cover;border-radius:4px"></a>` : ''}</td>
      <td class="actions">
        <button class="danger" onclick="deletePost(${p.id})">Löschen</button>
      </td>
    </tr>`).join('');
}

window.deletePost = async (id) => {
  if (!confirm('Post wirklich löschen? Kann nicht rückgängig gemacht werden.')) return;
  const { error } = await sb.from('posts').delete().eq('id', id);
  if (error) return toast(error.message, 'error');
  toast('Gelöscht', 'success'); loadCommunity(); loadCounts();
};

/* =============================================================
   KARTEN-LISTEN (cms_cards) – Räume, Bereiche, Footer, Quick-Bar, Timeline
   ============================================================= */
async function loadCardsList() {
  const tbody = $('#cardsTable tbody');
  const key = $('#cardsListFilter').value;
  tbody.innerHTML = '<tr><td colspan="5">Lädt…</td></tr>';
  const { data, error } = await sb.from('cms_cards').select('*').eq('list_key', key).order('sort_order');
  if (error) { tbody.innerHTML = `<tr><td colspan="5">Fehler: ${error.message}</td></tr>`; return; }
  if (!data.length) { tbody.innerHTML = '<tr><td colspan="5">Noch keine Einträge in dieser Liste.</td></tr>'; return; }
  tbody.innerHTML = data.map(c => `
    <tr>
      <td><strong>${escapeHtml(c.titel || '')}</strong></td>
      <td>${escapeHtml(c.untertitel || '')}</td>
      <td><div class="truncate">${escapeHtml((c.beschreibung || '').substring(0, 70))}</div></td>
      <td>${c.aktiv ? '<span class="badge badge--ok">Aktiv</span>' : '<span class="badge badge--off">Inaktiv</span>'}</td>
      <td class="actions">
        <button onclick="editCard(${c.id})">Bearbeiten</button>
        <button class="danger" onclick="deleteCard(${c.id})">Löschen</button>
      </td>
    </tr>`).join('');
  enhanceTableForSorting('cardsTable', 'cms_cards');
}
function loadCards() { loadCardsList(); }
$('#cardsListFilter').addEventListener('change', loadCardsList);

function cardFormHtml(c = {}) {
  const listKey = c.list_key || $('#cardsListFilter').value;
  return `<div class="form-grid">
    <div style="background:var(--c-beige);padding:0.5rem 0.75rem;border-radius:4px;font-size:0.85rem;">
      <strong>Liste:</strong> <code>${escapeHtml(listKey)}</code>
      <input type="hidden" name="list_key" value="${escapeAttr(listKey)}">
    </div>
    <div class="form-row">
      <div><label>Kicker (kleines Label)</label><input type="text" name="kicker" value="${escapeAttr(c.kicker||'')}" placeholder="z.B. 'Alte Höfli', 'Adresse'…"></div>
      <div><label>Titel</label><input type="text" name="titel" value="${escapeAttr(c.titel||'')}" placeholder="Haupttitel"></div>
    </div>
    <div><label>Untertitel</label><input type="text" name="untertitel" value="${escapeAttr(c.untertitel||'')}" placeholder="z.B. 'bis 130 Personen', 'Mittwoch'"></div>
    <div><label>Beschreibung</label><textarea name="beschreibung" rows="3">${escapeHtml(c.beschreibung||'')}</textarea></div>

    <!-- BILDER (mehrfach + sortierbar) -->
    <div>
      <label>Bilder (mehrere möglich, per Drag&amp;Drop sortieren)</label>
      <div id="cardImagesList" data-images="${escapeAttr(c.bilder || c.bild_url || '')}"></div>
      <div style="display:flex;gap:0.5rem;align-items:center;margin-top:0.5rem;">
        <label class="img-drop__btn">📷 Bild hinzufügen
          <input type="file" accept="image/*" hidden id="cardImageAdd">
        </label>
        <span style="font-size:0.8rem;color:var(--c-text-soft);font-style:italic;">Erstes Bild = Hauptbild. Bei mehreren wird auf der Webseite eine Collage gezeigt.</span>
      </div>
      <input type="hidden" name="bilder" id="cardBilderField" value="${escapeAttr(c.bilder || c.bild_url || '')}">
      <input type="hidden" name="bild_url" id="cardBildUrlField" value="">
    </div>

    <div class="form-row">
      <div><label>Link-URL</label><input type="text" name="link_url" value="${escapeAttr(c.link_url||'')}" placeholder="restaurant.html#hoefli"></div>
      <div><label>Link-Text</label><input type="text" name="link_text" value="${escapeAttr(c.link_text||'')}" placeholder="Mehr →"></div>
    </div>
    <div class="form-row">
      <div><label>Sortierung</label><input type="number" name="sort_order" value="${c.sort_order ?? 0}"></div>
      <div style="display:flex;align-items:end;"><label class="form-check"><input type="checkbox" name="aktiv" ${c.aktiv !== false ? 'checked' : ''}> Aktiv</label></div>
    </div>
  </div>`;
}

/* Generische Multi-Image-Manager (wiederverwendbar für alle Forms)
   HTML: <div data-multi-images="initial_urls\n..."></div>
         <input type="hidden" name="bilder" data-multi-images-field>
         <input type="hidden" name="bild_url" data-multi-images-first>
*/
function setupMultiImageFields() {
  document.querySelectorAll('[data-multi-images]').forEach(list => {
    if (list._initialized) return; list._initialized = true;
    let urls = (list.dataset.multiImages || '').split('\n').map(s => s.trim()).filter(Boolean);
    const hiddenAll = list.closest('.form-grid, form, [class*="form"]')?.querySelector('[data-multi-images-field]') || document.querySelector('[data-multi-images-field]');
    const hiddenFirst = list.closest('.form-grid, form, [class*="form"]')?.querySelector('[data-multi-images-first]') || document.querySelector('[data-multi-images-first]');

    function sync() {
      if (hiddenAll) hiddenAll.value = urls.join('\n');
      if (hiddenFirst) hiddenFirst.value = urls[0] || '';
    }
    function render() {
      if (!urls.length) {
        list.innerHTML = '<div style="padding:1rem;text-align:center;color:var(--c-text-soft);font-style:italic;background:var(--c-bg);border:2px dashed var(--c-line);border-radius:4px;">Noch keine Bilder. Füge unten welche hinzu.</div>';
      } else {
        list.innerHTML = urls.map((u, i) => `
          <div class="img-row" data-idx="${i}" style="display:flex;align-items:center;gap:0.5rem;padding:0.4rem;background:var(--c-bg);border:1px solid var(--c-line);border-radius:4px;margin-bottom:0.3rem;">
            <span class="img-drag" style="cursor:grab;font-size:1.1rem;color:var(--c-text-soft);user-select:none;letter-spacing:-2px;">⋮⋮</span>
            <div style="width:50px;height:50px;background-image:url('${u.replace(/'/g,"\\'")}');background-size:cover;background-position:center;border-radius:3px;flex-shrink:0;"></div>
            <input type="text" value="${u.replace(/"/g,'&quot;')}" data-url-idx="${i}" style="flex:1;padding:0.35rem 0.5rem;border:1px solid var(--c-line);border-radius:3px;font-size:0.85rem;">
            <button type="button" class="img-drop__btn" style="background:var(--c-danger)" data-remove-idx="${i}">×</button>
          </div>`).join('');
      }
      sync();
      list.querySelectorAll('[data-url-idx]').forEach(inp => {
        inp.addEventListener('input', () => { urls[Number(inp.dataset.urlIdx)] = inp.value; sync(); });
      });
      list.querySelectorAll('[data-remove-idx]').forEach(btn => {
        btn.addEventListener('click', () => { urls.splice(Number(btn.dataset.removeIdx), 1); render(); });
      });
      if (window.Sortable) {
        window.Sortable.create(list, {
          animation: 180, handle: '.img-drag',
          onEnd: (e) => {
            const moved = urls.splice(e.oldIndex, 1)[0];
            urls.splice(e.newIndex, 0, moved);
            render();
          }
        });
      }
    }
    render();
    // Upload button (eindeutige ID per Suchen)
    const addBtn = list.parentNode.querySelector('[data-multi-images-add]');
    if (addBtn) addBtn.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      toast('Lade hoch…');
      try {
        const ext = file.name.split('.').pop();
        const name = `${Date.now()}-${Math.round(Math.random()*1e6)}.${ext}`;
        const { error: upErr } = await sb.storage.from(STORAGE_BUCKET).upload(name, file);
        if (upErr) throw upErr;
        const { data: pub } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(name);
        await sb.from('cms_medien').insert({ filename: file.name, url: pub.publicUrl, alt: file.name });
        urls.push(pub.publicUrl);
        render();
        toast('Bild hinzugefügt', 'success');
      } catch (err) { toast('Fehler: ' + err.message, 'error'); }
      e.target.value = '';
    });
  });
}

/* HTML-Schnipsel für ein Multi-Image-Feld in jedem Form */
function multiImagesFieldHtml(initial = '', label = 'Bilder (mehrere, sortierbar)') {
  return `<div>
    <label>${escapeHtml(label)}</label>
    <div data-multi-images="${escapeAttr(initial)}"></div>
    <div style="display:flex;gap:0.5rem;align-items:center;margin-top:0.5rem;">
      <label class="img-drop__btn">📷 Bild hinzufügen
        <input type="file" accept="image/*" hidden data-multi-images-add>
      </label>
      <span style="font-size:0.78rem;color:var(--c-text-soft);font-style:italic;">Erstes Bild = Hauptbild. Drag&amp;Drop zum Sortieren.</span>
    </div>
    <input type="hidden" name="bilder" data-multi-images-field value="${escapeAttr(initial)}">
    <input type="hidden" name="bild_url" data-multi-images-first value="${escapeAttr((initial||'').split('\n')[0] || '')}">
  </div>`;
}

/* Multi-Image-Manager für Karten – nach Modal-Öffnung initialisieren */
function setupCardImages() {
  setupMultiImageFields();
  const list = document.getElementById('cardImagesList');
  if (!list) return;
  let urls = (list.dataset.images || '').split('\n').map(s => s.trim()).filter(Boolean);

  function render() {
    if (!urls.length) {
      list.innerHTML = '<div style="padding:1rem;text-align:center;color:var(--c-text-soft);font-style:italic;background:var(--c-bg);border:2px dashed var(--c-line);border-radius:4px;">Noch keine Bilder. Füge unten welche hinzu.</div>';
    } else {
      list.innerHTML = urls.map((u, i) => `
        <div class="card-img-row" data-idx="${i}" style="display:flex;align-items:center;gap:0.5rem;padding:0.4rem;background:var(--c-bg);border:1px solid var(--c-line);border-radius:4px;margin-bottom:0.3rem;">
          <span class="card-img-drag" style="cursor:grab;font-size:1.1rem;color:var(--c-text-soft);user-select:none;letter-spacing:-2px;">⋮⋮</span>
          <div style="width:50px;height:50px;background-image:url('${u.replace(/'/g,"\\'")}');background-size:cover;background-position:center;border-radius:3px;flex-shrink:0;"></div>
          <input type="text" value="${u.replace(/"/g,'&quot;')}" data-url-idx="${i}" style="flex:1;padding:0.35rem 0.5rem;border:1px solid var(--c-line);border-radius:3px;font-size:0.85rem;">
          <button type="button" class="img-drop__btn" style="background:var(--c-danger)" data-remove-idx="${i}">×</button>
        </div>`).join('');
    }
    // Hidden field aktualisieren
    document.getElementById('cardBilderField').value = urls.join('\n');
    document.getElementById('cardBildUrlField').value = urls[0] || '';

    // URL-Inputs sync
    list.querySelectorAll('[data-url-idx]').forEach(inp => {
      inp.addEventListener('input', () => {
        urls[Number(inp.dataset.urlIdx)] = inp.value;
        document.getElementById('cardBilderField').value = urls.join('\n');
        document.getElementById('cardBildUrlField').value = urls[0] || '';
      });
    });
    // Remove buttons
    list.querySelectorAll('[data-remove-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        urls.splice(Number(btn.dataset.removeIdx), 1);
        render();
      });
    });
    // Sortable
    if (window.Sortable) {
      window.Sortable.create(list, {
        animation: 180, handle: '.card-img-drag',
        onEnd: (e) => {
          const moved = urls.splice(e.oldIndex, 1)[0];
          urls.splice(e.newIndex, 0, moved);
          render();
        }
      });
    }
  }
  render();

  // Upload-Button
  const fileInput = document.getElementById('cardImageAdd');
  if (fileInput) fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    toast('Lade hoch…');
    try {
      const ext = file.name.split('.').pop();
      const name = `${Date.now()}-${Math.round(Math.random()*1e6)}.${ext}`;
      const { error: upErr } = await sb.storage.from(STORAGE_BUCKET).upload(name, file);
      if (upErr) throw upErr;
      const { data: pub } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(name);
      await sb.from('cms_medien').insert({ filename: file.name, url: pub.publicUrl, alt: file.name });
      urls.push(pub.publicUrl);
      render();
      toast('Bild hinzugefügt', 'success');
    } catch (err) {
      toast('Fehler: ' + err.message, 'error');
    }
    e.target.value = '';
  });
}

$('#newCardBtn').addEventListener('click', () => {
  openModal('Neuer Eintrag', cardFormHtml(), async () => {
    const f = readForm();
    if (!f.titel && !f.kicker) throw new Error('Mindestens Titel oder Kicker angeben.');
    const { error } = await sb.from('cms_cards').insert(f);
    if (error) throw error;
    toast('Gespeichert', 'success'); loadCardsList();
  });
  setTimeout(setupCardImages, 20);
});

window.editCard = async (id) => {
  const { data, error } = await sb.from('cms_cards').select('*').eq('id', id).single();
  if (error) return toast(error.message, 'error');
  openModal('Eintrag bearbeiten', cardFormHtml(data), async () => {
    const f = readForm();
    const { error } = await sb.from('cms_cards').update(f).eq('id', id);
    if (error) throw error;
    toast('Aktualisiert', 'success'); loadCardsList();
  });
  setTimeout(setupCardImages, 20);
};

window.deleteCard = async (id) => {
  if (!confirm('Eintrag wirklich löschen?')) return;
  const { error } = await sb.from('cms_cards').delete().eq('id', id);
  if (error) return toast(error.message, 'error');
  toast('Gelöscht', 'success'); loadCardsList();
};

/* GO */
init();
