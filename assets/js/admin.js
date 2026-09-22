/**
 * PANEL DE ADMINISTRACIÓN - JEAN CARLOS ANCHAPURI
 * Gestión de leads, métricas y autenticación con Supabase
 */

let allRequests = [];
let filteredRequests = [];
let currentRequest = null;

document.addEventListener('DOMContentLoaded', () => {
  initAdminThemeToggle();
  initAuth();
  initDashboard();
});

/* ==========================================================================
   SISTEMA DE TEMA CLARO / OSCURO (WHITE MODE)
   ========================================================================== */
function initAdminThemeToggle() {
  const adminToggle = document.getElementById('adminThemeToggle');
  const loginToggle = document.getElementById('loginThemeToggle');
  const toggles = [adminToggle, loginToggle].filter(Boolean);

  const savedTheme = localStorage.getItem('micv_theme') || 'dark';
  applyTheme(savedTheme);

  toggles.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const currentTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme(newTheme);
      localStorage.setItem('micv_theme', newTheme);
    });
  });

  function applyTheme(theme) {
    const isLight = theme === 'light';
    if (isLight) {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    toggles.forEach(btn => {
      const icon = btn.querySelector('i');
      if (icon) {
        if (isLight) {
          icon.className = 'fa-solid fa-moon';
          btn.setAttribute('title', 'Cambiar a Modo Oscuro');
        } else {
          icon.className = 'fa-solid fa-sun';
          btn.setAttribute('title', 'Cambiar a Modo Claro');
        }
      }
    });
  }
}

/* ==========================================================================
   AUTENTICACIÓN & CONTROL DE SESIÓN
   ========================================================================== */
function initAuth() {
  const loginView = document.getElementById('loginView');
  const adminApp = document.getElementById('adminApp');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');
  const togglePassBtn = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('adminPassword');

  // Toggle visibilidad contraseña
  if (togglePassBtn && passwordInput) {
    togglePassBtn.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      const icon = togglePassBtn.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
      }
    });
  }

  // Verificar sesión existente
  const savedUser = localStorage.getItem('jean_admin_user') || sessionStorage.getItem('jean_admin_user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      showDashboard(user);
    } catch (e) {
      localStorage.removeItem('jean_admin_user');
      sessionStorage.removeItem('jean_admin_user');
    }
  }

  // Submit Login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginError.classList.remove('active');
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      const username = document.getElementById('adminUsername').value.trim();
      const password = document.getElementById('adminPassword').value.trim();
      const remember = document.getElementById('rememberMe').checked;

      if (!username || !password) {
        showError('Por favor ingresa tu usuario y contraseña.');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verificando...';

      try {
        const res = await window.MicvSupabase.loginAdminUser(username, password);
        if (res.success) {
          const user = res.user;
          if (remember) {
            localStorage.setItem('jean_admin_user', JSON.stringify(user));
          } else {
            sessionStorage.setItem('jean_admin_user', JSON.stringify(user));
          }
          showDashboard(user);
        } else {
          showError(res.error || 'Credenciales incorrectas.');
        }
      } catch (err) {
        showError('Error de conexión con el servidor.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> Iniciar Sesión';
      }
    });
  }

  function showError(msg) {
    if (loginError) {
      loginError.innerText = msg;
      loginError.classList.add('active');
    }
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('jean_admin_user');
      sessionStorage.removeItem('jean_admin_user');
      adminApp.classList.remove('active');
      loginView.style.display = 'flex';
    });
  }
}

function showDashboard(user) {
  const loginView = document.getElementById('loginView');
  const adminApp = document.getElementById('adminApp');
  const currentUserName = document.getElementById('currentUserName');

  if (loginView) loginView.style.display = 'none';
  if (adminApp) adminApp.classList.add('active');
  if (currentUserName && user) {
    currentUserName.innerText = user.full_name || user.username;
  }

  initCmsTabs();
  initCmsItemForm();
  initHeroConfigForm();
  loadRequestsData();
  loadHeroConfig();
  loadCmsBonds();
  loadCmsExperience();
  loadCmsEducation();
  loadCmsServices();
  loadCmsWorkshops();
}

/* ==========================================================================
   CARGA DE DATOS & KPIS
   ========================================================================== */
async function loadRequestsData() {
  const tbody = document.getElementById('leadsTableBody');
  const refreshBtn = document.getElementById('refreshBtn');

  if (refreshBtn) {
    refreshBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Actualizando...';
    refreshBtn.disabled = true;
  }

  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding: 3rem;">
          <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2rem; color: var(--cyan);"></i>
          <p style="margin-top: 1rem; color: var(--text-muted);">Cargando solicitudes desde Supabase...</p>
        </td>
      </tr>
    `;
  }

  const res = await window.MicvSupabase.fetchAllRequests();

  if (refreshBtn) {
    refreshBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Actualizar';
    refreshBtn.disabled = false;
  }

  if (res.success) {
    allRequests = res.data || [];
    filteredRequests = [...allRequests];
    updateKpis(allRequests);
    renderTable(filteredRequests);
  } else {
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding: 2rem; color: var(--rose);">
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem;"></i>
            <p style="margin-top: 0.5rem;">Error al obtener datos: ${res.error}</p>
          </td>
        </tr>
      `;
    }
  }
}

