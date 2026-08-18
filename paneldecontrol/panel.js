// ================================================================
// PANEL DE CONTROL - EDITORIAL PUNTO Y COMA
// Archivo: panel.js
// Gestiona noticias, autores, libros, mensajes, autenticación y perfil.
// ================================================================

const auth = window.auth;
const db = window.db;
const storage = window.storage;

let usuarioActual = null;
let noticiaEnEdicion = null;
let imagenesSeleccionadas = [];
let imagenesExistentes = [];

console.log('panel.js cargado. db:', db ? 'OK' : 'NO');

// ================================================================
// 1. AUTENTICACIÓN Y ROLES
// ================================================================

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!auth || !db) { mostrarErrorAcceso('Firebase no configurado.'); return; }
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

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  if (confirm('¿Seguro que deseas cerrar sesión?')) {
    try { await auth.signOut(); mostrarLogin(); } catch (error) { console.error(error); alert('Error al cerrar sesión.'); }
  }
});

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
      nombre: nombreBase, email: correo, telefono: '',
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
    document.getElementById('userName').textContent = userData.nombre || user.email;
    document.getElementById('userEmail').textContent = userData.email || user.email;
    const initials = (userData.nombre || user.email || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('userInitials').textContent = initials;
    document.getElementById('inputNombre').value = userData.nombre || '';
    document.getElementById('inputTelefono').value = userData.telefono || '';
  } catch (error) { console.error('Error al cargar datos del usuario:', error); }
}

async function esAdministrador(user) {
  const userData = await obtenerPerfilUsuario(user);
  return Boolean(userData && userData.rol === 'admin');
}

function mostrarErrorAcceso(mensaje) {
  const errorDiv = document.getElementById('loginError');
  if (errorDiv) { errorDiv.classList.remove('hidden'); errorDiv.querySelector('div').textContent = mensaje; }
}

function mostrarLogin() {
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('panelScreen').classList.add('hidden');
}

function mostrarPanel() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('panelScreen').classList.remove('hidden');
}

if (auth) {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        if (!await esAdministrador(user)) { await auth.signOut(); mostrarErrorAcceso('Sin permisos de administración.'); return; }
        usuarioActual = user;
        await cargarDatosUsuario(user);
        mostrarPanel();
        cargarNoticiasUsuario();
        cargarResumen();
        cargarAutores();
        cargarLibros();
        cargarMensajes();
      } catch (error) {
        console.error('Error al validar permisos:', error);
        await auth.signOut();
        mostrarErrorAcceso('No fue posible validar los permisos.');
      }
    } else { mostrarLogin(); }
  });
} else {
  mostrarErrorAcceso('No se pudo inicializar la autenticación.');
  mostrarLogin();
}

// ================================================================
// 2. NAVEGACIÓN Y DASHBOARD
// ================================================================

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
      document.getElementById('seccionDashboard').classList.remove('hidden');
      if (sectionTitle) sectionTitle.textContent = 'Resumen';
      if (btnNuevaNoticia) btnNuevaNoticia.classList.add('hidden');
    } else if (section === 'noticias') {
      document.getElementById('seccionNoticias').classList.remove('hidden');
      if (sectionTitle) sectionTitle.textContent = 'Noticias';
      if (btnNuevaNoticia) btnNuevaNoticia.classList.remove('hidden');
    } else if (section === 'configuracion') {
      document.getElementById('seccionConfiguracion').classList.remove('hidden');
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
    const snapNoticias = await db.collection('noticias').where('usuario_id', '==', usuarioActual.uid).get();
    const totalNoticias = snapNoticias.docs.filter(doc => doc.data().estado !== 'borrador').length;
    document.getElementById('statNoticias').textContent = totalNoticias;

    const snapAutores = await db.collection('autores').get();
    const totalAutores = snapAutores.docs.filter(doc => doc.data().publicado !== false).length;
    document.getElementById('statAutores').textContent = totalAutores;

    const snapLibros = await db.collection('libros').where('usuario_id', '==', usuarioActual.uid).get();
    const totalLibros = snapLibros.docs.filter(doc => doc.data().publicado !== false).length;
    document.getElementById('statLibros').textContent = totalLibros;

    // Mensajes no leídos
    const snapMensajes = await db.collection('mensajes').where('leido', '==', false).get();
    document.getElementById('statMensajes').textContent = snapMensajes.size;
  } catch (error) { console.warn('No se pudo cargar el resumen:', error); }
}

