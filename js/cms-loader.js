/* =============================================================
   Müllerhof CMS – Frontend Loader
   Lädt Inhalte aus Supabase und ersetzt Platzhalter mit:
     <span data-cms="seite:schluessel">Fallback</span>
   Zusätzlich:
     <div data-cms-events>      → Eventliste aus DB
     <div data-cms-oeffnung>    → Öffnungszeiten
     <div data-cms-news>        → News-Liste
     <div data-cms-menu="speise|getraenk|wein"> → Speisekarte
   ============================================================= */
(function() {
  const SUPABASE_URL = 'https://rcnmnthscvfippedgmuu.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_EbLVUn9ckvKSLkpKkq5dTQ_UufHkMMG';

  if (!window.supabase) {
    console.warn('[CMS] supabase-js fehlt — bitte vor cms-loader.js einbinden.');
    return;
  }
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const fmtDateLong = (s) => {
    if (!s) return '';
    const d = new Date(s);
    return d.toLocaleDateString('de-CH', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' });
  };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
    c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // ---- 1. Text-Sektionen ----
  async function loadSections() {
    const els = [...document.querySelectorAll('[data-cms]')];
    if (!els.length) return;
    const keys = [...new Set(els.map(e => e.dataset.cms))];
    const pages = [...new Set(keys.map(k => k.split(':')[0]))];
    const { data, error } = await sb.from('cms_sections').select('*').in('page_slug', pages);
    if (error) { console.warn('[CMS] sections', error); return; }
    const lookup = {};
    data.forEach(s => lookup[`${s.page_slug}:${s.section_key}`] = s);
    els.forEach(el => {
      const s = lookup[el.dataset.cms];
      if (!s || !s.content) return;
      if (s.kind === 'image') {
        if (el.tagName === 'IMG') el.src = s.content;
        else el.style.backgroundImage = `url('${s.content}')`;
      } else if (s.kind === 'html') {
        el.innerHTML = s.content;
      } else {
        // Erlaube <br> in einfachem Text
        el.innerHTML = esc(s.content).replace(/\n/g, '<br>');
      }
    });
  }

  // ---- 2. Events ----
  async function loadEvents() {
    const container = document.querySelector('[data-cms-events]');
    if (!container) return;
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await sb.from('cms_events')
      .select('*')
      .eq('aktiv', true)
      .gte('datum', today)
      .order('datum');
    if (error) { console.warn('[CMS] events', error); return; }
    if (!data.length) { container.innerHTML = '<p style="text-align:center;color:var(--c-text-soft);font-style:italic;">Aktuell keine geplanten Events.</p>'; return; }
    container.innerHTML = data.map(e => `
      <article class="event-card">
        ${e.bild_url ? `<div class="event-card__img" style="background-image:url('${esc(e.bild_url)}');"></div>` : ''}
        <div class="event-card__body">
          <div class="event-card__date">${esc(fmtDateLong(e.datum))}${e.zeit ? ' · ' + esc(e.zeit) : ''}</div>
          ${e.kategorie ? `<span class="event-card__cat">${esc(e.kategorie)}</span>` : ''}
          <h3>${esc(e.titel)}</h3>
          ${e.ort ? `<p class="event-card__ort">${esc(e.ort)}</p>` : ''}
          ${e.beschreibung ? `<p>${esc(e.beschreibung)}</p>` : ''}
          ${e.link_url ? `<a href="${esc(e.link_url)}" class="btn btn--dark" target="_blank" rel="noopener">Mehr erfahren</a>` : ''}
        </div>
      </article>`).join('');
  }

  // ---- 3. Öffnungszeiten ----
  async function loadOz() {
    const container = document.querySelector('[data-cms-oeffnung]');
    if (!container) return;
    const { data, error } = await sb.from('cms_oeffnungszeiten')
      .select('*').eq('aktiv', true).order('bereich').order('sort_order');
    if (error) { console.warn('[CMS] oeffnung', error); return; }
    if (!data.length) { container.innerHTML = '<p>[ Öffnungszeiten folgen ]</p>'; return; }
    // Gruppieren nach Bereich
    const groups = {};
    data.forEach(o => (groups[o.bereich] ||= []).push(o));
    container.innerHTML = Object.entries(groups).map(([bereich, rows]) => `
      <div class="oz-group">
        <h4>${esc(bereich)}</h4>
        <table class="oz-table">
          ${rows.map(o => `
            <tr>
              <td><strong>${esc(o.tag_label)}</strong></td>
              <td>${o.von && o.bis ? esc(o.von) + ' – ' + esc(o.bis) : (o.hinweis ? esc(o.hinweis) : '')}</td>
              ${o.von && o.bis && o.hinweis ? `<td class="oz-hint">${esc(o.hinweis)}</td>` : ''}
            </tr>`).join('')}
        </table>
      </div>`).join('');
  }

  // ---- 4. News ----
  async function loadNews() {
    const container = document.querySelector('[data-cms-news]');
    if (!container) return;
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await sb.from('cms_news')
      .select('*').eq('aktiv', true)
      .lte('gueltig_ab', today)
      .order('sort_order').order('gueltig_ab', { ascending: false });
    if (error) { console.warn('[CMS] news', error); return; }
    const filtered = data.filter(n => !n.gueltig_bis || n.gueltig_bis >= today);
    if (!filtered.length) { container.innerHTML = ''; return; }
    container.innerHTML = filtered.map(n => `
      <article class="news-card">
        ${n.bild_url ? `<div class="news-card__img" style="background-image:url('${esc(n.bild_url)}');"></div>` : ''}
        <div class="news-card__body">
          ${n.kategorie ? `<span class="news-card__cat">${esc(n.kategorie)}</span>` : ''}
          <h3>${esc(n.titel)}</h3>
          ${n.text ? `<p>${esc(n.text)}</p>` : ''}
        </div>
      </article>`).join('');
  }

  // ---- 5. Menü ----
  async function loadMenu() {
    const containers = [...document.querySelectorAll('[data-cms-menu]')];
    if (!containers.length) return;
    for (const container of containers) {
      const typ = container.dataset.cmsMenu || 'speise';
      const [{ data: cats }, { data: items }] = await Promise.all([
        sb.from('cms_menu_kategorien').select('*').eq('typ', typ).eq('aktiv', true).order('sort_order'),
        sb.from('cms_menu_items').select('*').eq('aktiv', true).order('sort_order'),
      ]);
      if (!cats || !cats.length) { container.innerHTML = '<p>[ Karte folgt ]</p>'; continue; }
      const isWein = typ === 'wein';
      container.innerHTML = cats.map(cat => {
        const its = items.filter(i => i.kategorie_id === cat.id);
        if (!its.length) return '';
        return `
          <div class="menu-section">
            <h3>${esc(cat.name)}</h3>
            ${cat.beschreibung ? `<p class="menu-section__desc">${esc(cat.beschreibung)}</p>` : ''}
            <ul class="menu-list">
              ${its.map(i => `
                <li class="menu-list__item">
                  <div class="menu-list__name">
                    <strong>${esc(i.name)}</strong>
                    ${i.jahrgang ? ` <em>${esc(i.jahrgang)}</em>` : ''}
                    ${i.beschreibung ? `<div class="menu-list__desc">${esc(i.beschreibung)}</div>` : ''}
                    ${i.herkunft ? `<div class="menu-list__herkunft">${esc(i.herkunft)}</div>` : ''}
                  </div>
                  <div class="menu-list__price">
                    ${isWein
                      ? `${i.preis_dl ? Number(i.preis_dl).toFixed(2) + ' / dl' : ''}${i.preis_dl && i.preis_flasche ? '<br>' : ''}${i.preis_flasche ? Number(i.preis_flasche).toFixed(2) + ' / Fl.' : ''}`
                      : (i.preis ? Number(i.preis).toFixed(2) : '')}
                  </div>
                </li>`).join('')}
            </ul>
          </div>`;
      }).join('');
    }
  }

  // ---- HINTERGRUND-BILDER (kind='image' Sections) ----
  // <div class="hero__photo" data-cms-bg="index:hero_bg" style="background-image: url(images/...)"></div>
  async function loadBgImages() {
    const els = [...document.querySelectorAll('[data-cms-bg]')];
    if (!els.length) return;
    const keys = [...new Set(els.map(e => e.dataset.cmsBg))];
    const pages = [...new Set(keys.map(k => k.split(':')[0]))];
    const { data, error } = await sb.from('cms_sections').select('*').in('page_slug', pages);
    if (error) return console.warn('[CMS] bg-images', error);
    const lookup = {};
    data.forEach(s => lookup[`${s.page_slug}:${s.section_key}`] = s);
    els.forEach(el => {
      const s = lookup[el.dataset.cmsBg];
      if (!s || !s.content) return;
      el.style.backgroundImage = `url('${s.content}')`;
    });
  }

  // ---- TEAM ----
  async function loadTeam() {
    const container = document.querySelector('[data-cms-team]');
    if (!container) return;
    const { data, error } = await sb.from('cms_team').select('*').eq('aktiv', true).order('sort_order');
    if (error) { console.warn('[CMS] team', error); return; }
    if (!data.length) { container.innerHTML = ''; return; }
    container.innerHTML = data.map(t => `
      <article class="team-card">
        ${t.bild_url ? `<div class="team-card__img" style="background-image:url('${esc(t.bild_url)}');"></div>` : '<div class="team-card__img team-card__img--placeholder"></div>'}
        <div class="team-card__body">
          <h3>${esc(t.name)}</h3>
          ${t.position ? `<div class="team-card__pos">${esc(t.position)}</div>` : ''}
          ${t.bio ? `<p>${esc(t.bio)}</p>` : ''}
          ${t.email ? `<a href="mailto:${esc(t.email)}" class="team-card__mail">${esc(t.email)}</a>` : ''}
        </div>
      </article>`).join('');
  }

  // ---- STELLEN ----
  async function loadStellen() {
    const container = document.querySelector('[data-cms-stellen]');
    if (!container) return;
    const { data, error } = await sb.from('cms_stellen').select('*').eq('aktiv', true).order('sort_order');
    if (error) { console.warn('[CMS] stellen', error); return; }
    if (!data.length) { container.innerHTML = '<p style="text-align:center;color:var(--c-text-soft);font-style:italic;">Aktuell keine offenen Stellen ausgeschrieben.</p>'; return; }
    container.innerHTML = data.map(s => `
      <article class="stelle-card">
        <header class="stelle-card__head">
          <h3>${esc(s.titel)}</h3>
          <div class="stelle-card__meta">
            ${s.pensum ? `<span>${esc(s.pensum)}</span>` : ''}
            ${s.bereich ? `<span>${esc(s.bereich)}</span>` : ''}
            ${s.eintritt ? `<span>Eintritt: ${esc(s.eintritt)}</span>` : ''}
          </div>
        </header>
        ${s.beschreibung ? `<div class="stelle-card__sect"><strong>Deine Aufgaben</strong><p>${esc(s.beschreibung)}</p></div>` : ''}
        ${s.anforderungen ? `<div class="stelle-card__sect"><strong>Was du mitbringst</strong><p>${esc(s.anforderungen)}</p></div>` : ''}
        <footer class="stelle-card__foot">
          ${s.ansprechperson ? `<div>Ansprechperson: <strong>${esc(s.ansprechperson)}</strong></div>` : ''}
          ${s.ansprech_email ? `<a href="mailto:${esc(s.ansprech_email)}?subject=Bewerbung ${esc(s.titel)}" class="btn btn--dark">Bewerben</a>` : ''}
          ${s.pdf_url ? `<a href="${esc(s.pdf_url)}" target="_blank" rel="noopener" class="btn btn--outline">Inserat PDF ↗</a>` : ''}
        </footer>
      </article>`).join('');
  }

  // ---- ZIMMER ----
  async function loadZimmer() {
    const container = document.querySelector('[data-cms-zimmer]');
    if (!container) return;
    const { data, error } = await sb.from('cms_zimmer').select('*').eq('aktiv', true).order('sort_order');
    if (error) { console.warn('[CMS] zimmer', error); return; }
    if (!data.length) { container.innerHTML = ''; return; }
    container.innerHTML = data.map(z => `
      <article class="zimmer-card">
        ${z.bild_url ? `<div class="zimmer-card__img" style="background-image:url('${esc(z.bild_url)}');"></div>` : ''}
        <div class="zimmer-card__body">
          <h3>${esc(z.name)}</h3>
          ${z.zimmertyp ? `<div class="zimmer-card__typ">${esc(z.zimmertyp)} · für ${z.anzahl_personen} Personen${z.groesse_qm ? ' · '+z.groesse_qm+' m²' : ''}</div>` : ''}
          ${z.beschreibung ? `<p>${esc(z.beschreibung)}</p>` : ''}
          ${z.ausstattung ? `<div class="zimmer-card__aus"><strong>Ausstattung</strong><br>${esc(z.ausstattung)}</div>` : ''}
          ${z.preis_ab ? `<div class="zimmer-card__preis">ab CHF ${Number(z.preis_ab).toFixed(0)}.– / Nacht</div>` : ''}
        </div>
      </article>`).join('');
  }

  // ---- PARTNER ----
  async function loadPartner() {
    const container = document.querySelector('[data-cms-partner]');
    if (!container) return;
    const { data, error } = await sb.from('cms_partner').select('*').eq('aktiv', true).order('sort_order');
    if (error) { console.warn('[CMS] partner', error); return; }
    if (!data.length) { container.innerHTML = ''; return; }
    container.innerHTML = data.map(p => `
      <article class="partner-card ${p.highlight ? 'partner-card--highlight' : ''}">
        ${p.logo_url ? `<img src="${esc(p.logo_url)}" alt="${esc(p.name)}" class="partner-card__logo">` : ''}
        <div class="partner-card__body">
          ${p.kategorie ? `<span class="partner-card__cat">${esc(p.kategorie)}</span>` : ''}
          <h3>${esc(p.name)}</h3>
          ${p.beschreibung ? `<p>${esc(p.beschreibung)}</p>` : ''}
          ${p.website_url ? `<a href="${esc(p.website_url)}" target="_blank" rel="noopener" class="btn btn--dark">${esc(p.website_url.replace(/^https?:\/\//,'').replace(/\/$/,''))} ↗</a>` : ''}
        </div>
      </article>`).join('');
  }

  // ---- 6. PDF-Slots (Karten) ----
  // Beispiel im HTML:  <a data-cms-pdf="speisekarte" href="pdfs/Speisekarte_alteHoefli.pdf">Karte ansehen</a>
  // Die URL wird automatisch durch die im CMS hinterlegte PDF-URL ersetzt.
  async function loadKartenPdfs() {
    const els = [...document.querySelectorAll('[data-cms-pdf]')];
    if (!els.length) return;
    const { data, error } = await sb.from('cms_sections')
      .select('section_key, content').eq('page_slug', 'karten');
    if (error) { console.warn('[CMS] karten', error); return; }
    const map = {};
    (data || []).forEach(s => map[s.section_key] = s.content);
    els.forEach(el => {
      const url = map[el.dataset.cmsPdf];
      if (url) {
        if (el.tagName === 'A') el.href = url;
        else if (el.tagName === 'IFRAME') el.src = url;
        else el.dataset.url = url;
      }
    });
  }

  // Run all
  Promise.all([
    loadSections(), loadEvents(), loadOz(), loadNews(), loadMenu(),
    loadKartenPdfs(), loadBgImages(), loadTeam(), loadStellen(),
    loadZimmer(), loadPartner()
  ]).catch(err => console.warn('[CMS] error', err));
})();
