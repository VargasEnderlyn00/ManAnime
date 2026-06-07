# ManAnime - Plataforma Anime & Manga

## Descripción

ManAnime es una aplicación web completa para descubrir, explorar y comprar mangas, con funcionalidades de autenticación de usuarios, listas personalizadas, carrito de compras y sistema de favoritos.

## Tecnologías Utilizadas

### Backend
- **Node.js** - Entorno de ejecución
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos
- **bcrypt** - Encriptación de contraseñas

### Frontend
- **HTML5/CSS3** - Estructura y estilos
- **Bootstrap 5** - Framework CSS responsive
- **JavaScript (ES6+)** - Lógica del cliente

## Requisitos Previos

1. **Node.js** (v14 o superior)
2. **PostgreSQL** (v12 o superior)
3. **npm** o **yarn**

## Instalación y Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar la base de datos

Crear un archivo `.env` en la raíz del proyecto con las credenciales de PostgreSQL:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_DATABASE=nombre_base_datos
PORT=3000
```

Ejecutar el script de base de datos para crear las tablas:

```bash
psql -U tu_usuario -d nombre_base_datos -f database/schema.sql
```

### 3. Iniciar el servidor

```bash
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## Estructura del Proyecto

```
├── backend/
│   ├── config/
│   │   └── database.js          # Configuración PostgreSQL
│   ├── models/
│   │   ├── User.js             # Modelo usuarios
│   │   ├── Anime.js            # Modelo animes
│   │   ├── Manga.js            # Modelo mangas
│   │   ├── Carrito.js          # Modelo carrito
│   │   ├── Favorito.js         # Modelo favoritos
│   │   ├── ListaUsuario.js      # Modelo listas
│   │   └── Genero.js           # Modelo géneros
│   └── server.js               # Servidor Express
├── frontend/
│   ├── index.html              # Página principal (Home)
│   ├── inicio.html             # Página con carrusel de animes
│   ├── css/
│   │   ├── style.css           # Estilos principales
│   │   └── carrusel.css        # Estilos del carrusel
│   ├── js/
│   │   ├── auth.js             # Autenticación y gestión de sesión
│   │   ├── script.js           # Lógica principal
│   │   └── animated-bg.js      # Fondo animado de partículas
│   └── pages/
│       ├── login.html          # Inicio de sesión
│       ├── register.html       # Registro de usuarios
│       ├── animes.html         # Catálogo de animes
│       ├── mangas.html         # Tienda de mangas
│       ├── carrito.html        # Carrito de compras
│       └── perfil.html         # Perfil de usuario
└── package.json
```

## Funcionalidades Principales

### Páginas

1. **index.html (Home)** - Página de bienvenida con botones de registro/login
2. **inicio.html** - Página principal con carrusel de animes destacados y sección de "Populares esta semana"
3. **animes.html** - Catálogo completo de animes con filtros por búsqueda y género
4. **mangas.html** - Tienda de mangas con sistema de carrito
5. **carrito.html** - Gestión del carrito y proceso de compra
6. **perfil.html** - Perfil de usuario con tabs: Listas, Compras y Favoritos

### Sistema de Autenticación

- Registro de nuevos usuarios
- Inicio de sesión con email y contraseña
- Sesión persistente con localStorage
- Contraseñas encriptadas con bcrypt
- Redirección automática de usuarios autenticados

### Listas Personalizadas (Mis Listas)

Los usuarios pueden agregar animes a su lista personal con tres estados:
- **✓ Visto** - Animes que ya ha completado
- **⏳ Pendiente** - Animes que planea ver
- **✗ Abandonado** - Animes que no terminó

Acceso: Desde el modal de "Ver Detalles" de cualquier anime en `animes.html` o `inicio.html`.

### Carrito de Compras

- Agregar mangas al carrito
- Ver lista de productos
- Calcular subtotal y total
- Procesar compra con creación de orden
- Actualización automática de stock

### Favoritos

- Agregar animes y mangas a favoritos
- Visualización en el perfil
- Eliminación individual

## Animaciones

- **Fondo animado de partículas** (animated-bg.js)
  - Partículas interactivas con el mouse
  - Formas: círculos, diamantes y triángulos
  - Colores temáticos (rojo, rosa, blanco, amarillo)
  - Opacidad ajustada (0.15 en páginas de contenido, 0.3 en home)
  - Visible en todas las páginas

## API Endpoints

### Autenticación
- `POST /api/register` - Registrar nuevo usuario
- `POST /api/login` - Iniciar sesión

### Catálogo
- `GET /api/animes` - Listar animes (filtros: genero, ano, buscar, limit)
- `GET /api/animes/:id` - Detalle de un anime
- `GET /api/mangas` - Listar mangas (filtros: genero, buscar)
- `GET /api/generos` - Listar todos los géneros

### Carrito
- `GET /api/carrito/:usuario_id` - Obtener carrito
- `POST /api/carrito` - Agregar manga al carrito
- `DELETE /api/carrito/:id` - Eliminar item del carrito

### Compras
- `POST /api/ordenes` - Crear orden de compra
- `GET /api/ordenes/:usuario_id` - Historial de órdenes

### Listas
- `GET /api/lista/:usuario_id` - Listas personalizadas (tipo lista)
- `GET /api/lista-usuario/:usuario_id` - Lista de usuario por estado
- `POST /api/lista` - Agregar anime a lista con estado
- `PUT /api/lista/:usuario_id/:anime_id` - Actualizar estado en lista

### Favoritos
- `GET /api/favoritos/:usuario_id` - Obtener favoritos
- `POST /api/favoritos` - Agregar a favoritos
- `DELETE /api/favoritos/:id` - Eliminar favorito

## Navegación

- El navbar muestra las opciones según el estado de autenticación
- Las opciones de Animes/Mangas están deshabilitadas hasta iniciar sesión
- Tooltip informativo en opciones bloqueadas

## Solución de Problemas Comunes

1. **Error de conexión a la base de datos**
   - Verificar que PostgreSQL esté en ejecución
   - Confirmar credenciales en `.env`

2. **Los animes populares no cargan**
   - Verificar que la API esté funcionando: `http://localhost:3000/api/animes`
   - Se requieren datos en la tabla `animes` con `calificacion_promedio`

3. **Los estilos no se aplican**
   - Verificar conexión a internet (Bootstrap CDN)
   - Ejecutar desde el servidor, no desde archivo local

## Scripts Disponibles

```bash
npm start    # Iniciar servidor en producción
npm run dev  # Iniciar servidor (modo desarrollo)
```