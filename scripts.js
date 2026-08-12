//CONFIGURACION WHATSAPP E-MAIL Y CONTACTOS
const EDITORIAL_WHATSAPP = "573116060210"; 
const EDITORIAL_EMAIL = "puntoycoma.ediciontextos@gmail.com"; 

function linkWhatsapp(mensaje) {
  return `https://wa.me/${EDITORIAL_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
}

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

  const emailText = document.getElementById("contact-email-text");
  if (emailText) emailText.textContent = EDITORIAL_EMAIL;

  const phoneText = document.getElementById("contact-phone-text");
  if (phoneText) phoneText.textContent = EDITORIAL_WHATSAPP.replace(/^56/, "+56 ");
});

// Año en footer
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Menú móvil
const mobileBtn = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');

if (mobileBtn && mobileMenu) {
  mobileBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
  });

  mobileMenu.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      mobileMenu.classList.add('hidden');
    }
  });
}

// Animaciones con IntersectionObserver
const observer = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('js-fade-show');
        obs.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll('.js-fade').forEach(el => {
  observer.observe(el);
});

// Botón WhatsApp flotante
const whatsappButton = document.getElementById('whatsapp-float');
if (whatsappButton) {
  whatsappButton.addEventListener('click', () => {
    window.open(linkWhatsapp('Hola, me gustaría recibir información sobre Editorial Punto y Coma.'), '_blank');
  });
}

// FORMULARIO DE CONTACTO
const contactForm = document.getElementById("contact-form");

if (contactForm) {
  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const data = {
      nombre: document.getElementById("nombre").value.trim(),
      telefono: document.getElementById("telefono").value.trim(),
      email: document.getElementById("email").value.trim(),
      tipo: document.getElementById("tipo-consulta").value.trim(),
      mensaje: document.getElementById("mensaje").value.trim(),
      fecha_creacion: (typeof firebase !== 'undefined') ? firebase.firestore.FieldValue.serverTimestamp() : new Date()
    };

    const btn = this.querySelector("button[type='submit']");
    btn.disabled = true;
    btn.textContent = "Enviando...";

    const finalizar = (ok) => {
      if (ok) {
        alert("Tu mensaje fue enviado con éxito. Te contactaremos pronto.");
        contactForm.reset();
      } else {
        alert("Hubo un problema al enviar tu mensaje. Puedes escribirnos directamente por WhatsApp.");
      }
      btn.disabled = false;
      btn.textContent = "Enviar consulta";
    };

    if (typeof db !== 'undefined') {
      db.collection('mensajes_contacto').add(data)
        .then(() => finalizar(true))
        .catch(err => {
          console.error('Error al guardar el mensaje:', err);
          finalizar(false);
        });
    } else {
      finalizar(false);
    }
  });
}


document.addEventListener('DOMContentLoaded', () => {
    cargarNoticiasPublicas();
});

async function cargarNoticiasPublicas() {
    const grid = document.getElementById('newsGrid');
    if (!grid) return; 

    if (typeof db === 'undefined') {
        grid.innerHTML = '<div class="col-span-full text-center py-12 text-dorado">Error: No se pudo conectar con la base de datos.</div>';
        return;
    }

    try {
        // Consultar a Firestore solo las noticias marcadas como "publicado"
        const snapshot = await db.collection('noticias')
            .where('estado', '==', 'publicado')
            .orderBy('fecha_creacion', 'desc')
            .limit(6) // Mostrar máximo 6 noticias en el inicio
            .get();

        if (snapshot.empty) {
            grid.innerHTML = '<div class="col-span-full text-center py-12 text-cremadark">Próximamente compartiremos nuevas historias y novedades.</div>';
            return;
        }

        // Construir el HTML de las tarjetas
        const noticiasHTML = snapshot.docs.map((doc, index) => {
            const noticia = doc.data();
            
            // Extraer la primera imagen si existe
            const imagenPrincipal = noticia.imagenes && noticia.imagenes.length > 0
                ? noticia.imagenes.find(img => img.orden === 0)?.url || noticia.imagenes[0].url
                : 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=600&auto=format&fit=crop'; 

            // Formatear la fecha
            let fechaTexto = '';
            if (noticia.fecha_publicacion) {
                fechaTexto = new Date(noticia.fecha_publicacion).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
            }

            // Animación en cascada
            const delay = index * 0.1;

            // Escapar los datos para pasarlos seguros a la función abrirModalNoticia
            // Creamos un objeto JSON codificado en base64 para evitar problemas con comillas
            const noticiaSegura = btoa(unescape(encodeURIComponent(JSON.stringify(noticia))));

            return `
                <article class="interactive-card bg-cardbg rounded-xl overflow-hidden shadow-lg border border-dorado/10 flex flex-col reveal active" style="transition-delay: ${delay}s">
                    <div class="h-48 overflow-hidden relative cursor-pointer group" onclick="abrirNoticiaDesdeBase64('${noticiaSegura}')">
                        <img src="${imagenPrincipal}" alt="${noticia.titulo}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105">
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
                            <p class="text-cremadark font-light text-sm line-clamp-3 mb-4">
                                ${noticia.resumen}
                            </p>
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
        console.error('Error cargando noticias en el inicio:', error);
        grid.innerHTML = '<div class="col-span-full text-center py-12 text-dorado">Hubo un problema al cargar las noticias. Por favor, recarga la página.</div>';
    }
}

