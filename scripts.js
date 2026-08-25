// ================================================================
// SCRIPTS PÚBLICOS - Editorial Punto y Coma
// ================================================================

// ================================================================
// CONFIGURACIÓN DE WHATSAPP
// ================================================================
const EDITORIAL_WHATSAPP = "573116060210";
const EDITORIAL_EMAIL = "puntoycoma.ediciontextos@gmail.com";

function linkWhatsapp(mensaje) {
  return `https://wa.me/${EDITORIAL_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
}

// ================================================================
// VARIABLES GLOBALES
// ================================================================
let autoresData = [];
let todosLosLibros = [];
let librosFiltrados = [];
let librosMostrados = 12; // 12 iniciales, luego +12 con "Ver más"
let todosLosVideos = [];
let videosMostrados = 6;

// ================================================================
// AUTENTICACIÓN ANÓNIMA
// ================================================================
if (firebase && firebase.auth) {
  firebase.auth().signInAnonymously()
    .then(() => console.log('🔓 Autenticación anónima exitosa'))
    .catch(error => console.warn('⚠️ Auth anónima falló:', error));
}

// ================================================================
// DOMContentLoaded
// ================================================================
document.addEventListener("DOMContentLoaded", () => {
  // Enlaces de WhatsApp
  const enlaces = [
    { id: "whatsapp-header-link", msg: "Hola, quiero publicar mi libro con Editorial Punto y Coma." },
    { id: "whatsapp-hero-link", msg: "Hola, quiero solicitar un informe editorial." },
    { id: "whatsapp-nosotros-link", msg: "Hola, quiero unirme al Círculo Punto y Coma." },
  ];
  enlaces.forEach(({ id, msg }) => {
    const el = document.getElementById(id);
    if (el) el.href = linkWhatsapp(msg);
  });

  // Año en footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Menú móvil
  const mobileBtn = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileBtn && mobileMenu) {
    mobileBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
    mobileMenu.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') mobileMenu.classList.add('hidden');
    });
  }

  // WhatsApp flotante
  const whatsappButton = document.getElementById('whatsapp-float');
  if (whatsappButton) {
    whatsappButton.addEventListener('click', () => {
      window.open(linkWhatsapp('Hola, me gustaría recibir información sobre Editorial Punto y Coma.'), '_blank');
    });
  }

  // Cerrar modales
  const modalNews = document.getElementById('news-modal');
  const closeNews = document.getElementById('close-modal');
  if (closeNews) closeNews.addEventListener('click', closeNewsModal);
  if (modalNews) {
    modalNews.addEventListener('click', (e) => {
      if (e.target === modalNews) closeNewsModal();
    });
  }

  const modalAuthor = document.getElementById('author-modal');
  const closeAuthor = document.getElementById('close-author-modal');
  if (closeAuthor) closeAuthor.addEventListener('click', closeAuthorModal);
  if (modalAuthor) {
    modalAuthor.addEventListener('click', (e) => {
      if (e.target === modalAuthor) closeAuthorModal();
    });
  }

  const qrModal = document.getElementById('qr-modal');
  if (qrModal) {
    qrModal.addEventListener('click', (e) => {
      if (e.target === qrModal) closeQRModal();
    });
  }

  const contactoModal = document.getElementById('contacto-modal');
  if (contactoModal) {
    contactoModal.addEventListener('click', (e) => {
      if (e.target === contactoModal) cerrarModalContacto();
    });
  }

  // Modal libro
  const libroModal = document.getElementById('libro-modal');
  const closeLibro = document.getElementById('close-libro-modal');
  if (closeLibro) {
    closeLibro.addEventListener('click', () => {
      libroModal.classList.add('opacity-0');
      libroModal.firstElementChild.classList.add('scale-95');
      setTimeout(() => {
        libroModal.classList.add('hidden');
        libroModal.classList.remove('flex');
      }, 250);
    });
  }
  if (libroModal) {
    libroModal.addEventListener('click', (e) => {
      if (e.target === libroModal) {
        libroModal.classList.add('opacity-0');
        libroModal.firstElementChild.classList.add('scale-95');
        setTimeout(() => {
          libroModal.classList.add('hidden');
          libroModal.classList.remove('flex');
        }, 250);
      }
    });
  }

  // Botones "Ver más"
  const btnVerMasLibros = document.getElementById('btnVerMasLibros');
  if (btnVerMasLibros) {
    btnVerMasLibros.addEventListener('click', verMasLibros);
  }

  const btnVerMasVideos = document.getElementById('btnVerMasVideos');
  if (btnVerMasVideos) {
    btnVerMasVideos.addEventListener('click', verMasVideos);
  }

  // Filtros de libros
  const filtroInput = document.getElementById('filtroLibros');
  const filtroCategoria = document.getElementById('filtroCategoriaLibros');
  if (filtroInput) {
    filtroInput.addEventListener('input', aplicarFiltros);
  }
  if (filtroCategoria) {
    filtroCategoria.addEventListener('change', aplicarFiltros);
  }

  // Cargar datos
  setTimeout(() => {
    cargarNoticiasPublicas();
    cargarAutoresPublicos();
    cargarLibrosPublicos();
    cargarVideosPublicos();
  }, 500);
});

// ================================================================
// CONTACTO
// ================================================================
window.abrirModalContacto = function() {
  const modal = document.getElementById('contacto-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  setTimeout(() => {
    modal.classList.remove('opacity-0');
    modal.firstElementChild.classList.remove('scale-95');
  }, 10);
  document.getElementById('contacto-respuesta').classList.add('hidden');
  document.getElementById('formContacto').reset();
};

window.cerrarModalContacto = function() {
  const modal = document.getElementById('contacto-modal');
  if (!modal) return;
  modal.classList.add('opacity-0');
  modal.firstElementChild.classList.add('scale-95');
  setTimeout(() => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }, 250);
};

document.getElementById('formContacto')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btnEnviarContacto');
  const respuesta = document.getElementById('contacto-respuesta');
  btn.disabled = true;
  btn.textContent = 'Enviando...';
  respuesta.classList.add('hidden');

  const nombre = document.getElementById('contacto-nombre').value.trim();
  const email = document.getElementById('contacto-email').value.trim();
  const asunto = document.getElementById('contacto-asunto').value.trim();
  const mensaje = document.getElementById('contacto-mensaje').value.trim();

  if (!nombre || !email || !asunto || !mensaje) {
    respuesta.textContent = 'Por favor, completa todos los campos.';
    respuesta.className = 'mt-4 text-red-600 text-sm font-medium block';
    respuesta.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'Enviar mensaje';
    return;
  }

  const db = window.db || (typeof db !== 'undefined' ? db : null);
  if (!db) {
    respuesta.textContent = 'Error de conexión con el servidor. Intenta más tarde.';
    respuesta.className = 'mt-4 text-red-600 text-sm font-medium block';
    respuesta.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'Enviar mensaje';
    return;
  }

  try {
    if (typeof firebase === 'undefined' || !firebase.firestore) {
      throw new Error('Firebase no está inicializado correctamente.');
    }
    const timestamp = firebase.firestore.FieldValue.serverTimestamp();

    await db.collection('mensajes').add({
      nombre,
      email,
      asunto,
      mensaje,
      leido: false,
      fecha: timestamp
    });

    respuesta.textContent = '¡Mensaje enviado con éxito! Te responderemos pronto.';
    respuesta.className = 'mt-4 text-green-600 text-sm font-medium block';
    respuesta.classList.remove('hidden');
    document.getElementById('formContacto').reset();
    setTimeout(cerrarModalContacto, 3000);
  } catch (error) {
    console.error('❌ Error al enviar mensaje:', error);
    respuesta.textContent = `Error: ${error.message || 'No se pudo enviar el mensaje. Intenta nuevamente.'}`;
    respuesta.className = 'mt-4 text-red-600 text-sm font-medium block';
    respuesta.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Enviar mensaje';
  }
});

// ================================================================
// NOTICIAS
// ================================================================
async function cargarNoticiasPublicas() {
  const grid = document.getElementById('newsGrid');
  if (!grid) return;
  const db = window.db || (typeof db !== 'undefined' ? db : null);
  if (!db) {
    grid.innerHTML = '<div class="col-span-full text-center py-20 text-red-500">Error: No se detecta la conexión a Firebase.</div>';
    return;
  }

  try {
    const snapshot = await db.collection('noticias').get();
    if (snapshot.empty) {
      grid.innerHTML = '<div class="col-span-full text-center py-20 text-cremadark">Próximamente compartiremos nuevas historias y novedades.</div>';
      return;
    }

    let noticias = snapshot.docs.map(doc => doc.data());
    noticias = noticias.filter(n => n.estado === 'publicado');
    noticias.sort((a, b) => {
      const fechaA = a.fecha_creacion ? a.fecha_creacion.toMillis() : 0;
      const fechaB = b.fecha_creacion ? b.fecha_creacion.toMillis() : 0;
      return fechaB - fechaA;
    });
    noticias = noticias.slice(0, 8);

    if (noticias.length === 0) {
      grid.innerHTML = '<div class="col-span-full text-center py-12 text-cremadark">No hay noticias públicas en este momento.</div>';
      return;
    }

    let html = '';
    noticias.forEach((noticia, index) => {
      const imagenPrincipal = noticia.imagenes && noticia.imagenes.length > 0
        ? noticia.imagenes.find(img => img.orden === 0)?.url || noticia.imagenes[0].url
        : 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=600&auto=format&fit=crop';

      let fechaTexto = '';
      if (noticia.fecha_publicacion) {
        fechaTexto = new Date(noticia.fecha_publicacion).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
      }

      const delay = index * 0.1;
      const revealClass = index % 4 === 0 ? 'reveal-up' : index % 4 === 1 ? 'reveal-left' : index % 4 === 2 ? 'reveal-right' : 'reveal-zoom';
      const noticiaSegura = btoa(unescape(encodeURIComponent(JSON.stringify(noticia))));

      html += `
        <article class="interactive-card bg-cardbg rounded-xl overflow-hidden shadow-lg border border-dorado/10 flex flex-col ${revealClass}" style="transition-delay: ${delay}s">
          <div class="h-64 overflow-hidden relative cursor-pointer group" onclick="abrirNoticiaDesdeBase64('${noticiaSegura}')">
            <img src="${imagenPrincipal}" alt="${noticia.titulo}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                 onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=600&auto=format&fit=crop';">
            <div class="absolute top-4 left-4 bg-dorado text-vinodark text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-sm shadow-md">
              ${noticia.categoria || 'Novedad'}
            </div>
          </div>
          <div class="p-6 flex-grow flex flex-col justify-between text-crema">
            <div>
              ${fechaTexto ? `<time class="text-xs text-dorado mb-3 font-semibold tracking-widest block"><i class="fa-regular fa-calendar mr-2"></i>${fechaTexto}</time>` : ''}
              <h3 class="font-serif text-xl mb-3 leading-snug hover:text-dorado transition-colors cursor-pointer" onclick="abrirNoticiaDesdeBase64('${noticiaSegura}')">
                ${noticia.titulo}
              </h3>
              <p class="text-cremadark font-light text-sm line-clamp-3 mb-4">${noticia.resumen}</p>
            </div>
            <button onclick="abrirNoticiaDesdeBase64('${noticiaSegura}')" class="text-dorado font-bold text-xs uppercase tracking-widest hover:text-crema transition-colors text-left flex items-center gap-2 mt-auto">
              Leer completo <i class="fa-solid fa-arrow-right text-xs"></i>
            </button>
          </div>
        </article>
      `;
    });

    grid.innerHTML = html;
    document.querySelectorAll('#newsGrid .reveal-up, #newsGrid .reveal-left, #newsGrid .reveal-right, #newsGrid .reveal-zoom')
      .forEach(el => observer.observe(el));

  } catch (error) {
    console.error('Error cargando noticias:', error);
    grid.innerHTML = '<div class="col-span-full text-center py-12 text-dorado">Hubo un problema al cargar las noticias. Por favor, recarga la página.</div>';
  }
}

// ================================================================
// AUTORES
// ================================================================
async function cargarAutoresPublicos() {
  const container = document.getElementById('autoresGrid');
  const btnVerMas = document.getElementById('btnVerMasAutores');
  if (!container) return;

  const db = window.db || (typeof db !== 'undefined' ? db : null);
  if (!db) {
    container.innerHTML = '<div class="col-span-full text-center py-12 text-red-500">Error: No se detecta la conexión a Firebase.</div>';
    return;
  }

  try {
    const snapshot = await db.collection('autores').get();
    container.innerHTML = '';

    if (snapshot.empty) {
      container.innerHTML = '<div class="col-span-full text-center py-12 text-cremadark">Próximamente revelaremos nuestros talentos.</div>';
      if (btnVerMas) btnVerMas.style.display = 'none';
      return;
    }

    let autores = snapshot.docs.map(doc => doc.data());
    autores.sort((a, b) => {
      const fechaA = a.creado_en ? a.creado_en.toMillis() : 0;
      const fechaB = b.creado_en ? b.creado_en.toMillis() : 0;
      return fechaB - fechaA;
    });

    autoresData = autores.filter(autor => autor.publicado !== false);

    if (autoresData.length === 0) {
      container.innerHTML = '<div class="col-span-full text-center py-12 text-cremadark">Próximamente revelaremos nuestros talentos.</div>';
      if (btnVerMas) btnVerMas.style.display = 'none';
      return;
    }

    let html = '';
    autoresData.forEach((autor, index) => {
      const foto = autor.foto || '';
      const biografia = autor.biografia || autor.bio || 'Sin biografía disponible.';
      const revealClass = index % 3 === 0 ? 'reveal-up' : index % 3 === 1 ? 'reveal-left' : 'reveal-right';
      const delay = (index < 4) ? index * 0.1 : 0;
      const oculto = index >= 4 ? 'hidden' : '';

      let redesHTML = '';
      if (autor.redes?.instagram || autor.instagram) redesHTML += `<a href="${autor.redes?.instagram || autor.instagram}" target="_blank" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>`;
      if (autor.redes?.facebook || autor.facebook) redesHTML += `<a href="${autor.redes?.facebook || autor.facebook}" target="_blank" aria-label="Facebook"><i class="fa-brands fa-facebook"></i></a>`;
      if (autor.redes?.twitter || autor.twitter) redesHTML += `<a href="${autor.redes?.twitter || autor.twitter}" target="_blank" aria-label="Twitter"><i class="fa-brands fa-x-twitter"></i></a>`;
      if (autor.redes?.web || autor.enlace_venta || autor.web) redesHTML += `<a href="${autor.redes?.web || autor.enlace_venta || autor.web}" target="_blank" aria-label="Web"><i class="fa-solid fa-globe"></i></a>`;

      html += `
        <article class="author-card ${oculto} ${revealClass}" style="transition-delay: ${delay}s">
          <img src="${foto}" alt="${autor.nombre}" class="author-image object-cover w-full h-64 rounded-t-lg"
               onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop';">
          <div class="p-4 flex flex-col flex-grow bg-white border border-t-0 border-dorado/20 rounded-b-lg">
            <h3 class="font-serif text-2xl mt-2 mb-1">${autor.nombre}</h3>
            <p class="text-dorado text-sm italic mb-3">${autor.genero || 'Talento Punto y Coma'}</p>
            <p class="text-cremadark text-sm line-clamp-3 mb-4">${biografia}</p>
            <div class="author-social flex gap-4 text-dorado text-lg mb-4 mt-auto">${redesHTML}</div>
            <div class="author-actions flex justify-between items-center border-t border-dorado/20 pt-4">
              <button onclick="openAuthorModal(${index})" class="text-xs uppercase tracking-widest hover:text-dorado transition font-bold">Ver más</button>
              <button type="button" onclick="openQRModal('${autor.nombre}', '${autor.enlace_venta || '#libreria'}')" class="text-xs uppercase tracking-widest text-dorado hover:text-crema transition font-bold">
                <i class="fa-solid fa-qrcode text-sm"></i> QR
              </button>
            </div>
          </div>
        </article>
      `;
    });

    container.innerHTML = html;
    document.querySelectorAll('#autoresGrid .reveal-up, #autoresGrid .reveal-left, #autoresGrid .reveal-right')
      .forEach(el => observer.observe(el));

    if (btnVerMas) {
      if (autoresData.length > 4) {
        btnVerMas.style.display = 'inline-block';
        btnVerMas.onclick = () => {
          const ocultos = container.querySelectorAll('.author-card.hidden');
          ocultos.forEach(el => el.classList.remove('hidden'));
          btnVerMas.style.display = 'none';
        };
      } else {
        btnVerMas.style.display = 'none';
      }
    }

  } catch (error) {
    console.error("Error al cargar los autores:", error);
    container.innerHTML = '<div class="col-span-full text-center py-12 text-red-500">Error al cargar la lista de autores.</div>';
  }
}

// ================================================================
// LIBROS (con filtros y modal)
// ================================================================

function generarHTMLlibros(libros) {
  if (!libros || libros.length === 0) {
    return '<div class="col-span-full text-center py-12 text-cremadark">No se encontraron libros.</div>';
  }

  let html = '';
  libros.forEach((libro, index) => {
    const portada = libro.portada || 'https://via.placeholder.com/400x600?text=Sin+portada';
    const delay = index * 0.1;
    const revealClass = index % 3 === 0 ? 'reveal-up' : index % 3 === 1 ? 'reveal-left' : 'reveal-right';
    const esDestacado = libro.destacado || false;
    const precio = libro.precio ? `$${libro.precio}` : '';

    const libroData = encodeURIComponent(JSON.stringify(libro));

    html += `
      <article class="book-card ${revealClass}" style="transition-delay: ${delay}s" data-libro='${libroData}'>
        <div class="book-image-wrapper" onclick="abrirModalLibro(JSON.parse(decodeURIComponent(this.parentElement.dataset.libro)))">
          <img src="${portada}" alt="${libro.titulo}" class="book-image" loading="lazy" onerror="this.src='https://via.placeholder.com/400x600?text=Error'">
          ${esDestacado ? `<span class="book-badge">Destacado</span>` : ''}
        </div>
        <div class="book-info">
          <h3 class="book-title">${libro.titulo}</h3>
          <p class="book-author">${libro.autor}</p>
          ${precio ? `<p class="book-price">${precio}</p>` : ''}
          <p class="book-description">${libro.descripcion}</p>
          <div class="book-actions">
            <button onclick="abrirModalLibro(JSON.parse(decodeURIComponent(this.closest('.book-card').dataset.libro)))" class="book-btn-detail">Ver detalles</button>
            <a href="${libro.enlace_compra}" target="_blank" class="book-btn">Comprar ahora <i class="fa-solid fa-arrow-right"></i></a>
          </div>
        </div>
      </article>
    `;
  });
  return html;
}

// Cargar libros desde Firestore
async function cargarLibrosPublicos() {
  const grid = document.getElementById('librosGrid');
  const verMasContainer = document.getElementById('librosVerMasContainer');
  if (!grid) return;

  const db = window.db || (typeof db !== 'undefined' ? db : null);
  if (!db) {
    grid.innerHTML = '<div class="col-span-full text-center py-12 text-red-500">Error de conexión.</div>';
    return;
  }

  try {
    const snapshot = await db.collection('libros').get();
    if (snapshot.empty) {
      grid.innerHTML = '<div class="col-span-full text-center py-12 text-cremadark">Próximamente nuevos títulos.</div>';
      return;
    }

    let libros = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        destacado: data.destacado || false,
        precio: data.precio || '',
        descripcion: data.descripcion || data.sinopsis || '',
        enlace_compra: data.enlace_compra || '#',
        autor: data.autor || 'Autor por definir',
        categoria: data.categoria || '' // para filtros
      };
    });

    libros = libros.filter(libro => libro.publicado !== false);
    libros.sort((a, b) => {
      const fa = a.fecha_creacion ? a.fecha_creacion.toMillis() : 0;
      const fb = b.fecha_creacion ? b.fecha_creacion.toMillis() : 0;
      return fb - fa;
    });

    if (libros.length === 0) {
      grid.innerHTML = '<div class="col-span-full text-center py-12 text-cremadark">Próximamente nuevos títulos.</div>';
      return;
    }

    todosLosLibros = libros;
    librosFiltrados = [...libros];
    aplicarFiltros(); // esto muestra los filtrados

    // Inicializar el selector de categorías (si existe)
    const filtroCategoria = document.getElementById('filtroCategoriaLibros');
    if (filtroCategoria) {
      // Obtener categorías únicas
      const categorias = [...new Set(libros.map(l => l.categoria).filter(c => c))];
      categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        filtroCategoria.appendChild(option);
      });
    }

  } catch (error) {
    console.error('Error cargando libros:', error);
    grid.innerHTML = '<div class="col-span-full text-center py-12 text-dorado">Error al cargar los libros. Recarga la página.</div>';
  }
}

// Aplicar filtros de búsqueda y categoría
function aplicarFiltros() {
  const grid = document.getElementById('librosGrid');
  const verMasContainer = document.getElementById('librosVerMasContainer');
  if (!grid || !todosLosLibros.length) return;

  const filtroTexto = document.getElementById('filtroLibros')?.value.toLowerCase().trim() || '';
  const filtroCategoria = document.getElementById('filtroCategoriaLibros')?.value || '';

  // Filtrar
  let filtrados = todosLosLibros.filter(libro => {
    const coincideTexto = libro.titulo.toLowerCase().includes(filtroTexto) ||
                          libro.autor.toLowerCase().includes(filtroTexto);
    const coincideCategoria = filtroCategoria === '' || libro.categoria === filtroCategoria;
    return coincideTexto && coincideCategoria;
  });

  librosFiltrados = filtrados;

  // Mostrar primeros 12
  const primeros = filtrados.slice(0, librosMostrados);
  grid.innerHTML = generarHTMLlibros(primeros);

  // Mostrar u ocultar "Ver más"
  if (filtrados.length > librosMostrados) {
    verMasContainer.classList.remove('hidden');
  } else {
    verMasContainer.classList.add('hidden');
  }

  // Aplicar efecto 3D
  aplicarEfecto3D();

  // Observer para las nuevas tarjetas
  document.querySelectorAll('#librosGrid .book-card').forEach(el => observer.observe(el));

  // Resetear el contador de "Ver más" para que funcione con los filtrados
  // (la función verMasLibros usará librosFiltrados)
}

function verMasLibros() {
  const grid = document.getElementById('librosGrid');
  const verMasContainer = document.getElementById('librosVerMasContainer');
  if (!grid || !librosFiltrados.length) return;

  const actuales = grid.querySelectorAll('.book-card').length;
  const siguientes = librosFiltrados.slice(actuales, actuales + librosMostrados);
  if (!siguientes.length) {
    verMasContainer.classList.add('hidden');
    return;
  }

  const nuevoHTML = generarHTMLlibros(siguientes);
  grid.insertAdjacentHTML('beforeend', nuevoHTML);

  aplicarEfecto3D();
  document.querySelectorAll('#librosGrid .book-card').forEach(el => observer.observe(el));

  if (grid.querySelectorAll('.book-card').length >= librosFiltrados.length) {
    verMasContainer.classList.add('hidden');
  }
}

// ================================================================
// MODAL LIBRO
// ================================================================
function abrirModalLibro(libro) {
  const modal = document.getElementById('libro-modal');
  const content = document.getElementById('libro-modal-content');
  if (!modal || !content) return;

  const portada = libro.portada || 'https://via.placeholder.com/400x600?text=Sin+portada';
  const precio = libro.precio ? `$${libro.precio}` : 'Precio no disponible';
  const enlace = libro.enlace_compra || '#';

  content.innerHTML = `
    <div class="flex flex-col md:flex-row gap-6">
      <div class="md:w-1/3 flex justify-center">
        <img src="${portada}" alt="${libro.titulo}" class="w-full max-w-xs rounded-lg shadow-lg" onerror="this.src='https://via.placeholder.com/400x600?text=Error'">
      </div>
      <div class="md:w-2/3">
        <h2 class="font-serif text-3xl text-crema mb-2">${libro.titulo}</h2>
        <p class="text-dorado text-lg italic mb-3">${libro.autor || 'Autor por definir'}</p>
        <p class="text-2xl font-bold text-dorado mb-4">${precio}</p>
        <div class="prose prose-sm max-w-none text-cremadark leading-relaxed mb-6">
          ${libro.sinopsis || libro.descripcion || 'Sin sinopsis disponible.'}
        </div>
        <a href="${enlace}" target="_blank" class="inline-flex items-center gap-3 bg-dorado text-vinodark px-8 py-4 font-semibold uppercase tracking-widest hover:bg-crema transition-colors shadow-lg btn-glow">
          Comprar ahora <i class="fa-solid fa-arrow-right"></i>
        </a>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  setTimeout(() => {
    modal.classList.remove('opacity-0');
    modal.firstElementChild.classList.remove('scale-95');
  }, 10);
}

