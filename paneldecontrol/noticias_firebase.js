function recortarTexto(texto, max = 160) {
  if (!texto) return "";
  if (texto.length <= max) return texto;
  const corte = texto.lastIndexOf(" ", max);
  return texto.substring(0, corte > 0 ? corte : max) + "...";
}

// CARRUSEL (reutilizado para portada de noticia y modal)
function crearCarruselHTML(imagenes, noticiaId) {
  if (!imagenes || imagenes.length === 0) {
    return `<div class="news-image-placeholder">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-14 h-14 text-secondary/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6M8 6h8a2 2 0 012 2v12l-4-2-4 2-4-2-4 2V8a2 2 0 012-2z" />
              </svg>
            </div>`;
  }

  const imagenesOrdenadas = [...imagenes].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

  return `
    <div class="carousel-container" id="carousel-${noticiaId}">
      <div class="carousel-images">
        ${imagenesOrdenadas.map((img, index) => `
          <img
            src="${img.url}"
            alt="Imagen ${index + 1}"
            class="carousel-image ${index === 0 ? 'active' : ''}"
            loading="lazy"
          />
        `).join('')}
      </div>

      ${imagenes.length > 1 ? `
        <button class="carousel-btn carousel-prev" onclick="cambiarImagen('${noticiaId}', -1)">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button class="carousel-btn carousel-next" onclick="cambiarImagen('${noticiaId}', 1)">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div class="carousel-indicators">
          ${imagenesOrdenadas.map((_, index) => `
            <span class="indicator ${index === 0 ? 'active' : ''}" onclick="irAImagen('${noticiaId}', ${index})"></span>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function cambiarImagen(noticiaId, direccion) {
  const carousel = document.getElementById(`carousel-${noticiaId}`);
  const imagenes = carousel.querySelectorAll('.carousel-image');
  const indicators = carousel.querySelectorAll('.indicator');

  let indexActual = Array.from(imagenes).findIndex(img => img.classList.contains('active'));
  let nuevoIndex = indexActual + direccion;

  if (nuevoIndex >= imagenes.length) nuevoIndex = 0;
  if (nuevoIndex < 0) nuevoIndex = imagenes.length - 1;

  imagenes[indexActual].classList.remove('active');
  imagenes[nuevoIndex].classList.add('active');

  if (indicators.length > 0) {
    indicators[indexActual].classList.remove('active');
    indicators[nuevoIndex].classList.add('active');
  }
}

function irAImagen(noticiaId, index) {
  const carousel = document.getElementById(`carousel-${noticiaId}`);
  const imagenes = carousel.querySelectorAll('.carousel-image');
  const indicators = carousel.querySelectorAll('.indicator');

  const indexActual = Array.from(imagenes).findIndex(img => img.classList.contains('active'));

  imagenes[indexActual].classList.remove('active');
  imagenes[index].classList.add('active');

  if (indicators.length > 0) {
    indicators[indexActual].classList.remove('active');
    indicators[index].classList.add('active');
  }
}

// TARJETA DE NOTICIA
function crearTarjetaNoticia(noticia) {
  return `
    <article
      class="news-card reveal active"
      data-news
      data-category="${(noticia.categoria || '').toLowerCase()}"
    >
      ${crearCarruselHTML(noticia.imagenes, noticia.id)}

      <div class="p-4 md:p-5">
        <div class="flex items-center gap-2 mb-2 flex-wrap">
          ${noticia.categoria ? `<span class="inline-block text-dorado text-[10px] font-semibold uppercase tracking-[.15em]">${noticia.categoria}</span>` : ''}
          ${noticia.destacado ? '<span class="inline-block text-cremadark text-[10px] font-medium">Destacado</span>' : ''}
        </div>

        <h3 class="font-serif font-semibold text-base md:text-lg mb-2">${noticia.titulo}</h3>

        <p class="text-[11px] opacity-70 mb-3 flex items-center gap-3">
          ${noticia.fecha_publicacion ? `<span>${noticia.fecha_publicacion}</span>` : ''}
          ${noticia.autor ? `<span>Por ${noticia.autor}</span>` : ''}
        </p>

        <div class="descripcion-container mb-4">
          <p class="text-[0.80rem] leading-relaxed descripcion-texto descripcion-clamp">
            ${recortarTexto(noticia.resumen || noticia.contenido)}
          </p>
        </div>

        <button onclick="abrirModalDesdeId('${noticia.id}')" class="w-full inline-flex items-center justify-center px-3 py-2 text-xs font-medium transition mt-auto">
          Leer noticia completa
        </button>
      </div>
    </article>
  `;
}

// CARGAR NOTICIAS
window.noticiasCargadas = {};

async function cargarNoticias() {
  const container = document.getElementById('newsGrid');

  if (!container) {
    console.error('Contenedor de noticias no encontrado');
    return;
  }

  try {
    container.innerHTML = `
      <div class="col-span-full flex justify-center items-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p class="text-sm text-darktext/50">Cargando noticias...</p>
        </div>
      </div>
    `;

    const snapshot = await db.collection('noticias')
      .orderBy('destacado', 'desc')
      .orderBy('fecha_creacion', 'desc')
      .get();

    if (snapshot.empty) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <p class="text-darktext/50">Aún no hay noticias publicadas.</p>
        </div>
      `;
      return;
    }

    const noticias = snapshot.docs.map(doc => {
      const data = { id: doc.id, ...doc.data() };
      window.noticiasCargadas[doc.id] = data;
      return data;
    });

    let noticiasHTML = '';
    noticias.forEach((noticia, index) => {
      if (index < 6) {
        noticiasHTML += crearTarjetaNoticia(noticia);
      } else {
        noticiasHTML += `<div class="noticia-oculta hidden">${crearTarjetaNoticia(noticia)}</div>`;
      }
    });

    container.innerHTML = noticiasHTML;

    // Abrir modal automáticamente si viene ?noticia=ID en la URL
    const parametrosUrl = new URLSearchParams(window.location.search);
    const idNoticiaUrl = parametrosUrl.get('noticia');

    if (idNoticiaUrl && window.noticiasCargadas[idNoticiaUrl]) {
      setTimeout(() => {
        window.abrirModalDesdeId(idNoticiaUrl);
      }, 500);
    }

    if (noticias.length > 6) {
      container.insertAdjacentHTML('afterend', `
        <div class="text-center mt-6">
          <button id="btnVerMasNoticias"
            class="px-6 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition">
              Cargar más noticias
          </button>
        </div>
      `);

      document.getElementById("btnVerMasNoticias").addEventListener("click", function () {
        document.querySelectorAll(".noticia-oculta").forEach(div => {
          div.classList.remove("hidden");
        });
        this.style.display = "none";
      });
    }

  } catch (error) {
    console.error('Error al cargar noticias:', error);
    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <p class="text-red-500 mb-2">Error al cargar las noticias</p>
        <button onclick="cargarNoticias()" class="text-sm text-primary hover:underline">
          Intentar nuevamente
        </button>
      </div>
    `;
  }
}

window.abrirModalDesdeId = function (id) {
  const noticia = window.noticiasCargadas[id];
  if (noticia && typeof window.abrirModalNoticia === 'function') {
    window.abrirModalNoticia(noticia);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  cargarNoticias();
});

window.cambiarImagen = cambiarImagen;
window.irAImagen = irAImagen;
window.cargarNoticias = cargarNoticias;
