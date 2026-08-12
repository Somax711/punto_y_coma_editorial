// GESTIÓN DE PANEL
const auth = window.firebaseServices?.auth || (typeof firebase !== 'undefined' ? firebase.auth() : null);
const db = window.firebaseServices?.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
const storage = window.firebaseServices?.storage || (typeof firebase !== 'undefined' ? firebase.storage() : null);

let usuarioActual = null;
let noticiaEnEdicion = null;
let imagenesSeleccionadas = [];
let imagenesExistentes = [];

// LOGIN
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!auth || !db) {
    mostrarErrorAcceso('Firebase no está configurado. Revisa firebase-config.js y usa tus credenciales reales.');
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
    // onAuthStateChanged valida el rol y carga el panel.

  } catch (error) {
    console.error('Error en login:', error);
    errorDiv.classList.remove('hidden');
    errorDiv.querySelector('div').textContent = obtenerMensajeError(error.code);

    loginBtn.textContent = 'Iniciar Sesión';
    loginBtn.disabled = false;
    return;
  }

  loginBtn.textContent = 'Iniciar Sesión';
  loginBtn.disabled = false;
});

// LOGOUT
document.getElementById('logoutBtn').addEventListener('click', async () => {
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

async function obtenerPerfilUsuario(user) {
  if (!db || !user) return null;

  const usuarioRef = db.collection('usuarios').doc(user.uid);
  const usuarioDoc = await usuarioRef.get();
  const correo = (user.email || '').toLowerCase();
  
  // Verifica si el correo está en la lista 
  const esAdminPorCorreo = Array.isArray(window.FIREBASE_ADMIN_EMAILS) && 
                           window.FIREBASE_ADMIN_EMAILS.some(email => (email || '').toLowerCase() === correo);
                           
  const datos = usuarioDoc.exists ? usuarioDoc.data() : {};

  // Si el usuario es nuevo, lo crea
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

// CARGAR DATOS DE USUARIO
async function cargarDatosUsuario(user) {
  try {
    const userData = await obtenerPerfilUsuario(user);
    if (!userData) return;
    document.getElementById('userName').textContent = userData.nombre || user.email;
    document.getElementById('userEmail').textContent = userData.email || user.email;

    const initials = (userData.nombre || user.email || 'U')
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    document.getElementById('userInitials').textContent = initials;

    document.getElementById('inputNombre').value = userData.nombre || '';
    document.getElementById('inputTelefono').value = userData.telefono || '';
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
  errorDiv.classList.remove('hidden');
  errorDiv.querySelector('div').textContent = mensaje;
}

// MOSTRAR / OCULTAR PANTALLAS
function mostrarLogin() {
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('panelScreen').classList.add('hidden');
}

function mostrarPanel() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('panelScreen').classList.remove('hidden');
}

// Mantener sesión al recargar
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
        cargarAutores();
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
  mostrarErrorAcceso('error.');
  mostrarLogin();
}


// NAVEGACIÓN
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

    if (section === 'dashboard') {
      document.getElementById('seccionDashboard').classList.remove('hidden');
      document.getElementById('sectionTitle').textContent = 'Resumen';
      document.getElementById('btnNuevaNoticia').classList.add('hidden');
    } else if (section === 'noticias') {
      document.getElementById('seccionNoticias').classList.remove('hidden');
      document.getElementById('sectionTitle').textContent = 'Noticias';
      document.getElementById('btnNuevaNoticia').classList.remove('hidden');
    } else if (section === 'configuracion') {
      document.getElementById('seccionConfiguracion').classList.remove('hidden');
      document.getElementById('sectionTitle').textContent = 'Configuración';
      document.getElementById('btnNuevaNoticia').classList.add('hidden');
    } else {
      const sectionId = `seccion${section.charAt(0).toUpperCase() + section.slice(1)}`;
      const target = document.getElementById(sectionId);
      if (target) target.classList.remove('hidden');
      document.getElementById('sectionTitle').textContent = section.charAt(0).toUpperCase() + section.slice(1);
      document.getElementById('btnNuevaNoticia').classList.add('hidden');
    }
  });
});

document.querySelectorAll('.quick-link').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  const destination = document.querySelector(`[data-section="${link.dataset.go}"]`);
  if (destination) destination.click();
}));

async function cargarResumen() {
  try {
    const snapshot = await db.collection('noticias').where('usuario_id', '==', usuarioActual.uid).get();
    const total = snapshot.docs.filter(doc => doc.data().estado !== 'borrador').length;
    const stat = document.getElementById('statNoticias');
    if (stat) stat.textContent = total;
  } catch (error) {
    console.warn('No se pudo cargar el resumen:', error);
  }
}

