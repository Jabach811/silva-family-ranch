/* Turns any <input data-address-autocomplete> into a suggestions box.
   Needs window.addressProvider (see address-google.js). Without one the
   input is left alone and works as a normal text box. */
(() => {
  const provider = window.addressProvider;
  if (typeof provider?.suggest !== 'function') return;

  document.querySelectorAll('input[data-address-autocomplete]').forEach((input, index) => {
    const wrap = document.createElement('div');
    wrap.className = 'address-autocomplete';
    input.before(wrap);
    wrap.append(input);

    const list = document.createElement('ul');
    list.className = 'address-suggestions';
    list.id = `address-suggestions-${index}`;
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', 'Suggestions');
    list.hidden = true;

    const note = document.createElement('span');
    note.className = 'sr-only';
    note.id = `address-help-${index}`;
    note.setAttribute('role', 'status');
    note.setAttribute('aria-live', 'polite');

    const credit = document.createElement('span');
    credit.className = 'address-attribution';
    credit.setAttribute('translate', 'no');
    credit.textContent = provider.attribution || '';
    credit.hidden = true;

    wrap.append(list, credit, note);

    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', list.id);
    input.setAttribute('aria-describedby', [input.getAttribute('aria-describedby'), note.id].filter(Boolean).join(' '));

    let timer, version = 0, items = [], active = -1, composing = false, committing = false;

    const current = token => token === version && document.activeElement === input;

    function close() {
      list.hidden = true;
      credit.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      active = -1;
    }
    function cancel() { clearTimeout(timer); version++; close(); }

    function highlight(i) {
      active = i;
      Array.from(list.children).forEach((el, n) => el.setAttribute('aria-selected', String(n === i)));
      input.setAttribute('aria-activedescendant', list.children[i].id);
      list.children[i].scrollIntoView({ block: 'nearest' });
    }

    async function choose(item) {
      cancel();
      const token = version;
      try {
        const result = typeof provider.resolve === 'function' ? await provider.resolve(item, input) : item;
        if (!current(token) || !result) return;
        committing = true;
        input.value = result.label;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        committing = false;
        note.textContent = 'Filled in. You can still edit it.';
      } catch {
        if (current(token)) note.textContent = 'Could not fill that in. You can type it yourself.';
      }
    }

    async function search(query, token) {
      note.textContent = 'Looking for matches';
      try {
        const results = await provider.suggest(query, input);
        if (!current(token)) return;
        items = (Array.isArray(results) ? results : []).filter(r => r && typeof r.label === 'string').slice(0, 6);
        list.replaceChildren();
        items.forEach((item, i) => {
          const option = document.createElement('li');
          option.id = `${list.id}-${i}`;
          option.setAttribute('role', 'option');
          option.setAttribute('aria-selected', 'false');
          option.textContent = item.label;
          option.addEventListener('mousedown', e => e.preventDefault());
          option.addEventListener('click', () => choose(item));
          list.append(option);
        });
        if (items.length) {
          list.hidden = false;
          credit.hidden = !credit.textContent;
          input.setAttribute('aria-expanded', 'true');
          note.textContent = `${items.length} suggestions. Use the arrow keys to pick one, or keep typing.`;
        } else {
          close();
          note.textContent = 'No matches. Keep typing it yourself.';
        }
      } catch {
        /* Sighted users just see a plain text box. Without this a screen
           reader is left on "Looking for matches" for good. */
        if (!current(token)) return;
        close();
        note.textContent = 'Suggestions are not available. Please type it in yourself.';
      }
    }

    function queue() {
      if (committing) return;
      cancel();
      if (composing) return;
      const query = input.value.trim();
      if (query.length < 3) return;
      const token = version;
      timer = setTimeout(() => search(query, token), 250);
    }

    input.addEventListener('input', queue);
    input.addEventListener('compositionstart', () => { composing = true; cancel(); });
    input.addEventListener('compositionend', () => { composing = false; queue(); });
    input.addEventListener('keydown', e => {
      if (composing) return;
      if (e.key === 'Escape') { if (!list.hidden) e.preventDefault(); cancel(); }
      else if (e.key === 'Tab') cancel();
      else if (!list.hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        highlight(e.key === 'ArrowDown' ? Math.min(active + 1, items.length - 1) : Math.max(active < 0 ? items.length - 1 : active - 1, 0));
      }
      else if (e.key === 'Enter' && !list.hidden && active >= 0) { e.preventDefault(); choose(items[active]); }
    });
    input.addEventListener('blur', cancel);
    document.addEventListener('pointerdown', e => { if (!wrap.contains(e.target)) cancel(); });
    input.form?.addEventListener('reset', cancel);
  });
})();
