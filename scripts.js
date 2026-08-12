// ==========================================
// CONFIGURACIÓN WHATSAPP Y CONTACTOS
// ==========================================
const EDITORIAL_WHATSAPP = "573116060210"; 
const EDITORIAL_EMAIL = "puntoycoma.ediciontextos@gmail.com"; 

function linkWhatsapp(mensaje) {
  return `https://wa.me/${EDITORIAL_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
}

// Asignar enlaces WhatsApp
document.addEventListener("DOMContentLoaded", () => {
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

  // Botón WhatsApp flotante
  const whatsappButton = document.getElementById('whatsapp-float');
  if (whatsappButton) {
    whatsappButton.addEventListener('click', () => {
      window.open(linkWhatsapp('Hola, me gustaría recibir información sobre Editorial Punto y Coma.'), '_blank');
    });
  }

  // Cargar noticias y autores
  setTimeout(() => {
    cargarNoticiasPublicas();
    cargarAutoresPublicos();
  }, 500);
});

// ==========================================
// CARGA DE NOTICIAS (PÚBLICO)
// ==========================================
async function cargarNoticiasPublicas() {
  const grid = document.getElementById('newsGrid');
  if (!grid) return;

  const baseDatos = window.db || (typeof db !== 'undefined' ? db : null);
  if (!baseDatos) {
    grid.innerHTML = '<div class="col-span-full text-center py-12 text-red-500">Error: No se detecta la conexión a Firebase.</div>';
    return;
  }

  try {
    const snapshot = await baseDatos.collection('noticias').get();
    if (snapshot.empty) {
      grid.innerHTML = '<div class="col-span-full text-center py-12 text-cremadark">Próximamente compartiremos nuevas historias y novedades.</div>';
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

    const noticiasHTML = noticias.map((noticia, index) => {
      const imagenPrincipal = noticia.imagenes && noticia.imagenes.length > 0
        ? noticia.imagenes.find(img => img.orden === 0)?.url || noticia.imagenes[0].url
        : 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=600&auto=format&fit=crop';

      let fechaTexto = '';
      if (noticia.fecha_publicacion) {
        fechaTexto = new Date(noticia.fecha_publicacion).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
      }

      const delay = index * 0.1;
      const noticiaSegura = btoa(unescape(encodeURIComponent(JSON.stringify(noticia))));

      return `
        <article class="interactive-card bg-cardbg rounded-xl overflow-hidden shadow-lg border border-dorado/10 flex flex-col reveal active" style="transition-delay: ${delay}s">
          <div class="h-48 overflow-hidden relative cursor-pointer group" onclick="abrirNoticiaDesdeBase64('${noticiaSegura}')">
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
    }).join('');

    grid.innerHTML = noticiasHTML;

  } catch (error) {
    console.error('Error cargando noticias:', error);
    grid.innerHTML = '<div class="col-span-full text-center py-12 text-dorado">Hubo un problema al cargar las noticias. Por favor, recarga la página.</div>';
  }
}

