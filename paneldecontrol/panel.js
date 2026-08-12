// =========================================================================
// PANEL DE CONTROL - EDITORIAL PUNTO Y COMA
// Archivo: panel.js (Completo y corregido - muestra TODOS los autores)
// =========================================================================

// Usar las instancias globales definidas en firebase-config.js
const auth = window.auth;
const db = window.db;
const storage = window.storage;

let usuarioActual = null;
let noticiaEnEdicion = null;
let imagenesSeleccionadas = [];
let imagenesExistentes = [];

console.log('panel.js cargado. db:', db ? 'OK' : 'NO');

// =========================================================================
// 1. AUTENTICACIÓN Y ROLES
// =========================================================================

// Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!auth || !db) {
      mostrarErrorAcceso('Firebase no está configurado. Revisa firebase-config.js');
      return;
    }

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const loginBtn = document.getElementById('loginBtn');
    const errorDiv = document.getElementById('loginError');

    loginBtn.textContent = 'Iniciando sesión...';
    loginBtn.disabled = true;
    errorDiv.classList.add('hidden');

    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
      console.error('Error en login:', error);
      errorDiv.classList.remove('hidden');
      errorDiv.querySelector('div').textContent = obtenerMensajeError(error.code);
    } finally {
      loginBtn.textContent = 'Iniciar Sesión';
      loginBtn.disabled = false;
    }
  });
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    if (confirm('¿Seguro que deseas cerrar sesión?')) {
      try {
        await auth.signOut();
        mostrarLogin();
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión. Intenta nuevamente.');
      }
    }
  });
}

// Obtener o Crear Perfil de Usuario con Rol
async function obtenerPerfilUsuario(user) {
  if (!db || !user) return null;

  const usuarioRef = db.collection('usuarios').doc(user.uid);
  const usuarioDoc = await usuarioRef.get();
  const correo = (user.email || '').toLowerCase();

  const esAdminPorCorreo = Array.isArray(window.FIREBASE_ADMIN_EMAILS) &&
    window.FIREBASE_ADMIN_EMAILS.some(email => (email || '').toLowerCase() === correo);

  const datos = usuarioDoc.exists ? usuarioDoc.data() : {};

  if (!usuarioDoc.exists) {
    const nombreBase = user.displayName || correo.split('@')[0] || 'Usuario';
    await usuarioRef.set({
      nombre: nombreBase,
      email: correo,
      telefono: '',
      rol: esAdminPorCorreo ? 'admin' : 'editor',
      creado_en: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return { nombre: nombreBase, email: correo, telefono: '', rol: esAdminPorCorreo ? 'admin' : 'editor' };
  }

  if (esAdminPorCorreo && datos.rol !== 'admin') {
    await usuarioRef.set({ rol: 'admin' }, { merge: true });
    datos.rol = 'admin';
  }

  return {
    ...datos,
    nombre: datos.nombre || user.displayName || correo.split('@')[0] || 'Usuario',
    email: datos.email || correo,
    rol: datos.rol || 'editor'
  };
}

async function cargarDatosUsuario(user) {
  try {
    const userData = await obtenerPerfilUsuario(user);
    if (!userData) return;

    const elName = document.getElementById('userName');
    const elEmail = document.getElementById('userEmail');
    if (elName) elName.textContent = userData.nombre || user.email;
    if (elEmail) elEmail.textContent = userData.email || user.email;

    const initials = (userData.nombre || user.email || 'U')
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const elInitials = document.getElementById('userInitials');
    if (elInitials) elInitials.textContent = initials;

    const inputNombre = document.getElementById('inputNombre');
    const inputTelefono = document.getElementById('inputTelefono');
    if (inputNombre) inputNombre.value = userData.nombre || '';
    if (inputTelefono) inputTelefono.value = userData.telefono || '';
  } catch (error) {
    console.error('Error al cargar datos del usuario:', error);
  }
}

async function esAdministrador(user) {
  const userData = await obtenerPerfilUsuario(user);
  return Boolean(userData && userData.rol === 'admin');
}

function mostrarErrorAcceso(mensaje) {
  const errorDiv = document.getElementById('loginError');
  if (errorDiv) {
    errorDiv.classList.remove('hidden');
    const inner = errorDiv.querySelector('div');
    if (inner) inner.textContent = mensaje;
  }
}

function mostrarLogin() {
  const loginScreen = document.getElementById('loginScreen');
  const panelScreen = document.getElementById('panelScreen');
  if (loginScreen) loginScreen.classList.remove('hidden');
  if (panelScreen) panelScreen.classList.add('hidden');
}

function mostrarPanel() {
  const loginScreen = document.getElementById('loginScreen');
  const panelScreen = document.getElementById('panelScreen');
  if (loginScreen) loginScreen.classList.add('hidden');
  if (panelScreen) panelScreen.classList.remove('hidden');
}

// Listener de Estado de Sesión
if (auth) {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        if (!await esAdministrador(user)) {
          await auth.signOut();
          mostrarErrorAcceso('Esta cuenta no tiene permisos de administración.');
          return;
        }
        usuarioActual = user;
        await cargarDatosUsuario(user);
        mostrarPanel();
        cargarNoticiasUsuario();
        cargarResumen();
        cargarAutores();    // 🔥 Carga TODOS los autores (sin filtro)
        cargarLibros();
      } catch (error) {
        console.error('Error al validar permisos:', error);
        await auth.signOut();
        mostrarErrorAcceso('No fue posible validar los permisos de esta cuenta.');
      }
    } else {
      mostrarLogin();
    }
  });
} else {
  mostrarErrorAcceso('No se pudo inicializar la autenticación de Firebase.');
  mostrarLogin();
}

