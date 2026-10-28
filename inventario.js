document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
});

// Función auxiliar para obtener la sucursal activa
function obtenerSucursalActiva() {
    return parseInt(localStorage.getItem('rudafer_sucursal_activa')) || 1;
}

async function cargarProductos() {
    const tablaBody = document.querySelector('table tbody');
    if (!tablaBody) return;

    try {
        const idSucursal = obtenerSucursalActiva();
        // Se consulta el endpoint pasando la sucursal activa para aislar el inventario
        const respuesta = await fetch(`http://localhost:8081/api/productos?idSucursal=${idSucursal}`);
        const productos = await respuesta.json();

        // Limpiar filas estáticas/de prueba
        tablaBody.innerHTML = '';

        if (productos.length === 0) {
            tablaBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay productos registrados para esta sucursal.</td></tr>';
            return;
        }

        // Renderizar cada producto devuelto por la base de datos
        productos.forEach(p => {
            const idProd = p.idProducto || p.id;
            const precio = p.precioVenta || p.precio || 0;
            const stock = p.stock !== undefined ? p.stock : 0;
            const minStock = p.stockMinimo !== undefined ? p.stockMinimo : 5;

            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td><strong>${p.codigo || ''}</strong></td>
                <td>${p.nombre}</td>
                <td><span class="tag-categoria">${p.categoria || 'General'}</span></td>
                <td>$${precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                <td><span class="${stock <= minStock ? 'stock-critical' : 'stock-ok'}">${stock} u.</span></td>
                <td>
                    <button class="btn-acciones" onclick="prepararEdicionProducto(${idProd})">✏️</button>
                </td>
            `;
            tablaBody.appendChild(fila);
        });

    } catch (error) {
        console.error('Error al obtener productos:', error);
    }
}

// Función robusta de actualización enviando la sucursal activa y apuntando al endpoint correcto de Java (PUT /api/productos)
async function guardarCambiosProductoDesdeModal(event) {
    if (event) event.preventDefault();

    const idSucursalActiva = obtenerSucursalActiva();

        const productoModificado = {
                idProducto: parseInt(document.getElementById('idProductoEdit').value),
                codigo: document.getElementById('codigoEdit').value,
                nombre: document.getElementById('nombreEdit').value,
                marca: document.getElementById('marcaEdit').value || '',
                estante: document.getElementById('estanteEdit') ? document.getElementById('estanteEdit').value : '',
                fila: document.getElementById('filaEdit') ? document.getElementById('filaEdit').value : '',
                precioCompra: parseFloat(document.getElementById('precioCompraEdit').value) || 0,
                precioVenta: parseFloat(document.getElementById('precioVentaEdit').value) || 0,
                stockActual: parseInt(document.getElementById('stockEdit').value) || 0,
                stockMinimo: parseInt(document.getElementById('stockMinimoEdit').value) || 5,
                idCategoria: parseInt(document.getElementById('categoriaEdit')?.value) || 0,
                idProveedor: parseInt(document.getElementById('proveedorEdit')?.value) || 0,
                ID_Sucursal: parseInt(idSucursalActiva) // <--- ¡AQUÍ ESTABA EL DETALLE! Debe ir como ID_Sucursal
            };

    try {
        // Se corrige la URL apuntando a /api/productos con método PUT para que el servidor Java lo reciba correctamente
        const respuesta = await fetch('http://localhost:8081/api/productos', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productoModificado)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok && resultado.exito) {
            alert("¡Stock y datos actualizados con éxito en esta sucursal!");
            location.reload(); 
        } else {
            alert("Error al actualizar el producto en el servidor.");
        }
    } catch (err) {
        console.error("Error de conexión:", err);
        alert("No se pudo conectar con el servidor para actualizar el producto.");
    }
}