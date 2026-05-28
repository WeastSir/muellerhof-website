/* =============================================================
   Müllerhof CMS – Form Submitter
   Übernimmt alle Formulare, die das Attribut data-cms-form="<typ>"
   tragen, und schickt sie an Supabase (cms_anfragen).
   ============================================================= */
(function() {
  const SUPABASE_URL = 'https://rcnmnthscvfippedgmuu.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_EbLVUn9ckvKSLkpKkq5dTQ_UufHkMMG';
  if (!window.supabase) return console.warn('[CMS-Forms] supabase-js fehlt');
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Hilfs-Funktion: Feldwerte aus Formular lesen
  function slugify(s) {
    return s.toLowerCase()
      .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
      .replace(/[^\w]+/g, '_').replace(/^_|_$/g, '');
  }
  function findLabel(el) {
    // 1. Input innerhalb von <label>
    let lab = el.closest('label');
    if (lab) return lab.textContent.trim();
    // 2. Label als Geschwister im selben Parent (div)
    const parent = el.parentNode;
    if (parent) {
      const sib = parent.querySelector('label');
      if (sib) return sib.textContent.trim();
    }
    // 3. Direkt vorheriges Element ist ein Label
    const prev = el.previousElementSibling;
    if (prev && prev.tagName === 'LABEL') return prev.textContent.trim();
    return null;
  }
  function readFormData(form) {
    const data = {};
    [...form.querySelectorAll('input, textarea, select')].forEach(el => {
      let key = el.name || el.dataset.field;
      if (!key) {
        const lab = findLabel(el);
        if (lab) {
          key = slugify(lab);
          el.dataset.field = key;  // cache
        }
      }
      if (!key) {
        // Letzte Fallback: typ + index
        key = el.type + '_' + Math.random().toString(36).slice(2,6);
      }
      if (el.type === 'checkbox') data[key] = el.checked;
      else if (el.type === 'file') data[key] = el.files?.[0]?.name || null;
      else data[key] = el.value || null;
    });
    return data;
  }

  function showSuccess(form, typ) {
    form.style.opacity = '0.5';
    [...form.querySelectorAll('input, textarea, select, button')].forEach(e => e.disabled = true);
    const msg = document.createElement('div');
    msg.style.cssText = 'background:rgba(74,138,74,0.12);border-left:3px solid #4A8A4A;padding:1rem 1.25rem;margin-top:1rem;color:#2d4a2d;';
    msg.innerHTML = `<strong>✓ Anfrage erhalten.</strong><br>Wir melden uns so bald wie möglich. Danke für dein Vertrauen!`;
    form.appendChild(msg);
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function showError(form, errMsg) {
    const msg = document.createElement('div');
    msg.style.cssText = 'background:rgba(184,74,58,0.12);border-left:3px solid #b84a3a;padding:1rem 1.25rem;margin-top:1rem;color:#7a2820;';
    msg.innerHTML = `<strong>Fehler beim Senden.</strong> Bitte versuche es nochmal oder kontaktiere uns telefonisch: 062 865 53 80<br><small>${errMsg}</small>`;
    form.appendChild(msg);
    setTimeout(() => msg.remove(), 8000);
  }

  // Form-Typen → wichtige Felder-Mapping (mit Umlaut-Konvertierung in slugs)
  const FIELD_MAP = {
    name:      ['name', 'vorname_name', 'vorname_und_name', 'vorname_amp_name', 'vorname_nachname'],
    email:     ['email', 'e_mail', 'mail'],
    telefon:   ['telefon', 'phone', 'tel'],
    betreff:   ['betreff', 'thema', 'subject'],
    nachricht: ['nachricht', 'anmerkungen', 'bemerkungen', 'message',
                'anmerkungen_spezielle_wuensche', 'wuensche_anmerkungen',
                'wuensche', 'kommentar'],
  };

  function extractStandardField(data, candidates) {
    for (const c of candidates) {
      if (data[c]) return data[c];
    }
    // Fuzzy match
    const keys = Object.keys(data);
    for (const c of candidates) {
      const m = keys.find(k => k.toLowerCase().includes(c.replace(/_/g, '')));
      if (m && data[m]) return data[m];
    }
    return null;
  }

  // Alle Formulare mit data-cms-form übernehmen
  document.querySelectorAll('form[data-cms-form]').forEach(form => {
    const typ = form.dataset.cmsForm || 'kontakt';
    // Demo-onsubmit deaktivieren
    form.onsubmit = null;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const raw = readFormData(form);
      const payload = {
        typ,
        name:      extractStandardField(raw, FIELD_MAP.name)      || '(ohne Name)',
        email:     extractStandardField(raw, FIELD_MAP.email),
        telefon:   extractStandardField(raw, FIELD_MAP.telefon),
        betreff:   extractStandardField(raw, FIELD_MAP.betreff),
        nachricht: extractStandardField(raw, FIELD_MAP.nachricht),
        daten:     raw,
        status:    'neu',
      };
      try {
        const { error } = await sb.from('cms_anfragen').insert(payload);
        if (error) throw error;
        showSuccess(form, typ);
      } catch (err) {
        showError(form, err.message || String(err));
      }
    });
  });
})();