// AUTORES Y LIBRERÍA DIGITAL
function prepararFormulario(id, abierto) {
  const form = document.getElementById(id);
  form.classList.toggle('hidden', !abierto);
  if (!abierto) form.reset();
}

document.getElementById('btnNuevoAutor').addEventListener('click', () => prepararFormulario('formAutor', true));
document.getElementById('btnNuevoLibro').addEventListener('click', () => prepararFormulario('formLibro', true));
document.querySelectorAll('.cancel-form').forEach(button => button.addEventListener('click', () => prepararFormulario(button.closest('form').id, false)));

async function cargarAutores() {
  const container = document.getElementById('listaAutores');
  if (!usuarioActual || !container) return;
  try {
    const snapshot = await db.collection('autores').where('usuario_id', '==', usuarioActual.uid).get();
    if (snapshot.empty) { container.innerHTML = '<p class="text-darktext md:col-span-2 xl:col-span-3 py-5">Aún no has creado perfiles de autor.</p>'; return; }
    container.innerHTML = snapshot.docs.map(doc => crearTarjetaAutor({ id: doc.id, ...doc.data() })).join('');
  } catch (error) { console.error('Error al cargar autores:', error); container.innerHTML = '<p class="text-red-400">No se pudieron cargar los autores.</p>'; }
}

function crearTarjetaAutor(autor) {
  const initials = (autor.nombre || 'A').split(' ').map(word => word[0]).join('').slice(0, 2);
  return `<article class="panel-card rounded overflow-hidden"><div class="p-5 flex gap-4"><div class="w-14 h-14 rounded-full overflow-hidden bg-vino border border-primary/40 shrink-0 flex items-center justify-center text-primary font-serif text-lg">${autor.foto ? `<img src="${autor.foto}" alt="${autor.nombre}" class="w-full h-full object-cover">` : initials}</div><div class="min-w-0"><h3 class="font-serif text-xl text-secondary truncate">${autor.nombre}</h3><p class="text-primary text-xs uppercase tracking-widest mt-1">${autor.genero || 'Autor/a'}</p><p class="text-darktext text-sm mt-3 line-clamp-2">${autor.biografia || 'Sin biografía todavía.'}</p></div></div><div class="p-4 border-t border-dorado/10 flex gap-2"><button onclick="editarAutor('${autor.id}')" class="flex-1 border border-primary/50 text-primary py-2 text-xs uppercase tracking-widest">Editar</button><button onclick="eliminarAutor('${autor.id}')" class="px-3 border border-red-400/60 text-red-300 text-xs"><i class="fa-solid fa-trash"></i></button></div></article>`;
}

document.getElementById('formAutor').addEventListener('submit', async event => {
  event.preventDefault(); const form = event.target; const id = form.id.value;
  const data = Object.fromEntries(new FormData(form).entries()); data.publicado = form.publicado.checked; data.usuario_id = usuarioActual.uid; data.actualizado_en = firebase.firestore.FieldValue.serverTimestamp();
  try { if (id) await db.collection('autores').doc(id).update(data); else { data.creado_en = firebase.firestore.FieldValue.serverTimestamp(); await db.collection('autores').add(data); } prepararFormulario('formAutor', false); cargarAutores(); } catch (error) { console.error(error); alert('No se pudo guardar el autor.'); }
});

async function editarAutor(id) { const doc = await db.collection('autores').doc(id).get(); if (!doc.exists) return; const form = document.getElementById('formAutor'); Object.entries({ id: doc.id, ...doc.data() }).forEach(([key, value]) => { if (form[key]) form[key].type === 'checkbox' ? form[key].checked = Boolean(value) : form[key].value = value || ''; }); prepararFormulario('formAutor', true); }
async function eliminarAutor(id) { if (!confirm('¿Eliminar este perfil de autor?')) return; await db.collection('autores').doc(id).delete(); cargarAutores(); }

async function cargarLibros() {
  const container = document.getElementById('listaLibros'); if (!usuarioActual || !container) return;
  try { const snapshot = await db.collection('libros').where('usuario_id', '==', usuarioActual.uid).get(); if (snapshot.empty) { container.innerHTML = '<p class="text-darktext md:col-span-2 xl:col-span-3 py-5">Aún no has agregado libros al catálogo.</p>'; return; } container.innerHTML = snapshot.docs.map(doc => crearTarjetaLibro({ id: doc.id, ...doc.data() })).join(''); } catch (error) { console.error('Error al cargar libros:', error); container.innerHTML = '<p class="text-red-400">No se pudieron cargar los libros.</p>'; }
}

