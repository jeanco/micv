/**
 * Configuración y cliente centralizado de Supabase para micv
 * Proyecto: evencard (mfsdvlkphptgtssahpbr)
 */

const SUPABASE_URL = 'https://mfsdvlkphptgtssahpbr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mc2R2bGtwaHB0Z3Rzc2FocGJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMTk2MzYsImV4cCI6MjEwNTU5NTYzNn0.tANm5QuIhXK5xGLwQAU9PiuBKWYUlbsvseF4K0Wys48';

// Inicializar cliente
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

/**
 * Registra una nueva solicitud de asesoría en Supabase
 * @param {Object} data Datos del formulario
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
async function createConsultingRequest(data) {
  try {
    if (!supabaseClient) {
      throw new Error('El cliente de Supabase no está inicializado.');
    }

    const payload = {
      full_name: data.fullName.trim(),
      email: data.email.trim(),
      phone: data.phone ? data.phone.trim() : null,
      company: data.company ? data.company.trim() : null,
      service_type: data.serviceType,
      budget_range: data.budgetRange || 'No especificado',
      message: data.message ? data.message.trim() : '',
      status: 'pendiente',
      admin_notes: ''
    };

    const { data: result, error } = await supabaseClient
      .from('consulting_requests')
      .insert([payload])
      .select();

    if (error) {
      console.error('Error insertando en Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: result[0] };
  } catch (err) {
    console.error('Excepción en createConsultingRequest:', err);
    return { success: false, error: err.message || 'Error desconocido al registrar la solicitud.' };
  }
}

/**
 * Autenticación de administrador contra la tabla admin_users
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise<{success: boolean, user?: any, error?: string}>}
 */
async function loginAdminUser(username, password) {
  try {
    if (!supabaseClient) {
      throw new Error('El cliente de Supabase no está inicializado.');
    }

    const { data, error } = await supabaseClient
      .from('admin_users')
      .select('id, username, full_name, role')
      .eq('username', username.trim())
      .eq('password', password.trim())
      .maybeSingle();

    if (error) {
      return { success: false, error: 'Error de conexión: ' + error.message };
    }

    if (!data) {
      return { success: false, error: 'Credenciales inválidas. Verifica tu usuario y contraseña.' };
    }

    return { success: true, user: data };
  } catch (err) {
    return { success: false, error: err.message || 'Error en el inicio de sesión.' };
  }
}

/**
 * Obtener todas las solicitudes registradas ordenadas por fecha reciente
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
async function fetchAllRequests() {
  try {
    if (!supabaseClient) throw new Error('Cliente Supabase no disponible');

    const { data, error } = await supabaseClient
      .from('consulting_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    console.error('Error al obtener solicitudes:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Actualizar estado y notas administrativas de una solicitud
 * @param {string} id 
 * @param {string} status 
 * @param {string} adminNotes 
 */