// ==========================================
// CARGA DE AUTORES (PÚBLICO)
// ==========================================
async function cargarAutoresPublicos() {
  const container = document.getElementById('autoresGrid');
  if (!container) return;

  const baseDatos = window.db || (typeof db !== 'undefined' ? db : null);
  if (!baseDatos) {
    container.innerHTML = '<div class="col-span-full text-center py-12 text-red-500">Error: No se detecta la conexión a Firebase.</div>';
    return;
  }

  try {
    const snapshot = await baseDatos.collection('autores').get();
    container.innerHTML = '';

    if (snapshot.empty) {
      container.innerHTML = '<div class="col-span-full text-center py-12 text-cremadark">Próximamente revelaremos nuestros talentos.</div>';
      return;
    }

    let delay = 0;
    let autores = snapshot.docs.map(doc => doc.data());
    autores.sort((a, b) => {
      const fechaA = a.creado_en ? a.creado_en.toMillis() : 0;
      const fechaB = b.creado_en ? b.creado_en.toMillis() : 0;
      return fechaB - fechaA;
    });

    autores.forEach(autor => {
      if (autor.publicado === false) return;

      const foto = autor.foto || '';
      const biografia = autor.biografia || autor.bio || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop';

      let redesHTML = '';
      if (autor.redes?.instagram || autor.instagram) redesHTML += `<a href="${autor.redes?.instagram || autor.instagram}" target="_blank" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>`;
      if (autor.redes?.facebook || autor.facebook) redesHTML += `<a href="${autor.redes?.facebook || autor.facebook}" target="_blank" aria-label="Facebook"><i class="fa-brands fa-facebook"></i></a>`;
      if (autor.redes?.twitter || autor.twitter) redesHTML += `<a href="${autor.redes?.twitter || autor.twitter}" target="_blank" aria-label="Twitter"><i class="fa-brands fa-x-twitter"></i></a>`;
      if (autor.redes?.web || autor.enlace_venta || autor.web) redesHTML += `<a href="${autor.redes?.web || autor.enlace_venta || autor.web}" target="_blank" aria-label="Web"><i class="fa-solid fa-globe"></i></a>`;

      const articleHTML = `
        <article class="author-card reveal active" style="transition-delay:${delay}s">
          <img src="${foto}" alt="${autor.nombre}" class="author-image object-cover w-full h-64 rounded-t-lg"
               onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop';">
          <div class="p-4 flex flex-col flex-grow bg-white border border-t-0 border-dorado/20 rounded-b-lg">
            <h3 class="font-serif text-2xl mt-2 mb-1">${autor.nombre}</h3>
            <p class="text-dorado text-sm italic mb-3">${autor.genero || 'Talento Punto y Coma'}</p>
            <p class="text-cremadark text-sm line-clamp-3 mb-4">${biografia}</p>
            <div class="author-social flex gap-4 text-dorado text-lg mb-4 mt-auto">${redesHTML}</div>
            <div class="author-actions flex justify-between items-center border-t border-dorado/20 pt-4">
              <a href="${autor.enlace_venta || autor.redes?.web || '#libreria'}" target="_blank" class="text-xs uppercase tracking-widest hover:text-dorado transition font-bold">Ver Libros</a>
              <button type="button" onclick="openQRModal('${autor.nombre}', '${autor.enlace_venta || '#libreria'}')" class="text-xs uppercase tracking-widest text-dorado hover:text-crema transition font-bold">
                <i class="fa-solid fa-qrcode text-sm"></i> QR
              </button>
            </div>
          </div>
        </article>
      `;

      container.innerHTML += articleHTML;
      delay += 0.1;
    });

  } catch (error) {
    console.error("Error al cargar los autores:", error);
    container.innerHTML = '<div class="col-span-full text-center py-12 text-red-500">Error al cargar la lista de autores.</div>';
  }
}

