// window.API_URL ya está definida en auth.js, no redeclarar

let carrito = [];
let usuarioId = null;

// ==================== CARGAR GÉNEROS ====================
async function cargarGeneros() {
    try {
        const response = await fetch(`${window.API_URL}/generos`);
        const generos = await response.json();

        const selectAnimes = document.getElementById('filtroGenero');
        if (selectAnimes) {
            selectAnimes.innerHTML = '<option value="">Todos los géneros</option>' +
                generos.map(g => `<option value="${g.nombre}">${g.nombre}</option>`).join('');
        }

        const selectMangas = document.getElementById('filtroGeneroManga');
        if (selectMangas) {
            selectMangas.innerHTML = '<option value="">Todos los géneros</option>' +
                generos.map(g => `<option value="${g.nombre}">${g.nombre}</option>`).join('');
        }
    } catch (error) {
        console.error("Error cargando géneros:", error);
    }
}

// ==================== SETUP FILTROS ANIMES ====================
function setupFiltroAnimes() {
    const buscarInput = document.getElementById('buscar');
    const generoSelect = document.getElementById('filtroGenero');

    if (buscarInput) {
        buscarInput.addEventListener('input', cargarAnimesFiltrados);
    }
    if (generoSelect) {
        generoSelect.addEventListener('change', cargarAnimesFiltrados);
    }
}

async function cargarAnimesFiltrados() {
    const buscarInput = document.getElementById('buscar');
    const generoSelect = document.getElementById('filtroGenero');
    const buscar = buscarInput ? buscarInput.value : '';
    const genero = generoSelect ? generoSelect.value : '';
    await cargarAnimes({ buscar, genero });
}

// ==================== SETUP FILTROS MANGAS ====================
function setupFiltroMangas() {
    const buscarInput = document.getElementById('buscar-manga');
    const generoSelect = document.getElementById('filtroGeneroManga');

    if (buscarInput) {
        buscarInput.addEventListener('input', cargarMangasFiltrados);
    }
    if (generoSelect) {
        generoSelect.addEventListener('change', cargarMangasFiltrados);
    }
}

async function cargarMangasFiltrados() {
    const buscarInput = document.getElementById('buscar-manga');
    const generoSelect = document.getElementById('filtroGeneroManga');
    const buscar = buscarInput ? buscarInput.value : '';
    const genero = generoSelect ? generoSelect.value : '';
    await cargarMangas({ buscar, genero });
}

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', async () => {
    const usuarioJSON = localStorage.getItem('usuarioActual');
    if (usuarioJSON) {
        usuarioId = JSON.parse(usuarioJSON).id;
        await cargarCarritoDesdeBD();
    }

    const paginaActual = window.location.pathname.split('/').pop();
    const paginasProtegidas = ['perfil.html', 'carrito.html'];
    if (paginasProtegidas.includes(paginaActual) && !usuarioId) {
        return;
    }

    actualizarNavbar();
    await cargarGeneros();

    if (paginaActual === 'inicio.html' || paginaActual === 'index.html' || paginaActual === '/') {
        await cargarAnimes();
        await cargarPopulares();
    } else if (paginaActual === 'animes.html') {
        await cargarAnimes();
        setupFiltroAnimes();
    } else if (paginaActual === 'mangas.html') {
        await cargarMangas();
        setupFiltroMangas();
    } else if (paginaActual === 'carrito.html') {
        if (usuarioId) {
            await cargarCarritoDesdeBD();
        } else {
            document.getElementById('lista-carrito').innerHTML =
                '<div class="text-center py-5"><p class="text-muted">Debes iniciar sesión para ver tu carrito</p><a href="pages/login.html" class="btn btn-primary">Iniciar Sesión</a></div>';
        }
    } else if (paginaActual === 'perfil.html') {
        if (!usuarioId) {
            window.location.href = 'pages/login.html';
        } else {
            await cargarComprasPerfil();
            await cargarListasPerfil();
            await cargarFavoritosPerfil();
        }
    }

    actualizarContadorCarrito();
});

