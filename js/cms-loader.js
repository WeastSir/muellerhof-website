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

  // ---- 2. Events (kompakte Listen-Optik wie ursprünglich) ----
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
    const MONTHS = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
    const HIGHLIGHTS = new Set(['Festlich','Tradition','Anlass']);
    container.innerHTML = '<ul class="event-list">' + data.map(e => {
      const d = new Date(e.datum);
      const day = String(d.getDate()).padStart(2, '0');
      const month = MONTHS[d.getMonth()];
      const highlight = HIGHLIGHTS.has(e.kategorie) ? ' event-list__item--highlight' : '';
      const ortText = [e.ort, e.zeit].filter(Boolean).join(' · ');
      return `<li class="event-list__item${highlight}">
        <div class="event-list__date">
          <span class="event-list__day">${day}</span>
          <span class="event-list__month">${month}</span>
        </div>
        <div class="event-list__body">
          <h3>${esc(e.titel)}</h3>
          <span class="event-list__loc">${esc(ortText)}</span>
        </div>
      </li>`;
    }).join('') + '</ul>';
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
        ${renderImageGallery(n, 'news-card')}
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

  // Helper: rendert Galerie ODER Einzelbild aus bilder/bild_url
  function renderImageGallery(item, baseClass) {
    const urls = ((item.bilder || item.bild_url || '').toString()).split('\n').map(s => s.trim()).filter(Boolean);
    if (!urls.length) return '';
    if (urls.length === 1) return `<div class="${baseClass}__img" style="background-image:url('${esc(urls[0])}');"></div>`;
    const cls = `${baseClass}__gallery ${baseClass}__gallery--${Math.min(urls.length, 4)}`;
    return `<div class="${cls}">${urls.slice(0,4).map(u =>
      `<div class="${baseClass}__gallery-item" style="background-image:url('${esc(u)}');"></div>`).join('')}</div>`;
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
        ${renderImageGallery(z, 'zimmer-card')}
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

  // ---- KARTEN-LISTEN (generisch) ----
  // <div data-cms-list="rooms_index" data-cms-tpl="room"></div>
  // Templates: 'room', 'bereich', 'eventkat', 'regular', 'quickbar', 'timeline', 'footer'
  async function loadCards() {
    const containers = [...document.querySelectorAll('[data-cms-list]')];
    if (!containers.length) return;
    const keys = [...new Set(containers.map(c => c.dataset.cmsList))];
    const { data, error } = await sb.from('cms_cards').select('*').in('list_key', keys).eq('aktiv', true).order('sort_order');
    if (error) { console.warn('[CMS] cards', error); return; }
    for (const container of containers) {
      const tpl = container.dataset.cmsTpl || 'bereich';
      const key = container.dataset.cmsList;
      const items = (data || []).filter(c => c.list_key === key);
      container.innerHTML = items.map(c => renderCard(c, tpl)).join('') || '';
    }
  }

  function renderCard(c, tpl) {
    const link = (txt) => c.link_url ? `<a class="pillar__link" href="${esc(c.link_url)}">${esc(txt || c.link_text || 'Mehr →')}</a>` : '';
    if (tpl === 'room') {
      return `<div class="room-card"><div class="room-card__name">${esc(c.titel)}</div><div class="room-card__cap">${esc(c.untertitel||'')}</div></div>`;
    }
    if (tpl === 'bereich') {
      // Mehrere Bilder aus c.bilder (newline-getrennt) oder Fallback auf c.bild_url
      const bilderRaw = (c.bilder || c.bild_url || '').toString();
      const urls = bilderRaw.split('\n').map(s => s.trim()).filter(Boolean);
      let imgHtml = '';
      if (urls.length === 1) {
        imgHtml = `<div class="bereich-card__img" style="background-image:url('${esc(urls[0])}');"></div>`;
      } else if (urls.length > 1) {
        const cls = 'bereich-card__gallery bereich-card__gallery--' + Math.min(urls.length, 4);
        imgHtml = `<div class="${cls}">${urls.slice(0,4).map(u =>
          `<div class="bereich-card__gallery-item" style="background-image:url('${esc(u)}');"></div>`).join('')}</div>`;
      }
      return `<article class="bereich-card">
        ${imgHtml}
        <div class="bereich-card__body">
          ${c.kicker ? `<span class="pillar__kicker">${esc(c.kicker)}</span>` : ''}
          <h3>${esc(c.titel)}</h3>
          ${c.beschreibung ? `<p>${esc(c.beschreibung)}</p>` : ''}
          ${link()}
        </div>
      </article>`;
    }
    if (tpl === 'regular') {
      return `<div class="regular-card">
        <div class="regular-card__day">${esc(c.untertitel||'')}</div>
        <div class="regular-card__name">${esc(c.titel)}</div>
        <div class="regular-card__note">${esc(c.beschreibung||'')}</div>
      </div>`;
    }
    if (tpl === 'quickbar') {
      const val = c.link_url
        ? `<a href="${esc(c.link_url)}">${esc(c.titel)}</a>`
        : esc(c.titel);
      return `<div class="quick-bar__item"><span class="quick-bar__label">${esc(c.kicker)}</span><span class="quick-bar__value">${val}</span></div>`;
    }
    if (tpl === 'timeline') {
      return `<div class="timeline__year">${esc(c.untertitel)}</div><p class="timeline__text">${esc(c.beschreibung||'')}</p>`;
    }
    if (tpl === 'footer') {
      return `<li>${c.link_url ? `<a href="${esc(c.link_url)}">${esc(c.titel)}</a>` : esc(c.titel)}</li>`;
    }
    if (tpl === 'social') {
      const platform = (c.titel || '').toLowerCase();
      const note = c.untertitel ? ` <span class="footer__social-note">(${esc(c.untertitel)})</span>` : '';
      const href = c.link_url || '#';
      // Icon je nach Plattform
      let icon = '';
      if (platform.includes('instagram')) {
        icon = '<svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width:22px;height:22px;flex-shrink:0;"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.05.41 2.22.06 1.27.07 1.65.07 4.86s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.05.36-2.22.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.69 3.69 0 01-1.38-.9 3.69 3.69 0 01-.9-1.38c-.16-.42-.36-1.05-.41-2.22C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.05-.36 2.22-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.85 5.85 0 00-2.12 1.38A5.85 5.85 0 00.63 4.14c-.3.76-.5 1.64-.56 2.91C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.8.73 1.48 1.39 2.13a5.88 5.88 0 002.12 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.88 5.88 0 002.13-1.38 5.88 5.88 0 001.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.85 5.85 0 00-1.38-2.12A5.85 5.85 0 0019.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zm0 10.16a4 4 0 110-8 4 4 0 010 8zm7.85-10.4a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z"/></svg>';
      } else if (platform.includes('tiktok')) {
        icon = '<svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width:22px;height:22px;flex-shrink:0;"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z"/></svg>';
      } else if (platform.includes('facebook')) {
        icon = '<svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width:22px;height:22px;flex-shrink:0;"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/></svg>';
      } else {
        icon = '<svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width:22px;height:22px;flex-shrink:0;"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 6v6l4 2" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
      }
      return `<a href="${esc(href)}" class="footer__social" target="_blank" rel="noopener" aria-label="${esc(c.titel)}">${icon}<span>${esc(c.titel)}</span>${note}</a>`;
    }
    // default
    return `<div>${esc(c.titel||'')}</div>`;
  }

  // ---- AKTUELLE SPECIALS / AKTIONEN ----
  // <div data-cms-specials></div>  → listet aktive Landingpages mit Vorschau
  // Wenn keine aktiven Specials da sind: die ganze SECTION ausblenden
  async function loadSpecials() {
    const container = document.querySelector('[data-cms-specials]');
    if (!container) return;
    const section = container.closest('section') || container.parentNode;
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await sb.from('cms_landingpages')
      .select('*').eq('aktiv', true).order('sort_order');
    if (error) {
      console.warn('[CMS] specials', error);
      if (section) section.style.display = 'none';
      return;
    }
    const visible = (data || []).filter(lp =>
      (!lp.gueltig_ab || lp.gueltig_ab <= today) &&
      (!lp.gueltig_bis || lp.gueltig_bis >= today));
    if (!visible.length) {
      // Ganze Sektion (mit Titel "Specials & Aktionen.") ausblenden
      if (section) section.style.display = 'none';
      return;
    }
    if (section) section.style.display = '';
    container.innerHTML = visible.map(lp => {
      const heroBild = lp.hero_bild_url || (Array.isArray(lp.bloecke) && lp.bloecke.find(b => b.typ==='hero')?.bild_url) || '';
      return `<article class="special-card">
        ${heroBild ? `<div class="special-card__img" style="background-image:url('${esc(heroBild)}');"></div>` : ''}
        <div class="special-card__body">
          <span class="special-card__kicker">Aktion</span>
          <h3>${esc(lp.titel)}</h3>
          ${lp.beschreibung ? `<p>${esc(lp.beschreibung)}</p>` : ''}
          <a href="landingpage.html?slug=${esc(lp.slug)}" class="btn btn--dark">Mehr erfahren →</a>
        </div>
      </article>`;
    }).join('');
  }

  // Run all
  Promise.all([
    loadSections(), loadEvents(), loadOz(), loadNews(), loadMenu(),
    loadKartenPdfs(), loadBgImages(), loadTeam(), loadStellen(),
    loadZimmer(), loadPartner(), loadCards(), loadSpecials()
  ]).catch(err => console.warn('[CMS] error', err));
})();