function prepararFormulario(id, abierto) {
  const form = document.getElementById(id);
  if (!form) return;
  form.classList.toggle('hidden', !abierto);
  if (!abierto) form.reset();
}

document.getElementById('btnNuevoAutor')?.addEventListener('click', () => prepararFormulario('formAutor', true));
document.getElementById('btnNuevoLibro')?.addEventListener('click', () => prepararFormulario('formLibro', true));
document.querySelectorAll('.cancel-form').forEach(button => {
  button.addEventListener('click', () => {
    const form = button.closest('form');
    if (form) prepararFormulario(form.id, false);
  });
});

// ================================================================
// 3. GESTIÓN DE AUTORES
// ================================================================

async function cargarAutores() {
  const container = document.getElementById('listaAutores');
  if (!container || !db) return;
  container.innerHTML = '<div class="col-span-full text-center py-8"><i class="fas fa-spinner fa-spin text-primary text-2xl"></i><p class="text-xs text-darktext/60 mt-2">Cargando autores...</p></div>';
  try {
    const snapshot = await db.collection('autores').get();
    if (snapshot.empty) { container.innerHTML = '<div class="col-span-full text-center py-8 text-darktext/50 text-sm">No hay autores registrados aún.</div>'; return; }
    let html = '';
    snapshot.forEach(doc => {
      const autor = { id: doc.id, ...doc.data() };
      if (!autor.id) return;
      html += crearTarjetaAutorAdmin(autor);
    });
    container.innerHTML = html;
  } catch (error) {
    console.error('Error al cargar autores:', error);
    container.innerHTML = '<div class="col-span-full text-center py-8 text-red-500 text-sm">Error al cargar la lista de autores.</div>';
  }
}