// =========================================================================
// 2. NAVEGACIÓN Y DASHBOARD
// =========================================================================

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();

    document.querySelectorAll('.nav-link').forEach(l => {
      l.classList.remove('active', 'bg-primary', 'text-white');
      l.classList.add('text-secondary');
    });
    link.classList.add('active', 'bg-primary', 'text-white');
    link.classList.remove('text-secondary');

    const section = link.dataset.section;
    document.querySelectorAll('.section-content').forEach(s => s.classList.add('hidden'));

    const sectionTitle = document.getElementById('sectionTitle');
    const btnNuevaNoticia = document.getElementById('btnNuevaNoticia');

    if (section === 'dashboard') {
      const target = document.getElementById('seccionDashboard');
      if (target) target.classList.remove('hidden');
      if (sectionTitle) sectionTitle.textContent = 'Resumen';
      if (btnNuevaNoticia) btnNuevaNoticia.classList.add('hidden');
    } else if (section === 'noticias') {
      const target = document.getElementById('seccionNoticias');
      if (target) target.classList.remove('hidden');
      if (sectionTitle) sectionTitle.textContent = 'Noticias';
      if (btnNuevaNoticia) btnNuevaNoticia.classList.remove('hidden');
    } else if (section === 'configuracion') {
      const target = document.getElementById('seccionConfiguracion');
      if (target) target.classList.remove('hidden');
      if (sectionTitle) sectionTitle.textContent = 'Configuración';
      if (btnNuevaNoticia) btnNuevaNoticia.classList.add('hidden');
    } else {
      const sectionId = `seccion${section.charAt(0).toUpperCase() + section.slice(1)}`;
      const target = document.getElementById(sectionId);
      if (target) target.classList.remove('hidden');
      if (sectionTitle) sectionTitle.textContent = section.charAt(0).toUpperCase() + section.slice(1);
      if (btnNuevaNoticia) btnNuevaNoticia.classList.add('hidden');
    }
  });
});

document.querySelectorAll('.quick-link').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    const destination = document.querySelector(`[data-section="${link.dataset.go}"]`);
    if (destination) destination.click();
  });
});

async function cargarResumen() {
  if (!db || !usuarioActual) return;
  try {
    const snapshot = await db.collection('noticias').where('usuario_id', '==', usuarioActual.uid).get();
    const total = snapshot.docs.filter(doc => doc.data().estado !== 'borrador').length;
    const stat = document.getElementById('statNoticias');
    if (stat) stat.textContent = total;
  } catch (error) {
    console.warn('No se pudo cargar el resumen:', error);
  }
}

function prepararFormulario(id, abierto) {
  const form = document.getElementById(id);
  if (!form) return;
  form.classList.toggle('hidden', !abierto);
  if (!abierto) form.reset();
}

const btnNuevoAutor = document.getElementById('btnNuevoAutor');
if (btnNuevoAutor) btnNuevoAutor.addEventListener('click', () => prepararFormulario('formAutor', true));

const btnNuevoLibro = document.getElementById('btnNuevoLibro');
if (btnNuevoLibro) btnNuevoLibro.addEventListener('click', () => prepararFormulario('formLibro', true));

document.querySelectorAll('.cancel-form').forEach(button => {
  button.addEventListener('click', () => {
    const form = button.closest('form');
    if (form) prepararFormulario(form.id, false);
  });
});

// =========================================================================
// 3. GESTIÓN DE AUTORES (Muestra TODOS, sin filtrar por usuario)
// =========================================================================

