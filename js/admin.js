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
  events:     'Events verwalten',
  sections:   'Seiten-Texte verwalten',
  menu:       'Speisekarte verwalten',
  oeffnung:   'Öffnungszeiten verwalten',
  news:       'News & Aktuelles',
  medien:     'Medien-Bibliothek',
};

function switchView(view) {
  $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  $$('.view').forEach(v => v.classList.add('hidden'));
  $('#view-' + view).classList.remove('hidden');
  $('#viewTitle').textContent = viewTitles[view] || '';

  if (view === 'events')   loadEvents();
  if (view === 'sections') loadSections();
  if (view === 'menu')     loadMenu();
  if (view === 'oeffnung') loadOz();
  if (view === 'news')     loadNews();
  if (view === 'medien')   loadMedia();
}

$$('.nav-item').forEach(b => b.addEventListener('click', () => switchView(b.dataset.view)));
$$('[data-view-link]').forEach(c => c.addEventListener('click', () => switchView(c.dataset.viewLink)));

/* =============================================================
   OVERVIEW COUNTS
   ============================================================= */
async function loadCounts() {
  const tables = [
    ['cms_events',   '#countEvents'],
    ['cms_sections', '#countSections'],
    ['cms_menu_items', '#countMenu'],
    ['cms_news',     '#countNews'],
  ];
  for (const [tbl, sel] of tables) {
    const { count } = await sb.from(tbl).select('id', { count: 'exact', head: true });
    $(sel).textContent = count ?? '–';
  }
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
  const { data, error } = await sb.from('cms_events').select('*').order('datum', { ascending: true });
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
      <div><label>Bild-URL (optional)</label><input type="text" name="bild_url" value="${escapeAttr(e.bild_url || '')}" placeholder="https://… oder images/…"></div>
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
      <div><label>Bild-URL (optional)</label><input type="text" name="bild_url" value="${escapeAttr(n.bild_url||'')}"></div>
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
   MEDIEN (Bilder hochladen)
   ============================================================= */
async function loadMedia() {
  const grid = $('#mediaGrid');
  grid.innerHTML = 'Lädt…';
  const { data, error } = await sb.from('cms_medien').select('*').order('uploaded_at', { ascending: false });
  if (error) { grid.innerHTML = 'Fehler: ' + error.message; return; }
  if (!data.length) { grid.innerHTML = '<div class="info-box"><p>Noch keine Medien hochgeladen.</p></div>'; return; }
  grid.innerHTML = data.map(m => `
    <div class="media-tile">
      <img src="${escapeAttr(m.url)}" alt="${escapeAttr(m.alt || m.filename)}">
      <div class="media-tile__body">
        <span class="media-tile__name" title="${escapeAttr(m.filename)}">${escapeHtml(m.filename)}</span>
        <button class="media-tile__copy" onclick="copyUrl('${escapeAttr(m.url)}')">URL</button>
      </div>
    </div>`).join('');
}

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

/* GO */
init();