// ================================================================
// VIDEOS
// ================================================================
function generarHTMLvideos(videos) {
  let html = '';
  videos.forEach((video, index) => {
    const miniatura = video.miniatura || 'https://via.placeholder.com/480x360?text=Sin+miniatura';
    const delay = index * 0.1;
    const revealClass = index % 3 === 0 ? 'reveal-up' : index % 3 === 1 ? 'reveal-left' : 'reveal-right';
    const fecha = video.fecha_publicacion || (video.fecha_creacion ? new Date(video.fecha_creacion.toMillis()).toLocaleDateString('es-CO') : '');

    html += `
      <div class="video-card ${revealClass}" style="transition-delay: ${delay}s">
        <div class="video-thumbnail" onclick="abrirVideo('${video.url}')">
          <img src="${miniatura}" alt="${video.titulo}" loading="lazy" onerror="this.src='https://via.placeholder.com/480x360?text=Error'">
          <div class="play-icon">
            <i class="fa-solid fa-play"></i>
          </div>
        </div>
        <div class="video-info">
          <h3>${video.titulo}</h3>
          <p>${video.descripcion || ''}</p>
          ${fecha ? `<span class="video-date"><i class="fa-regular fa-calendar mr-1"></i>${fecha}</span>` : ''}
          ${video.destacado ? '<span class="video-badge">Destacado</span>' : ''}
        </div>
      </div>
    `;
  });
  return html;
}

