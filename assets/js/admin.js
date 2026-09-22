/**
 * PANEL DE ADMINISTRACIÓN - JEAN CARLOS ANCHAPURI
 * Gestión de leads, métricas y autenticación con Supabase
 */

let allRequests = [];
let filteredRequests = [];
let currentRequest = null;

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initDashboard();
});

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

  loadRequestsData();
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
