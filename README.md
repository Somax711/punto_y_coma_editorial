# Editorial Punto y Coma — Sitio web

Sitio web construido sobre la misma base técnica del sitio de referencia
(`uv_asesorias`): HTML + Tailwind (CDN) + Firebase (Auth, Firestore, Storage),
sin frameworks ni build step. La sección de **galería de propiedades** del
sitio original fue reemplazada por una **galería de noticias**, administrable
desde un panel de control propio.

## Estructura

```
index.html                         → Sitio público
style.css                          → Estilos (paleta Punto y Coma)
scripts.js                         → Interacción general + modal de noticias
tailwind.config.js                 → Paleta de colores Tailwind
paneldecontrol/
  index_usuario.html               → Login + dashboard del panel admin
  panel.js                         → CRUD de noticias (crear/editar/eliminar)
  noticias_firebase.js             → Carga y renderiza la galería de noticias
firestore.rules                    → Reglas de seguridad sugeridas
storage.rules                      → Reglas de seguridad sugeridas
img/logo.png, favicon.png          → Logo provisional (monograma "P;")
```

## Paleta de colores aplicada

| Uso                        | Color     | Hex        |
|-----------------------------|-----------|------------|
| `primary` (CTA, acentos)    | Vino      | `#810B38`  |
| `secondary` (textos, footer)| Granate   | `#541A1A`  |
| `accent` (detalles, badges) | Arena     | `#DCC3AA`  |
| `lightbg` (fondos suaves)   | Crema     | `#F1E2D1`  |

## Pasos pendientes antes de publicar

### 1. Crear el proyecto Firebase
1. Ir a [console.firebase.google.com](https://console.firebase.google.com) → **Crear proyecto**.
2. Dentro del proyecto: **Compilación → Authentication** → habilitar el proveedor
   **Correo/contraseña** → pestaña *Users* → **Agregar usuario** (este será el
   login del panel de control, ej. `admin@editorialpuntoycoma.cl`).
3. **Compilación → Firestore Database** → Crear base de datos (modo producción).
   Luego pega el contenido de `firestore.rules` en la pestaña *Reglas*.
4. **Compilación → Storage** → Comenzar. Pega el contenido de `storage.rules`
   en la pestaña *Reglas*.
5. En **Configuración del proyecto → General → Tus apps** → agregar app **Web**
   → copiar el objeto `firebaseConfig` que entrega Firebase.
6. Pegar ese mismo objeto **en dos archivos**: `index.html` (busca
   `REEMPLAZAR_API_KEY`) y `paneldecontrol/index_usuario.html` (mismo bloque).

### 2. Datos de contacto
Editar solo estas dos líneas al inicio de `scripts.js`:
```js
const EDITORIAL_WHATSAPP = "56900000000"; // número real, formato 569XXXXXXXX
const EDITORIAL_EMAIL = "contacto@editorialpuntoycoma.cl"; // correo real
```
Esto actualiza automáticamente todos los botones de WhatsApp y el correo
mostrado en la sección de contacto.

### 3. Logo
`img/logo.png` y `favicon.png` son un monograma provisional ("P;"). Reemplázalos
por el logo oficial de la editorial manteniendo el mismo nombre de archivo
(o actualiza las referencias en `index.html`).

### 4. Dominio
Buscar y reemplazar `editorialpuntoycoma.cl` por el dominio real en:
`index.html` (meta tags SEO, schema.org), `robots.txt`, `sitemap.xml`.

### 5. Publicar noticias
Una vez configurado Firebase y creado el usuario admin:
1. Entrar a `paneldecontrol/index_usuario.html` (o el link "Acceso admin" del
   footer del sitio).
2. Iniciar sesión con el correo/contraseña creados en el paso 1.
3. **+ Nueva noticia** → completar título, resumen, contenido, categoría,
   imágenes → Guardar.
4. La noticia aparece automáticamente en la sección **Noticias** del sitio
   público (`index.html#noticias`), con carrusel de imágenes y modal de
   lectura completa.

## Despliegue

Al ser un sitio 100% estático, se puede publicar igual que el sitio de
referencia: arrastrando la carpeta a [Netlify Drop](https://app.netlify.com/drop),
o conectando el repositorio de GitHub a Netlify/Vercel para despliegue continuo.
No requiere build step ni backend propio (Firebase cumple ese rol).

## Notas

- Los mensajes del formulario de contacto se guardan en la colección
  `mensajes_contacto` de Firestore (visible solo para el usuario admin
  autenticado). Si prefieren recibirlos también por correo, se puede integrar
  EmailJS o una Cloud Function más adelante.
- Las cifras de la sección "Hero" (autores publicados, etc.) y los testimonios
  de la sección "Testimonios" son de ejemplo — reemplazar por datos reales.
