document.addEventListener('DOMContentLoaded', () => {
    cargarMovimientos();

    // Recargar al cambiar el selector global de sucursal
    const selectSucursal = document.getElementById('selectSucursalGlobal');
    if (selectSucursal) {
        selectSucursal.addEventListener('change', cargarMovimientos);
    }

    // Filtros locales y ordenamiento
    document.getElementById('filtroMovimiento').addEventListener('change', aplicarFiltrosLocales);
    document.getElementById('filtroFechaDesde').addEventListener('change', aplicarFiltrosLocales);
    document.getElementById('filtroFechaHasta').addEventListener('change', aplicarFiltrosLocales);
    document.getElementById('ordenMovimientos').addEventListener('change', ordenarTablaLocal);

    // Botón limpiar filtros
    document.getElementById('limpiarMovimiento').addEventListener('click', () => {
        document.getElementById('filtroMovimiento').value = 'todos';
        document.getElementById('filtroFechaDesde').value = '';
        document.getElementById('filtroFechaHasta').value = '';
        aplicarFiltrosLocales();
    });
});

let listaMovimientosGlobal = [];

async function cargarMovimientos() {
    const selectSucursal = document.getElementById('selectSucursalGlobal');
    const idSucursal = selectSucursal ? selectSucursal.value : '0';

    try {
        const response = await fetch(`http://localhost:8081/api/movimientos?idSucursal=${idSucursal}`);
        if (!response.ok) throw new Error('Error al conectar con el servidor');

        const data = await response.json();

        // Actualizar tarjetas de resumen
        if (data.resumen) {
            document.getElementById('resumenVentas').textContent = data.resumen.ventas || 0;
            document.getElementById('resumenCompras').textContent = data.resumen.compras || 0;
            document.getElementById('resumenTransferencias').textContent = data.resumen.transferencias || 0;
            document.getElementById('resumenPagos').textContent = data.resumen.pagos || 0;
        }

        listaMovimientosGlobal = data.lista || [];
        renderizarTablaMovimientos(listaMovimientosGlobal);

    } catch (error) {
        console.error("Error al cargar movimientos:", error);
        document.getElementById('tablaMovimientos').innerHTML = `
            <tr><td colspan="7" style="text-align: center; padding: 25px; color: var(--danger);">Error al conectar con el servidor Java.</td></tr>
        `;
    }
}

function renderizarTablaMovimientos(movimientos) {
    const tbody = document.getElementById('tablaMovimientos');
    tbody.innerHTML = '';

    if (!movimientos || movimientos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 25px; color: var(--muted);">No hay movimientos registrados para esta vista.</td></tr>`;
        document.getElementById('infoConteoMovimientos').textContent = `0 movimientos encontrados`;
        return;
    }

    movimientos.forEach(item => {
        const cantidadStr = String(item.cantidad || '0');
        const esPositivo = !cantidadStr.includes('-');
        const claseCantidad = esPositivo ? 'quantity positive' : 'quantity negative';
        
        let tipoTexto = item.tipo ? item.tipo.toLowerCase() : 'movimiento';
        let tipoCapitalizado = tipoTexto.charAt(0).toUpperCase() + tipoTexto.slice(1);

        tbody.innerHTML += `
            <tr data-movimiento="${tipoTexto}" data-fecha="${item.fecha || ''}">
                <td>${item.fecha || '-'}</td>
                <td>
                    <span class="movement-type ${tipoTexto}">
                        <span class="movement-dot"></span>
                        ${tipoCapitalizado}
                    </span>
                </td>
                <td>
                    <div class="movement-product">
                        <strong>${item.detalle || '-'}</strong>
                        <span>${item.categoria || '-'}</span>
                    </div>
                </td>
                <td><strong class="${claseCantidad}">${cantidadStr}</strong></td>
                <td>${item.sucursal || 'Sucursal Central'}</td>
                <td>${item.responsable || 'Administración'}</td>
                <td>${item.referencia || '-'}</td>
            </tr>
        `;
    });

    document.getElementById('infoConteoMovimientos').textContent = `Mostrando ${movimientos.length} movimientos`;
}

function aplicarFiltrosLocales() {
    const tipoFiltro = document.getElementById('filtroMovimiento').value;
    const desdeVal = document.getElementById('filtroFechaDesde').value;
    const hastaVal = document.getElementById('filtroFechaHasta').value;

    const fechaDesde = desdeVal ? new Date(desdeVal + "T00:00:00") : null;
    const fechaHasta = hastaVal ? new Date(hastaVal + "T23:59:59") : null;

    let filtrados = listaMovimientosGlobal.filter(item => {
        const tipoMov = (item.tipo || '').toLowerCase();
        if (tipoFiltro !== 'todos' && tipoMov !== tipoFiltro) {
            return false;
        }

        if (fechaDesde || fechaHasta) {
            const fechaItem = item.fecha ? new Date(item.fecha) : null;
            if (fechaItem && !isNaN(fechaItem)) {
                if (fechaDesde && fechaItem < fechaDesde) return false;
                if (fechaHasta && fechaItem > fechaHasta) return false;
            }
        }

        return true;
    });

    renderizarTablaMovimientos(filtrados);
}

function ordenarTablaLocal() {
    const orden = document.getElementById('ordenMovimientos').value;
    let ordenados = [...listaMovimientosGlobal];

    ordenados.sort((a, b) => {
        const fechaA = new Date(a.fecha || 0);
        const fechaB = new Date(b.fecha || 0);
        return orden === 'reciente' ? fechaB - fechaA : fechaA - fechaB;
    });

    renderizarTablaMovimientos(ordenados);
}