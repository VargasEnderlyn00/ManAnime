// Exponer API_URL globalmente para otros scripts
window.API_URL = window.location.origin + '/api';

// Gestión de sesión
const Auth = {
    // Obtener usuario actual desde localStorage
    getUsuarioActual() {
        const usuarioJSON = localStorage.getItem('usuarioActual');
        return usuarioJSON ? JSON.parse(usuarioJSON) : null;
    },

    // Guardar usuario en sesión
    login(usuario) {
        localStorage.setItem('usuarioActual', JSON.stringify(usuario));
    },

    // Cerrar sesión
    logout() {
        localStorage.removeItem('usuarioActual');
    },

    // Verificar si hay sesión activa
    isAuthenticated() {
        return this.getUsuarioActual() !== null;
    },

    // Obtener ID del usuario actual
    getUsuarioId() {
        const usuario = this.getUsuarioActual();
        return usuario ? usuario.id : null;
    }
};

// Funciones de autenticación API
async function hacerLogin(email, password) {
    try {
        const response = await fetch(`${window.API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            Auth.login(data.usuario);
            actualizarNavbar();
            return { success: true, mensaje: data.mensaje };
        } else {
            return { success: false, error: data.error };
        }
    } catch (error) {
        console.error('Error en login:', error);
        return { success: false, error: 'Error de conexión con el servidor' };
    }
}

async function hacerRegister(username, email, password, nombre_completo) {
    try {
        const response = await fetch(`${window.API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, nombre_completo })
        });

        const data = await response.json();

        if (response.ok) {
            return { success: true, mensaje: data.mensaje };
        } else {
            return { success: false, error: data.error };
        }
    } catch (error) {
        console.error('Error en registro:', error);
        return { success: false, error: 'Error de conexión con el servidor' };
    }
}

// Proteger rutas: redirige a login si no está autenticado
function requerirAutenticacion() {
    if (!Auth.isAuthenticated()) {
        window.location.href = 'pages/login.html';
        return false;
    }
    return true;
}

// Actualizar UI según estado de sesión
function actualizarNavbar() {
    const usuario = Auth.getUsuarioActual();

    const botonesAuth = document.querySelectorAll('.btn-login-auth');
    const botonesPerfil = document.querySelectorAll('.btn-perfil');
    const navbarItems = document.querySelectorAll('.navbar-item-protected');

    if (usuario) {
        botonesAuth.forEach(btn => btn.style.display = 'none');
        botonesPerfil.forEach(btn => btn.style.display = 'inline-block');
        navbarItems.forEach(item => {
            item.classList.remove('disabled');
            item.removeAttribute('data-bs-toggle');
            item.removeAttribute('data-bs-title');
        });
    } else {
        botonesAuth.forEach(btn => btn.style.display = 'inline-block');
        botonesPerfil.forEach(btn => btn.style.display = 'none');
        navbarItems.forEach(item => {
            item.classList.add('disabled');
            item.setAttribute('data-bs-toggle', 'tooltip');
            item.setAttribute('data-bs-title', 'Inicia sesión para acceder');
        });
        
        // Initialize tooltips for disabled items
        if (typeof bootstrap !== 'undefined') {
            navbarItems.forEach(item => {
                new bootstrap.Tooltip(item);
            });
        }
    }
}

// Proteger página al cargar
function protegerPagina() {
    const currentPage = window.location.pathname.split('/').pop();
    const paginasProtegidas = ['perfil.html', 'carrito.html'];
    const paginasPublicas = ['login.html', 'register.html'];

    if (paginasPublicas.includes(currentPage) && Auth.isAuthenticated()) {
        window.location.href = '../inicio.html';
        return false;
    }

    if (paginasProtegidas.includes(currentPage) && !Auth.isAuthenticated()) {
        window.location.href = '../pages/login.html';
        return false;
    }
    return true;
}

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
    const protegida = protegerPagina();
    if (protegida) {
        actualizarNavbar();
    }
});
