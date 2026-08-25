#  Editorial Punto y Coma — Plataforma Editorial

![Editorial Punto y Coma](https://www.editorialpuntoycoma.com/logovector.png)

> ** AVISO IMPORTANTE:** Este repositorio es **exclusivamente para fines de demostración y portafolio**. No está permitido su uso, modificación, distribución o implementación sin autorización expresa del autor. El proyecto se presenta tal cual, como muestra de capacidades técnicas y de desarrollo.

---

##  Descripción del Proyecto

Plataforma web completa para la gestión editorial de **Editorial Punto y Coma**, una editorial independiente que ofrece servicios de edición, publicación y distribución de libros. El sistema incluye:

- **Sitio público** con diseño responsivo, animaciones, efecto 3D en libros, sección de noticias, autores, videos y catálogo de libros con filtros y modal de detalles.
- **Panel de administración** seguro con autenticación, gestión de contenido (CRUD) para noticias, autores, libros, videos y mensajes de contacto.
- **Backend en Firebase** (Firestore, Storage, Authentication) para almacenamiento de datos y archivos.

Este proyecto fue desarrollado como solución integral para una editorial real, demostrando habilidades en:

- **Frontend**: HTML5, CSS3 (Tailwind + custom), JavaScript vanilla.
- **Backend as a Service**: Firebase (Auth, Firestore, Storage).
- **UX/UI**: Diseño atractivo, responsivo, con microinteracciones y efectos visuales.
- **SEO**: Meta tags, Open Graph, Schema.org, sitemap.xml.
- **Seguridad**: Autenticación, reglas de Firestore y Storage.

---

##  Características Destacadas

| Área | Funcionalidad |
|------|---------------|
| **Página Pública** | Hero animado, noticias en grid de 4 columnas, servicios, autores con QR, libros con efecto 3D y paginación, videos, formulario de contacto con envío a Firestore. |
| **Panel de Administración** | Gestión completa de noticias (con imágenes), autores (foto, redes), libros (portada, precio, sinopsis), videos (URL de YouTube, miniatura), mensajes (leído/no leído). |
| **Interacciones** | Efecto 3D en tarjetas de libros (movimiento del mouse), modales para detalles de libros, autores y noticias, filtros de búsqueda y categoría. |
| **SEO** | Meta tags personalizados, Open Graph, Twitter Cards, Schema.org (Organización), sitemap.xml y robots.txt. |
| **Seguridad** | Autenticación con correo/contraseña (solo administradores autorizados), reglas de Firestore y Storage con permisos granulares. |
| **Rendimiento** | Carga perezosa de imágenes (lazy loading), paginación de libros y videos, reintentos automáticos en subidas de archivos. |
| **Pruebas** | Script de carga masiva de datos (libros, autores, noticias, videos) desde consola para pruebas de rendimiento. |

---

## 🛠️ Stack Tecnológico

| Tecnología | Propósito |
|------------|-----------|
| **Firebase** (Auth, Firestore, Storage) | Autenticación, base de datos NoSQL en tiempo real, almacenamiento de imágenes y archivos. |
| **Tailwind CSS** | Estilos rápidos, responsivos y personalizables. |
| **Font Awesome** | Iconografía vectorial. |
| **Google Fonts** | Tipografías `Playfair Display` (serif) y `Lato` (sans-serif). |
| **JavaScript Vanilla** | Lógica de frontend y administración (sin frameworks). |
| **HTML5 / CSS3** | Estructura y estilos personalizados (animaciones, transiciones). |
| **GitHub** | Control de versiones y repositorio. |
| **Netlify / Vercel / Hosting** | Despliegue en producción (ejemplo: editorialpuntoycoma.com). |

---

##  Estructura del Repositorio

```
/
├── index.html                      # Página pública principal
├── style.css                       # Estilos personalizados (animaciones, efectos 3D)
├── scripts.js                      # Lógica de la página pública (carga de datos, modales)
├── logovector.png                  # Logo de la editorial
├── sitemap.xml                     # Mapa del sitio para SEO
├── robots.txt                      # Instrucciones para bots de búsqueda
├── paneldecontrol/
│   ├── index_usuario.html          # Panel de administración (interfaz)
│   ├── firebase-config.js          # Configuración de Firebase (credenciales)
│   └── panel.js                    # Lógica del panel (CRUD, autenticación, reintentos)
├── README.md                       # Este archivo
└── (otros assets y documentos)
```

---

##  Instalación y Configuración (para propósitos demostrativos)

El proyecto está diseñado para ser desplegado en un entorno de producción, pero al ser un repositorio de muestra, **no se recomienda su uso directo**. A continuación, se describen los pasos generales de configuración para entender su funcionamiento:

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/editorial-puntoycoma.git
cd editorial-puntoycoma
```

### 2. Configurar Firebase
- Crear un proyecto en [Firebase Console](https://console.firebase.google.com/).
- Habilitar **Authentication** (correo/contraseña) y **Autenticación anónima** (para el formulario de contacto).
- Crear base de datos **Firestore** y **Storage**.
- Obtener las credenciales del proyecto y reemplazarlas en `paneldecontrol/firebase-config.js`.
- Agregar los correos de administradores en `FIREBASE_ADMIN_EMAILS`.

### 3. Reglas de Firestore y Storage
Configurar las reglas como se indica en la documentación interna del proyecto.

### 4. Despliegue
Subir los archivos a un hosting (Netlify, Vercel, cPanel, etc.).

---

##  Script de Prueba (Datos Masivos)

Para probar el rendimiento del sistema con grandes volúmenes de datos, se incluye un script que se ejecuta en la consola del navegador (dentro del panel de administración). Este script genera:

- **20 autores** (con nombres, géneros, biografías, fotos)
- **50 libros** (títulos, autores, precios, categorías, sinopsis, portadas)
- **15 noticias** (titulares, resúmenes, contenido, imágenes)
- **10 videos** (títulos, descripciones, URLs de YouTube, miniaturas)

```javascript
// Script completo disponible en la documentación interna.
// Ejecutar únicamente en entorno de prueba.
```

---

##  Funcionalidades del Panel de Administración

| Módulo | Funciones |
|--------|-----------|
| **Noticias** | Crear, editar, eliminar, filtrar por título, categoría y estado. Subir imágenes (múltiples). |
| **Autores** | Crear, editar, eliminar. Subir foto, redes sociales, enlace de venta. Generar código QR. |
| **Libros** | Crear, editar, eliminar. Subir portada, precio, sinopsis, enlace de compra. Filtros y paginación. |
| **Videos** | Crear, editar, eliminar. Pegar URL de YouTube (miniatura automática). |
| **Mensajes** | Ver mensajes del formulario de contacto, marcar como leído, eliminar. |
| **Configuración** | Actualizar nombre y teléfono del administrador. |

---

##  Diseño y Experiencia de Usuario

- **Paleta de colores**: Tonos cálidos y terrosos (`#B85C4A`, `#FFF9F2`, `#3B2925`, `#D9A6A0`) que reflejan la identidad de la editorial.
- **Tipografía**: Combinación de serif (`Playfair Display`) para títulos y sans-serif (`Lato`) para textos, logrando elegancia y legibilidad.
- **Animaciones**: Efecto de revelado al hacer scroll, fondo animado en el hero, brillo en botones, efecto 3D en libros (movimiento del mouse), transiciones suaves en modales.
- **Responsive**: Adaptación a todos los dispositivos (móvil, tablet, escritorio).
- **Microinteracciones**: Botones con hover, tarjetas que se elevan, iconos con movimiento.

---

##  Seguridad y Control de Acceso

- **Autenticación**: Solo usuarios con correo en `FIREBASE_ADMIN_EMAILS` pueden acceder al panel.
- **Persistencia de sesión**: Configurable (por defecto, la sesión expira al cerrar el navegador).
- **Reglas de Firestore**: Lectura pública, escritura solo para usuarios autenticados.
- **Reglas de Storage**: Lectura pública, escritura solo para usuarios autenticados.
- **Prevención de ataques**: Las reglas de Firebase evitan escrituras no autorizadas.

---

##  SEO y Optimización

- **Meta tags** personalizadas (título, descripción, keywords).
- **Open Graph** y **Twitter Cards** para compartir en redes sociales.
- **Schema.org** (Organización) para mejorar el posicionamiento.
- **Sitemap.xml** y **robots.txt** incluidos.
- **Google Analytics** integrado (opcional, se puede agregar el ID de medición).

---

## 🧑‍💻 Sobre el Autor

Este proyecto fue desarrollado como parte de un portafolio profesional, demostrando habilidades en desarrollo web full-stack, integración con Firebase, diseño UI/UX, y optimización SEO. Si deseas contactar al autor, puedes hacerlo a través de:

- **Correo**: [puntoycoma.ediciontextos@gmail.com](mailto:puntoycoma.ediciontextos@gmail.com)
- **WhatsApp**: [+57 3116060210](https://wa.me/573116060210)
- **Web**: [https://www.editorialpuntoycoma.com](https://www.editorialpuntoycoma.com)

---

##  Licencia y Uso

Este proyecto se comparte **exclusivamente con fines demostrativos y de portafolio**. No está permitido:

- Copiar, modificar, distribuir o implementar el código sin autorización expresa del autor.
- Utilizar el contenido (textos, imágenes, diseño) para fines comerciales.
- Eliminar o modificar los créditos del autor.

Si deseas utilizar este proyecto como base para tu propio desarrollo, por favor contacta al autor para obtener permiso.

---

##  Agradecimientos

- A **Editorial Punto y Coma** por confiar en el desarrollo de esta plataforma.
- A la comunidad de Firebase y Tailwind CSS por las excelentes herramientas.
- A todos los que han contribuido con ideas y feedback durante el desarrollo.

---

**© 2026 Editorial Punto y Coma - Todos los derechos reservados.**