// ==========================================
// CARGA DE AUTORES (PÚBLICO)
// ==========================================
async function cargarAutoresPublicos() {
  const container = document.getElementById('autoresGrid');
  const btnVerMas = document.getElementById('btnVerMasAutores'); // Seleccionamos el botón
  
  if (!container) return;

  const baseDatos = window.db || (typeof db !== 'undefined' ? db : null);
  if (!baseDatos) {
    container.innerHTML = '<div class="col-span-full text-center py-12 text-red-500">Error: No se detecta la conexión a Firebase.</div>';
    return;
  }

  try {
    const snapshot = await baseDatos.collection('autores').get();
    container.innerHTML = '';

    if (snapshot.empty) {
      container.innerHTML = '<div class="col-span-full text-center py-12 text-cremadark">Próximamente revelaremos nuestros talentos.</div>';
      if(btnVerMas) btnVerMas.style.display = 'none'; // Ocultar botón si no hay autores
      return;
    }

    let delay = 0;
    let autores = snapshot.docs.map(doc => doc.data());
    autores.sort((a, b) => {
      const fechaA = a.creado_en ? a.creado_en.toMillis() : 0;
      const fechaB = b.creado_en ? b.creado_en.toMillis() : 0;
      return fechaB - fechaA;
    });

    // Filtramos para usar solo los autores publicados
    const autoresPublicados = autores.filter(autor => autor.publicado !== false);

    autoresPublicados.forEach((autor, index) => {
      const foto = autor.foto || '';
      const biografia = autor.biografia || autor.bio || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop';

      let redesHTML = '';
      if (autor.redes?.instagram || autor.instagram) redesHTML += `<a href="${autor.redes?.instagram || autor.instagram}" target="_blank" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>`;
      if (autor.redes?.facebook || autor.facebook) redesHTML += `<a href="${autor.redes?.facebook || autor.facebook}" target="_blank" aria-label="Facebook"><i class="fa-brands fa-facebook"></i></a>`;
      if (autor.redes?.twitter || autor.twitter) redesHTML += `<a href="${autor.redes?.twitter || autor.twitter}" target="_blank" aria-label="Twitter"><i class="fa-brands fa-x-twitter"></i></a>`;
      if (autor.redes?.web || autor.enlace_venta || autor.web) redesHTML += `<a href="${autor.redes?.web || autor.enlace_venta || autor.web}" target="_blank" aria-label="Web"><i class="fa-solid fa-globe"></i></a>`;

      // LÓGICA CLAVE: Si el índice es mayor o igual a 4, le agregamos la clase 'hidden' de Tailwind
      const claseOculta = index >= 4 ? 'hidden' : '';

      const articleHTML = `
        <article class="author-card reveal active ${claseOculta}" style="transition-delay:${delay}s">
          <img src="${foto}" alt="${autor.nombre}" class="author-image object-cover w-full h-64 rounded-t-lg"
               onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop';">
          <div class="p-4 flex flex-col flex-grow bg-white border border-t-0 border-dorado/20 rounded-b-lg">
            <h3 class="font-serif text-2xl mt-2 mb-1">${autor.nombre}</h3>
            <p class="text-dorado text-sm italic mb-3">${autor.genero || 'Talento Punto y Coma'}</p>
            <p class="text-cremadark text-sm line-clamp-3 mb-4">${biografia}</p>
            <div class="author-social flex gap-4 text-dorado text-lg mb-4 mt-auto">${redesHTML}</div>
            <div class="author-actions flex justify-between items-center border-t border-dorado/20 pt-4">
              <a href="${autor.enlace_venta || autor.redes?.web || '#libreria'}" target="_blank" class="text-xs uppercase tracking-widest hover:text-dorado transition font-bold">Ver Libros</a>
              <button type="button" onclick="openQRModal('${autor.nombre}', '${autor.enlace_venta || '#libreria'}')" class="text-xs uppercase tracking-widest text-dorado hover:text-crema transition font-bold">
                <i class="fa-solid fa-qrcode text-sm"></i> QR
              </button>
            </div>
          </div>
        </article>
      `;

      container.innerHTML += articleHTML;
      
      // Solo le damos retraso de animación a los primeros 4 para que carguen bonito
      if (index < 4) delay += 0.1; 
    });

    // ACTIVAR EL BOTÓN DESPUÉS DE CARGAR LOS DATOS
    if (btnVerMas) {
        if (autoresPublicados.length > 4) {
            // Si hay más de 4 autores, nos aseguramos que el botón se vea
            btnVerMas.style.display = 'inline-block';
            
            // Le damos la orden al botón
            btnVerMas.onclick = () => {
                // Buscamos solo las tarjetas que están ocultas
                const autoresOcultos = container.querySelectorAll('.author-card.hidden');
                
                // Les quitamos la clase 'hidden' para mostrarlas
                autoresOcultos.forEach(autor => autor.classList.remove('hidden'));
                
                // Escondemos el botón ya que mostramos todo
                btnVerMas.style.display = 'none'; 
            };
        } else {
            // Si hay 4 autores o menos, escondemos el botón desde el principio
            btnVerMas.style.display = 'none';
        }
    }

  } catch (error) {
    console.error("Error al cargar los autores:", error);
    container.innerHTML = '<div class="col-span-full text-center py-12 text-red-500">Error al cargar la lista de autores.</div>';
  }
}

// FUNCIONES PARA MODALES (Noticias y QR)

window.abrirNoticiaDesdeBase64 = function(base64Data) {
  try {
    const jsonString = decodeURIComponent(escape(atob(base64Data)));
    const noticia = JSON.parse(jsonString);
    window.abrirModalNoticia(noticia);
  } catch(e) {
    console.error("Error decodificando la noticia", e);
  }
};

// Función para abrir el modal de noticia (definida globalmente)
window.abrirModalNoticia = function(noticia) {
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
};

// Cerrar modal de noticias
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('news-modal');
  const closeBtn = document.getElementById('close-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeNewsModal);
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeNewsModal();
    });
  }
});

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

// Funciones para QR
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

// Cerrar QR al hacer clic fuera
document.addEventListener('DOMContentLoaded', () => {
  const qrModal = document.getElementById('qr-modal');
  if (qrModal) {
    qrModal.addEventListener('click', (e) => {
      if (e.target === qrModal) window.closeQRModal();
    });
  }
});

// ==========================================
// INTERSECTION OBSERVER PARA REVEAL
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});