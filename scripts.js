// ================================================================
// SCRIPTS PÚBLICOS - EDITORIAL PUNTO Y COMA
// Versión mejorada
// ================================================================

// ================================================================
// CONFIGURACIÓN
// ================================================================

const EDITORIAL_WHATSAPP = "573116060210";
const EDITORIAL_EMAIL = "puntoycoma.ediciontextos@gmail.com";

function linkWhatsapp(mensaje) {
  return `https://wa.me/${EDITORIAL_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
}


// ================================================================
// FIREBASE
// ================================================================

// Intentamos utilizar la configuración global que ya tengas
const firebaseApp = window.firebaseApp || null;

const firebaseServices = window.firebaseServices || {};

const auth =
  firebaseServices.auth ||
  (typeof firebase !== "undefined" && firebase.auth ? firebase.auth() : null);

const db =
  firebaseServices.db ||
  (typeof firebase !== "undefined" && firebase.firestore
    ? firebase.firestore()
    : null);

const storage =
  firebaseServices.storage ||
  (typeof firebase !== "undefined" && firebase.storage
    ? firebase.storage()
    : null);


// ================================================================
// VARIABLES GLOBALES
// ================================================================

let autoresData = [];
let todosLosLibros = [];
let librosFiltrados = [];
let librosMostrados = 12;
const LIBROS_POR_CARGA = 12;
let todosLosVideos = [];
let videosMostrados = 6;
const VIDEOS_POR_CARGA = 6;


// ================================================================
// VERIFICACIÓN DE FIREBASE
// ================================================================

function firebaseDisponible() {
  return !!db;
}

if (!firebaseDisponible()) {
  console.error("❌ Firebase/Firestore no está disponible.");
}


// ================================================================
// AUTENTICACIÓN ANÓNIMA
// ================================================================

async function inicializarAutenticacionPublica() {

  if (!auth) {
    console.warn("⚠️ Firebase Auth no está disponible.");
    return;
  }

  try {

    if (auth.currentUser) {
      console.log("🔓 Usuario Firebase ya autenticado:", auth.currentUser.uid);
      return;
    }

    await auth.signInAnonymously();

    console.log(
      "🔓 Autenticación anónima exitosa:",
      auth.currentUser?.uid
    );

  } catch (error) {

    console.warn(
      "⚠️ No fue posible realizar autenticación anónima:",
      error
    );

  }
}


// ================================================================
// DOMCONTENTLOADED
// ================================================================

document.addEventListener("DOMContentLoaded", async () => {

  configurarWhatsApp();

  configurarAnio();

  configurarMenuMovil();

  configurarWhatsAppFlotante();

  configurarModales();

  configurarBotonesVerMas();

  configurarFiltrosLibros();

  configurarFormularioContacto();

  // Inicializamos autenticación pública
  await inicializarAutenticacionPublica();

  setTimeout(() => {

    cargarNoticiasPublicas();

    cargarAutoresPublicos();

    cargarLibrosPublicos();

    cargarVideosPublicos();

  }, 300);

});


// ================================================================
// WHATSAPP
// ================================================================

function configurarWhatsApp() {

  const enlaces = [
    {
      id: "whatsapp-header-link",
      msg: "Hola, quiero publicar mi libro con Editorial Punto y Coma."
    },
    {
      id: "whatsapp-hero-link",
      msg: "Hola, quiero solicitar un informe editorial."
    },
    {
      id: "whatsapp-nosotros-link",
      msg: "Hola, quiero unirme al Círculo Punto y Coma."
    }
  ];

  enlaces.forEach(({ id, msg }) => {

    const el = document.getElementById(id);

    if (el) {
      el.href = linkWhatsapp(msg);
    }

  });

}


// ================================================================
// AÑO FOOTER
// ================================================================

function configurarAnio() {

  const yearEl = document.getElementById("year");

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

}


// ================================================================
// MENÚ MÓVIL
// ================================================================

function configurarMenuMovil() {

  const mobileBtn =
    document.getElementById("mobile-menu-button");

  const mobileMenu =
    document.getElementById("mobile-menu");

  if (!mobileBtn || !mobileMenu) {
    return;
  }

  mobileBtn.addEventListener("click", () => {

    mobileMenu.classList.toggle("hidden");

  });

  mobileMenu.addEventListener("click", (e) => {

    if (e.target.tagName === "A") {
      mobileMenu.classList.add("hidden");
    }

  });

}


// ================================================================
// WHATSAPP FLOTANTE
// ================================================================

function configurarWhatsAppFlotante() {

  const whatsappButton =
    document.getElementById("whatsapp-float");

  if (!whatsappButton) {
    return;
  }

  whatsappButton.addEventListener("click", () => {

    window.open(
      linkWhatsapp(
        "Hola, me gustaría recibir información sobre Editorial Punto y Coma."
      ),
      "_blank",
      "noopener,noreferrer"
    );

  });

}


// ================================================================
// MODALES
// ================================================================

function configurarModales() {

  // --------------------------------------------------------------
  // Noticias
  // --------------------------------------------------------------

  const modalNews =
    document.getElementById("news-modal");

  const closeNews =
    document.getElementById("close-modal");

  if (closeNews) {
    closeNews.addEventListener(
      "click",
      closeNewsModal
    );
  }

  if (modalNews) {

    modalNews.addEventListener("click", (e) => {

      if (e.target === modalNews) {
        closeNewsModal();
      }

    });

  }


  // --------------------------------------------------------------
  // Autores
  // --------------------------------------------------------------

  const modalAuthor =
    document.getElementById("author-modal");

  const closeAuthor =
    document.getElementById("close-author-modal");

  if (closeAuthor) {

    closeAuthor.addEventListener(
      "click",
      closeAuthorModal
    );

  }

  if (modalAuthor) {

    modalAuthor.addEventListener("click", (e) => {

      if (e.target === modalAuthor) {
        closeAuthorModal();
      }

    });

  }


  // --------------------------------------------------------------
  // QR
  // --------------------------------------------------------------

  const qrModal =
    document.getElementById("qr-modal");

  if (qrModal) {

    qrModal.addEventListener("click", (e) => {

      if (e.target === qrModal) {
        closeQRModal();
      }

    });

  }


  // --------------------------------------------------------------
  // Contacto
  // --------------------------------------------------------------

  const contactoModal =
    document.getElementById("contacto-modal");

  if (contactoModal) {

    contactoModal.addEventListener("click", (e) => {

      if (e.target === contactoModal) {
        cerrarModalContacto();
      }

    });

  }


  // --------------------------------------------------------------
  // Libro
  // --------------------------------------------------------------

  const libroModal =
    document.getElementById("libro-modal");

  const closeLibro =
    document.getElementById("close-libro-modal");

  if (closeLibro) {

    closeLibro.addEventListener(
      "click",
      cerrarModalLibro
    );

  }

  if (libroModal) {

    libroModal.addEventListener("click", (e) => {

      if (e.target === libroModal) {
        cerrarModalLibro();
      }

    });

  }

}


// ================================================================
// CERRAR MODAL LIBRO
// ================================================================

function cerrarModalLibro() {

  const modal =
    document.getElementById("libro-modal");

  if (!modal) {
    return;
  }

  const inner =
    modal.firstElementChild;

  modal.classList.add("opacity-0");

  if (inner) {
    inner.classList.add("scale-95");
  }

  setTimeout(() => {

    modal.classList.add("hidden");
    modal.classList.remove("flex");

  }, 250);

}


// ================================================================
// BOTONES VER MÁS
// ================================================================

function configurarBotonesVerMas() {

  const btnVerMasLibros =
    document.getElementById("btnVerMasLibros");

  if (btnVerMasLibros) {

    btnVerMasLibros.addEventListener(
      "click",
      verMasLibros
    );

  }


  const btnVerMasVideos =
    document.getElementById("btnVerMasVideos");

  if (btnVerMasVideos) {

    btnVerMasVideos.addEventListener(
      "click",
      verMasVideos
    );

  }

}


// ================================================================
// FILTROS LIBROS
// ================================================================

function configurarFiltrosLibros() {

  const filtroInput =
    document.getElementById("filtroLibros");

  const filtroCategoria =
    document.getElementById(
      "filtroCategoriaLibros"
    );

  if (filtroInput) {

    filtroInput.addEventListener(
      "input",
      aplicarFiltros
    );

  }

  if (filtroCategoria) {

    filtroCategoria.addEventListener(
      "change",
      aplicarFiltros
    );

  }

}


// ================================================================
// CONTACTO
// ================================================================

function configurarFormularioContacto() {

  const form =
    document.getElementById("formContacto");

  if (!form) {
    return;
  }

  form.addEventListener(
    "submit",
    enviarFormularioContacto
  );

}


async function enviarFormularioContacto(e) {

  e.preventDefault();

  const btn =
    document.getElementById(
      "btnEnviarContacto"
    );

  const respuesta =
    document.getElementById(
      "contacto-respuesta"
    );

  const form =
    document.getElementById(
      "formContacto"
    );

  if (!btn || !respuesta || !form) {
    return;
  }

  btn.disabled = true;
  btn.textContent = "Enviando...";

  respuesta.classList.add("hidden");


  const nombre =
    document.getElementById(
      "contacto-nombre"
    )?.value.trim() || "";

  const email =
    document.getElementById(
      "contacto-email"
    )?.value.trim() || "";

  const asunto =
    document.getElementById(
      "contacto-asunto"
    )?.value.trim() || "";

  const mensaje =
    document.getElementById(
      "contacto-mensaje"
    )?.value.trim() || "";


  if (!nombre || !email || !asunto || !mensaje) {

    mostrarRespuestaContacto(
      "Por favor, completa todos los campos.",
      "error"
    );

    btn.disabled = false;
    btn.textContent = "Enviar mensaje";

    return;
  }


  if (!db) {

    mostrarRespuestaContacto(
      "Error de conexión con el servidor. Intenta más tarde.",
      "error"
    );

    btn.disabled = false;
    btn.textContent = "Enviar mensaje";

    return;
  }


  try {

    await db.collection("mensajes").add({

      nombre,
      email,
      asunto,
      mensaje,

      leido: false,

      fecha:
        firebase.firestore.FieldValue.serverTimestamp()

    });


    mostrarRespuestaContacto(
      "¡Mensaje enviado con éxito! Te responderemos pronto.",
      "success"
    );

    form.reset();

    setTimeout(
      cerrarModalContacto,
      3000
    );


  } catch (error) {

    console.error(
      "❌ Error al enviar mensaje:",
      error
    );

    mostrarRespuestaContacto(
      "No se pudo enviar el mensaje. Intenta nuevamente.",
      "error"
    );

  } finally {

    btn.disabled = false;
    btn.textContent = "Enviar mensaje";

  }

}


function mostrarRespuestaContacto(
  texto,
  tipo
) {

  const respuesta =
    document.getElementById(
      "contacto-respuesta"
    );

  if (!respuesta) {
    return;
  }

  respuesta.textContent = texto;

  if (tipo === "success") {

    respuesta.className =
      "mt-4 text-green-600 text-sm font-medium block";

  } else {

    respuesta.className =
      "mt-4 text-red-600 text-sm font-medium block";

  }

  respuesta.classList.remove("hidden");

}


// ================================================================
// MODAL CONTACTO
// ================================================================

window.abrirModalContacto = function () {

  const modal =
    document.getElementById(
      "contacto-modal"
    );

  if (!modal) {
    return;
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");

  setTimeout(() => {

    modal.classList.remove("opacity-0");

    if (modal.firstElementChild) {
      modal.firstElementChild.classList.remove(
        "scale-95"
      );
    }

  }, 10);

  const respuesta =
    document.getElementById(
      "contacto-respuesta"
    );

  if (respuesta) {
    respuesta.classList.add("hidden");
  }

  const form =
    document.getElementById(
      "formContacto"
    );

  if (form) {
    form.reset();
  }

};


window.cerrarModalContacto = function () {

  const modal =
    document.getElementById(
      "contacto-modal"
    );

  if (!modal) {
    return;
  }

  modal.classList.add("opacity-0");

  if (modal.firstElementChild) {
    modal.firstElementChild.classList.add(
      "scale-95"
    );
  }

  setTimeout(() => {

    modal.classList.add("hidden");
    modal.classList.remove("flex");

  }, 250);

};


// ================================================================
// NOTICIAS
// ================================================================

async function cargarNoticiasPublicas() {

  const grid =
    document.getElementById(
      "newsGrid"
    );

  if (!grid) {
    return;
  }

  if (!db) {

    grid.innerHTML =
      '<div class="col-span-full text-center py-20 text-red-500">Error: No se detecta la conexión a Firebase.</div>';

    return;
  }


  try {

    const snapshot =
      await db
        .collection("noticias")
        .get();


    if (snapshot.empty) {

      grid.innerHTML =
        '<div class="col-span-full text-center py-20 text-cremadark">Próximamente compartiremos nuevas historias y novedades.</div>';

      return;
    }


    let noticias =
      snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));


    noticias =
      noticias.filter(
        noticia =>
          noticia.estado === "publicado"
      );


    noticias.sort((a, b) => {

      const fechaA =
        obtenerTimestamp(a.fecha_creacion);

      const fechaB =
        obtenerTimestamp(b.fecha_creacion);

      return fechaB - fechaA;

    });


    noticias =
      noticias.slice(0, 8);


    if (!noticias.length) {

      grid.innerHTML =
        '<div class="col-span-full text-center py-12 text-cremadark">No hay noticias públicas en este momento.</div>';

      return;
    }


    let html = "";


    noticias.forEach((noticia, index) => {

      const imagenPrincipal =
        obtenerImagenNoticia(noticia);


      const fechaTexto =
        formatearFecha(
          noticia.fecha_publicacion
        );


      const delay =
        index * 0.1;


      const revealClass =
        index % 4 === 0
          ? "reveal-up"
          : index % 4 === 1
            ? "reveal-left"
            : index % 4 === 2
              ? "reveal-right"
              : "reveal-zoom";


      const noticiaSegura =
        btoa(
          unescape(
            encodeURIComponent(
              JSON.stringify(noticia)
            )
          )
        );


      html += `

        <article
          class="interactive-card bg-cardbg rounded-xl overflow-hidden shadow-lg border border-dorado/10 flex flex-col ${revealClass}"
          style="transition-delay:${delay}s"
        >

          <div
            class="h-64 overflow-hidden relative cursor-pointer group"
            onclick="abrirNoticiaDesdeBase64('${noticiaSegura}')"
          >

            <img
              src="${escapeAttribute(imagenPrincipal)}"
              alt="${escapeAttribute(noticia.titulo || "Noticia")}"
              class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
              onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=600&auto=format&fit=crop';"
            >

            <div class="absolute top-4 left-4 bg-dorado text-vinodark text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-sm shadow-md">
              ${escapeHTML(noticia.categoria || "Novedad")}
            </div>

          </div>


          <div class="p-6 flex-grow flex flex-col justify-between text-crema">

            <div>

              ${
                fechaTexto
                  ? `
                    <time class="text-xs text-dorado mb-3 font-semibold tracking-widest block">
                      <i class="fa-regular fa-calendar mr-2"></i>
                      ${fechaTexto}
                    </time>
                  `
                  : ""
              }


              <h3
                class="font-serif text-xl mb-3 leading-snug hover:text-dorado transition-colors cursor-pointer"
                onclick="abrirNoticiaDesdeBase64('${noticiaSegura}')"
              >
                ${escapeHTML(noticia.titulo || "Sin título")}
              </h3>


              <p class="text-cremadark font-light text-sm line-clamp-3 mb-4">
                ${escapeHTML(noticia.resumen || "")}
              </p>

            </div>


            <button
              onclick="abrirNoticiaDesdeBase64('${noticiaSegura}')"
              class="text-dorado font-bold text-xs uppercase tracking-widest hover:text-crema transition-colors text-left flex items-center gap-2 mt-auto"
            >
              Leer completo
              <i class="fa-solid fa-arrow-right text-xs"></i>
            </button>

          </div>

        </article>

      `;

    });


    grid.innerHTML = html;

    observarElementos(
      "#newsGrid .reveal-up, #newsGrid .reveal-left, #newsGrid .reveal-right, #newsGrid .reveal-zoom"
    );


  } catch (error) {

    console.error(
      "❌ Error cargando noticias:",
      error
    );

    grid.innerHTML =
      '<div class="col-span-full text-center py-12 text-dorado">Hubo un problema al cargar las noticias. Por favor, recarga la página.</div>';

  }

}


// ================================================================
// AUTORES
// ================================================================

async function cargarAutoresPublicos() {

  const container =
    document.getElementById(
      "autoresGrid"
    );

  const btnVerMas =
    document.getElementById(
      "btnVerMasAutores"
    );

  if (!container) {
    return;
  }


  if (!db) {

    container.innerHTML =
      '<div class="col-span-full text-center py-12 text-red-500">Error: No se detecta la conexión a Firebase.</div>';

    return;
  }


  try {

    const snapshot =
      await db
        .collection("autores")
        .get();


    container.innerHTML = "";


    if (snapshot.empty) {

      container.innerHTML =
        '<div class="col-span-full text-center py-12 text-cremadark">Próximamente revelaremos nuestros talentos.</div>';

      if (btnVerMas) {
        btnVerMas.style.display = "none";
      }

      return;
    }


    let autores =
      snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));


    autores.sort((a, b) => {

      const fechaA =
        obtenerTimestamp(a.creado_en);

      const fechaB =
        obtenerTimestamp(b.creado_en);

      return fechaB - fechaA;

    });


    autoresData =
      autores.filter(
        autor =>
          autor.publicado !== false
      );


    if (!autoresData.length) {

      container.innerHTML =
        '<div class="col-span-full text-center py-12 text-cremadark">Próximamente revelaremos nuestros talentos.</div>';

      if (btnVerMas) {
        btnVerMas.style.display = "none";
      }

      return;
    }


    let html = "";


    autoresData.forEach((autor, index) => {

      const foto =
        autor.foto || "";

      const biografia =
        autor.biografia ||
        autor.bio ||
        "Sin biografía disponible.";


      const revealClass =
        index % 3 === 0
          ? "reveal-up"
          : index % 3 === 1
            ? "reveal-left"
            : "reveal-right";


      const delay =
        index < 4
          ? index * 0.1
          : 0;


      const oculto =
        index >= 4
          ? "hidden"
          : "";


      let redesHTML = "";


      const instagram =
        autor.redes?.instagram ||
        autor.instagram;

      const facebook =
        autor.redes?.facebook ||
        autor.facebook;

      const twitter =
        autor.redes?.twitter ||
        autor.twitter;

      const web =
        autor.redes?.web ||
        autor.enlace_venta ||
        autor.web;


      if (instagram) {

        redesHTML += `
          <a
            href="${escapeAttribute(instagram)}"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <i class="fa-brands fa-instagram"></i>
          </a>
        `;

      }


      if (facebook) {

        redesHTML += `
          <a
            href="${escapeAttribute(facebook)}"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
          >
            <i class="fa-brands fa-facebook"></i>
          </a>
        `;

      }


      if (twitter) {

        redesHTML += `
          <a
            href="${escapeAttribute(twitter)}"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter"
          >
            <i class="fa-brands fa-x-twitter"></i>
          </a>
        `;

      }


      if (web) {

        redesHTML += `
          <a
            href="${escapeAttribute(web)}"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Web"
          >
            <i class="fa-solid fa-globe"></i>
          </a>
        `;

      }


      const nombreSeguro =
        escapeAttribute(
          autor.nombre || "Autor"
        );


      const enlaceVenta =
        escapeAttribute(
          autor.enlace_venta ||
          "#libreria"
        );


      html += `

        <article
          class="author-card ${oculto} ${revealClass}"
          style="transition-delay:${delay}s"
        >

          <img
            src="${escapeAttribute(foto)}"
            alt="${nombreSeguro}"
            class="author-image object-cover w-full h-64 rounded-t-lg"
            loading="lazy"
            onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop';"
          >


          <div class="p-4 flex flex-col flex-grow bg-white border border-t-0 border-dorado/20 rounded-b-lg">

            <h3 class="font-serif text-2xl mt-2 mb-1">
              ${escapeHTML(autor.nombre || "Autor")}
            </h3>


            <p class="text-dorado text-sm italic mb-3">
              ${escapeHTML(autor.genero || "Talento Punto y Coma")}
            </p>


            <p class="text-cremadark text-sm line-clamp-3 mb-4">
              ${escapeHTML(biografia)}
            </p>


            <div class="author-social flex gap-4 text-dorado text-lg mb-4 mt-auto">
              ${redesHTML}
            </div>


            <div class="author-actions flex justify-between items-center border-t border-dorado/20 pt-4">

              <button
                onclick="openAuthorModal(${index})"
                class="text-xs uppercase tracking-widest hover:text-dorado transition font-bold"
              >
                Ver más
              </button>


              <button
                type="button"
                onclick="openQRModal('${escapeAttribute(autor.nombre || "Autor")}', '${enlaceVenta}')"
                class="text-xs uppercase tracking-widest text-dorado hover:text-crema transition font-bold"
              >
                <i class="fa-solid fa-qrcode text-sm"></i>
                QR
              </button>

            </div>

          </div>

        </article>

      `;

    });


    container.innerHTML = html;


    observarElementos(
      "#autoresGrid .reveal-up, #autoresGrid .reveal-left, #autoresGrid .reveal-right"
    );


    if (btnVerMas) {

      if (autoresData.length > 4) {

        btnVerMas.style.display =
          "inline-block";


        btnVerMas.onclick = () => {

          const ocultos =
            container.querySelectorAll(
              ".author-card.hidden"
            );

          ocultos.forEach(
            el =>
              el.classList.remove("hidden")
          );

          btnVerMas.style.display =
            "none";

        };

      } else {

        btnVerMas.style.display =
          "none";

      }

    }


  } catch (error) {

    console.error(
      "❌ Error al cargar autores:",
      error
    );

    container.innerHTML =
      '<div class="col-span-full text-center py-12 text-red-500">Error al cargar la lista de autores.</div>';

  }

}


// ================================================================
// LIBROS - GENERAR HTML
// ================================================================

function generarHTMLlibros(libros) {

  if (!libros || !libros.length) {

    return `
      <div class="col-span-full text-center py-12 text-cremadark">
        No se encontraron libros.
      </div>
    `;

  }


  let html = "";


  libros.forEach((libro, index) => {

    const portada =
      libro.portada ||
      "https://via.placeholder.com/400x600?text=Sin+portada";


    const delay =
      index * 0.1;


    const revealClass =
      index % 3 === 0
        ? "reveal-up"
        : index % 3 === 1
          ? "reveal-left"
          : "reveal-right";


    const esDestacado =
      libro.destacado === true;


    const precio =
      libro.precio !== "" &&
      libro.precio !== null &&
      libro.precio !== undefined
        ? `$${escapeHTML(String(libro.precio))}`
        : "";


    // Guardamos el objeto en JSON codificado
    const libroData =
      encodeURIComponent(
        JSON.stringify(libro)
      );


    html += `

      <article
        class="book-card ${revealClass}"
        style="transition-delay:${delay}s"
        data-libro="${libroData}"
      >

        <div
          class="book-image-wrapper"
          onclick="abrirLibroDesdeTarjeta(this)"
        >

          <img
            src="${escapeAttribute(portada)}"
            alt="${escapeAttribute(libro.titulo || "Libro")}"
            class="book-image"
            loading="lazy"
            onerror="this.onerror=null;this.src='https://via.placeholder.com/400x600?text=Error';"
          >

          ${
            esDestacado
              ? `
                <span class="book-badge">
                  Destacado
                </span>
              `
              : ""
          }

        </div>


        <div class="book-info">

          <h3 class="book-title">
            ${escapeHTML(libro.titulo || "Sin título")}
          </h3>


          <p class="book-author">
            ${escapeHTML(libro.autor || "Autor por definir")}
          </p>


          ${
            precio
              ? `
                <p class="book-price">
                  ${precio}
                </p>
              `
              : ""
          }


          <p class="book-description">
            ${escapeHTML(libro.descripcion || "")}
          </p>


          <div class="book-actions">

            <button
              type="button"
              onclick="abrirLibroDesdeTarjeta(this)"
              class="book-btn-detail"
            >
              Ver detalles
            </button>


            <a
              href="${escapeAttribute(libro.enlace_compra || "#")}"
              target="_blank"
              rel="noopener noreferrer"
              class="book-btn"
            >
              Comprar ahora
              <i class="fa-solid fa-arrow-right"></i>
            </a>

          </div>

        </div>

      </article>

    `;

  });


  return html;

}


// ================================================================
// ABRIR LIBRO DESDE TARJETA
// ================================================================

window.abrirLibroDesdeTarjeta = function(element) {

  const card =
    element.closest(".book-card");

  if (!card) {
    return;
  }


  try {

    const data =
      card.dataset.libro;

    if (!data) {
      return;
    }


    const libro =
      JSON.parse(
        decodeURIComponent(data)
      );


    abrirModalLibro(libro);


  } catch (error) {

    console.error(
      "❌ Error abriendo libro:",
      error
    );

  }

};


// ================================================================
// CARGAR LIBROS DESDE FIRESTORE
// ================================================================

async function cargarLibrosPublicos() {

  const grid =
    document.getElementById(
      "librosGrid"
    );

  const verMasContainer =
    document.getElementById(
      "librosVerMasContainer"
    );


  if (!grid) {
    return;
  }


  if (!db) {

    grid.innerHTML =
      '<div class="col-span-full text-center py-12 text-red-500">Error de conexión con Firebase.</div>';

    return;
  }


  try {

    console.log(
      " Cargando libros desde Firestore..."
    );


    const snapshot =
      await db
        .collection("libros")
        .get();


    console.log(
      ` Libros encontrados en Firestore: ${snapshot.size}`
    );


    if (snapshot.empty) {

      grid.innerHTML =
        '<div class="col-span-full text-center py-12 text-cremadark">Próximamente nuevos títulos.</div>';

      if (verMasContainer) {
        verMasContainer.classList.add("hidden");
      }

      return;
    }


    let libros =
      snapshot.docs.map(doc => {

        const data =
          doc.data();


        return {

          id: doc.id,

          ...data,

          destacado:
            data.destacado === true,

          precio:
            data.precio ??
            "",

          descripcion:
            data.descripcion ||
            data.sinopsis ||
            "",

          enlace_compra:
            data.enlace_compra ||
            "#",

          autor:
            data.autor ||
            "Autor por definir",

          titulo:
            data.titulo ||
            "Sin título",

          categoria:
            data.categoria ||
            ""

        };

      });


    // ------------------------------------------------------------
    // Solo mostramos libros públicos
    // ------------------------------------------------------------

    libros =
      libros.filter(
        libro =>
          libro.publicado !== false
      );


    // ------------------------------------------------------------
    // Más nuevos primero
    // ------------------------------------------------------------

    libros.sort((a, b) => {

      const fechaA =
        obtenerTimestamp(
          a.fecha_creacion
        );

      const fechaB =
        obtenerTimestamp(
          b.fecha_creacion
        );

      return fechaB - fechaA;

    });


    if (!libros.length) {

      grid.innerHTML =
        '<div class="col-span-full text-center py-12 text-cremadark">Próximamente nuevos títulos.</div>';

      if (verMasContainer) {
        verMasContainer.classList.add("hidden");
      }

      return;
    }


    // ------------------------------------------------------------
    // Guardamos TODOS los libros
    // ------------------------------------------------------------

    todosLosLibros =
      libros;


    librosFiltrados =
      [...libros];


    librosMostrados =
      LIBROS_POR_CARGA;


    // ------------------------------------------------------------
    // Categorías
    // ------------------------------------------------------------

    inicializarCategoriasLibros(
      libros
    );


    // ------------------------------------------------------------
    // Mostrar libros
    // ------------------------------------------------------------

    aplicarFiltros();


  } catch (error) {

    console.error(
      "❌ ERROR CARGANDO LIBROS:",
      error
    );



    if (
      error.code ===
      "permission-denied"
    ) {

      grid.innerHTML = `
        <div class="col-span-full text-center py-12 text-red-500">
          No tienes permisos para consultar los libros.
        </div>
      `;

      console.error(
        " FIRESTORE PERMISSION DENIED. Revisar las Rules de Firestore."
      );

    } else {

      grid.innerHTML =
        '<div class="col-span-full text-center py-12 text-dorado">Error al cargar los libros. Recarga la página.</div>';

    }

  }

}


// ================================================================
// CATEGORÍAS DE LIBROS
// ================================================================

function inicializarCategoriasLibros(libros) {

  const select =
    document.getElementById(
      "filtroCategoriaLibros"
    );


  if (!select) {
    return;
  }


  // Conservamos solamente la opción inicial

  select.innerHTML =
    '<option value="">Todas las categorías</option>';


  const categorias =
    [
      ...new Set(
        libros
          .map(
            libro =>
              libro.categoria
          )
          .filter(Boolean)
      )
    ]
    .sort(
      (a, b) =>
        a.localeCompare(
          b,
          "es"
        )
    );


  categorias.forEach(
    categoria => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        categoria;

      option.textContent =
        categoria;

      select.appendChild(
        option
      );

    }
  );

}


// ================================================================
// APLICAR FILTROS
// ================================================================

function aplicarFiltros() {

  const grid =
    document.getElementById(
      "librosGrid"
    );

  const verMasContainer =
    document.getElementById(
      "librosVerMasContainer"
    );


  if (
    !grid ||
    !todosLosLibros.length
  ) {
    return;
  }


  const filtroTexto =
    document
      .getElementById(
        "filtroLibros"
      )
      ?.value
      .toLowerCase()
      .trim() || "";


  const filtroCategoria =
    document
      .getElementById(
        "filtroCategoriaLibros"
      )
      ?.value || "";


  const filtrados =
    todosLosLibros.filter(
      libro => {

        const titulo =
          String(
            libro.titulo || ""
          ).toLowerCase();


        const autor =
          String(
            libro.autor || ""
          ).toLowerCase();


        const categoria =
          String(
            libro.categoria || ""
          );


        const coincideTexto =
          !filtroTexto ||
          titulo.includes(
            filtroTexto
          ) ||
          autor.includes(
            filtroTexto
          );


        const coincideCategoria =
          !filtroCategoria ||
          categoria ===
            filtroCategoria;


        return (
          coincideTexto &&
          coincideCategoria
        );

      }
    );


  librosFiltrados =
    filtrados;


  // Cuando cambia un filtro volvemos a mostrar 12

  librosMostrados =
    LIBROS_POR_CARGA;


  const primeros =
    filtrados.slice(
      0,
      librosMostrados
    );


  grid.innerHTML =
    generarHTMLlibros(
      primeros
    );


  if (verMasContainer) {

    if (
      filtrados.length >
      librosMostrados
    ) {

      verMasContainer.classList.remove(
        "hidden"
      );

    } else {

      verMasContainer.classList.add(
        "hidden"
      );

    }

  }


  aplicarEfecto3D();


  observarElementos(
    "#librosGrid .book-card"
  );

}


// ================================================================
// VER MÁS LIBROS
// ================================================================

function verMasLibros() {

  const grid =
    document.getElementById(
      "librosGrid"
    );

  const verMasContainer =
    document.getElementById(
      "librosVerMasContainer"
    );


  if (
    !grid ||
    !librosFiltrados.length
  ) {
    return;
  }


  const actuales =
    grid.querySelectorAll(
      ".book-card"
    ).length;


  const siguientes =
    librosFiltrados.slice(
      actuales,
      actuales + LIBROS_POR_CARGA
    );


  if (!siguientes.length) {

    if (verMasContainer) {
      verMasContainer.classList.add(
        "hidden"
      );
    }

    return;
  }


  grid.insertAdjacentHTML(
    "beforeend",
    generarHTMLlibros(
      siguientes
    )
  );


  aplicarEfecto3D();


  observarElementos(
    "#librosGrid .book-card"
  );


  const totalActual =
    grid.querySelectorAll(
      ".book-card"
    ).length;


  if (
    totalActual >=
    librosFiltrados.length
  ) {

    if (verMasContainer) {
      verMasContainer.classList.add(
        "hidden"
      );
    }

  }

}


// ================================================================
// MODAL LIBRO
// ================================================================

function abrirModalLibro(libro) {

  const modal =
    document.getElementById(
      "libro-modal"
    );

  const content =
    document.getElementById(
      "libro-modal-content"
    );


  if (
    !modal ||
    !content
  ) {
    return;
  }


  const portada =
    libro.portada ||
    "https://via.placeholder.com/400x600?text=Sin+portada";


  const precio =
    libro.precio
      ? `$${escapeHTML(String(libro.precio))}`
      : "Precio no disponible";


  const enlace =
    libro.enlace_compra ||
    "#";


  content.innerHTML = `

    <div class="flex flex-col md:flex-row gap-6">

      <div class="md:w-1/3 flex justify-center">

        <img
          src="${escapeAttribute(portada)}"
          alt="${escapeAttribute(libro.titulo || "Libro")}"
          class="w-full max-w-xs rounded-lg shadow-lg"
          loading="lazy"
          onerror="this.onerror=null;this.src='https://via.placeholder.com/400x600?text=Error';"
        >

      </div>


      <div class="md:w-2/3">

        <h2 class="font-serif text-3xl text-crema mb-2">
          ${escapeHTML(libro.titulo || "Sin título")}
        </h2>


        <p class="text-dorado text-lg italic mb-3">
          ${escapeHTML(libro.autor || "Autor por definir")}
        </p>


        <p class="text-2xl font-bold text-dorado mb-4">
          ${precio}
        </p>


        <div class="prose prose-sm max-w-none text-cremadark leading-relaxed mb-6">
          ${escapeHTML(
            libro.sinopsis ||
            libro.descripcion ||
            "Sin sinopsis disponible."
          )}
        </div>


        ${
          enlace !== "#"
            ? `
              <a
                href="${escapeAttribute(enlace)}"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-3 bg-dorado text-vinodark px-8 py-4 font-semibold uppercase tracking-widest hover:bg-crema transition-colors shadow-lg btn-glow"
              >
                Comprar ahora
                <i class="fa-solid fa-arrow-right"></i>
              </a>
            `
            : ""
        }

      </div>

    </div>

  `;


  modal.classList.remove(
    "hidden"
  );

  modal.classList.add(
    "flex"
  );


  setTimeout(() => {

    modal.classList.remove(
      "opacity-0"
    );

    if (modal.firstElementChild) {

      modal.firstElementChild.classList.remove(
        "scale-95"
      );

    }

  }, 10);

}


// ================================================================
// VIDEOS
// ================================================================

function generarHTMLvideos(videos) {

  if (!videos.length) {

    return `
      <div class="col-span-full text-center py-12 text-cremadark">
        No hay videos disponibles.
      </div>
    `;

  }


  let html = "";


  videos.forEach((video, index) => {

    const miniatura =
      video.miniatura ||
      "https://via.placeholder.com/480x360?text=Sin+miniatura";


    const delay =
      index * 0.1;


    const revealClass =
      index % 3 === 0
        ? "reveal-up"
        : index % 3 === 1
          ? "reveal-left"
          : "reveal-right";


    const fecha =
      video.fecha_publicacion ||
      (
        video.fecha_creacion
          ? new Date(
              obtenerTimestamp(
                video.fecha_creacion
              )
            ).toLocaleDateString(
              "es-CL"
            )
          : ""
      );


    html += `

      <div
        class="video-card ${revealClass}"
        style="transition-delay:${delay}s"
      >

        <div
          class="video-thumbnail"
          onclick="abrirVideo('${escapeAttribute(video.url || "#")}')"
        >

          <img
            src="${escapeAttribute(miniatura)}"
            alt="${escapeAttribute(video.titulo || "Video")}"
            loading="lazy"
            onerror="this.onerror=null;this.src='https://via.placeholder.com/480x360?text=Error';"
          >

          <div class="play-icon">
            <i class="fa-solid fa-play"></i>
          </div>

        </div>


        <div class="video-info">

          <h3>
            ${escapeHTML(video.titulo || "Sin título")}
          </h3>


          <p>
            ${escapeHTML(video.descripcion || "")}
          </p>


          ${
            fecha
              ? `
                <span class="video-date">
                  <i class="fa-regular fa-calendar mr-1"></i>
                  ${escapeHTML(fecha)}
                </span>
              `
              : ""
          }


          ${
            video.destacado
              ? `
                <span class="video-badge">
                  Destacado
                </span>
              `
              : ""
          }

        </div>

      </div>

    `;

  });


  return html;

}


// ================================================================
// CARGAR VIDEOS
// ================================================================

async function cargarVideosPublicos() {

  const grid =
    document.getElementById(
      "videosGrid"
    );

  const verMasContainer =
    document.getElementById(
      "videosVerMasContainer"
    );


  if (!grid) {
    return;
  }


  if (!db) {

    grid.innerHTML =
      '<div class="col-span-full text-center py-12 text-red-500">Error de conexión.</div>';

    return;
  }


  try {

    const snapshot =
      await db
        .collection("videos")
        .get();


    if (snapshot.empty) {

      grid.innerHTML =
        '<div class="col-span-full text-center py-12 text-cremadark">Próximamente contenido multimedia.</div>';

      return;
    }


    let videos =
      snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));


    videos =
      videos.filter(
        video =>
          video.publicado !== false
      );


    videos.sort((a, b) => {

      const fechaA =
        obtenerTimestamp(
          a.fecha_creacion
        );

      const fechaB =
        obtenerTimestamp(
          b.fecha_creacion
        );

      return fechaB - fechaA;

    });


    if (!videos.length) {

      grid.innerHTML =
        '<div class="col-span-full text-center py-12 text-cremadark">Próximamente contenido multimedia.</div>';

      return;
    }


    todosLosVideos =
      videos;


    const videosIniciales =
      videos.slice(
        0,
        videosMostrados
      );


    grid.innerHTML =
      generarHTMLvideos(
        videosIniciales
      );


    if (verMasContainer) {

      if (
        videos.length >
        videosMostrados
      ) {

        verMasContainer.classList.remove(
          "hidden"
        );

      } else {

        verMasContainer.classList.add(
          "hidden"
        );

      }

    }


    observarElementos(
      "#videosGrid .reveal-up, #videosGrid .reveal-left, #videosGrid .reveal-right"
    );


  } catch (error) {

    console.error(
      "❌ Error cargando videos:",
      error
    );

    grid.innerHTML =
      '<div class="col-span-full text-center py-12 text-dorado">Error al cargar los videos.</div>';

  }

}


// ================================================================
// VER MÁS VIDEOS
// ================================================================

function verMasVideos() {

  const grid =
    document.getElementById(
      "videosGrid"
    );

  const verMasContainer =
    document.getElementById(
      "videosVerMasContainer"
    );


  if (
    !grid ||
    !todosLosVideos.length
  ) {
    return;
  }


  const actuales =
    grid.querySelectorAll(
      ".video-card"
    ).length;


  const siguientes =
    todosLosVideos.slice(
      actuales,
      actuales + VIDEOS_POR_CARGA
    );


  if (!siguientes.length) {

    if (verMasContainer) {
      verMasContainer.classList.add(
        "hidden"
      );
    }

    return;
  }


  grid.insertAdjacentHTML(
    "beforeend",
    generarHTMLvideos(
      siguientes
    )
  );


  observarElementos(
    "#videosGrid .reveal-up, #videosGrid .reveal-left, #videosGrid .reveal-right"
  );


  const totalActual =
    grid.querySelectorAll(
      ".video-card"
    ).length;


  if (
    totalActual >=
    todosLosVideos.length
  ) {

    if (verMasContainer) {
      verMasContainer.classList.add(
        "hidden"
      );
    }

  }

}


// ================================================================
// EFECTO 3D LIBROS
// ================================================================

function aplicarEfecto3D() {

  const cards =
    document.querySelectorAll(
      "#librosGrid .book-card"
    );


  if (!cards.length) {
    return;
  }


  cards.forEach(card => {

    if (card._3dHandler) {

      card.removeEventListener(
        "mousemove",
        card._3dHandler
      );

    }


    if (card._3dLeaveHandler) {

      card.removeEventListener(
        "mouseleave",
        card._3dLeaveHandler
      );

    }


    const handler = (e) => {

      const rect =
        card.getBoundingClientRect();


      const x =
        e.clientX -
        rect.left;


      const y =
        e.clientY -
        rect.top;


      const centerX =
        rect.width / 2;


      const centerY =
        rect.height / 2;


      const rotateX =
        ((y - centerY) /
          centerY) *
        -12;


      const rotateY =
        ((x - centerX) /
          centerX) *
        12;


      card.style.transform =
        `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`;


      card.style.transition =
        "transform 0.1s ease";

    };


    const leaveHandler = () => {

      card.style.transform =
        "perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)";

      card.style.transition =
        "transform 0.4s ease";

    };


    card.addEventListener(
      "mousemove",
      handler
    );


    card.addEventListener(
      "mouseleave",
      leaveHandler
    );


    card._3dHandler =
      handler;


    card._3dLeaveHandler =
      leaveHandler;

  });

}


// ================================================================
// MODAL AUTOR
// ================================================================

window.openAuthorModal = function(index) {

  const autor =
    autoresData[index];


  if (!autor) {
    return;
  }


  const modal =
    document.getElementById(
      "author-modal"
    );


  const photo =
    document.getElementById(
      "author-modal-photo"
    );


  const name =
    document.getElementById(
      "author-modal-name"
    );


  const genre =
    document.getElementById(
      "author-modal-genre"
    );


  const bio =
    document.getElementById(
      "author-modal-bio"
    );


  const social =
    document.getElementById(
      "author-modal-social"
    );


  const link =
    document.getElementById(
      "author-modal-link"
    );


  if (!modal) {
    return;
  }


  if (photo) {

    photo.src =
      autor.foto ||
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop";

  }


  if (name) {

    name.textContent =
      autor.nombre ||
      "Autor";

  }


  if (genre) {

    genre.textContent =
      autor.genero ||
      "Talento Punto y Coma";

  }


  if (bio) {

    bio.textContent =
      autor.biografia ||
      autor.bio ||
      "Sin biografía disponible.";

  }


  if (social) {

    let socialHTML = "";


    const instagram =
      autor.redes?.instagram ||
      autor.instagram;


    const facebook =
      autor.redes?.facebook ||
      autor.facebook;


    const twitter =
      autor.redes?.twitter ||
      autor.twitter;


    const web =
      autor.redes?.web ||
      autor.enlace_venta ||
      autor.web;


    if (instagram) {

      socialHTML += `
        <a
          href="${escapeAttribute(instagram)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          <i class="fa-brands fa-instagram"></i>
        </a>
      `;

    }


    if (facebook) {

      socialHTML += `
        <a
          href="${escapeAttribute(facebook)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          <i class="fa-brands fa-facebook"></i>
        </a>
      `;

    }


    if (twitter) {

      socialHTML += `
        <a
          href="${escapeAttribute(twitter)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          <i class="fa-brands fa-x-twitter"></i>
        </a>
      `;

    }


    if (web) {

      socialHTML += `
        <a
          href="${escapeAttribute(web)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          <i class="fa-solid fa-globe"></i>
        </a>
      `;

    }


    social.innerHTML =
      socialHTML;

  }


  if (link) {

    link.href =
      autor.enlace_venta ||
      autor.redes?.web ||
      "#libreria";

    link.textContent =
      "Ver libros";

  }


  modal.classList.remove(
    "hidden"
  );

  modal.classList.add(
    "flex"
  );


  setTimeout(() => {

    modal.classList.remove(
      "opacity-0"
    );

    if (modal.firstElementChild) {

      modal.firstElementChild.classList.remove(
        "scale-95"
      );

    }

  }, 10);

};


// ================================================================
// CERRAR MODAL AUTOR
// ================================================================

function closeAuthorModal() {

  const modal =
    document.getElementById(
      "author-modal"
    );


  if (!modal) {
    return;
  }


  modal.classList.add(
    "opacity-0"
  );


  if (modal.firstElementChild) {

    modal.firstElementChild.classList.add(
      "scale-95"
    );

  }


  setTimeout(() => {

    modal.classList.add(
      "hidden"
    );

    modal.classList.remove(
      "flex"
    );

  }, 250);

}


// ================================================================
// NOTICIA BASE64
// ================================================================

window.abrirNoticiaDesdeBase64 =
  function(base64Data) {

    try {

      const jsonString =
        decodeURIComponent(
          escape(
            atob(base64Data)
          )
        );


      const noticia =
        JSON.parse(
          jsonString
        );


      abrirModalNoticia(
        noticia
      );


    } catch (error) {

      console.error(
        "❌ Error decodificando la noticia:",
        error
      );

    }

  };


// ================================================================
// MODAL NOTICIA
// ================================================================

function abrirModalNoticia(noticia) {

  const modal =
    document.getElementById(
      "news-modal"
    );


  const content =
    document.getElementById(
      "modal-content-body"
    );


  if (
    !modal ||
    !content
  ) {
    return;
  }


  content.innerHTML = `

    <div class="p-8 md:p-10 text-crema">

      <p class="text-dorado text-xs uppercase tracking-widest mb-3">

        ${escapeHTML(noticia.categoria || "Noticias")}

        ${
          noticia.fecha_publicacion
            ? ` · ${escapeHTML(String(noticia.fecha_publicacion))}`
            : ""
        }

      </p>


      <h3 class="font-serif text-3xl mb-5">
        ${escapeHTML(noticia.titulo || "Sin título")}
      </h3>


      ${
        noticia.autor
          ? `
            <p class="text-cremadark mb-5">
              Por ${escapeHTML(noticia.autor)}
            </p>
          `
          : ""
      }


      <div class="text-cremadark leading-relaxed whitespace-pre-wrap">
        ${escapeHTML(
          noticia.contenido ||
          noticia.resumen ||
          ""
        )}
      </div>

    </div>

  `;


  modal.classList.remove(
    "hidden"
  );

  modal.classList.add(
    "flex"
  );


  setTimeout(() => {

    modal.classList.remove(
      "opacity-0"
    );

    if (modal.firstElementChild) {

      modal.firstElementChild.classList.remove(
        "scale-95"
      );

    }

  }, 10);

}


// ================================================================
// CERRAR MODAL NOTICIA
// ================================================================

function closeNewsModal() {

  const modal =
    document.getElementById(
      "news-modal"
    );


  if (!modal) {
    return;
  }


  modal.classList.add(
    "opacity-0"
  );


  if (modal.firstElementChild) {

    modal.firstElementChild.classList.add(
      "scale-95"
    );

  }


  setTimeout(() => {

    modal.classList.add(
      "hidden"
    );

    modal.classList.remove(
      "flex"
    );

  }, 250);

}


// ================================================================
// QR
// ================================================================

window.openQRModal =
  function(author, path) {

    const modal =
      document.getElementById(
        "qr-modal"
      );


    if (!modal) {
      return;
    }


    const authorName =
      document.getElementById(
        "qr-author-name"
      );


    const qrImage =
      document.getElementById(
        "qr-image"
      );


    if (authorName) {

      authorName.textContent =
        author;

    }


    try {

      const url =
        new URL(
          path || "#libreria",
          window.location.href
        ).href;


      if (qrImage) {

        qrImage.src =
          "https://api.qrserver.com/v1/create-qr-code/?size=240x240&color=2C0E14&data=" +
          encodeURIComponent(url);

      }

    } catch (error) {

      console.error(
        "❌ Error generando QR:",
        error
      );

    }


    modal.classList.remove(
      "hidden"
    );

    modal.classList.add(
      "flex"
    );


    setTimeout(() => {

      modal.classList.remove(
        "opacity-0"
      );

      if (modal.firstElementChild) {

        modal.firstElementChild.classList.remove(
          "scale-95"
        );

      }

    }, 10);

  };


// ================================================================
// CERRAR QR
// ================================================================

window.closeQRModal =
  function() {

    const modal =
      document.getElementById(
        "qr-modal"
      );


    if (!modal) {
      return;
    }


    modal.classList.add(
      "opacity-0"
    );


    if (modal.firstElementChild) {

      modal.firstElementChild.classList.add(
        "scale-95"
      );

    }


    setTimeout(() => {

      modal.classList.add(
        "hidden"
      );

      modal.classList.remove(
        "flex"
      );

    }, 250);

  };


// ================================================================
// VIDEOS
// ================================================================

window.abrirVideo =
  function(url) {

    if (!url || url === "#") {
      return;
    }


    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );

  };


// ================================================================
// INTERSECTION OBSERVER
// ================================================================

const observer =
  new IntersectionObserver(
    (entries) => {

      entries.forEach(
        entry => {

          if (
            entry.isIntersecting
          ) {

            entry.target.classList.add(
              "active"
            );

            observer.unobserve(
              entry.target
            );

          }

        }
      );

    },
    {
      threshold: 0.15
    }
  );


// ================================================================
// OBSERVAR ELEMENTOS
// ================================================================

function observarElementos(selector) {

  document
    .querySelectorAll(selector)
    .forEach(
      element =>
        observer.observe(
          element
        )
    );

}


// ================================================================
// UTILIDADES
// ================================================================

function obtenerTimestamp(valor) {

  if (!valor) {
    return 0;
  }


  // Timestamp de Firebase

  if (
    typeof valor.toMillis ===
    "function"
  ) {

    return valor.toMillis();

  }


  // Timestamp serializado

  if (
    typeof valor.seconds ===
    "number"
  ) {

    return valor.seconds * 1000;

  }


  // Fecha normal

  const fecha =
    new Date(valor).getTime();


  return Number.isNaN(fecha)
    ? 0
    : fecha;

}


// ================================================================
// FORMATEAR FECHA
// ================================================================

function formatearFecha(fecha) {

  if (!fecha) {
    return "";
  }


  try {

    let fechaFinal;


    if (
      typeof fecha.toDate ===
      "function"
    ) {

      fechaFinal =
        fecha.toDate();

    } else {

      fechaFinal =
        new Date(fecha);

    }


    if (
      Number.isNaN(
        fechaFinal.getTime()
      )
    ) {

      return "";

    }


    return fechaFinal.toLocaleDateString(
      "es-CL",
      {
        year: "numeric",
        month: "short",
        day: "numeric"
      }
    );

  } catch {

    return "";

  }

}


// ================================================================
// IMAGEN NOTICIA
// ================================================================

function obtenerImagenNoticia(noticia) {

  if (
    noticia.imagenes &&
    Array.isArray(
      noticia.imagenes
    ) &&
    noticia.imagenes.length
  ) {

    const principal =
      noticia.imagenes.find(
        img =>
          img &&
          img.orden === 0
      );


    if (
      principal &&
      principal.url
    ) {

      return principal.url;

    }


    if (
      noticia.imagenes[0] &&
      noticia.imagenes[0].url
    ) {

      return noticia.imagenes[0].url;

    }

  }


  return "https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=600&auto=format&fit=crop";

}


// ================================================================
// ESCAPE HTML
// ================================================================

function escapeHTML(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


// ================================================================
// ESCAPE ATRIBUTOS
// ================================================================

function escapeAttribute(value) {

  return escapeHTML(
    value || ""
  );

}


// ================================================================
// CARGA INICIAL DE ANIMACIONES
// ================================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    observarElementos(
      ".reveal-up, .reveal-left, .reveal-right, .reveal-zoom"
    );

  }
);