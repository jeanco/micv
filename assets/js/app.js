/**
 * LÓGICA PRINCIPAL DEL SITIO WEB - JEAN CARLOS ANCHAPURI
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initNavbar();
  initCounters();
  initServiceButtons();
  initLightbox();
  initContactForm();
  loadDynamicContent();
});

/* ==========================================================================
   CAMBIO DE TEMA (MODO CLARO / OSCURO)
   ========================================================================== */
function initThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  if (!themeToggle || !themeIcon) return;

  // Cargar preferencia guardada
  const savedTheme = localStorage.getItem('micv_theme') || 'dark';
  applyTheme(savedTheme);

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    localStorage.setItem('micv_theme', newTheme);
  });

  function applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      themeIcon.classList.remove('fa-sun');
      themeIcon.classList.add('fa-moon');
      themeToggle.setAttribute('title', 'Cambiar a Modo Oscuro');
    } else {
      document.documentElement.removeAttribute('data-theme');
      themeIcon.classList.remove('fa-moon');
      themeIcon.classList.add('fa-sun');
      themeToggle.setAttribute('title', 'Cambiar a Modo Claro');
    }
  }
}

/* ==========================================================================
   NAVBAR & SCROLL SPY
   ========================================================================== */
function initNavbar() {
  const header = document.querySelector('.header');
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  // Header blur / shadow al scrollear
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    updateActiveNavLink();
  });

  // Toggle menú móvil
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-xmark');
      }
    });

    // Cerrar al clickear cualquier link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        const icon = mobileToggle.querySelector('i');
        if (icon) {
          icon.classList.add('fa-bars');
          icon.classList.remove('fa-xmark');
        }
      });
    });
  }

  // Scroll Spy
  function updateActiveNavLink() {
    const scrollY = window.pageYOffset;
    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120;
      const sectionId = current.getAttribute('id');
      const matchingLink = document.querySelector(`.nav-link[href*="${sectionId}"]`);

      if (matchingLink) {
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          matchingLink.classList.add('active');
        } else {
          matchingLink.classList.remove('active');
        }
      }
    });
  }
}

/* ==========================================================================
   CONTADORES ANIMADOS (HERO STATS)
   ========================================================================== */
function initCounters() {
  const counters = document.querySelectorAll('.counter-val');
  let animated = false;

  function runCounters() {
    if (animated) return;
    counters.forEach(counter => {
      const target = +counter.getAttribute('data-target');
      let count = 0;
      const speed = 25; // Velocidad de conteo
      const increment = Math.ceil(target / 40);

      const updateCount = () => {
        count += increment;
        if (count < target) {
          counter.innerText = count;
          setTimeout(updateCount, speed);
        } else {
          counter.innerText = target;
        }
      };
      updateCount();
    });
    animated = true;
  }

  // Activar cuando la sección sea visible
  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        runCounters();
      }
    }, { threshold: 0.5 });
    observer.observe(heroStats);
  }
}

/* ==========================================================================
   BOTONES DE SELECCIÓN DE SERVICIO
   ========================================================================== */
function initServiceButtons() {
  const serviceButtons = document.querySelectorAll('.btn-select-service');
  const serviceSelect = document.getElementById('serviceType');

  serviceButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const serviceVal = btn.getAttribute('data-service');
      if (serviceSelect && serviceVal) {
        serviceSelect.value = serviceVal;
      }
      
      const contactSection = document.getElementById('contacto');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
        // Efecto visual de resaltado
        setTimeout(() => {
          if (serviceSelect) {
            serviceSelect.focus();
            serviceSelect.style.borderColor = 'var(--primary-light)';
            setTimeout(() => {
              serviceSelect.style.borderColor = '';
            }, 1800);
          }
        }, 600);
      }
    });
  });
}

/* ==========================================================================
   LIGHTBOX PARA FOTOS DE WORKSHOPS
   ========================================================================== */
