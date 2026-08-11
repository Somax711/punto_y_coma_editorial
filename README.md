
# Editorial Punto y Coma --Sitio Web 

Sitio web oficial de Editorial Punto y Coma, desarrollado con una arquitectura ligera y moderna basada en HTML, Tailwind CSS (vía CDN) 
y Firebase (Auth, Firestore y Storage). No requiere frameworks complejos ni procesos de compilación (build step).
Cuenta con una galería de noticias interactiva y un panel de control administrativo completo para la gestión de contenidos.

# Estructura del proyecto 

index.html                      → Sitio web público (landing page y sección de noticias)
style.css                       → Estilos personalizados y paleta de colores corporativa
scripts.js                      → Lógica de interacción general y modal de noticias
tailwind.config.js              → Configuración de la paleta de colores en Tailwind
paneldecontrol/
  index_usuario.html            → Interfaz de autenticación (Login) y panel de administración
  panel.js                      → Operaciones CRUD de noticias (crear, editar, eliminar)
  noticias_firebase.js          → Carga y renderizado dinámico de la galería de noticias
firestore.rules                 → Reglas de seguridad recomendadas para Firestore
storage.rules                   → Reglas de seguridad recomendadas para Firebase Storage
img/logo.png, favicon.png       → Recursos gráficos corporativos


#  Paleta de colores Corporativa 

Uso                                          Color              Hexadecimal
"primary (Botones, CTA, acentos)"            Vino               #810B38
"secondary (Textos principales, footer)"     Granate            #541A1A
"accent(Detalles, badges, bordes)"           Arena              #DCC3AA
"lightbg(Fondos suaves, tarjetas)"           Crema              #F1E2D1


1. Pasos para la Configuración y Publicación

  1. Configurar el Proyecto en Firebase Accede a Firebase Console y haz clic en Crear proyecto.

  2. Authentication: Ve a Compilación > Authentication, habilita el proveedor Correo/contraseña y añade un usuario en la pestaña Users (este será el administrador, ej. admin@editorialpuntoycoma.cl).

  3. Firestore Database: Ve a Compilación > Firestore Database, crea la base de datos en modo producción y pega el contenido del archivo firestore.rules en la pestaña Reglas.

  4. Storage: Ve a Compilación > Storage, inicializa el servicio y pega el contenido del archivo storage.rules en la pestaña Reglas.

  5. Credenciales: En Configuración del proyecto > General > Tus apps, añade una app web y copia el objeto firebaseConfig.

  6. Pega este objeto de configuración en:
     - index.html (reemplazando el marcador REEMPLAZAR_API_KEY).
     - paneldecontrol/index_usuario.html (en el bloque correspondiente de Firebase).


2. Configurar Datos de Contacto
Actualiza las constantes de contacto al inicio del archivo scripts.js:

const EDITORIAL_WHATSAPP = "56900000000"; // Número real con formato 569XXXXXXXX
const EDITORIAL_EMAIL = "contacto@editorialpuntoycoma.cl"; // Correo electrónico real
(Esto actualizará de forma automática los enlaces directos a WhatsApp y el correo visible en la sección de contacto.)

3. Actualizar Recursos Gráficos y Metadatos
Logotipo: Reemplaza img/logo.png y favicon.png por los archivos oficiales de la editorial manteniendo los mismos nombres (o actualiza las rutas en index.html).

Dominio: Reemplaza la cadena provisional editorialpuntoycoma.cl por el dominio definitivo en index.html (etiquetas SEO y Schema.org), robots.txt y sitemap.xml.

4. Gestión de Noticias
Una vez completada la configuración de Firebase:

Ingresa al panel administrativo a través de paneldecontrol/index_usuario.html (o mediante el enlace de acceso en el pie de página).

Inicia sesión con las credenciales creadas en la consola de Firebase.

Utiliza la opción + Nueva noticia para redactar títulos, resúmenes, contenido detallado, categorías y cargar imágenes asociadas.

Los cambios se reflejarán instantáneamente en la sección pública de noticias (index.html#noticias).

# Despliegue
Al ser una aplicación web completamente estática, el despliegue es inmediato y flexible:

Netlify: Arrastrando la carpeta del proyecto a Netlify Drop o conectando el repositorio de GitHub para despliegues automatizados.

Vercel / GitHub Pages: Compatible mediante integración directa con repositorio.

# Notas Técnicas
Formulario de Contacto: Los mensajes enviados por los usuarios se almacenan de manera segura en la colección mensajes_contacto de Firestore, accesibles exclusivamente desde el panel de administración. Es posible integrar servicios de notificación por correo (como EmailJS) posteriormente si se requiere.

Contenido de Ejemplo: Las cifras estadísticas de la sección principal (autores publicados, obras en catálogo) y los testimonios son referenciales y deben actualizarse con información real de la editorial.