// Función auxiliar para leer el string en Base64 y abrir el modal
window.abrirNoticiaDesdeBase64 = function(base64Data) {
    try {
        const jsonString = decodeURIComponent(escape(atob(base64Data)));
        const noticia = JSON.parse(jsonString);
        window.abrirModalNoticia(noticia);
    } catch(e) {
        console.error("Error decodificando la noticia", e);
    }
}


// Función para cargar autores desde Firebase a la web pública
async function cargarAutoresPublicos() {
  const container = document.getElementById('autoresGrid');
  if (!container || !window.db) return; // Asegura que exista el contenedor y Firebase

  try {
    // Llamamos a la colección 'autores' ordenados por los más recientes
    const snapshot = await window.db.collection('autores').orderBy('fechaRegistro', 'desc').get();
    container.innerHTML = ''; // Limpiamos el texto de "Cargando..."

    if (snapshot.empty) {
      container.innerHTML = '<div class="col-span-full text-center py-12 text-cremadark">Próximamente revelaremos nuestros talentos.</div>';
      return;
    }

    let delay = 0; // Para el efecto visual de aparición en cascada

    snapshot.forEach(doc => {
      const autor = doc.data();

      // Armamos los íconos de redes sociales si el autor tiene links guardados
      let redesHTML = '';
      if (autor.redes && autor.redes.instagram) {
        redesHTML += `<a href="${autor.redes.instagram}" target="_blank" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>`;
      }
      if (autor.redes && autor.redes.twitter) {
        redesHTML += `<a href="${autor.redes.twitter}" target="_blank" aria-label="X"><i class="fa-brands fa-x-twitter"></i></a>`;
      }
      if (autor.redes && autor.redes.web) {
        redesHTML += `<a href="${autor.redes.web}" target="_blank" aria-label="Sitio web"><i class="fa-solid fa-globe"></i></a>`;
      }

      // Dibujamos la tarjeta exacta con las clases CSS de tu diseño
      const articleHTML = `
        <article class="author-card reveal active" style="transition-delay:${delay}s">
          <img src="${autor.foto}" alt="${autor.nombre}" class="author-image object-cover w-full rounded-t-lg">
          <h3 class="font-serif text-2xl mt-4 mb-1">${autor.nombre}</h3>
          <p class="text-dorado text-sm italic mb-4">Talento Punto y Coma</p>
          <p class="text-cremadark text-sm line-clamp-3 mb-4">${autor.bio}</p>
          
          <div class="author-social flex gap-4 text-dorado text-lg mb-4">
            ${redesHTML}
          </div>
          
          <div class="author-actions flex justify-between items-center border-t border-dorado/20 pt-4 mt-auto">
            <a href="#libreria" class="text-xs uppercase tracking-widest hover:text-dorado transition">Ver libros</a>
            <button type="button" onclick="openQRModal('${autor.nombre}', '#libreria')" class="text-xs uppercase tracking-widest text-dorado hover:text-crema transition">
              <i class="fa-solid fa-qrcode text-sm"></i> QR
            </button>
          </div>
        </article>
      `;

      container.innerHTML += articleHTML;
      delay += 0.1; // Sube 0.1s en cada tarjeta para la animación
    });

  } catch (error) {
    console.error("Error al cargar los autores de Firebase:", error);
    container.innerHTML = '<div class="col-span-full text-center py-12 text-red-500">Error al cargar la lista de autores. Por favor recarga la página.</div>';
  }
}

// Ejecutar la carga apenas inicie la página
window.addEventListener('DOMContentLoaded', () => {
  // Le damos un segundo de respiro para asegurar que firebase se cargó
  setTimeout(cargarAutoresPublicos, 1000); 
});