function initLightbox() {
  const lightbox = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxOrg = document.getElementById('lightboxOrg');
  const closeBtn = document.getElementById('lightboxClose');
  const cards = document.querySelectorAll('.workshop-card');

  if (!lightbox) return;

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const img = card.querySelector('img');
      const title = card.querySelector('.workshop-title');
      const org = card.querySelector('.workshop-org');

      if (img && lightboxImg) lightboxImg.src = img.src;
      if (title && lightboxTitle) lightboxTitle.innerText = title.innerText;
      if (org && lightboxOrg) lightboxOrg.innerText = org.innerText;

      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  const closeLightbox = () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });
}

/* ==========================================================================
   FORMULARIO DE SOLICITUD DE ASESORÍA CON SUPABASE
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('consultingForm');
  const submitBtn = document.getElementById('submitBtn');
  const modalAlert = document.getElementById('successModal');
  const closeModalBtn = document.getElementById('closeSuccessModal');
  const modalWhatsappBtn = document.getElementById('modalWhatsappBtn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const company = document.getElementById('company').value.trim();
    const serviceType = document.getElementById('serviceType').value;
    const budgetRange = document.getElementById('budgetRange').value;
    const message = document.getElementById('message').value.trim();

    // Validaciones básicas
    if (!fullName || !email || !serviceType || !message) {
      alert('Por favor completa todos los campos requeridos (*)');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Por favor ingresa un correo electrónico válido.');
      return;
    }

    // Estado cargando
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
      const response = await window.MicvSupabase.createConsultingRequest({
        fullName,
        email,
        phone,
        company,
        serviceType,
        budgetRange,
        message
      });

      if (response.success) {
        // Configurar botón de WhatsApp en el modal de éxito
        if (modalWhatsappBtn) {
          const waMessage = encodeURIComponent(
            `¡Hola Jean Carlos! Acabo de registrar una solicitud de asesoría en tu página web.\n\n` +
            `👤 *Nombre:* ${fullName}\n` +
            `🏢 *Empresa:* ${company || 'Particular'}\n` +
            `💼 *Servicio de interés:* ${serviceType}\n` +
            `📝 *Detalle:* ${message.substring(0, 150)}...`
          );
          modalWhatsappBtn.href = `https://wa.me/51995921377?text=${waMessage}`;
        }

        // Mostrar modal de éxito
        if (modalAlert) {
          modalAlert.classList.add('active');
        }

        form.reset();
      } else {
        alert('Hubo un inconveniente al registrar la solicitud: ' + (response.error || 'Error de conexión'));
      }
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error inesperado al procesar la solicitud.');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });

  // Cerrar modal de éxito
  if (closeModalBtn && modalAlert) {
    closeModalBtn.addEventListener('click', () => {
      modalAlert.classList.remove('active');
    });
    modalAlert.addEventListener('click', (e) => {
      if (e.target === modalAlert) {
        modalAlert.classList.remove('active');
      }
    });
  }
}

/* ==========================================================================
   CARGA DINÁMICA DE CONTENIDOS DESDE SUPABASE (CMS)
   ========================================================================== */
