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

// ================================================================
// AUTENTICACIÓN ANÓNIMA (para permitir escritura en mensajes)
// ================================================================
if (firebase && firebase.auth) {
  firebase.auth().signInAnonymously()
    .then(() => console.log('🔓 Autenticación anónima exitosa'))
    .catch(error => console.warn('⚠️ Auth anónima falló:', error));
}

// ================================================================
// DOMContentLoaded - Asignación de eventos y carga inicial
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

  // Cerrar modal de contacto con clic fuera
  const contactoModal = document.getElementById('contacto-modal');
  if (contactoModal) {
    contactoModal.addEventListener('click', (e) => {
      if (e.target === contactoModal) cerrarModalContacto();
    });
  }

  // Cargar datos
  setTimeout(() => {
    cargarNoticiasPublicas();
    cargarAutoresPublicos();
    cargarLibrosPublicos();
  }, 500);
});

// ================================================================
// CONTACTO - MODAL Y ENVÍO A FIRESTORE
// ================================================================

// Abrir modal de contacto
window.abrirModalContacto = function() {
  const modal = document.getElementById('contacto-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  setTimeout(() => {
    modal.classList.remove('opacity-0');
    modal.firstElementChild.classList.remove('scale-95');
  }, 10);
  // Limpiar mensajes anteriores
  document.getElementById('contacto-respuesta').classList.add('hidden');
  document.getElementById('formContacto').reset();
};

// Cerrar modal de contacto
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

// Enviar mensaje de contacto (corregido)
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

  // Verificar que la base de datos esté disponible
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
    // Verificar que firebase y FieldValue están disponibles
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
    console.error('❌ Error detallado al enviar mensaje:', error);
    respuesta.textContent = `Error: ${error.message || 'No se pudo enviar el mensaje. Intenta nuevamente.'}`;
    respuesta.className = 'mt-4 text-red-600 text-sm font-medium block';
    respuesta.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Enviar mensaje';
  }
});

// ================================================================
// NOTICIAS PÚBLICAS
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
    noticias = noticias.slice(0, 6);

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
      const revealClass = index % 3 === 0 ? 'reveal-up' : index % 3 === 1 ? 'reveal-left' : 'reveal-right';
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
    document.querySelectorAll('#newsGrid .reveal-up, #newsGrid .reveal-left, #newsGrid .reveal-right').forEach(el => observer.observe(el));

  } catch (error) {
    console.error('Error cargando noticias:', error);
    grid.innerHTML = '<div class="col-span-full text-center py-12 text-dorado">Hubo un problema al cargar las noticias. Por favor, recarga la página.</div>';
  }
}

// ================================================================
// AUTORES PÚBLICOS
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
    document.querySelectorAll('#autoresGrid .reveal-up, #autoresGrid .reveal-left, #autoresGrid .reveal-right').forEach(el => observer.observe(el));

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
// LIBROS PÚBLICOS
// ================================================================
async function cargarLibrosPublicos() {
  const grid = document.getElementById('librosGrid');
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

    let libros = snapshot.docs.map(doc => doc.data());
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

    let html = '';
    libros.forEach((libro, index) => {
      const portada = libro.portada || 'https://via.placeholder.com/300x400?text=Sin+portada';
      const delay = index * 0.1;
      const revealClass = index % 3 === 0 ? 'reveal-up' : index % 3 === 1 ? 'reveal-left' : 'reveal-right';

      html += `
        <article class="book-card ${revealClass}" style="transition-delay: ${delay}s">
          <img src="${portada}" alt="${libro.titulo}" class="w-full h-64 object-cover rounded-t-lg" onerror="this.src='https://via.placeholder.com/300x400?text=Error'">
          <div class="p-4 bg-white rounded-b-lg border border-t-0 border-dorado/20">
            <h3 class="font-serif text-xl">${libro.titulo}</h3>
            <p class="text-dorado text-sm">${libro.autor || 'Editorial Punto y Coma'}</p>
            <p class="text-cremadark text-sm line-clamp-2 mt-2">${libro.descripcion || ''}</p>
            <a href="${libro.enlace_compra || '#'}" target="_blank" class="inline-block mt-3 border border-dorado text-dorado px-4 py-1 text-xs uppercase tracking-widest hover:bg-dorado hover:text-vinodark transition">Comprar</a>
          </div>
        </article>
      `;
    });

    grid.innerHTML = html;
    document.querySelectorAll('#librosGrid .reveal-up, #librosGrid .reveal-left, #librosGrid .reveal-right').forEach(el => observer.observe(el));

  } catch (error) {
    console.error('Error cargando libros:', error);
    grid.innerHTML = '<div class="col-span-full text-center py-12 text-dorado">Error al cargar los libros.</div>';
  }
}

// ================================================================
// MODAL AUTOR
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

// ================================================================
// MODAL NOTICIA
// ================================================================
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

// ================================================================
// MODAL QR
// ================================================================
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
  document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right, .reveal-zoom').forEach(el => observer.observe(el));
});