// ==================== CARGAR ANIMES ====================
async function cargarAnimes(filters = {}) {
    try {
        const params = new URLSearchParams();
        if (filters.buscar) params.append('buscar', filters.buscar);
        if (filters.genero) params.append('genero', filters.genero);

        const response = await fetch(`${window.API_URL}/animes?${params}`);
        const animes = await response.json();

        const contenedor = document.getElementById('lista-animes');
        if (!contenedor) return;

        contenedor.innerHTML = animes.map(anime => `
            <div class="col">
                <div class="card bg-dark border-light h-100 position-relative">
                    <button class="btn btn-sm btn-outline-warning position-absolute top-0 end-0 m-1 rounded-0" 
                            onclick="agregarAFavoritos(${anime.id}, null)" title="Agregar a favoritos">
                        <i class="bi bi-star"></i>
                    </button>
                    <img src="${anime.imagen_url || 'https://picsum.photos/id/1015/300/400'}"
                         class="card-img-top" style="height: 380px; object-fit: cover;">
                    <div class="card-body">
                        <h6 class="card-title">${anime.titulo}</h6>
                        <p class="text-warning">★ ${anime.calificacion_promedio || 'N/A'}</p>
                        <small class="text-muted">${Array.isArray(anime.generos) ? anime.generos.join(' • ') : ''}</small>
                    </div>
                    <div class="card-footer bg-dark border-light">
                        <button class="btn btn-outline-danger w-100 btn-sm" onclick="verDetalleAnime(${anime.id})">
                            Ver Detalles
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error("Error cargando animes:", error);
    }
}

// Agregar a favoritos
async function agregarAFavoritos(animeId, mangaId) {
    const usuarioId = Auth.getUsuarioId();
    if (!usuarioId) {
        alert('Debes iniciar sesión para agregar a favoritos');
        window.location.href = 'pages/login.html';
        return;
    }

    try {
        const response = await fetch(`${window.API_URL}/favoritos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: usuarioId, anime_id: animeId, manga_id: mangaId })
        });

        if (response.ok) {
            alert('✅ Agregado a favoritos');
        } else if (response.status === 409) {
            alert('Este elemento ya está en tus favoritos');
        } else {
            const data = await response.json();
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        console.error("Error agregando a favoritos:", error);
        alert('Error al agregar a favoritos');
    }
}