async function loadDynamicContent() {
  if (!window.MicvSupabase) return;

  // 1. Configuración General (Hero, Estadísticas, Contacto)
  try {
    const cfgRes = await window.MicvSupabase.fetchSiteConfig();
    if (cfgRes.success && cfgRes.data) {
      const cfg = cfgRes.data;
      if (cfg.hero_badge) {
        const badgeEl = document.getElementById('heroBadgeText');
        if (badgeEl) badgeEl.innerText = cfg.hero_badge;
      }
      if (cfg.hero_title_p1) {
        const titleEl = document.getElementById('heroTitle');
        if (titleEl) {
          titleEl.innerHTML = `${escapeHtml(cfg.hero_title_p1)} <span class="gradient-text">${escapeHtml(cfg.hero_title_highlight || '')}</span> ${escapeHtml(cfg.hero_title_p2 || '')}`;
        }
      }
      if (cfg.hero_description) {
        const descEl = document.getElementById('heroDescription');
        if (descEl) descEl.innerHTML = cfg.hero_description;
      }
      if (cfg.stat_years) {
        const el = document.getElementById('statYears');
        if (el) { el.setAttribute('data-target', cfg.stat_years); el.innerText = cfg.stat_years; }
      }
      if (cfg.stat_projects) {
        const el = document.getElementById('statProjects');
        if (el) { el.setAttribute('data-target', cfg.stat_projects); el.innerText = cfg.stat_projects; }
      }
      if (cfg.stat_trained) {
        const el = document.getElementById('statTrained');
        if (el) { el.setAttribute('data-target', cfg.stat_trained); el.innerText = cfg.stat_trained; }
      }
      if (cfg.contact_phone) {
        const el = document.getElementById('contactPhoneDisplay');
        if (el) el.innerText = cfg.contact_phone;
      }
      if (cfg.contact_email) {
        const el = document.getElementById('contactEmailDisplay');
        if (el) el.innerText = cfg.contact_email;
      }
      if (cfg.contact_location) {
        const el = document.getElementById('contactLocationDisplay');
        if (el) el.innerText = cfg.contact_location;
      }
      if (cfg.contact_legal) {
        const el = document.getElementById('contactLegalDisplay');
        if (el) el.innerText = cfg.contact_legal;
      }
    }
  } catch (e) {
    console.warn('Fallback a contenido estático en Hero/Config');
  }

  // 2. Bondades
  try {
    const bondsRes = await window.MicvSupabase.fetchBonds();
    if (bondsRes.success && bondsRes.data && bondsRes.data.length > 0) {
      renderBonds(bondsRes.data);
    }
  } catch (e) {
    console.warn('Fallback a contenido estático en Bondades');
  }

  // 3. Experiencia
  try {
    const expRes = await window.MicvSupabase.fetchExperience();
    if (expRes.success && expRes.data && expRes.data.length > 0) {
      renderExperience(expRes.data);
    }
  } catch (e) {
    console.warn('Fallback a contenido estático en Experiencia');
  }

  // 4. Educación
  try {
    const eduRes = await window.MicvSupabase.fetchEducation();
    if (eduRes.success && eduRes.data && eduRes.data.length > 0) {
      renderEducation(eduRes.data);
    }
  } catch (e) {
    console.warn('Fallback a contenido estático en Educación');
  }

  // 5. Servicios
  try {
    const srvRes = await window.MicvSupabase.fetchServices();
    if (srvRes.success && srvRes.data && srvRes.data.length > 0) {
      renderServices(srvRes.data);
      initServiceButtons();
    }
  } catch (e) {
    console.warn('Fallback a contenido estático en Servicios');
  }

  // 6. Workshops
  try {
    const wsRes = await window.MicvSupabase.fetchWorkshops();
    if (wsRes.success && wsRes.data && wsRes.data.length > 0) {
      renderWorkshops(wsRes.data);
      initLightbox();
    }
  } catch (e) {
    console.warn('Fallback a contenido estático en Workshops');
  }
}

function renderBonds(bonds) {
  const container = document.getElementById('bondsGrid');
  if (!container) return;

  let html = '';
  bonds.forEach(bond => {
    let bulletsHtml = '';
    const bullets = Array.isArray(bond.bullets) ? bond.bullets : [];
    bullets.forEach(b => {
      bulletsHtml += `<li><i class="fa-solid fa-circle-check"></i> ${escapeHtml(b)}</li>`;
    });

    html += `
      <div class="bond-card">
        <div class="bond-icon">
          <i class="${escapeHtml(bond.icon || 'fa-solid fa-star')}"></i>
        </div>
        <h3 class="bond-title">${escapeHtml(bond.title)}</h3>
        <p class="bond-desc">${escapeHtml(bond.description)}</p>
        ${bulletsHtml ? `<ul class="bond-bullets">${bulletsHtml}</ul>` : ''}
      </div>
    `;
  });
  container.innerHTML = html;
}