async function updateRequest(id, status, adminNotes) {
  try {
    if (!supabaseClient) throw new Error('Cliente Supabase no disponible');

    const updatePayload = {};
    if (status !== undefined) updatePayload.status = status;
    if (adminNotes !== undefined) updatePayload.admin_notes = adminNotes;

    const { data, error } = await supabaseClient
      .from('consulting_requests')
      .update(updatePayload)
      .eq('id', id)
      .select();

    if (error) throw error;
    return { success: true, data: data[0] };
  } catch (err) {
    console.error('Error al actualizar solicitud:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Eliminar una solicitud
 * @param {string} id 
 */
async function deleteRequestById(id) {
  try {
    if (!supabaseClient) throw new Error('Cliente Supabase no disponible');

    const { error } = await supabaseClient
      .from('consulting_requests')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Error al eliminar solicitud:', err);
    return { success: false, error: err.message };
  }
}

/* ==========================================================================
   CMS DINÁMICO: MÉTODOS DE LECTURA Y ESCRITURA
   ========================================================================== */

// 1. Configuración General y Hero
async function fetchSiteConfig() {
  try {
    if (!supabaseClient) throw new Error('Cliente Supabase no disponible');
    const { data, error } = await supabaseClient.from('site_config').select('*');
    if (error) throw error;
    const configMap = {};
    (data || []).forEach(item => { configMap[item.key] = item.value; });
    return { success: true, data: configMap };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function updateSiteConfig(key, value) {
  try {
    if (!supabaseClient) throw new Error('Cliente Supabase no disponible');
    const { error } = await supabaseClient
      .from('site_config')
      .upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// 2. Bondades / Diferenciadores
async function fetchBonds() {
  try {
    if (!supabaseClient) throw new Error('Cliente Supabase no disponible');
    const { data, error } = await supabaseClient.from('site_bonds').select('*').order('display_order', { ascending: true });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function saveBond(bond) {
  try {
    if (!supabaseClient) throw new Error('Cliente Supabase no disponible');
    const payload = {
      icon: bond.icon,
      title: bond.title,
      description: bond.description,
      bullets: bond.bullets || [],
      display_order: Number(bond.display_order) || 0
    };
    let res;
    if (bond.id) {
      res = await supabaseClient.from('site_bonds').update(payload).eq('id', bond.id).select();
    } else {
      res = await supabaseClient.from('site_bonds').insert([payload]).select();
    }
    if (res.error) throw res.error;
    return { success: true, data: res.data[0] };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function deleteBond(id) {
  try {
    if (!supabaseClient) throw new Error('Cliente Supabase no disponible');
    const { error } = await supabaseClient.from('site_bonds').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// 3. Experiencia Laboral
async function fetchExperience() {
  try {
    if (!supabaseClient) throw new Error('Cliente Supabase no disponible');
    const { data, error } = await supabaseClient.from('site_experience').select('*').order('display_order', { ascending: true });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function saveExperience(exp) {
  try {
    if (!supabaseClient) throw new Error('Cliente Supabase no disponible');
    const payload = {
      company: exp.company,
      role: exp.role,
      period: exp.period,
      description: exp.description,
      tasks: exp.tasks || [],
      display_order: Number(exp.display_order) || 0
    };
    let res;
    if (exp.id) {
      res = await supabaseClient.from('site_experience').update(payload).eq('id', exp.id).select();
    } else {
      res = await supabaseClient.from('site_experience').insert([payload]).select();
    }
    if (res.error) throw res.error;
    return { success: true, data: res.data[0] };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function deleteExperience(id) {
  try {
    if (!supabaseClient) throw new Error('Cliente Supabase no disponible');
    const { error } = await supabaseClient.from('site_experience').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// 4. Educación y Certificaciones
async function fetchEducation() {
  try {
    if (!supabaseClient) throw new Error('Cliente Supabase no disponible');
    const { data, error } = await supabaseClient.from('site_education').select('*').order('display_order', { ascending: true });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function saveEducation(edu) {
  try {
    if (!supabaseClient) throw new Error('Cliente Supabase no disponible');
    const payload = {
      title: edu.title,
      institution: edu.institution,
      badge_type: edu.badge_type || 'cert',
      badge_label: edu.badge_label,
      description: edu.description,
      meta_info: edu.meta_info,
      display_order: Number(edu.display_order) || 0
    };
    let res;
    if (edu.id) {
      res = await supabaseClient.from('site_education').update(payload).eq('id', edu.id).select();
    } else {
      res = await supabaseClient.from('site_education').insert([payload]).select();
    }
    if (res.error) throw res.error;
    return { success: true, data: res.data[0] };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function deleteEducation(id) {
  try {
    if (!supabaseClient) throw new Error('Cliente Supabase no disponible');
    const { error } = await supabaseClient.from('site_education').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// 5. Servicios de Asesoría
async function fetchServices() {
  try {
    if (!supabaseClient) throw new Error('Cliente Supabase no disponible');
    const { data, error } = await supabaseClient.from('site_services').select('*').order('display_order', { ascending: true });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function saveService(srv) {
  try {
    if (!supabaseClient) throw new Error('Cliente Supabase no disponible');
    const payload = {
      name: srv.name,
      icon: srv.icon,
      description: srv.description,
      features: srv.features || [],
      is_featured: Boolean(srv.is_featured),
      display_order: Number(srv.display_order) || 0
    };
    let res;
    if (srv.id) {
      res = await supabaseClient.from('site_services').update(payload).eq('id', srv.id).select();
    } else {
      res = await supabaseClient.from('site_services').insert([payload]).select();
    }
    if (res.error) throw res.error;
    return { success: true, data: res.data[0] };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function deleteService(id) {
  try {
    if (!supabaseClient) throw new Error('Cliente Supabase no disponible');
    const { error } = await supabaseClient.from('site_services').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// 6. Workshops y Talleres
async function fetchWorkshops() {
  try {
    if (!supabaseClient) throw new Error('Cliente Supabase no disponible');
    const { data, error } = await supabaseClient.from('site_workshops').select('*').order('display_order', { ascending: true });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function saveWorkshop(ws) {
  try {
    if (!supabaseClient) throw new Error('Cliente Supabase no disponible');
    const payload = {
      title: ws.title,
      organization: ws.organization,
      badge: ws.badge,
      image_url: ws.image_url,
      display_order: Number(ws.display_order) || 0
    };
    let res;
    if (ws.id) {
      res = await supabaseClient.from('site_workshops').update(payload).eq('id', ws.id).select();
    } else {
      res = await supabaseClient.from('site_workshops').insert([payload]).select();
    }
    if (res.error) throw res.error;
    return { success: true, data: res.data[0] };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function deleteWorkshop(id) {
  try {
    if (!supabaseClient) throw new Error('Cliente Supabase no disponible');
    const { error } = await supabaseClient.from('site_workshops').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Exponer en el objeto global
window.MicvSupabase = {
  client: supabaseClient,
  createConsultingRequest,
  loginAdminUser,
  fetchAllRequests,
  updateRequest,
  deleteRequestById,
  // CMS Methods
  fetchSiteConfig,
  updateSiteConfig,
  fetchBonds,
  saveBond,
  deleteBond,
  fetchExperience,
  saveExperience,
  deleteExperience,
  fetchEducation,
  saveEducation,
  deleteEducation,
  fetchServices,
  saveService,
  deleteService,
  fetchWorkshops,
  saveWorkshop,
  deleteWorkshop
};