async function cargarVideosPublicos() {
  const grid = document.getElementById('videosGrid');
  const verMasContainer = document.getElementById('videosVerMasContainer');
  if (!grid) return;

  const db = window.db || (typeof db !== 'undefined' ? db : null);
  if (!db) {
    grid.innerHTML = '<div class="col-span-full text-center py-12 text-red-500">Error de conexión.</div>';
    return;
  }

  try {
    const snapshot = await db.collection('videos').get();
    if (snapshot.empty) {
      grid.innerHTML = '<div class="col-span-full text-center py-12 text-cremadark">Próximamente contenido multimedia.</div>';
      return;
    }

    let videos = snapshot.docs.map(doc => doc.data());
    videos = videos.filter(video => video.publicado !== false);
    videos.sort((a, b) => {
      const fa = a.fecha_creacion ? a.fecha_creacion.toMillis() : 0;
      const fb = b.fecha_creacion ? b.fecha_creacion.toMillis() : 0;
      return fb - fa;
    });

    if (videos.length === 0) {
      grid.innerHTML = '<div class="col-span-full text-center py-12 text-cremadark">Próximamente contenido multimedia.</div>';
      return;
    }

    todosLosVideos = videos;

    const videosIniciales = videos.slice(0, videosMostrados);
    grid.innerHTML = generarHTMLvideos(videosIniciales);

    if (videos.length > videosMostrados) {
      verMasContainer.classList.remove('hidden');
    } else {
      verMasContainer.classList.add('hidden');
    }

    document.querySelectorAll('#videosGrid .reveal-up, #videosGrid .reveal-left, #videosGrid .reveal-right')
      .forEach(el => observer.observe(el));

  } catch (error) {
    console.error('Error cargando videos:', error);
    grid.innerHTML = '<div class="col-span-full text-center py-12 text-dorado">Error al cargar los videos.</div>';
  }
}

