(function () {
  'use strict';

  const API = '/api';
  const SESSION_KEY = 'ns_admin_token';
  let token = sessionStorage.getItem(SESSION_KEY);
  let pendingDeleteId = null;
  let currentImageUrl = null;

  // ── Helpers ────────────────────────────────────────────

  function getToken() { return sessionStorage.getItem(SESSION_KEY); }

  function authHeaders() {
    return { 'Authorization': `Bearer ${getToken()}` };
  }

  function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast ${type}`;
    t.classList.remove('hidden');
    clearTimeout(t._to);
    t._to = setTimeout(() => t.classList.add('hidden'), 3200);
  }

  function setLoading(btn, textId, spinnerId, loading) {
    btn.disabled = loading;
    document.getElementById(textId).style.opacity = loading ? '0' : '1';
    document.getElementById(spinnerId).classList.toggle('hidden', !loading);
  }

  // ── Confirm dialog ─────────────────────────────────────

  function confirm(msg) {
    return new Promise(resolve => {
      const overlay = document.getElementById('confirm-overlay');
      document.getElementById('confirm-msg').textContent = msg;
      overlay.classList.remove('hidden');

      const yes = document.getElementById('confirm-yes');
      const no = document.getElementById('confirm-no');

      function cleanup(val) {
        overlay.classList.add('hidden');
        yes.removeEventListener('click', onYes);
        no.removeEventListener('click', onNo);
        resolve(val);
      }

      function onYes() { cleanup(true); }
      function onNo() { cleanup(false); }

      yes.addEventListener('click', onYes);
      no.addEventListener('click', onNo);
    });
  }

  // ── Auth ───────────────────────────────────────────────

  function showLogin() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
  }

  function showDashboard(username) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    const u = document.getElementById('topbar-user');
    if (u) u.textContent = username || 'admin';
    loadCourses();
    loadConfig();
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    showLogin();
  }

  // Auto-login check
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 > Date.now()) {
        showDashboard(payload.username);
      } else {
        logout();
      }
    } catch { logout(); }
  } else {
    showLogin();
  }

  // Login form
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    const errEl = document.getElementById('login-error');
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    errEl.textContent = '';
    setLoading(btn, 'login-btn-text', 'login-spinner', true);

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        errEl.textContent = data.error || 'Credenciais inválidas.';
        return;
      }

      sessionStorage.setItem(SESSION_KEY, data.token);
      const payload = JSON.parse(atob(data.token.split('.')[1]));
      showDashboard(payload.username);
    } catch {
      errEl.textContent = 'Erro de conexão. Tente novamente.';
    } finally {
      setLoading(btn, 'login-btn-text', 'login-spinner', false);
    }
  });

  // Toggle password visibility
  document.getElementById('toggle-pass').addEventListener('click', () => {
    const input = document.getElementById('login-password');
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    document.getElementById('eye-open').style.display = isPass ? 'none' : 'block';
    document.getElementById('eye-closed').style.display = isPass ? 'block' : 'none';
  });

  document.getElementById('logout-btn').addEventListener('click', async () => {
    const ok = await confirm('Deseja sair do painel?');
    if (ok) logout();
  });

  // ── Sidebar / Tabs ─────────────────────────────────────

  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.querySelector('.sidebar');

  mobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== mobileMenuBtn) {
      sidebar.classList.remove('open');
    }
  });

  document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${tab}`).classList.add('active');
      const topbarTitle = document.getElementById('topbar-title');
      if (topbarTitle) topbarTitle.textContent = `// ${tab}`;
      sidebar.classList.remove('open');
    });
  });

  // ── Courses ────────────────────────────────────────────

  async function loadCourses() {
    const loading = document.getElementById('courses-loading-admin');
    const table = document.getElementById('courses-table');
    const noEl = document.getElementById('no-courses');
    const tbody = document.getElementById('courses-tbody');

    loading.classList.remove('hidden');
    table.classList.add('hidden');
    noEl.classList.add('hidden');

    try {
      const res = await fetch(`${API}/admin/courses`, { headers: authHeaders() });
      if (res.status === 401) { logout(); return; }
      const { courses } = await res.json();

      loading.classList.add('hidden');

      if (!courses || courses.length === 0) {
        noEl.classList.remove('hidden');
        return;
      }

      tbody.innerHTML = '';
      courses.forEach(c => tbody.appendChild(buildRow(c)));
      table.classList.remove('hidden');
    } catch {
      loading.classList.add('hidden');
      noEl.textContent = '[!] Erro ao carregar cursos.';
      noEl.classList.remove('hidden');
    }
  }

  function fmtPrice(v) {
    if (!v && v !== 0) return '—';
    return `R$ ${parseFloat(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  }

  function buildRow(course) {
    const tr = document.createElement('tr');

    // Cover
    const tdImg = document.createElement('td');
    if (course.cover_image) {
      const img = document.createElement('img');
      img.src = course.cover_image;
      img.className = 'td-cover';
      img.alt = course.name;
      tdImg.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'td-cover-ph';
      ph.innerHTML = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>`;
      tdImg.appendChild(ph);
    }

    const tdName = document.createElement('td');
    tdName.className = 'td-name';
    tdName.textContent = course.name;

    const tdOld = document.createElement('td');
    tdOld.className = 'td-price td-old';
    tdOld.textContent = fmtPrice(course.old_price);

    const tdPromo = document.createElement('td');
    tdPromo.className = 'td-price td-promo';
    tdPromo.textContent = fmtPrice(course.promo_price);

    const tdStatus = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = `badge-active ${course.active ? 'on' : 'off'}`;
    badge.textContent = course.active ? 'ATIVO' : 'INATIVO';
    tdStatus.appendChild(badge);

    const tdActions = document.createElement('td');
    tdActions.className = 'td-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-edit';
    editBtn.textContent = 'Editar';
    editBtn.addEventListener('click', () => openEditModal(course));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-del';
    delBtn.textContent = 'Remover';
    delBtn.addEventListener('click', () => deleteCourse(course.id, course.name));

    tdActions.appendChild(editBtn);
    tdActions.appendChild(delBtn);

    tr.appendChild(tdImg);
    tr.appendChild(tdName);
    tr.appendChild(tdOld);
    tr.appendChild(tdPromo);
    tr.appendChild(tdStatus);
    tr.appendChild(tdActions);
    return tr;
  }

  // ── Modal ──────────────────────────────────────────────

  function openModal(title) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('modal-error').classList.add('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('modal-form').reset();
    document.getElementById('edit-id').value = '';
    document.getElementById('upload-preview').classList.add('hidden');
    document.getElementById('upload-placeholder').classList.remove('hidden');
    document.getElementById('btn-clear-img').classList.add('hidden');
    currentImageUrl = null;
    document.body.style.overflow = '';
  }

  document.getElementById('btn-add-course').addEventListener('click', () => {
    document.getElementById('edit-id').value = '';
    document.getElementById('f-active').value = '1';
    openModal('Adicionar Curso');
  });

  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);

  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });

  function openEditModal(course) {
    document.getElementById('edit-id').value = course.id;
    document.getElementById('f-name').value = course.name || '';
    document.getElementById('f-desc').value = course.description || '';
    document.getElementById('f-old-price').value = course.old_price || '';
    document.getElementById('f-promo-price').value = course.promo_price || '';
    document.getElementById('f-checkout').value = course.checkout_link || '';
    document.getElementById('f-order').value = course.display_order || 0;
    document.getElementById('f-active').value = course.active ? '1' : '0';

    if (course.cover_image) {
      currentImageUrl = course.cover_image;
      const preview = document.getElementById('upload-preview');
      preview.src = course.cover_image;
      preview.classList.remove('hidden');
      document.getElementById('upload-placeholder').classList.add('hidden');
      document.getElementById('btn-clear-img').classList.remove('hidden');
    }

    openModal('Editar Curso');
  }

  // Image upload
  const uploadArea = document.getElementById('upload-area');
  const fileInput = document.getElementById('f-image');

  uploadArea.addEventListener('click', () => fileInput.click());

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'rgba(255,255,255,0.4)';
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '';
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleImageFile(fileInput.files[0]);
  });

  function handleImageFile(file) {
    if (!file.type.startsWith('image/')) { showToast('Selecione uma imagem válida.', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { showToast('Imagem muito grande (máx 5MB).', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.getElementById('upload-preview');
      preview.src = e.target.result;
      preview.classList.remove('hidden');
      document.getElementById('upload-placeholder').classList.add('hidden');
      document.getElementById('btn-clear-img').classList.remove('hidden');
      currentImageUrl = null;
    };
    reader.readAsDataURL(file);
  }

  document.getElementById('btn-clear-img').addEventListener('click', () => {
    fileInput.value = '';
    document.getElementById('upload-preview').classList.add('hidden');
    document.getElementById('upload-placeholder').classList.remove('hidden');
    document.getElementById('btn-clear-img').classList.add('hidden');
    currentImageUrl = null;
  });

  // Form submit
  document.getElementById('modal-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const errEl = document.getElementById('modal-error');
    const saveBtn = document.getElementById('modal-save');
    const id = document.getElementById('edit-id').value;

    const name = document.getElementById('f-name').value.trim();
    const promoPrice = document.getElementById('f-promo-price').value;
    const checkout = document.getElementById('f-checkout').value.trim();

    if (!name) { showFieldError(errEl, 'Nome do curso é obrigatório.'); return; }
    if (!promoPrice || parseFloat(promoPrice) < 0) { showFieldError(errEl, 'Preço promocional inválido.'); return; }
    if (!checkout) { showFieldError(errEl, 'Link de checkout é obrigatório.'); return; }

    errEl.classList.add('hidden');
    setLoading(saveBtn, 'save-btn-text', 'save-spinner', true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', document.getElementById('f-desc').value.trim());
    formData.append('promo_price', promoPrice);
    formData.append('old_price', document.getElementById('f-old-price').value || '');
    formData.append('checkout_link', checkout);
    formData.append('display_order', document.getElementById('f-order').value || '0');
    formData.append('active', document.getElementById('f-active').value);

    if (fileInput.files[0]) {
      formData.append('cover_image', fileInput.files[0]);
    }

    const url = id ? `${API}/admin/courses/${id}` : `${API}/admin/courses`;
    const method = id ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: formData,
      });

      if (res.status === 401) { logout(); return; }

      const data = await res.json();

      if (!res.ok) {
        showFieldError(errEl, data.error || 'Erro ao salvar curso.');
        return;
      }

      closeModal();
      showToast(id ? 'Curso atualizado!' : 'Curso criado!');
      loadCourses();
    } catch {
      showFieldError(errEl, 'Erro de conexão.');
    } finally {
      setLoading(saveBtn, 'save-btn-text', 'save-spinner', false);
    }
  });

  function showFieldError(el, msg) {
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  async function deleteCourse(id, name) {
    const ok = await confirm(`Remover o curso "${name}"? Esta ação não pode ser desfeita.`);
    if (!ok) return;

    try {
      const res = await fetch(`${API}/admin/courses/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });

      if (res.status === 401) { logout(); return; }

      if (res.ok) {
        showToast('Curso removido.');
        loadCourses();
      } else {
        const d = await res.json();
        showToast(d.error || 'Erro ao remover.', 'error');
      }
    } catch {
      showToast('Erro de conexão.', 'error');
    }
  }

  // ── Config ─────────────────────────────────────────────

  async function loadConfig() {
    try {
      const res = await fetch(`${API}/public/config`);
      const { config } = await res.json();
      if (config.hero_title) document.getElementById('cfg-hero-title').value = config.hero_title;
      if (config.hero_subtitle) document.getElementById('cfg-hero-subtitle').value = config.hero_subtitle;
      if (config.whatsapp_link) document.getElementById('cfg-whatsapp').value = config.whatsapp_link;
    } catch { /* silent */ }
  }

  document.querySelectorAll('.btn-save-cfg').forEach(btn => {
    btn.addEventListener('click', async () => {
      const key = btn.dataset.key;
      const srcId = btn.dataset.src;
      const value = document.getElementById(srcId).value.trim();

      if (!value) { showToast('Campo vazio.', 'error'); return; }

      const prevText = btn.textContent;
      btn.textContent = '...';
      btn.disabled = true;

      try {
        const res = await fetch(`${API}/admin/config`, {
          method: 'PUT',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value }),
        });

        if (res.status === 401) { logout(); return; }
        const data = await res.json();

        if (res.ok) {
          showToast('Configuração salva!');
        } else {
          showToast(data.error || 'Erro ao salvar.', 'error');
        }
      } catch {
        showToast('Erro de conexão.', 'error');
      } finally {
        btn.textContent = prevText;
        btn.disabled = false;
      }
    });
  });

})();