function renderExperience(items) {
  const container = document.getElementById('experienceTimeline');
  if (!container) return;

  let html = '';
  items.forEach(item => {
    let tasksHtml = '';
    const tasks = Array.isArray(item.tasks) ? item.tasks : [];
    tasks.forEach(t => {
      tasksHtml += `<li><i class="fa-solid fa-angle-right"></i> ${escapeHtml(t)}</li>`;
    });

    html += `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <div class="timeline-header">
            <div>
              <h3 class="timeline-role">${escapeHtml(item.role)}</h3>
              <span class="timeline-company">${escapeHtml(item.company)}</span>
            </div>
            <span class="timeline-date"><i class="fa-regular fa-calendar"></i> ${escapeHtml(item.period)}</span>
          </div>
          <p class="timeline-desc">${escapeHtml(item.description)}</p>
          ${tasksHtml ? `<ul class="timeline-tasks">${tasksHtml}</ul>` : ''}
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

function renderEducation(items) {
  const container = document.getElementById('educationGrid');
  if (!container) return;

  let html = '';
  items.forEach(item => {
    html += `
      <div class="edu-card">
        <span class="edu-badge ${escapeHtml(item.badge_type || 'cert')}">${escapeHtml(item.badge_label || 'Certificado')}</span>
        <h3 class="edu-title">${escapeHtml(item.title)}</h3>
        <p class="edu-institution">${escapeHtml(item.institution)}</p>
        <p class="bond-desc">${escapeHtml(item.description)}</p>
        <div class="edu-meta">${escapeHtml(item.meta_info)}</div>
      </div>
    `;
  });
  container.innerHTML = html;
}

function renderServices(items) {
  const container = document.getElementById('servicesGrid');
  if (!container) return;

  let html = '';
  items.forEach(srv => {
    let featuresHtml = '';
    const features = Array.isArray(srv.features) ? srv.features : [];
    features.forEach(f => {
      featuresHtml += `<li><i class="fa-solid fa-check"></i> ${escapeHtml(f)}</li>`;
    });

    const isFeatured = srv.is_featured;
    const btnClass = isFeatured ? 'btn btn-primary' : 'btn btn-outline';

    html += `
      <div class="service-card ${isFeatured ? 'featured' : ''}">
        ${isFeatured ? `<span class="featured-pill">Alta Demanda</span>` : ''}
        <div class="service-icon-box">
          <i class="${escapeHtml(srv.icon || 'fa-solid fa-laptop-code')}"></i>
        </div>
        <h3 class="service-name">${escapeHtml(srv.name)}</h3>
        <p class="service-description">${escapeHtml(srv.description)}</p>
        ${featuresHtml ? `<ul class="service-features">${featuresHtml}</ul>` : ''}
        <a href="#contacto" class="${btnClass} btn-service btn-select-service" data-service="${escapeHtml(srv.name)}">
          Solicitar esta Asesoría <i class="fa-solid fa-arrow-right"></i>
        </a>
      </div>
    `;
  });
  container.innerHTML = html;
}

function renderWorkshops(items) {
  const container = document.getElementById('workshopsGrid');
  if (!container) return;

  let html = '';
  items.forEach(ws => {
    html += `
      <div class="workshop-card">
        <div class="workshop-thumb">
          <img src="${escapeHtml(ws.image_url)}" alt="${escapeHtml(ws.title)}">
          <span class="workshop-badge">${escapeHtml(ws.badge || 'WORKSHOP')}</span>
        </div>
        <div class="workshop-info">
          <h4 class="workshop-title">${escapeHtml(ws.title)}</h4>
          <p class="workshop-org">${escapeHtml(ws.organization)}</p>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