function crearTarjetaAutorAdmin(autor) {
  if (!autor.id) return '';
  let foto = autor.foto || '';
  if (!foto.startsWith('http') && foto) foto = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop';
  if (!foto) foto = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop';
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
          <button onclick="editarAutor('${autor.id}')" class="px-3 py-1 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded text-xs transition">Editar</button>
          <button onclick="eliminarAutor('${autor.id}')" class="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded text-xs transition"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    </div>
  `;
}

async function editarAutor(id) {
  if (!id || id.trim() === '') { alert('ID inválido.'); return; }
  if (!db) return;
  try {
    const doc = await db.collection('autores').doc(id).get();
    if (!doc.exists) { alert('Autor no encontrado.'); return; }
    const autor = doc.data();
    const form = document.getElementById('formAutor');
    if (!form) return;
    form.classList.remove('hidden');
    form.querySelector('input[name="id"]').value = id;
    form.querySelector('[name="nombre"]').value = autor.nombre || '';
    form.querySelector('[name="genero"]').value = autor.genero || '';
    form.querySelector('[name="biografia"]').value = autor.biografia || autor.bio || '';
    form.querySelector('[name="instagram"]').value = autor.redes?.instagram || autor.instagram || '';
    form.querySelector('[name="twitter"]').value = autor.redes?.twitter || autor.twitter || '';
    form.querySelector('[name="web"]').value = autor.web || autor.redes?.web || '';
    document.getElementById('autor-publicado').checked = autor.publicado !== false;
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) { console.error(error); alert('Error al cargar el autor.'); }
}

async function eliminarAutor(id) {
  if (!id || id.trim() === '') { alert('ID inválido.'); return; }
  if (!confirm('¿Estás seguro de eliminar este autor?')) return;
  try {
    await db.collection('autores').doc(id).delete();
    alert('Autor eliminado.');
    cargarAutores();
  } catch (error) { console.error(error); alert('Error al eliminar.'); }
}

document.getElementById('formAutor')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const btnGuardar = form.querySelector('button[type="submit"]');
  const textoOriginal = btnGuardar.textContent;
  btnGuardar.disabled = true;
  btnGuardar.textContent = 'Guardando...';
  try {
    const inputId = form.querySelector('input[name="id"]');
    const docId = inputId ? inputId.value.trim() : '';
    const nombre = form.querySelector('[name="nombre"]')?.value?.trim() || '';
    const genero = form.querySelector('[name="genero"]')?.value?.trim() || '';
    const biografia = form.querySelector('[name="biografia"]')?.value?.trim() || '';
    const instagram = form.querySelector('[name="instagram"]')?.value?.trim() || '';
    const twitter = form.querySelector('[name="twitter"]')?.value?.trim() || '';
    const web = form.querySelector('[name="web"]')?.value?.trim() || '';
    const publicadoCheck = document.getElementById('autor-publicado');
    const estaPublicado = publicadoCheck ? publicadoCheck.checked : true;

    let fotoUrl = '';
    const fotoInput = document.getElementById('autor-foto');
    if (fotoInput && fotoInput.files && fotoInput.files.length > 0) {
      btnGuardar.textContent = 'Subiendo foto...';
      const archivo = fotoInput.files[0];
      const storageRef = storage.ref(`autores/${Date.now()}_${archivo.name}`);
      const snapshot = await storageRef.put(archivo);
      fotoUrl = await snapshot.ref.getDownloadURL();
    }

    const datosAutor = {
      nombre, genero, biografia, bio: biografia, publicado: estaPublicado,
      usuario_id: usuarioActual ? usuarioActual.uid : '',
      redes: { instagram, twitter, web },
      actualizado_en: firebase.firestore.FieldValue.serverTimestamp()
    };
    if (fotoUrl) datosAutor.foto = fotoUrl;

    if (docId) {
      await db.collection('autores').doc(docId).update(datosAutor);
      alert('Autor actualizado.');
    } else {
      if (!fotoUrl) datosAutor.foto = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop';
      datosAutor.creado_en = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('autores').add(datosAutor);
      alert('Autor creado.');
    }
    form.reset();
    if (inputId) inputId.value = '';
    form.classList.add('hidden');
    cargarAutores();
  } catch (error) { console.error(error); alert('Error al guardar.'); } finally {
    btnGuardar.disabled = false;
    btnGuardar.textContent = textoOriginal;
  }
});

// ================================================================
// 4. GESTIÓN DE LIBROS
// ================================================================

async function cargarLibros() {
  const container = document.getElementById('listaLibros');
  if (!usuarioActual || !container || !db) return;
  try {
    const snapshot = await db.collection('libros').where('usuario_id', '==', usuarioActual.uid).get();
    if (snapshot.empty) { container.innerHTML = '<p class="text-darktext md:col-span-2 xl:col-span-3 py-5">Aún no has agregado libros al catálogo.</p>'; return; }
    container.innerHTML = snapshot.docs.map(doc => crearTarjetaLibro({ id: doc.id, ...doc.data() })).join('');
  } catch (error) { console.error(error); container.innerHTML = '<p class="text-red-400">No se pudieron cargar los libros.</p>'; }
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

document.getElementById('formLibro')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const btnGuardar = form.querySelector('button[type="submit"]');
  btnGuardar.disabled = true;
  btnGuardar.textContent = 'Guardando...';
  try {
    const id = form.querySelector('input[name="id"]')?.value || '';
    const titulo = form.querySelector('[name="titulo"]')?.value?.trim() || '';
    const autor = form.querySelector('[name="autor"]')?.value?.trim() || '';
    const precio = form.querySelector('[name="precio"]')?.value?.trim() || '';
    const enlace_compra = form.querySelector('[name="enlace_compra"]')?.value?.trim() || '';
    const sinopsis = form.querySelector('[name="sinopsis"]')?.value?.trim() || '';
    const publicado = form.querySelector('[name="publicado"]')?.checked !== false;
    let portadaUrl = form.querySelector('[name="portada"]')?.value?.trim() || '';
    const portadaFile = document.getElementById('portada-file');
    if (portadaFile && portadaFile.files && portadaFile.files.length > 0) {
      btnGuardar.textContent = 'Subiendo portada...';
      const archivo = portadaFile.files[0];
      const storageRef = storage.ref(`portadas/${Date.now()}_${archivo.name}`);
      const snapshot = await storageRef.put(archivo);
      portadaUrl = await snapshot.ref.getDownloadURL();
    }
    const data = { titulo, autor, precio, enlace_compra, sinopsis, publicado, portada: portadaUrl, usuario_id: usuarioActual.uid, actualizado_en: firebase.firestore.FieldValue.serverTimestamp() };
    if (id) { await db.collection('libros').doc(id).update(data); alert('Libro actualizado.'); }
    else { data.creado_en = firebase.firestore.FieldValue.serverTimestamp(); await db.collection('libros').add(data); alert('Libro creado.'); }
    form.reset();
    form.classList.add('hidden');
    cargarLibros();
  } catch (error) { console.error(error); alert('Error al guardar.'); } finally {
    btnGuardar.disabled = false;
    btnGuardar.textContent = 'Guardar libro';
  }
});

async function editarLibro(id) {
  const doc = await db.collection('libros').doc(id).get();
  if (!doc.exists) return;
  const form = document.getElementById('formLibro');
  if (!form) return;
  const data = { id: doc.id, ...doc.data() };
  Object.entries(data).forEach(([key, value]) => {
    const field = form.querySelector(`[name="${key}"]`);
    if (field) { if (field.type === 'checkbox') field.checked = Boolean(value); else field.value = value || ''; }
  });
  form.classList.remove('hidden');
}

async function eliminarLibro(id) {
  if (!confirm('¿Eliminar este libro?')) return;
  await db.collection('libros').doc(id).delete();
  cargarLibros();
  alert('Libro eliminado.');
}

// ================================================================
// 5. GESTIÓN DE NOTICIAS
// ================================================================

async function cargarNoticiasUsuario() {
  const container = document.getElementById('listaNoticias');
  if (!container || !db || !usuarioActual) return;
  container.innerHTML = '<div class="col-span-full flex justify-center py-12"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>';
  try {
    const snapshot = await db.collection('noticias').where('usuario_id', '==', usuarioActual.uid).get();
    if (snapshot.empty) { container.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-darktext/40 mb-4">No tienes noticias publicadas</p></div>'; return; }
    let noticias = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    noticias.sort((a, b) => {
      const fa = a.fecha_creacion ? a.fecha_creacion.toMillis() : 0;
      const fb = b.fecha_creacion ? b.fecha_creacion.toMillis() : 0;
      return fb - fa;
    });
    container.innerHTML = noticias.map(crearTarjetaNoticiaAdmin).join('');
  } catch (error) { console.error(error); container.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-red-500">Error al cargar las noticias</p></div>'; }
}

function crearTarjetaNoticiaAdmin(noticia) {
  const imagenPrincipal = noticia.imagenes && noticia.imagenes.length > 0
    ? noticia.imagenes.find(img => img.orden === 0)?.url || noticia.imagenes[0].url
    : '';
  const estadoClases = { publicado: 'bg-green-100 text-green-700', borrador: 'bg-yellow-100 text-yellow-700' };
  return `
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition border border-lightbg flex flex-col justify-between">
      <div>
        ${imagenPrincipal ? `<div class="h-40 bg-lightbg"><img src="${imagenPrincipal}" alt="${noticia.titulo}" class="w-full h-full object-cover"></div>` :
          `<div class="h-40 bg-lightbg flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6M8 6h8a2 2 0 012 2v12l-4-2-4 2-4-2-4 2V8a2 2 0 012-2z"/></svg></div>`}
        <div class="p-5">
          <div class="flex items-start justify-between mb-3 gap-2">
            <div class="flex-1 min-w-0"><h3 class="font-semibold text-secondary truncate mb-1">${noticia.titulo}</h3><p class="text-sm text-darktext/40 truncate">${noticia.categoria || 'Sin categoría'}</p></div>
            <span class="px-2 py-1 rounded-full text-xs font-medium ${estadoClases[noticia.estado] || 'bg-gray-100 text-gray-700'}">${noticia.estado || 'borrador'}</span>
          </div>
          <p class="text-xs text-darktext/50 mb-4 line-clamp-2">${noticia.resumen || ''}</p>
        </div>
      </div>
      <div class="p-5 pt-0 flex gap-2">
        <button onclick="editarNoticia('${noticia.id}')" class="flex-1 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition">Editar</button>
        <button onclick="eliminarNoticia('${noticia.id}')" class="px-4 py-2 border border-red-300 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition">Eliminar</button>
      </div>
    </div>
  `;
}

document.getElementById('btnNuevaNoticia')?.addEventListener('click', abrirModalNueva);
document.getElementById('btnCerrarModal')?.addEventListener('click', cerrarModal);
document.getElementById('btnCancelar')?.addEventListener('click', cerrarModal);

function abrirModalNueva() {
  noticiaEnEdicion = null;
  imagenesSeleccionadas = [];
  imagenesExistentes = [];
  document.getElementById('modalTitulo').textContent = 'Nueva Noticia';
  document.getElementById('formNoticia').reset();
  document.getElementById('noticiaId').value = '';
  document.getElementById('previewImagenes').innerHTML = '';
  document.getElementById('modalNoticia').classList.add('active');
}

function cerrarModal() {
  document.getElementById('modalNoticia').classList.remove('active');
  noticiaEnEdicion = null;
  imagenesSeleccionadas = [];
  imagenesExistentes = [];
}

async function editarNoticia(id) {
  try {
    const doc = await db.collection('noticias').doc(id).get();
    if (!doc.exists) { alert('Noticia no encontrada'); return; }
    noticiaEnEdicion = { id: doc.id, ...doc.data() };
    imagenesExistentes = noticiaEnEdicion.imagenes || [];
    imagenesSeleccionadas = [];
    const form = document.getElementById('formNoticia');
    if (form) {
      form.titulo.value = noticiaEnEdicion.titulo || '';
      form.resumen.value = noticiaEnEdicion.resumen || '';
      form.contenido.value = noticiaEnEdicion.contenido || '';
      form.categoria.value = noticiaEnEdicion.categoria || 'Novedad';
      form.estado.value = noticiaEnEdicion.estado || 'publicado';
      form.autor.value = noticiaEnEdicion.autor || '';
      form.fecha_publicacion.value = noticiaEnEdicion.fecha_publicacion || '';
      form.enlace_externo.value = noticiaEnEdicion.enlace_externo || '';
      form.destacado.checked = noticiaEnEdicion.destacado || false;
    }
    document.getElementById('noticiaId').value = doc.id;
    document.getElementById('modalTitulo').textContent = 'Editar Noticia';
    mostrarPreviewImagenes();
    document.getElementById('modalNoticia').classList.add('active');
  } catch (error) { console.error(error); alert('Error al cargar la noticia.'); }
}

async function eliminarNoticia(id) {
  if (!confirm('¿Eliminar esta noticia y sus imágenes?')) return;
  try {
    const doc = await db.collection('noticias').doc(id).get();
    const noticia = doc.data();
    if (noticia && noticia.imagenes && noticia.imagenes.length > 0) {
      const deletePromises = noticia.imagenes.map(img => {
        try {
          const path = img.url.split('/o/')[1].split('?')[0];
          const decodedPath = decodeURIComponent(path);
          return storage.ref(decodedPath).delete().catch(err => console.warn('Error al borrar imagen:', err));
        } catch (e) { return Promise.resolve(); }
      });
      await Promise.all(deletePromises);
    }
    await db.collection('noticias').doc(id).delete();
    alert('Noticia eliminada.');
    cargarNoticiasUsuario();
  } catch (error) { console.error(error); alert('Error al eliminar.'); }
}

document.getElementById('inputImagenes')?.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  files.forEach(file => {
    if (file.size > 5 * 1024 * 1024) { alert(`La imagen ${file.name} supera los 5MB`); return; }
    if (!file.type.startsWith('image/')) { alert(`El archivo ${file.name} no es una imagen válida`); return; }
    imagenesSeleccionadas.push(file);
  });
  mostrarPreviewImagenes();
  e.target.value = '';
});

function mostrarPreviewImagenes() {
  const container = document.getElementById('previewImagenes');
  if (!container) return;
  container.innerHTML = '';
  imagenesExistentes.forEach((img, index) => {
    const div = document.createElement('div');
    div.className = 'image-preview-item relative inline-block mr-2 mb-2';
    div.innerHTML = `<img src="${img.url}" class="w-20 h-20 object-cover rounded-lg"><button type="button" class="remove-btn absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs" onclick="eliminarImagenExistente(${index})">&times;</button><div class="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] px-1 rounded">Actual</div>`;
    container.appendChild(div);
  });
  imagenesSeleccionadas.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const div = document.createElement('div');
      div.className = 'image-preview-item relative inline-block mr-2 mb-2';
      div.innerHTML = `<img src="${e.target.result}" class="w-20 h-20 object-cover rounded-lg"><button type="button" class="remove-btn absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs" onclick="eliminarImagenNueva(${index})">&times;</button><div class="absolute bottom-1 left-1 bg-primary text-white text-[9px] px-1 rounded">Nueva</div>`;
      container.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
}

function eliminarImagenExistente(index) { imagenesExistentes.splice(index, 1); mostrarPreviewImagenes(); }
function eliminarImagenNueva(index) { imagenesSeleccionadas.splice(index, 1); mostrarPreviewImagenes(); }

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
      urlsImagenes.push({ url, nombre: fileName, orden: urlsImagenes.length });
    } catch (error) { console.error('Error al subir imagen:', error); alert(`Error al subir la imagen ${file.name}. Se omitirá.`); }
  }
  return urlsImagenes;
}

document.getElementById('formNoticia')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const btnGuardar = document.getElementById('btnGuardar');
  const noticiaIdInput = document.getElementById('noticiaId');
  const noticiaId = noticiaIdInput ? noticiaIdInput.value : '';
  btnGuardar.textContent = 'Guardando...';
  btnGuardar.disabled = true;
  try {
    const datos = {
      titulo: form.titulo.value.trim(),
      resumen: form.resumen.value.trim(),
      contenido: form.contenido.value.trim(),
      categoria: form.categoria.value || 'Novedad',
      estado: form.estado.value || 'publicado',
      autor: form.autor.value.trim(),
      fecha_publicacion: form.fecha_publicacion.value || '',
      enlace_externo: form.enlace_externo.value.trim(),
      destacado: form.destacado.checked,
      usuario_id: usuarioActual.uid,
      fecha_actualizacion: firebase.firestore.FieldValue.serverTimestamp()
    };
    let docId;
    if (noticiaId) {
      docId = noticiaId;
      const imagenes = await subirImagenes(docId);
      datos.imagenes = imagenes;
      await db.collection('noticias').doc(docId).update(datos);
      alert('Noticia actualizada.');
    } else {
      datos.fecha_creacion = firebase.firestore.FieldValue.serverTimestamp();
      const docRef = await db.collection('noticias').add(datos);
      docId = docRef.id;
      const imagenes = await subirImagenes(docId);
      await db.collection('noticias').doc(docId).update({ imagenes });
      alert('Noticia publicada.');
    }
    cerrarModal();
    cargarNoticiasUsuario();
  } catch (error) { console.error(error); alert('Error al guardar.'); } finally {
    btnGuardar.textContent = 'Guardar Noticia';
    btnGuardar.disabled = false;
  }
});

// ================================================================
// 6. GESTIÓN DE MENSAJES
// ================================================================

async function cargarMensajes() {
  const container = document.getElementById('listaMensajes');
  if (!container || !db) return;
  container.innerHTML = '<div class="text-center py-12 text-darktext/50">Cargando mensajes...</div>';
  try {
    const snapshot = await db.collection('mensajes').orderBy('fecha', 'desc').get();
    if (snapshot.empty) {
      container.innerHTML = '<div class="text-center py-12 text-darktext/50">No hay mensajes aún.</div>';
      return;
    }
    let html = '';
    snapshot.forEach(doc => {
      const msg = { id: doc.id, ...doc.data() };
      const fecha = msg.fecha ? new Date(msg.fecha.toMillis()).toLocaleString('es-CO') : 'Fecha desconocida';
      const leido = msg.leido || false;
      const claseLeido = leido ? 'mensaje-leido' : 'mensaje-no-leido';
      html += `
        <div class="panel-card p-5 rounded-xl border border-lightbg ${claseLeido}">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div class="flex-1">
              <p class="font-bold text-secondary">${msg.nombre || 'Anónimo'} <span class="text-xs font-normal text-darktext/50">${fecha}</span></p>
              <p class="text-sm text-primary">${msg.email || ''}</p>
              <p class="text-sm font-medium text-secondary mt-1">${msg.asunto || 'Sin asunto'}</p>
              <p class="text-sm text-darktext/70 mt-1 line-clamp-2">${msg.mensaje || ''}</p>
            </div>
            <div class="flex gap-2 flex-shrink-0">
              ${!leido ? `<button onclick="marcarLeido('${msg.id}')" class="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded text-xs font-medium transition">Marcar leído</button>` : ''}
              <button onclick="eliminarMensaje('${msg.id}')" class="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-medium transition">Eliminar</button>
            </div>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
    // Actualizar el contador del dashboard
    const noLeidos = snapshot.docs.filter(doc => !doc.data().leido).length;
    document.getElementById('statMensajes').textContent = noLeidos;
  } catch (error) {
    console.error('Error al cargar mensajes:', error);
    container.innerHTML = '<div class="text-center py-12 text-red-500">Error al cargar los mensajes.</div>';
  }
}

