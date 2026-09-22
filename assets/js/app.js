/**
 * LÓGICA PRINCIPAL DEL SITIO WEB - JEAN CARLOS ANCHAPURI
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initCounters();
  initServiceButtons();
  initLightbox();
  initContactForm();
});

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