function crearTarjetaLibro(libro) { return `<article class="panel-card rounded overflow-hidden flex"><div class="w-24 shrink-0 bg-vino flex items-center justify-center text-primary">${libro.portada ? `<img src="${libro.portada}" alt="${libro.titulo}" class="w-full h-full object-cover">` : '<i class="fa-solid fa-book text-2xl"></i>'}</div><div class="p-4 min-w-0 flex-1"><h3 class="font-serif text-lg text-secondary truncate">${libro.titulo}</h3><p class="text-primary text-xs mt-1">${libro.autor || 'Autor por definir'}</p><p class="text-darktext text-xs mt-2 truncate">${libro.precio || 'Sin precio'}</p><div class="mt-4 flex gap-3"><button onclick="editarLibro('${libro.id}')" class="text-primary text-xs uppercase tracking-widest">Editar</button><button onclick="eliminarLibro('${libro.id}')" class="text-red-300 text-xs uppercase tracking-widest">Eliminar</button></div></div></article>`; }

document.getElementById('formLibro').addEventListener('submit', async event => { event.preventDefault(); const form = event.target; const id = form.id.value; const data = Object.fromEntries(new FormData(form).entries()); data.publicado = form.publicado.checked; data.usuario_id = usuarioActual.uid; data.actualizado_en = firebase.firestore.FieldValue.serverTimestamp(); try { if (id) await db.collection('libros').doc(id).update(data); else { data.creado_en = firebase.firestore.FieldValue.serverTimestamp(); await db.collection('libros').add(data); } prepararFormulario('formLibro', false); cargarLibros(); } catch (error) { console.error(error); alert('No se pudo guardar el libro.'); } });
async function editarLibro(id) { const doc = await db.collection('libros').doc(id).get(); if (!doc.exists) return; const form = document.getElementById('formLibro'); Object.entries({ id: doc.id, ...doc.data() }).forEach(([key, value]) => { if (form[key]) form[key].type === 'checkbox' ? form[key].checked = Boolean(value) : form[key].value = value || ''; }); prepararFormulario('formLibro', true); }
async function eliminarLibro(id) { if (!confirm('¿Eliminar este libro del catálogo?')) return; await db.collection('libros').doc(id).delete(); cargarLibros(); }

// NOTICIAS
async function cargarNoticiasUsuario() {
  const container = document.getElementById('listaNoticias');
  container.innerHTML = `
    <div class="col-span-full flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  `;

  try {
    const snapshot = await db.collection('noticias')
      .where('usuario_id', '==', usuarioActual.uid)
      .orderBy('fecha_creacion', 'desc')
      .get();

    if (snapshot.empty) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <p class="text-darktext/40 mb-4">No tienes noticias publicadas</p>
          <button onclick="abrirModalNueva()" class="px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition">
            Publicar tu primera noticia
          </button>
        </div>
      `;
      return;
    }

    const html = snapshot.docs.map(doc => {
      const noticia = { id: doc.id, ...doc.data() };
      return crearTarjetaNoticiaAdmin(noticia);
    }).join('');

    container.innerHTML = html;

  } catch (error) {
    console.error('Error al cargar noticias:', error);
    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <p class="text-red-500 mb-4">Error al cargar las noticias</p>
        <button onclick="cargarNoticiasUsuario()" class="text-primary hover:underline">Reintentar</button>
      </div>
    `;
  }
}

// TARJETA DE NOTICIA ADMIN
function crearTarjetaNoticiaAdmin(noticia) {
  const imagenPrincipal = noticia.imagenes && noticia.imagenes.length > 0
    ? noticia.imagenes.find(img => img.orden === 0)?.url || noticia.imagenes[0].url
    : '';

  const estadoClases = {
    publicado: 'bg-green-100 text-green-700',
    borrador: 'bg-yellow-100 text-yellow-700'
  };

  return `
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition">
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

        <div class="flex gap-2">
          <button onclick="editarNoticia('${noticia.id}')" class="flex-1 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition">
            Editar
          </button>
          <button onclick="eliminarNoticia('${noticia.id}')" class="px-4 py-2 border border-red-300 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  `;
}

// MODAL NUEVA NOTICIA
document.getElementById('btnNuevaNoticia').addEventListener('click', abrirModalNueva);
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

document.getElementById('btnCerrarModal').addEventListener('click', cerrarModal);
document.getElementById('btnCancelar').addEventListener('click', cerrarModal);

function cerrarModal() {
  document.getElementById('modalNoticia').classList.remove('active');
  noticiaEnEdicion = null;
  imagenesSeleccionadas = [];
  imagenesExistentes = [];
}