async function marcarLeido(id) {
  if (!db) return;
  try {
    await db.collection('mensajes').doc(id).update({ leido: true });
    cargarMensajes();
  } catch (error) { console.error(error); alert('Error al marcar como leído.'); }
}

async function eliminarMensaje(id) {
  if (!confirm('¿Eliminar este mensaje?')) return;
  try {
    await db.collection('mensajes').doc(id).delete();
    cargarMensajes();
  } catch (error) { console.error(error); alert('Error al eliminar.'); }
}

document.getElementById('btnRecargarMensajes')?.addEventListener('click', cargarMensajes);

// ================================================================
// 7. CONFIGURACIÓN DE PERFIL
// ================================================================

document.getElementById('btnActualizarPerfil')?.addEventListener('click', async () => {
  const nombre = document.getElementById('inputNombre').value.trim();
  const telefono = document.getElementById('inputTelefono').value.trim();
  if (!nombre) { alert('El nombre es obligatorio'); return; }
  try {
    if (auth && auth.currentUser) { await auth.currentUser.updateProfile({ displayName: nombre }); }
    await db.collection('usuarios').doc(usuarioActual.uid).set({ nombre, telefono, email: usuarioActual.email }, { merge: true });
    alert('Perfil actualizado.');
    await cargarDatosUsuario(usuarioActual);
  } catch (error) { console.error(error); alert('Error al actualizar.'); }
});