// ==================== CARGAR POPULARES ====================
async function cargarPopulares() {
    try {
        const response = await fetch(`${window.API_URL}/animes?limit=10`);
        const animes = await response.json();

        const contenedor = document.getElementById('populares');
        if (!contenedor) return;

        const usuarioId = Auth.getUsuarioId();

        // Ordenar por calificación más alta y tomar los primeros 5
        const populares = animes
            .filter(anime => anime.calificacion_promedio)
            .sort((a, b) => (b.calificacion_promedio || 0) - (a.calificacion_promedio || 0))
            .slice(0, 5);

        contenedor.innerHTML = populares.map(anime => `
            <div class="col">
                <div class="card bg-dark border-light h-100 position-relative">
                    <button class="btn btn-sm btn-outline-warning position-absolute top-0 end-0 m-1 rounded-0" 
                            onclick="agregarAFavoritos(${anime.id}, null)" title="Agregar a favoritos">
                        <i class="bi bi-star"></i>
                    </button>
                    <img src="${anime.imagen_url || 'https://picsum.photos/id/1015/200/300'}"
                         class="card-img-top" style="height: 200px; object-fit: cover;">
                    <div class="card-body text-center">
                        <h6 class="card-title mb-2">${anime.titulo}</h6>
                        <p class="text-warning mb-0">★ ${anime.calificacion_promedio || 'N/A'}</p>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error("Error cargando populares:", error);
    }
}

// ==================== CARGAR MANGAS ====================
async function cargarMangas(filters = {}) {
    try {
        const params = new URLSearchParams();
        if (filters.buscar) params.append('buscar', filters.buscar);
        if (filters.genero) params.append('genero', filters.genero);

        const response = await fetch(`${window.API_URL}/mangas?${params}`);
        const mangas = await response.json();

        const contenedor = document.getElementById('lista-mangas');
        if (!contenedor) return;

        contenedor.innerHTML = mangas.map(manga => `
            <div class="col">
                <div class="card bg-dark border-light h-100 position-relative">
                    <button class="btn btn-sm btn-outline-warning position-absolute top-0 end-0 m-1 rounded-0" 
                            onclick="agregarAFavoritos(null, ${manga.id})" title="Agregar a favoritos">
                        <i class="bi bi-star"></i>
                    </button>
                    <img src="${manga.imagen_portada || 'https://picsum.photos/id/201/300/400'}"
                         class="card-img-top" style="height: 380px; object-fit: cover;">
                    <div class="card-body">
                        <h6 class="card-title">${manga.titulo}</h6>
                        <p class="text-success fw-bold">$${parseFloat(manga.precio).toFixed(2)}</p>
                        <small class="text-muted">Stock: ${manga.stock}</small>
                    </div>
                    <div class="card-footer bg-dark border-light">
                        <button onclick="agregarAlCarrito(${manga.id})" class="btn btn-danger w-100 btn-sm">
                            Añadir al Carrito
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error("Error cargando mangas:", error);
    }
}

// ==================== DETALLE ANIME EN MODAL ====================
async function verDetalleAnime(id) {
    try {
        const response = await fetch(`${window.API_URL}/animes/${id}`);
        const anime = await response.json();

        if (!anime || response.status === 404) {
            alert('Anime no encontrado');
            return;
        }

        mostrarModalAnime(anime);
    } catch (error) {
        console.error("Error obteniendo detalle:", error);
        alert('Error al cargar el detalle');
    }
}

function mostrarModalAnime(anime) {
    const generos = Array.isArray(anime.generos) ? anime.generos.join(' • ') : 'No especificado';
    const trailerEmbed = anime.trailer_url ?
        `<div class="ratio ratio-16x9 mb-3">
            <iframe src="${anime.trailer_url.replace('watch?v=', 'embed/')}"
                    title="Trailer" allowfullscreen></iframe>
        </div>` : '';

    const usuarioActual = Auth.getUsuarioActual();
    const botonesLista = usuarioActual ? `
        <div class="mb-4">
            <strong>Mi Lista:</strong><br>
            <div class="mt-2">
                <button onclick="agregarALista(${anime.id}, 'visto')" class="btn btn-success btn-sm me-2">✓ Visto</button>
                <button onclick="agregarALista(${anime.id}, 'pendiente')" class="btn btn-warning btn-sm me-2">⏳ Pendiente</button>
                <button onclick="agregarALista(${anime.id}, 'abandonado')" class="btn btn-secondary btn-sm">✗ Abandonado</button>
            </div>
        </div>
    ` : '<div class="mb-4"><a href="pages/login.html" class="btn btn-primary btn-sm">Inicia sesión para agregar a tu lista</a></div>';

    document.getElementById('modalTitulo').textContent = anime.titulo;
    document.getElementById('modalContenido').innerHTML = `
        <div class="row">
            <div class="col-md-4">
                <img src="${anime.imagen_url || 'https://picsum.photos/400/600'}"
                     class="img-fluid rounded mb-3" style="max-height: 500px; object-fit: cover; width: 100%;">
            </div>
            <div class="col-md-8">
                <h4 class="mb-3">${anime.titulo}</h4>
                <p class="text-warning h5 mb-3">★ ${anime.calificacion_promedio || 'N/A'}</p>
                <p class="text-light mb-4">${anime.sinopsis || 'Sin sinopsis disponible.'}</p>

                <div class="row g-3 mb-4">
                    <div class="col-md-6">
                        <strong>Título Japonés:</strong><br>
                        ${anime.titulo_japones || 'No disponible'}
                    </div>
                    <div class="col-md-6">
                        <strong>Año de Lanzamiento:</strong><br>
                        ${anime.ano_lanzamiento || 'No disponible'}
                    </div>
                    <div class="col-md-6">
                        <strong>Temporadas:</strong><br>
                        ${anime.temporadas || 1}
                    </div>
                    <div class="col-md-6">
                        <strong>Episodios:</strong><br>
                        ${anime.episodios || 'No disponible'}
                    </div>
                    <div class="col-md-6">
                        <strong>Estado:</strong><br>
                        <span class="badge ${anime.estado === 'En emisión' ? 'bg-success' : 'bg-secondary'}">${anime.estado || 'Desconocido'}</span>
                    </div>
                </div>

                <div class="mb-4">
                    <strong>Géneros:</strong><br>
                    <div class="mt-2">
                        ${generos.split(' • ').map(g => `<span class="badge bg-secondary me-1 mb-1">${g.trim()}</span>`).join('')}
                    </div>
                </div>

                ${botonesLista}

                ${trailerEmbed}
            </div>
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('detalleAnimeModal'));
    modal.show();
}

// ==================== AGREGAR A LISTA ====================
async function agregarALista(animeId, estado) {
    const usuarioId = Auth.getUsuarioId();
    if (!usuarioId) {
        alert('Debes iniciar sesión para agregar a tu lista');
        return;
    }

    try {
        const response = await fetch(`${window.API_URL}/lista`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: usuarioId, anime_id: animeId, estado })
        });

        const data = await response.json();

        if (response.ok) {
            alert(`Anime agregado a tu lista como "${estado}"`);
        } else if (response.status === 409) {
            // Actualizar estado existente
            const updateResponse = await fetch(`${window.API_URL}/lista/${usuarioId}/${animeId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado })
            });
            if (updateResponse.ok) {
                alert(`Estado actualizado a "${estado}"`);
            }
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        console.error("Error agregando a lista:", error);
        alert('Error al agregar a tu lista');
    }
}