function updateKpis(requests) {
  const totalCount = requests.length;
  const pendingCount = requests.filter(r => r.status === 'pendiente').length;
  const contactedCount = requests.filter(r => r.status === 'contactado' || r.status === 'en_progreso').length;
  const completedCount = requests.filter(r => r.status === 'completado').length;

  document.getElementById('kpiTotal').innerText = totalCount;
  document.getElementById('kpiPending').innerText = pendingCount;
  document.getElementById('kpiContacted').innerText = contactedCount;
  document.getElementById('kpiCompleted').innerText = completedCount;
}

/* ==========================================================================
   RENDERIZADO DE TABLA & ACCIONES
   ========================================================================== */
function renderTable(requests) {
  const tbody = document.getElementById('leadsTableBody');
  if (!tbody) return;

  if (requests.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <i class="fa-regular fa-folder-open"></i>
            <h4>No se encontraron solicitudes</h4>
            <p>No hay registros que coincidan con los filtros aplicados o aún no se han recibido solicitudes.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  requests.forEach(req => {
    const dateObj = new Date(req.created_at);
    const formattedDate = dateObj.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const formattedTime = dateObj.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const statusBadgeClass = {
      'pendiente': 'pendiente',
      'contactado': 'contactado',
      'en_progreso': 'en_progreso',
      'completado': 'completado'
    }[req.status] || 'pendiente';

    const cleanPhone = (req.phone || '').replace(/\D/g, '');
    const waPhone = cleanPhone.startsWith('51') ? cleanPhone : '51' + cleanPhone;
    const waText = encodeURIComponent(
      `Hola ${req.full_name}, te saluda Jean Carlos Anchapuri. Recibí tu solicitud de asesoría sobre "${req.service_type}". ¿Cuándo podríamos coordinar una breve reunión?`
    );

    html += `
      <tr data-id="${req.id}">
        <td>
          <div style="font-weight: 600; color: #fff;">${formattedDate}</div>
          <div style="font-size: 0.78rem; color: var(--text-dim);">${formattedTime}</div>
        </td>
        <td>
          <div class="client-cell">
            <span class="client-name">${escapeHtml(req.full_name)}</span>
            <span class="client-company">${escapeHtml(req.company || 'Sin Empresa')}</span>
          </div>
        </td>
        <td>
          <div class="contact-links">
            <a href="mailto:${escapeHtml(req.email)}" title="Enviar correo">
              <i class="fa-regular fa-envelope"></i> ${escapeHtml(req.email)}
            </a>
            ${req.phone ? `
              <a href="https://wa.me/${waPhone}?text=${waText}" target="_blank" title="Chatear en WhatsApp" style="color: #25d366;">
                <i class="fa-brands fa-whatsapp"></i> ${escapeHtml(req.phone)}
              </a>
            ` : ''}
          </div>
        </td>
        <td>
          <span style="font-weight: 600; color: var(--cyan-light);">${escapeHtml(req.service_type)}</span>
          <div style="font-size: 0.78rem; color: var(--text-dim);">${escapeHtml(req.budget_range || '')}</div>
        </td>
        <td>
          <span class="badge-status ${statusBadgeClass}">${formatStatus(req.status)}</span>
        </td>
        <td>
          <div class="table-actions">
            <button class="btn-icon" onclick="openDetailModal('${req.id}')" title="Ver Detalles y Notas">
              <i class="fa-solid fa-eye"></i>
            </button>
            ${req.phone ? `
              <a href="https://wa.me/${waPhone}?text=${waText}" target="_blank" class="btn-icon wa" title="Abrir WhatsApp">
                <i class="fa-brands fa-whatsapp"></i>
              </a>
            ` : ''}
            <button class="btn-icon delete" onclick="confirmDelete('${req.id}')" title="Eliminar Registro">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function formatStatus(status) {
  const map = {
    'pendiente': 'Pendiente',
    'contactado': 'Contactado',
    'en_progreso': 'En Asesoría',
    'completado': 'Cerrado / Éxito'
  };
  return map[status] || status;
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ==========================================================================
   FILTROS Y BÚSQUEDA
   ========================================================================== */
function initDashboard() {
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const serviceFilter = document.getElementById('serviceFilter');
  const refreshBtn = document.getElementById('refreshBtn');
  const exportBtn = document.getElementById('exportBtn');
  const detailModal = document.getElementById('detailModal');
  const closeModalBtn = document.getElementById('closeDetailModal');
  const saveChangesBtn = document.getElementById('saveChangesBtn');

  function applyFilters() {
    const q = (searchInput?.value || '').toLowerCase().trim();
    const st = statusFilter?.value || 'todos';
    const srv = serviceFilter?.value || 'todos';

    filteredRequests = allRequests.filter(r => {
      const matchQuery = !q ||
        (r.full_name && r.full_name.toLowerCase().includes(q)) ||
        (r.company && r.company.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.phone && r.phone.toLowerCase().includes(q)) ||
        (r.message && r.message.toLowerCase().includes(q));

      const matchStatus = st === 'todos' || r.status === st;
      const matchService = srv === 'todos' || r.service_type === srv;

      return matchQuery && matchStatus && matchService;
    });

    renderTable(filteredRequests);
  }

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (statusFilter) statusFilter.addEventListener('change', applyFilters);
  if (serviceFilter) serviceFilter.addEventListener('change', applyFilters);
  if (refreshBtn) refreshBtn.addEventListener('click', loadRequestsData);

  // Exportar a CSV para Excel
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportToCSV(filteredRequests);
    });
  }

  // Modal handlers
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      detailModal.classList.remove('active');
    });
  }
  if (detailModal) {
    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) detailModal.classList.remove('active');
    });
  }

  // Guardar cambios en el modal
  if (saveChangesBtn) {
    saveChangesBtn.addEventListener('click', async () => {
      if (!currentRequest) return;
      const newStatus = document.getElementById('modalStatusSelect').value;
      const newNotes = document.getElementById('modalAdminNotes').value;

      saveChangesBtn.disabled = true;
      saveChangesBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

      const res = await window.MicvSupabase.updateRequest(currentRequest.id, newStatus, newNotes);

      saveChangesBtn.disabled = false;
      saveChangesBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Cambios';

      if (res.success) {
        // Actualizar en memoria local
        const idx = allRequests.findIndex(r => r.id === currentRequest.id);
        if (idx !== -1) {
          allRequests[idx].status = newStatus;
          allRequests[idx].admin_notes = newNotes;
        }
        updateKpis(allRequests);
        applyFilters();
        detailModal.classList.remove('active');
      } else {
        alert('Error al guardar cambios: ' + res.error);
      }
    });
  }
}

/* ==========================================================================
   MODAL DE DETALLE
   ========================================================================== */
window.openDetailModal = function(id) {
  const req = allRequests.find(r => r.id === id);
  if (!req) return;

  currentRequest = req;
  const modal = document.getElementById('detailModal');

  document.getElementById('modalClientName').innerText = req.full_name;
  document.getElementById('modalCompany').innerText = req.company || 'Particular';
  document.getElementById('modalEmail').innerText = req.email;
  document.getElementById('modalEmail').href = `mailto:${req.email}`;
  document.getElementById('modalPhone').innerText = req.phone || 'No registrado';
  
  const cleanPhone = (req.phone || '').replace(/\D/g, '');
  const waPhone = cleanPhone.startsWith('51') ? cleanPhone : '51' + cleanPhone;
  const waText = encodeURIComponent(
    `Hola ${req.full_name}, te saluda Jean Carlos Anchapuri. Me pongo en contacto respecto a tu requerimiento de "${req.service_type}".`
  );
  
  const modalWaBtn = document.getElementById('modalDirectWaBtn');
  if (modalWaBtn) {
    modalWaBtn.href = req.phone ? `https://wa.me/${waPhone}?text=${waText}` : '#';
    modalWaBtn.style.display = req.phone ? 'inline-flex' : 'none';
  }

  document.getElementById('modalService').innerText = req.service_type;
  document.getElementById('modalBudget').innerText = req.budget_range || 'No especificado';
  document.getElementById('modalDate').innerText = new Date(req.created_at).toLocaleString('es-PE');
  document.getElementById('modalMessage').innerText = req.message || 'Sin mensaje adicional.';

  document.getElementById('modalStatusSelect').value = req.status || 'pendiente';
  document.getElementById('modalAdminNotes').value = req.admin_notes || '';

  modal.classList.add('active');
};

/* ==========================================================================
   ELIMINAR SOLICITUD
   ========================================================================== */
window.confirmDelete = async function(id) {
  const req = allRequests.find(r => r.id === id);
  if (!req) return;

  const ok = confirm(`¿Estás seguro de eliminar la solicitud de "${req.full_name}"? Esta acción no se puede deshacer.`);
  if (!ok) return;

  const res = await window.MicvSupabase.deleteRequestById(id);
  if (res.success) {
    allRequests = allRequests.filter(r => r.id !== id);
    updateKpis(allRequests);
    initDashboard.applyFilters ? initDashboard.applyFilters() : renderTable(allRequests);
    loadRequestsData();
  } else {
    alert('No se pudo eliminar la solicitud: ' + res.error);
  }
};

/* ==========================================================================
   EXPORTAR A EXCEL (CSV UTF-8)
   ========================================================================== */
function exportToCSV(data) {
  if (!data || data.length === 0) {
    alert('No hay solicitudes para exportar.');
    return;
  }

  const headers = ['Fecha', 'Cliente', 'Empresa', 'Email', 'Telefono', 'Servicio', 'Presupuesto', 'Estado', 'Mensaje', 'Notas_Admin'];
  
  const rows = data.map(item => [
    new Date(item.created_at).toLocaleString('es-PE'),
    `"${(item.full_name || '').replace(/"/g, '""')}"`,
    `"${(item.company || '').replace(/"/g, '""')}"`,
    `"${(item.email || '').replace(/"/g, '""')}"`,
    `"${(item.phone || '').replace(/"/g, '""')}"`,
    `"${(item.service_type || '').replace(/"/g, '""')}"`,
    `"${(item.budget_range || '').replace(/"/g, '""')}"`,
    `"${(item.status || '').replace(/"/g, '""')}"`,
    `"${(item.message || '').replace(/"/g, '""')}"`,
    `"${(item.admin_notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Solicitudes_Asesoria_JeanCarlos_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* ==========================================================================
   CMS DINÁMICO: GESTIÓN DE PESTAÑAS Y SECCIONES
   ========================================================================== */

let cachedBonds = [];
let cachedExp = [];
let cachedEdu = [];
let cachedSrv = [];
let cachedWs = [];

function initCmsTabs() {
  const tabs = document.querySelectorAll('.admin-tab');
  const panes = document.querySelectorAll('.tab-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');
    });
  });
}

function showAdminToast(msg) {
  const toast = document.getElementById('adminToast');
  const toastMsg = document.getElementById('toastMessage');
  if (!toast || !toastMsg) return;

  toastMsg.innerText = msg;
  toast.classList.add('active');
  setTimeout(() => {
    toast.classList.remove('active');
  }, 3200);
}

/* 1. HERO & CONFIGURACIÓN */
function initHeroConfigForm() {
  const form = document.getElementById('heroConfigForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSaveHeroConfig');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

    const updates = [
      { key: 'hero_badge', value: document.getElementById('cfgHeroBadge').value.trim() },
      { key: 'hero_title_p1', value: document.getElementById('cfgHeroTitleP1').value.trim() },
      { key: 'hero_title_highlight', value: document.getElementById('cfgHeroTitleHighlight').value.trim() },
      { key: 'hero_title_p2', value: document.getElementById('cfgHeroTitleP2').value.trim() },
      { key: 'hero_description', value: document.getElementById('cfgHeroDesc').value.trim() },
      { key: 'stat_years', value: document.getElementById('cfgStatYears').value.trim() },
      { key: 'stat_projects', value: document.getElementById('cfgStatProjects').value.trim() },
      { key: 'stat_trained', value: document.getElementById('cfgStatTrained').value.trim() },
      { key: 'contact_phone', value: document.getElementById('cfgContactPhone').value.trim() },
      { key: 'contact_email', value: document.getElementById('cfgContactEmail').value.trim() },
      { key: 'contact_location', value: document.getElementById('cfgContactLocation').value.trim() },
      { key: 'contact_legal', value: document.getElementById('cfgContactLegal').value.trim() }
    ];

    for (const item of updates) {
      await window.MicvSupabase.updateSiteConfig(item.key, item.value);
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Cambios en Hero y Contacto';
    showAdminToast('¡Configuración de Hero y Contacto actualizada con éxito!');
  });
}

async function loadHeroConfig() {
  const res = await window.MicvSupabase.fetchSiteConfig();
  if (res.success && res.data) {
    const cfg = res.data;
    if (cfg.hero_badge) document.getElementById('cfgHeroBadge').value = cfg.hero_badge;
    if (cfg.hero_title_p1) document.getElementById('cfgHeroTitleP1').value = cfg.hero_title_p1;
    if (cfg.hero_title_highlight) document.getElementById('cfgHeroTitleHighlight').value = cfg.hero_title_highlight;
    if (cfg.hero_title_p2) document.getElementById('cfgHeroTitleP2').value = cfg.hero_title_p2;
    if (cfg.hero_description) document.getElementById('cfgHeroDesc').value = cfg.hero_description;
    if (cfg.stat_years) document.getElementById('cfgStatYears').value = cfg.stat_years;
    if (cfg.stat_projects) document.getElementById('cfgStatProjects').value = cfg.stat_projects;
    if (cfg.stat_trained) document.getElementById('cfgStatTrained').value = cfg.stat_trained;
    if (cfg.contact_phone) document.getElementById('cfgContactPhone').value = cfg.contact_phone;
    if (cfg.contact_email) document.getElementById('cfgContactEmail').value = cfg.contact_email;
    if (cfg.contact_location) document.getElementById('cfgContactLocation').value = cfg.contact_location;
    if (cfg.contact_legal) document.getElementById('cfgContactLegal').value = cfg.contact_legal;
  }
}

/* 2. BONDARES */
async function loadCmsBonds() {
  const grid = document.getElementById('cmsBondsGrid');
  const countEl = document.getElementById('tabCountBonds');
  if (!grid) return;

  const res = await window.MicvSupabase.fetchBonds();
  if (res.success) {
    cachedBonds = res.data || [];
    if (countEl) countEl.innerText = cachedBonds.length;

    let html = '';
    cachedBonds.forEach(item => {
      html += `
        <div class="cms-item-card">
          <div class="cms-item-header">
            <div style="display: flex; align-items: center; gap: 0.6rem;">
              <i class="${escapeHtml(item.icon || 'fa-solid fa-star')}" style="color: var(--cyan); font-size: 1.2rem;"></i>
              <h4>${escapeHtml(item.title)}</h4>
            </div>
            <span style="font-size: 0.78rem; color: var(--text-dim);">#${item.display_order}</span>
          </div>
          <p class="cms-item-desc">${escapeHtml(item.description)}</p>
          <div class="cms-item-footer">
            <span style="font-size: 0.78rem; color: var(--text-dim);">${(item.bullets || []).length} viñetas</span>
            <div class="table-actions">
              <button class="btn-icon" onclick="openCmsModal('bond', '${item.id}')" title="Editar">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button class="btn-icon delete" onclick="deleteCmsItem('bond', '${item.id}')" title="Eliminar">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    });
    grid.innerHTML = html || '<p style="color: var(--text-dim);">No hay bondades registradas.</p>';
  }
}

/* 3. EXPERIENCIA */
async function loadCmsExperience() {
  const grid = document.getElementById('cmsExperienceGrid');
  const countEl = document.getElementById('tabCountExp');
  if (!grid) return;

  const res = await window.MicvSupabase.fetchExperience();
  if (res.success) {
    cachedExp = res.data || [];
    if (countEl) countEl.innerText = cachedExp.length;

    let html = '';
    cachedExp.forEach(item => {
      html += `
        <div class="cms-item-card">
          <div class="cms-item-header">
            <h4>${escapeHtml(item.role)}</h4>
            <span style="font-size: 0.78rem; color: var(--text-dim);">#${item.display_order}</span>
          </div>
          <div class="cms-item-sub">${escapeHtml(item.company)} (${escapeHtml(item.period)})</div>
          <p class="cms-item-desc">${escapeHtml(item.description)}</p>
          <div class="cms-item-footer">
            <span style="font-size: 0.78rem; color: var(--text-dim);">${(item.tasks || []).length} logros</span>
            <div class="table-actions">
              <button class="btn-icon" onclick="openCmsModal('experience', '${item.id}')" title="Editar">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button class="btn-icon delete" onclick="deleteCmsItem('experience', '${item.id}')" title="Eliminar">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    });
    grid.innerHTML = html || '<p style="color: var(--text-dim);">No hay experiencia registrada.</p>';
  }
}

/* 4. EDUCACIÓN */
async function loadCmsEducation() {
  const grid = document.getElementById('cmsEducationGrid');
  const countEl = document.getElementById('tabCountEdu');
  if (!grid) return;

  const res = await window.MicvSupabase.fetchEducation();
  if (res.success) {
    cachedEdu = res.data || [];
    if (countEl) countEl.innerText = cachedEdu.length;

    let html = '';
    cachedEdu.forEach(item => {
      html += `
        <div class="cms-item-card">
          <div class="cms-item-header">
            <h4>${escapeHtml(item.title)}</h4>
            <span class="badge-status" style="background: rgba(139, 92, 246, 0.15); color: #c084fc;">${escapeHtml(item.badge_label)}</span>
          </div>
          <div class="cms-item-sub">${escapeHtml(item.institution)}</div>
          <p class="cms-item-desc">${escapeHtml(item.description)}</p>
          <div class="cms-item-footer">
            <span style="font-size: 0.78rem; color: var(--text-dim);">${escapeHtml(item.meta_info)}</span>
            <div class="table-actions">
              <button class="btn-icon" onclick="openCmsModal('education', '${item.id}')" title="Editar">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button class="btn-icon delete" onclick="deleteCmsItem('education', '${item.id}')" title="Eliminar">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    });
    grid.innerHTML = html || '<p style="color: var(--text-dim);">No hay formación registrada.</p>';
  }
}

/* 5. SERVICIOS */
async function loadCmsServices() {
  const grid = document.getElementById('cmsServicesGrid');
  const countEl = document.getElementById('tabCountSrv');
  if (!grid) return;

  const res = await window.MicvSupabase.fetchServices();
  if (res.success) {
    cachedSrv = res.data || [];
    if (countEl) countEl.innerText = cachedSrv.length;

    let html = '';
    cachedSrv.forEach(item => {
      html += `
        <div class="cms-item-card">
          <div class="cms-item-header">
            <div style="display: flex; align-items: center; gap: 0.6rem;">
              <i class="${escapeHtml(item.icon || 'fa-solid fa-briefcase')}" style="color: var(--cyan); font-size: 1.2rem;"></i>
              <h4>${escapeHtml(item.name)}</h4>
            </div>
            ${item.is_featured ? `<span class="badge-status completado">Destacado</span>` : ''}
          </div>
          <p class="cms-item-desc">${escapeHtml(item.description)}</p>
          <div class="cms-item-footer">
            <span style="font-size: 0.78rem; color: var(--text-dim);">${(item.features || []).length} características</span>
            <div class="table-actions">
              <button class="btn-icon" onclick="openCmsModal('service', '${item.id}')" title="Editar">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button class="btn-icon delete" onclick="deleteCmsItem('service', '${item.id}')" title="Eliminar">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    });
    grid.innerHTML = html || '<p style="color: var(--text-dim);">No hay servicios registrados.</p>';
  }
}

/* 6. WORKSHOPS */
async function loadCmsWorkshops() {
  const grid = document.getElementById('cmsWorkshopsGrid');
  const countEl = document.getElementById('tabCountWs');
  if (!grid) return;

  const res = await window.MicvSupabase.fetchWorkshops();
  if (res.success) {
    cachedWs = res.data || [];
    if (countEl) countEl.innerText = cachedWs.length;

    let html = '';
    cachedWs.forEach(item => {
      html += `
        <div class="cms-item-card">
          <div style="width: 100%; height: 130px; border-radius: 8px; overflow: hidden; margin-bottom: 0.85rem; background: #0b101c;">
            <img src="${escapeHtml(item.image_url)}" style="width: 100%; height: 100%; object-fit: cover;" alt="">
          </div>
          <div class="cms-item-header">
            <h4 style="font-size: 0.95rem;">${escapeHtml(item.title)}</h4>
            <span class="badge-status" style="background: rgba(6, 182, 212, 0.15); color: #67e8f9;">${escapeHtml(item.badge)}</span>
          </div>
          <div class="cms-item-sub" style="font-size: 0.8rem;">${escapeHtml(item.organization)}</div>
          <div class="cms-item-footer">
            <span style="font-size: 0.78rem; color: var(--text-dim);">Orden: #${item.display_order}</span>
            <div class="table-actions">
              <button class="btn-icon" onclick="openCmsModal('workshop', '${item.id}')" title="Editar">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button class="btn-icon delete" onclick="deleteCmsItem('workshop', '${item.id}')" title="Eliminar">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    });
    grid.innerHTML = html || '<p style="color: var(--text-dim);">No hay workshops registrados.</p>';
  }
}

/* ==========================================================================
   MODAL CMS DINÁMICO (CREAR / EDITAR)
   ========================================================================== */
window.openCmsModal = function(type, id = null) {
  const modal = document.getElementById('cmsItemModal');
  const titleEl = document.getElementById('cmsModalTitle');
  const typeInput = document.getElementById('cmsItemType');
  const idInput = document.getElementById('cmsItemId');
  const fieldsContainer = document.getElementById('cmsModalDynamicFields');

  typeInput.value = type;
  idInput.value = id || '';

  let html = '';

  if (type === 'bond') {
    const item = id ? cachedBonds.find(x => x.id === id) : {};
    titleEl.innerText = id ? 'Editar Bondad' : 'Nueva Bondad / Diferenciador';
    const bulletsText = (item.bullets || []).join('\n');
    html = `
      <div class="input-group">
        <label>Título de la Bondad *</label>
        <input type="text" id="f_title" class="input-field" value="${escapeHtml(item.title || '')}" required>
      </div>
      <div class="input-group">
        <label>Icono FontAwesome (clase CSS)</label>
        <input type="text" id="f_icon" class="input-field" placeholder="fa-solid fa-code-compare" value="${escapeHtml(item.icon || 'fa-solid fa-star')}">
      </div>
      <div class="input-group">
        <label>Descripción *</label>
        <textarea id="f_desc" class="input-field" rows="3" required>${escapeHtml(item.description || '')}</textarea>
      </div>
      <div class="input-group">
        <label>Viñetas Destacadas (una por línea)</label>
        <textarea id="f_bullets" class="input-field" rows="3" placeholder="Viñeta 1&#10;Viñeta 2">${escapeHtml(bulletsText)}</textarea>
      </div>
      <div class="input-group">
        <label>Orden de Visualización</label>
        <input type="number" id="f_order" class="input-field" value="${item.display_order || 1}">
      </div>
    `;
  } else if (type === 'experience') {
    const item = id ? cachedExp.find(x => x.id === id) : {};
    titleEl.innerText = id ? 'Editar Experiencia' : 'Nueva Experiencia Laboral';
    const tasksText = (item.tasks || []).join('\n');
    html = `
      <div class="detail-row">
        <div class="input-group">
          <label>Empresa u Organización *</label>
          <input type="text" id="f_company" class="input-field" value="${escapeHtml(item.company || '')}" required>
        </div>
        <div class="input-group">
          <label>Cargo Desempeñado *</label>
          <input type="text" id="f_role" class="input-field" value="${escapeHtml(item.role || '')}" required>
        </div>
      </div>
      <div class="input-group">
        <label>Periodo (ej. 2025 - 2026 (10 Meses)) *</label>
        <input type="text" id="f_period" class="input-field" value="${escapeHtml(item.period || '')}" required>
      </div>
      <div class="input-group">
        <label>Descripción / Logro General *</label>
        <textarea id="f_desc" class="input-field" rows="2" required>${escapeHtml(item.description || '')}</textarea>
      </div>
      <div class="input-group">
        <label>Actividades / Tareas Clave (una por línea)</label>
        <textarea id="f_tasks" class="input-field" rows="3" placeholder="Tarea 1&#10;Tarea 2">${escapeHtml(tasksText)}</textarea>
      </div>
      <div class="input-group">
        <label>Orden de Visualización</label>
        <input type="number" id="f_order" class="input-field" value="${item.display_order || 1}">
      </div>
    `;
  } else if (type === 'education') {
    const item = id ? cachedEdu.find(x => x.id === id) : {};
    titleEl.innerText = id ? 'Editar Formación' : 'Nueva Formación / Certificación';
    html = `
      <div class="input-group">
        <label>Título o Grado *</label>
        <input type="text" id="f_title" class="input-field" value="${escapeHtml(item.title || '')}" required>
      </div>
      <div class="input-group">
        <label>Institución o Casa de Estudios *</label>
        <input type="text" id="f_institution" class="input-field" value="${escapeHtml(item.institution || '')}" required>
      </div>
      <div class="detail-row">
        <div class="input-group">
          <label>Etiqueta / Insignia *</label>
          <input type="text" id="f_badge_label" class="input-field" placeholder="Postgrado, Certificación..." value="${escapeHtml(item.badge_label || 'Certificación')}" required>
        </div>
        <div class="input-group">
          <label>Tipo de Insignia</label>
          <select id="f_badge_type" class="input-field">
            <option value="master" ${item.badge_type === 'master' ? 'selected' : ''}>Postgrado (Púrpura)</option>
            <option value="cert" ${item.badge_type === 'cert' || !item.badge_type ? 'selected' : ''}>Certificación (Cian)</option>
            <option value="lang" ${item.badge_type === 'lang' ? 'selected' : ''}>Idioma (Verde)</option>
          </select>
        </div>
      </div>
      <div class="input-group">
        <label>Descripción</label>
        <textarea id="f_desc" class="input-field" rows="2">${escapeHtml(item.description || '')}</textarea>
      </div>
      <div class="detail-row">
        <div class="input-group">
          <label>Fechas / Ubicación *</label>
          <input type="text" id="f_meta" class="input-field" placeholder="2021 - 2023 | Tacna, Perú" value="${escapeHtml(item.meta_info || '')}" required>
        </div>
        <div class="input-group">
          <label>Orden</label>
          <input type="number" id="f_order" class="input-field" value="${item.display_order || 1}">
        </div>
      </div>
    `;
  } else if (type === 'service') {
    const item = id ? cachedSrv.find(x => x.id === id) : {};
    titleEl.innerText = id ? 'Editar Servicio' : 'Nuevo Servicio de Asesoría';
    const featText = (item.features || []).join('\n');
    html = `
      <div class="input-group">
        <label>Nombre del Servicio *</label>
        <input type="text" id="f_name" class="input-field" value="${escapeHtml(item.name || '')}" required>
      </div>
      <div class="input-group">
        <label>Icono FontAwesome (clase CSS)</label>
        <input type="text" id="f_icon" class="input-field" placeholder="fa-solid fa-file-invoice-dollar" value="${escapeHtml(item.icon || 'fa-solid fa-briefcase')}">
      </div>
      <div class="input-group">
        <label>Descripción Comercial *</label>
        <textarea id="f_desc" class="input-field" rows="2" required>${escapeHtml(item.description || '')}</textarea>
      </div>
      <div class="input-group">
        <label>Características / Alcance (una por línea)</label>
        <textarea id="f_features" class="input-field" rows="3" placeholder="Característica 1&#10;Característica 2">${escapeHtml(featText)}</textarea>
      </div>
      <div class="detail-row">
        <div class="input-group" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 1.5rem;">
          <label style="cursor: pointer; display: flex; align-items: center; gap: 0.5rem; color: #fff;">
            <input type="checkbox" id="f_featured" ${item.is_featured ? 'checked' : ''}> Marcar como Servicio Destacado
          </label>
        </div>
        <div class="input-group">
          <label>Orden</label>
          <input type="number" id="f_order" class="input-field" value="${item.display_order || 1}">
        </div>
      </div>
    `;
  } else if (type === 'workshop') {
    const item = id ? cachedWs.find(x => x.id === id) : {};
    titleEl.innerText = id ? 'Editar Workshop' : 'Nuevo Workshop / Conferencia';
    html = `
      <div class="input-group">
        <label>Título del Taller o Conferencia *</label>
        <input type="text" id="f_title" class="input-field" value="${escapeHtml(item.title || '')}" required>
      </div>
      <div class="detail-row">
        <div class="input-group">
          <label>Organización / Entidad *</label>
          <input type="text" id="f_org" class="input-field" placeholder="IESTP San Luis, PRODUCE..." value="${escapeHtml(item.organization || '')}" required>
        </div>
        <div class="input-group">
          <label>Insignia / Rubro *</label>
          <input type="text" id="f_badge" class="input-field" placeholder="IESTP SAN LUIS, CLOUD..." value="${escapeHtml(item.badge || 'WORKSHOP')}" required>
        </div>
      </div>
      <div class="input-group">
        <label>Ruta o URL de Imagen *</label>
        <input type="text" id="f_img" class="input-field" placeholder="assets/img/workshop-1.jpg" value="${escapeHtml(item.image_url || 'assets/img/workshop-produce.jpg')}" required>
      </div>
      <div class="input-group">
        <label>Orden de Visualización</label>
        <input type="number" id="f_order" class="input-field" value="${item.display_order || 1}">
      </div>
    `;
  }

  fieldsContainer.innerHTML = html;
  modal.classList.add('active');
};

window.closeCmsModal = function() {
  const modal = document.getElementById('cmsItemModal');
  if (modal) modal.classList.remove('active');
};

function initCmsItemForm() {
  const form = document.getElementById('cmsItemForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = document.getElementById('cmsItemType').value;
    const id = document.getElementById('cmsItemId').value || null;
    const saveBtn = document.getElementById('btnSaveCmsItem');

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

    try {
      if (type === 'bond') {
        const bullets = (document.getElementById('f_bullets').value || '').split('\n').map(s => s.trim()).filter(Boolean);
        await window.MicvSupabase.saveBond({
          id,
          title: document.getElementById('f_title').value.trim(),
          icon: document.getElementById('f_icon').value.trim(),
          description: document.getElementById('f_desc').value.trim(),
          bullets,
          display_order: document.getElementById('f_order').value
        });
        await loadCmsBonds();
      } else if (type === 'experience') {
        const tasks = (document.getElementById('f_tasks').value || '').split('\n').map(s => s.trim()).filter(Boolean);
        await window.MicvSupabase.saveExperience({
          id,
          company: document.getElementById('f_company').value.trim(),
          role: document.getElementById('f_role').value.trim(),
          period: document.getElementById('f_period').value.trim(),
          description: document.getElementById('f_desc').value.trim(),
          tasks,
          display_order: document.getElementById('f_order').value
        });
        await loadCmsExperience();
      } else if (type === 'education') {
        await window.MicvSupabase.saveEducation({
          id,
          title: document.getElementById('f_title').value.trim(),
          institution: document.getElementById('f_institution').value.trim(),
          badge_label: document.getElementById('f_badge_label').value.trim(),
          badge_type: document.getElementById('f_badge_type').value,
          description: document.getElementById('f_desc').value.trim(),
          meta_info: document.getElementById('f_meta').value.trim(),
          display_order: document.getElementById('f_order').value
        });
        await loadCmsEducation();
      } else if (type === 'service') {
        const features = (document.getElementById('f_features').value || '').split('\n').map(s => s.trim()).filter(Boolean);
        await window.MicvSupabase.saveService({
          id,
          name: document.getElementById('f_name').value.trim(),
          icon: document.getElementById('f_icon').value.trim(),
          description: document.getElementById('f_desc').value.trim(),
          features,
          is_featured: document.getElementById('f_featured').checked,
          display_order: document.getElementById('f_order').value
        });
        await loadCmsServices();
      } else if (type === 'workshop') {
        await window.MicvSupabase.saveWorkshop({
          id,
          title: document.getElementById('f_title').value.trim(),
          organization: document.getElementById('f_org').value.trim(),
          badge: document.getElementById('f_badge').value.trim(),
          image_url: document.getElementById('f_img').value.trim(),
          display_order: document.getElementById('f_order').value
        });
        await loadCmsWorkshops();
      }

      closeCmsModal();
      showAdminToast('¡Registro guardado con éxito en Supabase!');
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Registro';
    }
  });
}

window.deleteCmsItem = async function(type, id) {
  const ok = confirm('¿Estás seguro de eliminar este registro? Esta acción actualizará la base de datos de inmediato.');
  if (!ok) return;

  try {
    if (type === 'bond') {
      await window.MicvSupabase.deleteBond(id);
      await loadCmsBonds();
    } else if (type === 'experience') {
      await window.MicvSupabase.deleteExperience(id);
      await loadCmsExperience();
    } else if (type === 'education') {
      await window.MicvSupabase.deleteEducation(id);
      await loadCmsEducation();
    } else if (type === 'service') {
      await window.MicvSupabase.deleteService(id);
      await loadCmsServices();
    } else if (type === 'workshop') {
      await window.MicvSupabase.deleteWorkshop(id);
      await loadCmsWorkshops();
    }
    showAdminToast('Registro eliminado de Supabase.');
  } catch (err) {
    alert('Error al eliminar: ' + err.message);
  }
};

