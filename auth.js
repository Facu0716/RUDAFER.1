document.addEventListener('DOMContentLoaded', () => {
    const usuarioNombre = localStorage.getItem('usuarioNombre');
    const usuarioRol = localStorage.getItem('usuarioRol');

    // 1. Verificar si hay sesión activa
    if (!usuarioNombre || !usuarioRol) {
        alert('Debes iniciar sesión para acceder al sistema.');
        window.location.href = 'LOGIN.html';
        return;
    }

    // 2. Control de permisos por rol
    const paginaActual = window.location.pathname.toUpperCase();

    if (paginaActual.includes('INICIO.HTML') && usuarioRol !== 'ADMINISTRADOR') {
        alert('Acceso denegado: esta sección es solo para Administradores.');
        window.location.href = 'INICIO.EMPLEADOS.html';
        return;
    }

    // 3. Mostrar el nombre completo y primer nombre
    const elementoNombre = document.getElementById('nombreUsuario');
    if (elementoNombre) {
        elementoNombre.textContent = usuarioNombre;
    }

    const elementoSaludo = document.getElementById('saludoUsuario');
    if (elementoSaludo) {
        const primerNombre = usuarioNombre.split(' ')[0];
        elementoSaludo.textContent = primerNombre;
    }

    const elementoRol = document.getElementById('rolUsuario');
    if (elementoRol) {
        elementoRol.textContent = usuarioRol;
    }

    // Generar iniciales para el avatar
    const elementoAvatar = document.getElementById('avatarUsuario');
    if (elementoAvatar) {
        const partes = usuarioNombre.trim().split(' ');
        let iniciales = partes[0].charAt(0);
        if (partes.length > 1) {
            iniciales += partes[1].charAt(0);
        }
        elementoAvatar.textContent = iniciales.toUpperCase();
    }

    // 4. Configurar el botón de Cerrar Sesión
    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear(); // Borra la sesión
            window.location.href = 'LOGIN.html';
        });
    }
});

// ================================================
// PERSISTENCIA DEL MODO OSCURO SIN DESTELLO
// ================================================
document.addEventListener("DOMContentLoaded", () => {
    const modoOscuroInput = document.getElementById("modo-oscuro");

    if (modoOscuroInput) {
        const esOscuro = localStorage.getItem("rudafer_theme") === "dark";
        modoOscuroInput.checked = esOscuro;

        if (esOscuro) {
            document.documentElement.classList.add("dark-mode");
        } else {
            document.documentElement.classList.remove("dark-mode");
        }

        modoOscuroInput.addEventListener("change", () => {
            if (modoOscuroInput.checked) {
                localStorage.setItem("rudafer_theme", "dark");
                document.documentElement.classList.add("dark-mode");
            } else {
                localStorage.setItem("rudafer_theme", "light");
                document.documentElement.classList.remove("dark-mode");
            }
        });
    }
});

// ==========================================
// GESTIÓN GLOBAL DE SUCURSAL ACTIVA (SEGÚN ROL)
// ==========================================

function obtenerSucursalActiva() {
    const sucursal = localStorage.getItem('rudafer_sucursal_activa');
    if (!sucursal) {
        localStorage.setItem('rudafer_sucursal_activa', '1');
        return '1';
    }
    return sucursal;
}

function cambiarSucursalActiva(idSucursal) {
    const usuarioRol = localStorage.getItem('usuarioRol');

    // RESTRICCIÓN DE SEGURIDAD: Los empleados comunes no pueden cambiar de sucursal
    if (usuarioRol !== 'ADMINISTRADOR') {
        console.warn('Acción no permitida: Los empleados operativos están bloqueados a su sucursal asignada.');
        return;
    }

    // Guardamos la sucursal seleccionada si es Administrador
    localStorage.setItem('rudafer_sucursal_activa', idSucursal);
    
    // Disparar la recarga de datos según la vista en la que se encuentre el usuario
    if (typeof cargarProductosDesdeBD === 'function') cargarProductosDesdeBD();
    if (typeof cargarDatosDashboard === 'function') cargarDatosDashboard();
    if (typeof cargarHistorialPedidosBD === 'function') cargarHistorialPedidosBD();
    if (typeof cargarDatosAdmin === 'function') cargarDatosAdmin();
    if (typeof cargarReportes === 'function') cargarReportes();
    if (typeof cargarHistorialCierres === 'function') cargarHistorialCierres();
    
    if (window.location.pathname.toUpperCase().includes('VENTAS') || window.location.pathname.toUpperCase().includes('INVENTARIO')) {
        location.reload();
    }
}

async function poblarSelectoresSucursales() {
    try {
        const res = await fetch('http://localhost:8081/api/sucursales');
        if (!res.ok) throw new Error('Error al obtener sucursales');
        const sucursales = await res.json();
        
        const selectores = document.querySelectorAll('#selectSucursalGlobal, #sucursal, #sucursalMovimiento, #reportesSucursal, #filtroSucursal');
        const sucursalActiva = obtenerSucursalActiva();
        const usuarioRol = localStorage.getItem('usuarioRol');

        selectores.forEach(sel => {
            if (sel) {
                sel.innerHTML = "";
                sucursales.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.id;
                    opt.textContent = s.nombre;
                    sel.appendChild(opt);
                });
                
                sel.value = sucursalActiva;
                
                if (!sel.value) {
                    sel.value = "1";
                    localStorage.setItem('rudafer_sucursal_activa', '1');
                }

                // RESTRICCIÓN VISUAL: Si es empleado, bloqueamos el selector para que no pueda modificarlo
                if (usuarioRol !== 'ADMINISTRADOR') {
                    sel.disabled = true;
                    sel.style.opacity = "0.7";
                    sel.style.cursor = "not-allowed";
                } else {
                    // Asignar el evento change global solo para Administradores
                    sel.onchange = (e) => {
                        cambiarSucursalActiva(e.target.value);
                    };
                }
            }
        });
    } catch (e) {
        console.error("Error al cargar sucursales dinámicas desde el servidor:", e);
    }
}

// Cargar las sucursales automáticamente al iniciar la página
document.addEventListener("DOMContentLoaded", () => {
    poblarSelectoresSucursales();
});