// ==================== CARRITO ====================
async function cargarCarritoDesdeBD() {
    if (!usuarioId) return;

    try {
        const response = await fetch(`${window.API_URL}/carrito/${usuarioId}`);
        const items = await response.json();

        carrito = items;
        actualizarContadorCarrito();

        const contenedor = document.getElementById('lista-carrito');
        if (contenedor) {
            renderizarCarrito();
        }
    } catch (error) {
        console.error("Error cargando carrito:", error);
    }
}

async function agregarAlCarrito(mangaId) {
    if (!usuarioId) {
        alert('Debes iniciar sesión para agregar al carrito');
        window.location.href = 'pages/login.html';
        return;
    }

    try {
        const response = await fetch(`${window.API_URL}/carrito`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: usuarioId, manga_id: mangaId, cantidad: 1 })
        });

        if (response.ok) {
            alert('✅ Manga añadido al carrito');
            await cargarCarritoDesdeBD();
        } else {
            const data = await response.json();
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        console.error("Error agregando al carrito:", error);
        alert('Error al agregar al carrito');
    }
}

async function eliminarDelCarrito(itemId) {
    try {
        const response = await fetch(`${window.API_URL}/carrito/${itemId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await cargarCarritoDesdeBD();
        }
    } catch (error) {
        console.error("Error eliminando del carrito:", error);
    }
}

function actualizarContadorCarrito() {
    const contador = document.getElementById('contador-carrito');
    if (contador) {
        contador.textContent = carrito.length;
    }
}

function renderizarCarrito() {
    const contenedor = document.getElementById('lista-carrito');
    if (!contenedor) return;

    if (carrito.length === 0) {
        contenedor.innerHTML = '<p class="text-center text-muted py-5">Tu carrito está vacío</p>';
        document.getElementById('subtotal').textContent = '$0.00';
        document.getElementById('total').textContent = '$0.00';
        return;
    }

    let subtotal = 0;

    const itemsHTML = carrito.map(item => {
        const precio = parseFloat(item.precio) || 0;
        const cantidad = item.cantidad || 1;
        const subtotalItem = precio * cantidad;
        subtotal += subtotalItem;

        return `
            <div class="card bg-dark border-light mb-3">
                <div class="card-body d-flex align-items-center">
                    <img src="${item.imagen_portada || 'https://picsum.photos/80/80'}"
                         class="rounded me-3" width="80" height="80" style="object-fit: cover;">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${item.titulo}</h6>
                        <p class="text-success mb-0">$${precio.toFixed(2)} x ${cantidad}</p>
                    </div>
                    <button onclick="eliminarDelCarrito(${item.id})"
                            class="btn btn-outline-danger btn-sm">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    contenedor.innerHTML = itemsHTML;
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('total').textContent = `$${subtotal.toFixed(2)}`;
}

// ==================== COMPRAR / CHECKOUT ====================
async function procederAlPago() {
    if (!usuarioId) {
        alert('Debes iniciar sesión para comprar');
        window.location.href = 'pages/login.html';
        return;
    }

    if (carrito.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }

    const confirmacion = confirm(`Total a pagar: ${document.getElementById('total').textContent}\n\n¿Confirmas la compra?`);
    if (!confirmacion) return;

    try {
        const response = await fetch(`${window.API_URL}/ordenes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: usuarioId })
        });

        const data = await response.json();

        if (response.ok) {
            alert('✅ Compra realizada con éxito');
            await cargarCarritoDesdeBD();
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        console.error("Error en compra:", error);
        alert('Error al procesar la compra');
    }
}

// ==================== COMPRAS EN PERFIL ====================
async function cargarComprasPerfil() {
    const uid = Auth.getUsuarioId();
    if (!uid) return;

    try {
        const response = await fetch(`${window.API_URL}/ordenes/${uid}`);
        const ordenes = await response.json();

        const contenedor = document.getElementById('lista-compras');
        if (!contenedor) return;

        if (ordenes.length === 0) {
            contenedor.innerHTML = '<p class="text-muted">Aún no tienes compras realizadas.</p>';
            return;
        }

        contenedor.innerHTML = ordenes.map(orden => `
            <div class="card bg-dark border-light mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between">
                        <div>
                            <h6>Orden #${orden.id}</h6>
                            <small class="text-muted">Fecha: ${new Date(orden.fecha).toLocaleDateString()}</small>
                        </div>
                        <div class="text-end">
                            <p class="fw-bold text-success">$${parseFloat(orden.total).toFixed(2)}</p>
                            <span class="badge bg-${orden.estado === 'completado' ? 'success' : 'warning'}">${orden.estado}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error("Error cargando compras:", error);
        const contenedor = document.getElementById('lista-compras');
        if (contenedor) contenedor.innerHTML = '<p class="text-danger">Error al cargar compras</p>';
    }
}

// ==================== LISTAS DE USUARIO EN PERFIL ====================
async function cargarListasPerfil() {
    const currentUsuarioId = Auth.getUsuarioId();
    if (!currentUsuarioId) return;

    try {
        const response = await fetch(`${window.API_URL}/lista-usuario/${currentUsuarioId}`);
        const listas = await response.json();

        const contenedor = document.getElementById('lista-listas');
        if (!contenedor) return;

        const allItems = [...(listas.visto || []), ...(listas.pendiente || []), ...(listas.abandonado || [])];
        
        if (allItems.length === 0) {
            contenedor.innerHTML = '<p class="text-muted">Aún no tienes listas. Agrega animes como "visto", "pendiente" o "abandonado" desde el detalle del anime.</p>';
            return;
        }

        const html = `
            <div class="row">
                <div class="col-md-4">
                    <h6 class="text-success">Vistos (${listas.visto?.length || 0})</h6>
                    ${listas.visto?.map(item => `
                        <div class="card bg-dark border-success mb-2 p-2">
                            <small>${item.titulo || 'Anime sin título'}</small>
                        </div>
                    `).join('') || '<p class="text-muted">Ninguno</p>'}
                </div>
                <div class="col-md-4">
                    <h6 class="text-warning">Pendientes (${listas.pendiente?.length || 0})</h6>
                    ${listas.pendiente?.map(item => `
                        <div class="card bg-dark border-warning mb-2 p-2">
                            <small>${item.titulo || 'Anime sin título'}</small>
                        </div>
                    `).join('') || '<p class="text-muted">Ninguno</p>'}
                </div>
                <div class="col-md-4">
                    <h6 class="text-secondary">Abandonados (${listas.abandonado?.length || 0})</h6>
                    ${listas.abandonado?.map(item => `
                        <div class="card bg-dark border-secondary mb-2 p-2">
                            <small>${item.titulo || 'Anime sin título'}</small>
                        </div>
                    `).join('') || '<p class="text-muted">Ninguno</p>'}
                </div>
            </div>
        `;

        contenedor.innerHTML = html;
    } catch (error) {
        console.error("Error cargando listas:", error);
        const contenedor = document.getElementById('lista-listas');
        if (contenedor) {
            contenedor.innerHTML = '<p class="text-danger">Error al cargar listas</p>';
        }
    }
}

// ==================== FAVORITOS EN PERFIL ====================
async function cargarFavoritosPerfil() {
    const uid = Auth.getUsuarioId();
    if (!uid) return;

    try {
        const response = await fetch(`${window.API_URL}/favoritos/${uid}`);
        const favoritos = await response.json();

        const contenedor = document.getElementById('lista-favoritos');
        if (!contenedor) return;

        if (favoritos.length === 0) {
            contenedor.innerHTML = '<p class="text-muted">Aún no tienes favoritos agregados.</p>';
            return;
        }

        contenedor.innerHTML = favoritos.map(fav => `
            <div class="card bg-dark border-light mb-2">
                <div class="card-body d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${fav.titulo}</strong>
                    </div>
                    <button onclick="eliminarFavorito(${fav.id})" class="btn btn-outline-danger btn-sm">
                        Eliminar
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error("Error cargando favoritos:", error);
        const contenedor = document.getElementById('lista-favoritos');
        if (contenedor) contenedor.innerHTML = '<p class="text-danger">Error al cargar favoritos</p>';
    }
}

async function eliminarFavorito(favoritoId) {
    try {
        const response = await fetch(`${window.API_URL}/favoritos/${favoritoId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            await cargarFavoritosPerfil();
        }
    } catch (error) {
        console.error("Error eliminando favorito:", error);
    }
}