function verMasVideos() {
  const grid = document.getElementById('videosGrid');
  const verMasContainer = document.getElementById('videosVerMasContainer');
  if (!grid || !todosLosVideos.length) return;

  const actuales = grid.querySelectorAll('.video-card').length;
  const siguientes = todosLosVideos.slice(actuales, actuales + videosMostrados);
  if (!siguientes.length) {
    verMasContainer.classList.add('hidden');
    return;
  }

  const nuevoHTML = generarHTMLvideos(siguientes);
  grid.insertAdjacentHTML('beforeend', nuevoHTML);

  document.querySelectorAll('#videosGrid .video-card').forEach(el => observer.observe(el));

  if (grid.querySelectorAll('.video-card').length >= todosLosVideos.length) {
    verMasContainer.classList.add('hidden');
  }
}

// ================================================================
// EFECTO 3D EN LIBROS
// ================================================================
function aplicarEfecto3D() {
  const cards = document.querySelectorAll('.book-card');
  if (!cards.length) return;

  cards.forEach(card => {
    card.removeEventListener('mousemove', card._3dHandler);
    card.removeEventListener('mouseleave', card._3dLeaveHandler);

    const handler = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -12;
      const rotateY = ((x - centerX) / centerX) * 12;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`;
      card.style.transition = 'transform 0.1s ease';
    };

    const leaveHandler = () => {
      card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)';
      card.style.transition = 'transform 0.4s ease';
    };

    card.addEventListener('mousemove', handler);
    card.addEventListener('mouseleave', leaveHandler);

    card._3dHandler = handler;
    card._3dLeaveHandler = leaveHandler;
  });
}

// ================================================================
// MODALES (AUTOR, NOTICIA, QR)
// ================================================================
function openAuthorModal(index) {
  const autor = autoresData[index];
  if (!autor) return;
  const modal = document.getElementById('author-modal');
  const photo = document.getElementById('author-modal-photo');
  const name = document.getElementById('author-modal-name');
  const genre = document.getElementById('author-modal-genre');
  const bio = document.getElementById('author-modal-bio');
  const social = document.getElementById('author-modal-social');
  const link = document.getElementById('author-modal-link');

  photo.src = autor.foto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop';
  name.textContent = autor.nombre;
  genre.textContent = autor.genero || 'Talento Punto y Coma';
  bio.textContent = autor.biografia || autor.bio || 'Sin biografía disponible.';

  let socialHTML = '';
  if (autor.redes?.instagram || autor.instagram) socialHTML += `<a href="${autor.redes?.instagram || autor.instagram}" target="_blank"><i class="fa-brands fa-instagram"></i></a>`;
  if (autor.redes?.facebook || autor.facebook) socialHTML += `<a href="${autor.redes?.facebook || autor.facebook}" target="_blank"><i class="fa-brands fa-facebook"></i></a>`;
  if (autor.redes?.twitter || autor.twitter) socialHTML += `<a href="${autor.redes?.twitter || autor.twitter}" target="_blank"><i class="fa-brands fa-x-twitter"></i></a>`;
  if (autor.redes?.web || autor.enlace_venta || autor.web) socialHTML += `<a href="${autor.redes?.web || autor.enlace_venta || autor.web}" target="_blank"><i class="fa-solid fa-globe"></i></a>`;
  social.innerHTML = socialHTML;

  link.href = autor.enlace_venta || autor.redes?.web || '#libreria';
  link.textContent = 'Ver libros';

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  setTimeout(() => {
    modal.classList.remove('opacity-0');
    modal.firstElementChild.classList.remove('scale-95');
  }, 10);
}

function closeAuthorModal() {
  const modal = document.getElementById('author-modal');
  if (!modal) return;
  modal.classList.add('opacity-0');
  modal.firstElementChild.classList.add('scale-95');
  setTimeout(() => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }, 250);
}

window.abrirNoticiaDesdeBase64 = function(base64Data) {
  try {
    const jsonString = decodeURIComponent(escape(atob(base64Data)));
    const noticia = JSON.parse(jsonString);
    abrirModalNoticia(noticia);
  } catch (e) {
    console.error("Error decodificando la noticia", e);
  }
};

function abrirModalNoticia(noticia) {
  const modal = document.getElementById('news-modal');
  const content = document.getElementById('modal-content-body');
  if (!modal || !content) return;

  content.innerHTML = `
    <div class="p-8 md:p-10 text-crema">
      <p class="text-dorado text-xs uppercase tracking-widest mb-3">
        ${noticia.categoria || 'Noticias'} ${noticia.fecha_publicacion ? '· ' + noticia.fecha_publicacion : ''}
      </p>
      <h3 class="font-serif text-3xl mb-5">${noticia.titulo}</h3>
      ${noticia.autor ? `<p class="text-cremadark mb-5">Por ${noticia.autor}</p>` : ''}
      <div class="text-cremadark leading-relaxed whitespace-pre-wrap">
        ${noticia.contenido || noticia.resumen || ''}
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  setTimeout(() => {
    modal.classList.remove('opacity-0');
    modal.firstElementChild.classList.remove('scale-95');
  }, 10);
}

function closeNewsModal() {
  const modal = document.getElementById('news-modal');
  if (!modal) return;
  modal.classList.add('opacity-0');
  modal.firstElementChild.classList.add('scale-95');
  setTimeout(() => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }, 250);
}

window.openQRModal = function(author, path) {
  const modal = document.getElementById('qr-modal');
  if (!modal) return;
  document.getElementById('qr-author-name').textContent = author;
  const url = new URL(path, window.location.href).href;
  document.getElementById('qr-image').src = 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&color=2C0E14&data=' + encodeURIComponent(url);

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  setTimeout(() => {
    modal.classList.remove('opacity-0');
    modal.firstElementChild.classList.remove('scale-95');
  }, 10);
};

window.closeQRModal = function() {
  const modal = document.getElementById('qr-modal');
  if (!modal) return;
  modal.classList.add('opacity-0');
  modal.firstElementChild.classList.add('scale-95');
  setTimeout(() => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }, 250);
};

// ================================================================
// UTILIDADES
// ================================================================
function abrirVideo(url) {
  window.open(url, '_blank');
}

// ================================================================
// INTERSECTION OBSERVER
// ================================================================
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right, .reveal-zoom')
    .forEach(el => observer.observe(el));
});