// EDITAR NOTICIA
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
    form.titulo.value = noticiaEnEdicion.titulo || '';
    form.resumen.value = noticiaEnEdicion.resumen || '';
    form.contenido.value = noticiaEnEdicion.contenido || '';
    form.categoria.value = noticiaEnEdicion.categoria || '';
    form.estado.value = noticiaEnEdicion.estado || 'publicado';
    form.autor.value = noticiaEnEdicion.autor || '';
    form.fecha_publicacion.value = noticiaEnEdicion.fecha_publicacion || '';
    form.enlace_externo.value = noticiaEnEdicion.enlace_externo || '';
    form.destacado.checked = noticiaEnEdicion.destacado || false;

    document.getElementById('noticiaId').value = doc.id;
    document.getElementById('modalTitulo').textContent = 'Editar Noticia';

    mostrarPreviewImagenes();
    document.getElementById('modalNoticia').classList.add('active');

  } catch (error) {
    console.error('Error al cargar noticia:', error);
    alert('Error al cargar la noticia');
  }
}

// ELIMINAR NOTICIA
async function eliminarNoticia(id) {
  if (!confirm('¿Estás seguro de eliminar esta noticia?')) return;

  try {
    const doc = await db.collection('noticias').doc(id).get();
    const noticia = doc.data();

    if (noticia.imagenes && noticia.imagenes.length > 0) {
      const deletePromises = noticia.imagenes.map(img => {
        const path = img.url.split('/o/')[1].split('?')[0];
        const decodedPath = decodeURIComponent(path);
        return storage.ref(decodedPath).delete().catch(err => {
          console.error('Error al eliminar imagen:', err);
        });
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

// IMÁGENES
document.getElementById('inputImagenes').addEventListener('change', (e) => {
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

function mostrarPreviewImagenes() {
  const container = document.getElementById('previewImagenes');
  container.innerHTML = '';

  imagenesExistentes.forEach((img, index) => {
    const div = document.createElement('div');
    div.className = 'image-preview-item';
    div.innerHTML = `
      <img src="${img.url}">
      <button type="button" class="remove-btn" onclick="eliminarImagenExistente(${index})">&times;</button>
      <div class="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded">Actual</div>
    `;
    container.appendChild(div);
  });

  imagenesSeleccionadas.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const div = document.createElement('div');
      div.className = 'image-preview-item';
      div.innerHTML = `
        <img src="${e.target.result}">
        <button type="button" class="remove-btn" onclick="eliminarImagenNueva(${index})">&times;</button>
        <div class="absolute bottom-1 left-1 bg-primary text-white text-xs px-2 py-0.5 rounded">Nueva</div>
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

// SUBIR IMÁGENES
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
      throw error;
    }
  }
  return urlsImagenes;
}

// GUARDAR NOTICIA
document.getElementById('formNoticia').addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = e.target;
  const btnGuardar = document.getElementById('btnGuardar');
  const noticiaId = document.getElementById('noticiaId').value;

  btnGuardar.textContent = 'Guardando...';
  btnGuardar.disabled = true;
  form.classList.add('loading');

  try {
    const datos = {
      titulo: form.titulo.value.trim(),
      resumen: form.resumen.value.trim(),
      contenido: form.contenido.value.trim(),
      categoria: form.categoria.value,
      estado: form.estado.value,
      autor: form.autor.value.trim(),
      fecha_publicacion: form.fecha_publicacion.value,
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
    alert('Error al guardar la noticia.');
  } finally {
    btnGuardar.textContent = 'Guardar Noticia';
    btnGuardar.disabled = false;
    form.classList.remove('loading');
  }
});

// ACTUALIZAR PERFIL
document.getElementById('btnActualizarPerfil').addEventListener('click', async () => {
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

// FILTROS
document.getElementById('btnAplicarFiltros').addEventListener('click', async () => {
  const titulo = document.getElementById('filtroTitulo').value.toLowerCase();
  const categoria = document.getElementById('filtroCategoria').value;
  const estado = document.getElementById('filtroEstado').value;

  const container = document.getElementById('listaNoticias');
  container.innerHTML = '<div class="col-span-full flex justify-center py-12"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>';

  try {
    let query = db.collection('noticias').where('usuario_id', '==', usuarioActual.uid);

    if (categoria) query = query.where('categoria', '==', categoria);
    if (estado) query = query.where('estado', '==', estado);

    const snapshot = await query.orderBy('fecha_creacion', 'desc').get();

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

// UTILIDADES
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
window.editarNoticia = editarNoticia;
window.eliminarNoticia = eliminarNoticia;
window.eliminarImagenExistente = eliminarImagenExistente;
window.eliminarImagenNueva = eliminarImagenNueva;
window.abrirModalNueva = abrirModalNueva;
window.cargarNoticiasUsuario = cargarNoticiasUsuario;
window.obtenerMensajeError = obtenerMensajeError;
window.editarAutor = editarAutor;
window.eliminarAutor = eliminarAutor;
window.editarLibro = editarLibro;
window.eliminarLibro = eliminarLibro;
