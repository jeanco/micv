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

// Exponer en el objeto global
window.MicvSupabase = {
  client: supabaseClient,
  createConsultingRequest,
  loginAdminUser,
  fetchAllRequests,
  updateRequest,
  deleteRequestById
};