// ================================================================
// 8. FILTROS DE NOTICIAS
// ================================================================

document.getElementById('btnAplicarFiltros')?.addEventListener('click', async () => {
  const titulo = document.getElementById('filtroTitulo').value.toLowerCase();
  const categoria = document.getElementById('filtroCategoria').value;
  const estado = document.getElementById('filtroEstado').value;
  const container = document.getElementById('listaNoticias');
  container.innerHTML = '<div class="col-span-full flex justify-center py-12"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>';
  try {
    let query = db.collection('noticias').where('usuario_id', '==', usuarioActual.uid);
    if (categoria) query = query.where('categoria', '==', categoria);
    if (estado) query = query.where('estado', '==', estado);
    const snapshot = await query.get();
    let noticias = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (titulo) noticias = noticias.filter(n => (n.titulo || '').toLowerCase().includes(titulo));
    if (noticias.length === 0) { container.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-darktext/40">No se encontraron noticias</p></div>'; return; }
    container.innerHTML = noticias.map(crearTarjetaNoticiaAdmin).join('');
  } catch (error) { console.error(error); container.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-red-500">Error al aplicar filtros</p></div>'; }
});

// ================================================================
// 9. UTILIDADES Y EXPOSICIÓN GLOBAL
// ================================================================

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

// Exponer funciones globalmente
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
window.cargarMensajes = cargarMensajes;
window.marcarLeido = marcarLeido;
window.eliminarMensaje = eliminarMensaje;

console.log('Funciones globales expuestas correctamente.');