const radarProgress = (() => {
  const storageKey = 'radar-enem-2026-progresso';
  const legacyKeys = {natureza:'radar2dia', matematica:'radar2dia-matematica'};
  const areas = Object.keys(legacyKeys);
  const codes = {
    natureza: new Set(T.map(topic => topic.s + topic.i)),
    matematica: new Set(mathData.topics.map(topic => topic.id)),
  };
  const state = {natureza:Object.create(null), matematica:Object.create(null)};
  const fileInput = document.getElementById('progressFile');
  const status = document.getElementById('progressMessage');
  let pendingSave = false;

  function parseBackup(text) {
    const backup = JSON.parse(text);
    if (backup?.radar !== 'radar-enem-2026' || backup.version !== 1 ||
        !areas.every(area => Array.isArray(backup[area]) && backup[area].every(code => codes[area].has(code)))) {
      throw new Error('Arquivo de progresso inválido');
    }
    return backup;
  }

  function readSaved() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return parseBackup(saved);
      const legacy = {};
      for (const area of areas) {
        let old;
        try { old = JSON.parse(localStorage.getItem(legacyKeys[area]) || '{}'); } catch {}
        legacy[area] = [...codes[area]].filter(code => old?.[code] === true);
      }
      return legacy;
    } catch {
      return null;
    }
  }

  function apply(saved) {
    if (!saved) return;
    for (const area of areas) {
      for (const code of Object.keys(state[area])) delete state[area][code];
      for (const code of saved[area]) state[area][code] = true;
    }
  }

  function serialize() {
    return JSON.stringify({
      radar:'radar-enem-2026',
      version:1,
      natureza:Object.keys(state.natureza).sort(),
      matematica:Object.keys(state.matematica).sort(),
    }, null, 2);
  }

  function refresh() {
    document.dispatchEvent(new Event('radar-progress-changed'));
  }

  function persist() {
    try {
      localStorage.setItem(storageKey, serialize());
      pendingSave = false;
    } catch {
      pendingSave = true;
    }
    refresh();
    return !pendingSave;
  }

  function sync() {
    if (!pendingSave) apply(readSaved());
  }

  function mark(area, code, checked) {
    if (!codes[area]?.has(code)) return;
    sync();
    if (checked) state[area][code] = true;
    else delete state[area][code];
    if (!persist()) status.textContent = 'O navegador não conseguiu salvar. Exporte o progresso antes de sair.';
  }

  sync();
  window.addEventListener('storage', event => {
    if (event.key === storageKey || event.key === null) {
      sync();
      refresh();
    }
  });

  document.getElementById('exportProgress').addEventListener('click', () => {
    sync();
    refresh();
    const url = URL.createObjectURL(new Blob([serialize()], {type:'application/json'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'radar-enem-2026-progresso.json';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    status.textContent = 'Arquivo gerado. Procure radar-enem-2026-progresso.json nos downloads do navegador.';
  });

  document.getElementById('importProgress').addEventListener('click', () => {
    fileInput.value = '';
    fileInput.click();
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    try {
      if (file.size > 64 * 1024) throw new Error('Arquivo excede o limite de progresso');
      const backup = parseBackup(await file.text());
      sync();
      let added = 0;
      for (const area of areas) {
        for (const code of backup[area]) {
          if (!state[area][code]) added++;
          state[area][code] = true;
        }
      }
      if (persist()) {
        status.textContent = added === 1 ? '1 novo tema revisado importado.' : `${added} novos temas revisados importados.`;
      } else {
        status.textContent = 'Progresso combinado nesta aba. O navegador não conseguiu salvar. Exporte antes de sair.';
      }
    } catch {
      status.textContent = 'Arquivo inválido. Selecione um arquivo de progresso exportado pelo Radar ENEM 2026.';
    }
  });

  return {...state, mark};
})();