async function cargarAutores() {
  const container = document.getElementById('listaAutores');
  if (!container || !db) return;

  container.innerHTML = '<div class="col-span-full text-center py-8"><i class="fas fa-spinner fa-spin text-primary text-2xl"></i><p class="text-xs text-darktext/60 mt-2">Cargando autores...</p></div>';

  try {
    // 🔥 IMPORTANTE: Traemos TODOS los autores (sin where)
    const snapshot = await db.collection('autores').get();

    if (snapshot.empty) {
      container.innerHTML = '<div class="col-span-full text-center py-8 text-darktext/50 text-sm">No hay autores registrados aún.</div>';
      return;
    }

    let html = '';
    snapshot.forEach(doc => {
      const autor = { id: doc.id, ...doc.data() };
      // Validar que el ID existe
      if (!autor.id) {
        console.warn('Autor sin ID encontrado:', autor);
        return;
      }
      html += crearTarjetaAutorAdmin(autor);
    });

    container.innerHTML = html;
    console.log('Autores cargados en panel:', snapshot.size);
  } catch (error) {
    console.error('Error al cargar autores:', error);
    container.innerHTML = '<div class="col-span-full text-center py-8 text-red-500 text-sm">Error al cargar la lista de autores.</div>';
  }
}

function crearTarjetaAutorAdmin(autor) {
  // Validar que el autor tenga ID
  if (!autor.id) {
    console.error('Autor sin ID, no se puede generar tarjeta:', autor);
    return '<div class="text-red-500">Error: autor sin ID</div>';
  }

  // Corregir ruta de foto: si es local, usar imagen por defecto
  let foto = autor.foto || '';
  if (!foto.startsWith('http') && !foto.startsWith('https') && foto) {
    console.warn('Ruta de foto local detectada, usando imagen por defecto:', foto);
    foto = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop';
  }
  if (!foto) {
    foto = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop';
  }

  return `
    <div class="panel-card p-5 rounded-xl border border-lightbg flex flex-col justify-between bg-white shadow-sm">
      <div class="flex items-start gap-4">
        <img src="${foto}" alt="${autor.nombre || 'Autor'}" class="w-16 h-16 rounded-full object-cover border border-primary/20 shrink-0"
             onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop';">
        <div class="flex-1 min-w-0">
          <h3 class="font-bold text-secondary text-base truncate">${autor.nombre || 'Sin nombre'}</h3>
          <p class="text-xs text-primary font-medium italic mb-1">${autor.genero || 'Autor'}</p>
          <p class="text-xs text-darktext/70 line-clamp-2">${autor.biografia || autor.bio || 'Sin biografía'}</p>
        </div>
      </div>
      <div class="flex items-center justify-between border-t border-lightbg pt-3 mt-4">
        <span class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${autor.publicado !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'} font-bold">
          ${autor.publicado !== false ? 'Visible' : 'Oculto'}
        </span>
        <div class="flex gap-2">
          <button onclick="editarAutor('${autor.id}')" class="px-3 py-1 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded text-xs transition" title="Editar">
            Editar
          </button>
          <button onclick="eliminarAutor('${autor.id}')" class="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded text-xs transition" title="Eliminar">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

// =========================================================================
// 4. FUNCIONES DE EDICIÓN Y ELIMINACIÓN DE AUTORES (CON VALIDACIÓN)
// =========================================================================

async function editarAutor(id) {
  console.log('editarAutor llamado con id:', id);
  if (!id || id.trim() === '') {
    alert('No se puede editar: el ID del autor está vacío o no es válido.');
    console.error('editarAutor: ID vacío');
    return;
  }

  if (!db) {
    alert('La base de datos no está disponible.');
    return;
  }

  try {
    const doc = await db.collection('autores').doc(id).get();
    if (!doc.exists) {
      alert('Autor no encontrado.');
      return;
    }

    const autor = doc.data();
    const form = document.getElementById('formAutor');
    if (!form) {
      console.error('Formulario #formAutor no encontrado');
      return;
    }

    form.classList.remove('hidden');

    if (form.querySelector('input[name="id"]')) form.querySelector('input[name="id"]').value = id;
    if (form.querySelector('[name="nombre"]')) form.querySelector('[name="nombre"]').value = autor.nombre || '';
    if (form.querySelector('[name="genero"]')) form.querySelector('[name="genero"]').value = autor.genero || '';
    if (form.querySelector('[name="biografia"]')) form.querySelector('[name="biografia"]').value = autor.biografia || autor.bio || '';
    if (form.querySelector('[name="instagram"]')) form.querySelector('[name="instagram"]').value = autor.redes?.instagram || autor.instagram || '';
    if (form.querySelector('[name="facebook"]')) form.querySelector('[name="facebook"]').value = autor.redes?.facebook || autor.facebook || '';
    if (form.querySelector('[name="twitter"]')) form.querySelector('[name="twitter"]').value = autor.redes?.twitter || autor.twitter || '';
    if (form.querySelector('[name="enlace_venta"]')) form.querySelector('[name="enlace_venta"]').value = autor.enlace_venta || autor.redes?.web || '';
    if (form.querySelector('[name="web"]')) form.querySelector('[name="web"]').value = autor.web || autor.redes?.web || '';

    const pubCheck = form.querySelector('#autor-publicado') || form.querySelector('[name="publicado"]');
    if (pubCheck) pubCheck.checked = autor.publicado !== false;

    form.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (error) {
    console.error('Error al cargar autor para edición:', error);
    alert('Error al cargar los datos del autor.');
  }
}

async function eliminarAutor(id) {
  console.log('eliminarAutor llamado con id:', id);
  if (!id || id.trim() === '') {
    alert('No se puede eliminar: el ID del autor está vacío o no es válido.');
    console.error('eliminarAutor: ID vacío');
    return;
  }

  if (!confirm('¿Estás seguro de que deseas eliminar este autor? Esta acción no se puede deshacer.')) return;
  if (!db) {
    alert('La base de datos no está disponible.');
    return;
  }

  try {
    await db.collection('autores').doc(id).delete();
    alert('Autor eliminado correctamente.');
    cargarAutores();
  } catch (error) {
    console.error('Error al eliminar autor:', error);
    alert('No se pudo eliminar el autor. Revisa la consola para más detalles.');
  }
}

// =========================================================================
// 5. GUARDAR AUTOR (formulario)
// =========================================================================

const formAutorElement = document.getElementById('formAutor');
if (formAutorElement) {
  formAutorElement.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btnGuardar = formAutorElement.querySelector('button[type="submit"]');
    const textoOriginal = btnGuardar ? btnGuardar.textContent : 'Guardar autor';
    if (btnGuardar) {
      btnGuardar.disabled = true;
      btnGuardar.textContent = 'Guardando...';
    }

    try {
      const inputId = formAutorElement.querySelector('input[name="id"]');
      const docId = inputId ? inputId.value.trim() : '';

      const nombre = (formAutorElement.querySelector('[name="nombre"]')?.value || '').trim();
      const genero = (formAutorElement.querySelector('[name="genero"]')?.value || '').trim();
      const biografia = (formAutorElement.querySelector('[name="biografia"]')?.value || '').trim();
      const instagram = (formAutorElement.querySelector('[name="instagram"]')?.value || '').trim();
      const facebook = (formAutorElement.querySelector('[name="facebook"]')?.value || '').trim();
      const twitter = (formAutorElement.querySelector('[name="twitter"]')?.value || '').trim();
      const enlace_venta = (formAutorElement.querySelector('[name="enlace_venta"]')?.value || '').trim();
      const web = (formAutorElement.querySelector('[name="web"]')?.value || '').trim();

      const publicadoCheck = formAutorElement.querySelector('#autor-publicado') || formAutorElement.querySelector('[name="publicado"]');
      const estaPublicado = publicadoCheck ? publicadoCheck.checked : true;

      // Subida de foto a Storage
      let fotoUrl = '';
      const fotoInput = document.getElementById('autor-foto');

      if (fotoInput && fotoInput.files && fotoInput.files.length > 0) {
        if (btnGuardar) btnGuardar.textContent = 'Subiendo foto...';
        const archivo = fotoInput.files[0];
        const storageRef = storage.ref(`autores/${Date.now()}_${archivo.name}`);
        const snapshot = await storageRef.put(archivo);
        fotoUrl = await snapshot.ref.getDownloadURL();
      }

      const datosAutor = {
        nombre,
        genero,
        biografia,
        bio: biografia,
        publicado: estaPublicado,
        usuario_id: usuarioActual ? usuarioActual.uid : '',
        redes: {
          instagram,
          facebook,
          twitter,
          web: enlace_venta || web
        },
        enlace_venta: enlace_venta || web,
        actualizado_en: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (fotoUrl) datosAutor.foto = fotoUrl;

      if (docId) {
        await db.collection('autores').doc(docId).update(datosAutor);
        alert('Autor actualizado correctamente.');
      } else {
        if (!fotoUrl) {
          datosAutor.foto = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop';
        }
        datosAutor.creado_en = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('autores').add(datosAutor);
        alert('Autor creado correctamente.');
      }

      formAutorElement.reset();
      if (inputId) inputId.value = '';
      formAutorElement.classList.add('hidden');
      cargarAutores();

    } catch (error) {
      console.error('Error al guardar autor:', error);
      alert('Hubo un error al guardar el autor. Inténtalo de nuevo.');
    } finally {
      if (btnGuardar) {
        btnGuardar.disabled = false;
        btnGuardar.textContent = textoOriginal;
      }
    }
  });
}

// =========================================================================
// 6. GESTIÓN DE LIBROS
// =========================================================================

async function cargarLibros() {
  const container = document.getElementById('listaLibros');
  if (!usuarioActual || !container || !db) return;
  try {
    const snapshot = await db.collection('libros').where('usuario_id', '==', usuarioActual.uid).get();
    if (snapshot.empty) {
      container.innerHTML = '<p class="text-darktext md:col-span-2 xl:col-span-3 py-5">Aún no has agregado libros al catálogo.</p>';
      return;
    }
    container.innerHTML = snapshot.docs.map(doc => crearTarjetaLibro({ id: doc.id, ...doc.data() })).join('');
  } catch (error) {
    console.error('Error al cargar libros:', error);
    container.innerHTML = '<p class="text-red-400">No se pudieron cargar los libros.</p>';
  }
}

function crearTarjetaLibro(libro) {
  return `
    <article class="panel-card rounded overflow-hidden flex bg-white border border-lightbg">
      <div class="w-24 shrink-0 bg-secondary flex items-center justify-center text-primary">
        ${libro.portada ? `<img src="${libro.portada}" alt="${libro.titulo}" class="w-full h-full object-cover">` : '<i class="fa-solid fa-book text-2xl"></i>'}
      </div>
      <div class="p-4 min-w-0 flex-1 flex flex-col justify-between">
        <div>
          <h3 class="font-serif text-lg text-secondary truncate">${libro.titulo}</h3>
          <p class="text-primary text-xs mt-1">${libro.autor || 'Autor por definir'}</p>
          <p class="text-darktext text-xs mt-2 truncate">${libro.precio || 'Sin precio'}</p>
        </div>
        <div class="mt-4 flex gap-3">
          <button onclick="editarLibro('${libro.id}')" class="text-primary text-xs uppercase tracking-widest font-bold">Editar</button>
          <button onclick="eliminarLibro('${libro.id}')" class="text-red-500 text-xs uppercase tracking-widest font-bold">Eliminar</button>
        </div>
      </div>
    </article>
  `;
}

const formLibroElement = document.getElementById('formLibro');
if (formLibroElement) {
  formLibroElement.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.target;
    const id = form.id.value;
    const data = Object.fromEntries(new FormData(form).entries());
    data.publicado = form.publicado ? form.publicado.checked : true;
    data.usuario_id = usuarioActual.uid;
    data.actualizado_en = firebase.firestore.FieldValue.serverTimestamp();

    try {
      if (id) await db.collection('libros').doc(id).update(data);
      else {
        data.creado_en = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('libros').add(data);
      }
      prepararFormulario('formLibro', false);
      cargarLibros();
      alert('Libro guardado correctamente.');
    } catch (error) {
      console.error(error);
      alert('No se pudo guardar el libro.');
    }
  });
}

async function editarLibro(id) {
  const doc = await db.collection('libros').doc(id).get();
  if (!doc.exists) return;
  const form = document.getElementById('formLibro');
  if (!form) return;
  Object.entries({ id: doc.id, ...doc.data() }).forEach(([key, value]) => {
    if (form[key]) {
      form[key].type === 'checkbox' ? form[key].checked = Boolean(value) : form[key].value = value || '';
    }
  });
  prepararFormulario('formLibro', true);
}

async function eliminarLibro(id) {
  if (!confirm('¿Eliminar este libro del catálogo?')) return;
  await db.collection('libros').doc(id).delete();
  cargarLibros();
  alert('Libro eliminado.');
}

// =========================================================================
// 7. GESTIÓN DE NOTICIAS
// =========================================================================

async function cargarNoticiasUsuario() {
  const container = document.getElementById('listaNoticias');
  if (!container || !db || !usuarioActual) return;

  container.innerHTML = '<div class="col-span-full flex justify-center py-12"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>';

  try {
    const snapshot = await db.collection('noticias')
      .where('usuario_id', '==', usuarioActual.uid)
      .get();

    if (snapshot.empty) {
      container.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-darktext/40 mb-4">No tienes noticias publicadas</p></div>';
      return;
    }

    let noticias = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    noticias.sort((a, b) => {
      const fechaA = a.fecha_creacion ? a.fecha_creacion.toMillis() : 0;
      const fechaB = b.fecha_creacion ? b.fecha_creacion.toMillis() : 0;
      return fechaB - fechaA;
    });

    const html = noticias.map(crearTarjetaNoticiaAdmin).join('');
    container.innerHTML = html;

  } catch (error) {
    console.error('Error al cargar noticias:', error);
    container.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-red-500 mb-4">Error al cargar las noticias</p></div>';
  }
}

function crearTarjetaNoticiaAdmin(noticia) {
  const imagenPrincipal = noticia.imagenes && noticia.imagenes.length > 0
    ? noticia.imagenes.find(img => img.orden === 0)?.url || noticia.imagenes[0].url
    : '';

  const estadoClases = {
    publicado: 'bg-green-100 text-green-700',
    borrador: 'bg-yellow-100 text-yellow-700'
  };

  return `
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition border border-lightbg flex flex-col justify-between">
      <div>
        ${imagenPrincipal ? `
          <div class="h-40 bg-lightbg">
            <img src="${imagenPrincipal}" alt="${noticia.titulo}" class="w-full h-full object-cover">
          </div>
        ` : `
          <div class="h-40 bg-lightbg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6M8 6h8a2 2 0 012 2v12l-4-2-4 2-4-2-4 2V8a2 2 0 012-2z" />
            </svg>
          </div>
        `}

        <div class="p-5">
          <div class="flex items-start justify-between mb-3 gap-2">
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-secondary truncate mb-1">${noticia.titulo}</h3>
              <p class="text-sm text-darktext/40 truncate">${noticia.categoria || 'Sin categoría'}</p>
            </div>
            <span class="px-2 py-1 rounded-full text-xs font-medium ${estadoClases[noticia.estado] || 'bg-gray-100 text-gray-700'}">
              ${noticia.estado || 'borrador'}
            </span>
          </div>

          <p class="text-xs text-darktext/50 mb-4 line-clamp-2">${noticia.resumen || ''}</p>
        </div>
      </div>

      <div class="p-5 pt-0 flex gap-2">
        <button onclick="editarNoticia('${noticia.id}')" class="flex-1 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition">
          Editar
        </button>
        <button onclick="eliminarNoticia('${noticia.id}')" class="px-4 py-2 border border-red-300 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition">
          Eliminar
        </button>
      </div>
    </div>
  `;
}

// Control Modal Noticias
const btnNuevaNoticia = document.getElementById('btnNuevaNoticia');
if (btnNuevaNoticia) btnNuevaNoticia.addEventListener('click', abrirModalNueva);

function abrirModalNueva() {
  noticiaEnEdicion = null;
  imagenesSeleccionadas = [];
  imagenesExistentes = [];
  const modalTitulo = document.getElementById('modalTitulo');
  const formNoticia = document.getElementById('formNoticia');
  const noticiaId = document.getElementById('noticiaId');
  const previewContainer = document.getElementById('previewImagenes');

  if (modalTitulo) modalTitulo.textContent = 'Nueva Noticia';
  if (formNoticia) formNoticia.reset();
  if (noticiaId) noticiaId.value = '';
  if (previewContainer) previewContainer.innerHTML = '';

  const modalNoticia = document.getElementById('modalNoticia');
  if (modalNoticia) modalNoticia.classList.add('active');
}

const btnCerrarModal = document.getElementById('btnCerrarModal');
if (btnCerrarModal) btnCerrarModal.addEventListener('click', cerrarModal);

const btnCancelar = document.getElementById('btnCancelar');
if (btnCancelar) btnCancelar.addEventListener('click', cerrarModal);

function cerrarModal() {
  const modalNoticia = document.getElementById('modalNoticia');
  if (modalNoticia) modalNoticia.classList.remove('active');
  noticiaEnEdicion = null;
  imagenesSeleccionadas = [];
  imagenesExistentes = [];
}

async function editarNoticia(id) {
  try {
    const doc = await db.collection('noticias').doc(id).get();
    if (!doc.exists) {
      alert('Noticia no encontrada');
      return;
    }
    noticiaEnEdicion = { id: doc.id, ...doc.data() };
    imagenesExistentes = noticiaEnEdicion.imagenes || [];
    imagenesSeleccionadas = [];

    const form = document.getElementById('formNoticia');
    if (form) {
      if (form.titulo) form.titulo.value = noticiaEnEdicion.titulo || '';
      if (form.resumen) form.resumen.value = noticiaEnEdicion.resumen || '';
      if (form.contenido) form.contenido.value = noticiaEnEdicion.contenido || '';
      if (form.categoria) form.categoria.value = noticiaEnEdicion.categoria || 'Novedad';
      if (form.estado) form.estado.value = noticiaEnEdicion.estado || 'publicado';
      if (form.autor) form.autor.value = noticiaEnEdicion.autor || '';
      if (form.fecha_publicacion) form.fecha_publicacion.value = noticiaEnEdicion.fecha_publicacion || '';
      if (form.enlace_externo) form.enlace_externo.value = noticiaEnEdicion.enlace_externo || '';
      if (form.destacado) form.destacado.checked = noticiaEnEdicion.destacado || false;
    }

    const inputNoticiaId = document.getElementById('noticiaId');
    if (inputNoticiaId) inputNoticiaId.value = doc.id;

    const modalTitulo = document.getElementById('modalTitulo');
    if (modalTitulo) modalTitulo.textContent = 'Editar Noticia';

    mostrarPreviewImagenes();
    const modalNoticia = document.getElementById('modalNoticia');
    if (modalNoticia) modalNoticia.classList.add('active');

  } catch (error) {
    console.error('Error al cargar noticia:', error);
    alert('Error al cargar la noticia');
  }
}

async function eliminarNoticia(id) {
  if (!confirm('¿Estás seguro de eliminar esta noticia? También se eliminarán sus imágenes.')) return;
  try {
    const doc = await db.collection('noticias').doc(id).get();
    const noticia = doc.data();

    if (noticia && noticia.imagenes && noticia.imagenes.length > 0) {
      const deletePromises = noticia.imagenes.map(img => {
        try {
          const path = img.url.split('/o/')[1].split('?')[0];
          const decodedPath = decodeURIComponent(path);
          return storage.ref(decodedPath).delete().catch(err => console.warn('Error al borrar imagen:', err));
        } catch (e) {
          return Promise.resolve();
        }
      });
      await Promise.all(deletePromises);
    }

    await db.collection('noticias').doc(id).delete();
    alert('Noticia eliminada correctamente');
    cargarNoticiasUsuario();

  } catch (error) {
    console.error('Error al eliminar noticia:', error);
    alert('Error al eliminar la noticia.');
  }
}

// Control de Imágenes
const inputImagenes = document.getElementById('inputImagenes');
if (inputImagenes) {
  inputImagenes.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`La imagen ${file.name} supera los 5MB`);
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert(`El archivo ${file.name} no es una imagen válida`);
        return;
      }
      imagenesSeleccionadas.push(file);
    });
    mostrarPreviewImagenes();
    e.target.value = '';
  });
}

function mostrarPreviewImagenes() {
  const container = document.getElementById('previewImagenes');
  if (!container) return;
  container.innerHTML = '';

  imagenesExistentes.forEach((img, index) => {
    const div = document.createElement('div');
    div.className = 'image-preview-item relative inline-block mr-2 mb-2';
    div.innerHTML = `
      <img src="${img.url}" class="w-20 h-20 object-cover rounded-lg">
      <button type="button" class="remove-btn absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs" onclick="eliminarImagenExistente(${index})">&times;</button>
      <div class="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] px-1 rounded">Actual</div>
    `;
    container.appendChild(div);
  });

  imagenesSeleccionadas.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const div = document.createElement('div');
      div.className = 'image-preview-item relative inline-block mr-2 mb-2';
      div.innerHTML = `
        <img src="${e.target.result}" class="w-20 h-20 object-cover rounded-lg">
        <button type="button" class="remove-btn absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs" onclick="eliminarImagenNueva(${index})">&times;</button>
        <div class="absolute bottom-1 left-1 bg-primary text-white text-[9px] px-1 rounded">Nueva</div>
      `;
      container.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
}

function eliminarImagenExistente(index) {
  imagenesExistentes.splice(index, 1);
  mostrarPreviewImagenes();
}

function eliminarImagenNueva(index) {
  imagenesSeleccionadas.splice(index, 1);
  mostrarPreviewImagenes();
}

async function subirImagenes(noticiaId) {
  const urlsImagenes = [...imagenesExistentes];

  for (let i = 0; i < imagenesSeleccionadas.length; i++) {
    const file = imagenesSeleccionadas[i];
    const timestamp = Date.now();
    const fileName = `${noticiaId}_${timestamp}_${i}.jpg`;
    const storageRef = storage.ref(`noticias/${usuarioActual.uid}/${fileName}`);

    try {
      const snapshot = await storageRef.put(file);
      const url = await snapshot.ref.getDownloadURL();

      urlsImagenes.push({
        url: url,
        nombre: fileName,
        orden: urlsImagenes.length
      });
    } catch (error) {
      console.error('Error al subir imagen:', error);
      alert(`Error al subir la imagen ${file.name}. Se omitirá.`);
    }
  }
  return urlsImagenes;
}

// Formulario Noticia Submit
const formNoticia = document.getElementById('formNoticia');
if (formNoticia) {
  formNoticia.addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const btnGuardar = document.getElementById('btnGuardar');
    const noticiaIdInput = document.getElementById('noticiaId');
    const noticiaId = noticiaIdInput ? noticiaIdInput.value : '';

    if (btnGuardar) {
      btnGuardar.textContent = 'Guardando...';
      btnGuardar.disabled = true;
    }

    try {
      const datos = {
        titulo: (form.titulo?.value || '').trim(),
        resumen: (form.resumen?.value || '').trim(),
        contenido: (form.contenido?.value || '').trim(),
        categoria: form.categoria?.value || 'Novedad',
        estado: form.estado?.value || 'publicado',
        autor: (form.autor?.value || '').trim(),
        fecha_publicacion: form.fecha_publicacion?.value || '',
        enlace_externo: (form.enlace_externo?.value || '').trim(),
        destacado: form.destacado ? form.destacado.checked : false,
        usuario_id: usuarioActual.uid,
        fecha_actualizacion: firebase.firestore.FieldValue.serverTimestamp()
      };

      let docId;

      if (noticiaId) {
        docId = noticiaId;
        const imagenes = await subirImagenes(docId);
        datos.imagenes = imagenes;
        await db.collection('noticias').doc(docId).update(datos);
        alert('Noticia actualizada correctamente');
      } else {
        datos.fecha_creacion = firebase.firestore.FieldValue.serverTimestamp();
        const docRef = await db.collection('noticias').add(datos);
        docId = docRef.id;

        const imagenes = await subirImagenes(docId);
        await db.collection('noticias').doc(docId).update({ imagenes });

        alert('Noticia publicada correctamente');
      }

      cerrarModal();
      cargarNoticiasUsuario();

    } catch (error) {
      console.error('Error al guardar noticia:', error);
      alert('Error al guardar la noticia. Revisa la consola para más detalles.');
    } finally {
      if (btnGuardar) {
        btnGuardar.textContent = 'Guardar Noticia';
        btnGuardar.disabled = false;
      }
    }
  });
}

// =========================================================================
// 8. CONFIGURACIÓN DE PERFIL Y FILTROS
// =========================================================================

const btnActualizarPerfil = document.getElementById('btnActualizarPerfil');
if (btnActualizarPerfil) {
  btnActualizarPerfil.addEventListener('click', async () => {
    const nombre = document.getElementById('inputNombre').value.trim();
    const telefono = document.getElementById('inputTelefono').value.trim();

    if (!nombre) {
      alert('El nombre es obligatorio');
      return;
    }

    try {
      if (auth && auth.currentUser) {
        await auth.currentUser.updateProfile({ displayName: nombre });
      }

      await db.collection('usuarios').doc(usuarioActual.uid).set({
        nombre: nombre,
        telefono: telefono,
        email: usuarioActual.email
      }, { merge: true });

      alert('Perfil actualizado correctamente');
      await cargarDatosUsuario(usuarioActual);

    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      alert('Error al actualizar el perfil');
    }
  });
}

const btnAplicarFiltros = document.getElementById('btnAplicarFiltros');
if (btnAplicarFiltros) {
  btnAplicarFiltros.addEventListener('click', async () => {
    const titulo = document.getElementById('filtroTitulo').value.toLowerCase();
    const categoria = document.getElementById('filtroCategoria').value;
    const estado = document.getElementById('filtroEstado').value;

    const container = document.getElementById('listaNoticias');
    if (!container) return;
    container.innerHTML = '<div class="col-span-full flex justify-center py-12"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>';

    try {
      let query = db.collection('noticias').where('usuario_id', '==', usuarioActual.uid);

      if (categoria) query = query.where('categoria', '==', categoria);
      if (estado) query = query.where('estado', '==', estado);

      const snapshot = await query.get();
      let noticias = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (titulo) {
        noticias = noticias.filter(n => (n.titulo || '').toLowerCase().includes(titulo));
      }

      if (noticias.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-darktext/40">No se encontraron noticias</p></div>';
        return;
      }

      const html = noticias.map(crearTarjetaNoticiaAdmin).join('');
      container.innerHTML = html;

    } catch (error) {
      console.error('Error al filtrar:', error);
      container.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-red-500">Error al aplicar filtros</p></div>';
    }
  });
}

// =========================================================================
// 9. UTILIDADES Y EXPOSICIÓN GLOBAL
// =========================================================================

function obtenerMensajeError(code) {
  const errores = {
    'auth/user-not-found': 'No existe una cuenta con ese correo',
    'auth/wrong-password': 'Contraseña incorrecta',
    'auth/invalid-email': 'Correo inválido',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
    'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde'
  };
  return errores[code] || 'Error al iniciar sesión.';
}

// EXPONER FUNCIONES GLOBALMENTE (para usar con onclick en HTML)
window.editarAutor = editarAutor;
window.eliminarAutor = eliminarAutor;
window.editarLibro = editarLibro;
window.eliminarLibro = eliminarLibro;
window.editarNoticia = editarNoticia;
window.eliminarNoticia = eliminarNoticia;
window.abrirModalNueva = abrirModalNueva;
window.eliminarImagenExistente = eliminarImagenExistente;
window.eliminarImagenNueva = eliminarImagenNueva;
window.cargarAutores = cargarAutores;
window.cargarLibros = cargarLibros;
window.cargarNoticiasUsuario = cargarNoticiasUsuario;

console.log('Funciones globales expuestas correctamente.');