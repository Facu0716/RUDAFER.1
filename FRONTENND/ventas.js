// Variables globales para el carrito, ID de pago y cuotas normalizadas
let carritoVenta = [];
let idPagoSeleccionado = 0; // 0 significa no seleccionado
let cuotasSeleccionadas = 1; // Por defecto 1 cuota
let textoMetodoVisual = 'Sin seleccionar';

// Referencias a elementos del DOM
const inputBarcode = document.getElementById('barcode-input');
const btnScan = document.getElementById('scan-button');
const contenedorProductos = document.getElementById('sale-products');
const saleTotalEl = document.getElementById('sale-total');
const checkoutTotalEl = document.getElementById('checkout-total');
const productCountEl = document.getElementById('product-count');
const selectedPaymentText = document.getElementById('selected-payment');
const btnFinalizar = document.getElementById('finish-sale-button');

// Referencias a estadísticas del header
const summarySalesEl = document.getElementById('summary-sales');
const summaryCommissionEl = document.getElementById('summary-commission');

// Configuración de métodos de pago visuales
const paymentButtons = document.querySelectorAll('.payment-method');
const cardOptions = document.getElementById('card-payment-options');
const installmentButtons = document.querySelectorAll('.installment-button');

// FUNCIÓN AUXILIAR PARA OBTENER EL ID_EMPLEADO DEL LOCALSTORAGE
function obtenerIdEmpleado() {
    return parseInt(localStorage.getItem('ID_Empleado')) || 1;
}

// FUNCIÓN AUXILIAR PARA OBTENER LA SUCURSAL ACTIVA
function obtenerSucursalActiva() {
    return parseInt(localStorage.getItem('rudafer_sucursal_activa')) || 1;
}

// INICIALIZACIÓN AL CARGAR LA PÁGINA
document.addEventListener('DOMContentLoaded', () => {
    renderizarCarrito(); // Arranca vacío mostrando el mensaje correspondiente
    cargarEstadisticasEmpleado(); // Carga ventas y comisiones reales del ID activo
    cargarHistorialVentasHoy(); // Carga las ventas del día en la tabla inferior
});

// 1. SELECCIÓN DE MÉTODO DE PAGO (Asociado a ID_Pago de la BD)
paymentButtons.forEach(button => {
    button.addEventListener('click', () => {
        paymentButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const paymentType = button.getAttribute('data-payment');

        // Mapeo exacto con la tabla 'pago': 1: Efectivo, 2: Transferencia, 3: QR, 4: Débito, 5: Crédito, 6: Otros
        if (paymentType === 'efectivo') {
            idPagoSeleccionado = 1;
            cuotasSeleccionadas = 1;
            cardOptions.classList.remove('visible');
            textoMetodoVisual = 'Efectivo';
        } else if (paymentType === 'transferencia') {
            idPagoSeleccionado = 2;
            cuotasSeleccionadas = 1;
            cardOptions.classList.remove('visible');
            textoMetodoVisual = 'Transferencia';
        } else if (paymentType === 'qr') {
            idPagoSeleccionado = 3;
            cuotasSeleccionadas = 1;
            cardOptions.classList.remove('visible');
            textoMetodoVisual = 'QR';
        } else if (paymentType === 'debito') {
            idPagoSeleccionado = 4;
            cuotasSeleccionadas = 1;
            cardOptions.classList.remove('visible');
            textoMetodoVisual = 'Tarjeta de Débito';
        } else if (paymentType === 'credito') {
            idPagoSeleccionado = 5; // ID_Pago 5 para Tarjeta de Crédito
            cardOptions.classList.add('visible');
            textoMetodoVisual = `Tarjeta de Crédito (${cuotasSeleccionadas} cuotas)`;
        } else if (paymentType === 'otros') {
            idPagoSeleccionado = 6;
            cuotasSeleccionadas = 1;
            cardOptions.classList.remove('visible');
            textoMetodoVisual = 'Otros';
        }

        selectedPaymentText.textContent = textoMetodoVisual;
    });
});

// 2. SELECCIÓN DE CUOTAS
installmentButtons.forEach(button => {
    button.addEventListener('click', () => {
        installmentButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const count = button.getAttribute('data-installments');
        cuotasSeleccionadas = parseInt(count) || 1;

        if (idPagoSeleccionado === 5) {
            selectedPaymentText.textContent = `Tarjeta de Crédito (${cuotasSeleccionadas} cuotas)`;
        }
    });
});

// 3. ESCANEAR / AGREGAR PRODUCTO POR CÓDIGO DE BARRAS (FILTRADO POR SUCURSAL ACTIVA)
btnScan.addEventListener('click', agregarProductoPorCodigo);
inputBarcode.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        agregarProductoPorCodigo();
    }
});

async function agregarProductoPorCodigo() {
    const codigo = inputBarcode.value.trim();
    if (!codigo) return;

    try {
        const idSucursal = obtenerSucursalActiva();
        // Se consulta estrictamente el inventario y stock de la sucursal actual
        const response = await fetch(`http://localhost:8081/api/productos?idSucursal=${idSucursal}`);
        if (!response.ok) throw new Error('Error al conectar con el inventario de la sucursal');
        
        const catalogo = await response.json();
        const productoEncontrado = catalogo.find(p => p.codigo === codigo || p.idProducto == codigo);

        if (!productoEncontrado) {
            alert("Producto no encontrado en el inventario de esta sucursal con el código: " + codigo);
            inputBarcode.value = '';
            return;
        }

        if (parseInt(productoEncontrado.stock || 0) <= 0) {
            alert("El producto seleccionado no tiene stock disponible en esta sucursal.");
            inputBarcode.value = '';
            return;
        }

        const indexExistente = carritoVenta.findIndex(item => item.idProducto === productoEncontrado.idProducto);

        if (indexExistente !== -1) {
            if (carritoVenta[indexExistente].cantidad < productoEncontrado.stock) {
                carritoVenta[indexExistente].cantidad += 1;
            } else {
                alert("No hay más stock disponible para este producto en esta sucursal.");
            }
        } else {
            carritoVenta.push({
                idProducto: productoEncontrado.idProducto,
                codigo: productoEncontrado.codigo || '',
                nombre: productoEncontrado.nombre,
                precioVenta: parseFloat(productoEncontrado.precioVenta || 0),
                cantidad: 1,
                stockMaximo: parseInt(productoEncontrado.stock || 0)
            });
        }

        inputBarcode.value = '';
        renderizarCarrito();

    } catch (err) {
        console.error("Error al buscar producto:", err);
        alert("No se pudo conectar con el servidor para buscar el producto.");
    }
}

// 4. RENDERIZAR CARRITO EN LA VISTA
function renderizarCarrito() {
    contenedorProductos.innerHTML = '';

    if (carritoVenta.length === 0) {
        contenedorProductos.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--muted);">
                No hay productos cargados. Escaneá un código de barras para comenzar.
            </div>
        `;
        saleTotalEl.textContent = '$0';
        checkoutTotalEl.textContent = '$0';
        productCountEl.textContent = '0';
        return;
    }

    let totalGeneral = 0;
    let cantidadTotalItems = 0;

    carritoVenta.forEach((item, index) => {
        const subtotal = item.precioVenta * item.cantidad;
        totalGeneral += subtotal;
        cantidadTotalItems += item.cantidad;

        const inicial = item.nombre ? item.nombre.charAt(0).toUpperCase() : 'P';

        contenedorProductos.innerHTML += `
            <div class="product-card-item">
                <div class="product-main-info">
                    <div class="product-placeholder">${inicial}</div>
                    <div class="product-details">
                        <strong>${item.nombre}</strong>
                        <span>Cód: ${item.codigo} · <small>$${item.precioVenta.toLocaleString('es-AR')} c/u</small></span>
                    </div>
                </div>
                <div class="product-actions-zone">
                    <div class="quantity-control">
                        <button type="button" class="quantity-button" onclick="cambiarCantidad(${index}, -1)">−</button>
                        <span>${item.cantidad}</span>
                        <button type="button" class="quantity-button" onclick="cambiarCantidad(${index}, 1)">+</button>
                    </div>
                    <div class="product-subtotal-price">
                        $${subtotal.toLocaleString('es-AR')}
                    </div>
                    <button type="button" class="delete-product" onclick="eliminarDelCarrito(${index})" aria-label="Eliminar producto">×</button>
                </div>
            </div>
        `;
    });

    saleTotalEl.textContent = `$${totalGeneral.toLocaleString('es-AR', {minimumFractionDigits: 2})}`;
    checkoutTotalEl.textContent = `$${totalGeneral.toLocaleString('es-AR', {minimumFractionDigits: 2})}`;
    productCountEl.textContent = cantidadTotalItems;
}

// 5. MODIFICAR CANTIDADES DESDE LOS BOTONES + / -
window.cambiarCantidad = function(index, delta) {
    const item = carritoVenta[index];
    const nuevaCantidad = item.cantidad + delta;

    if (nuevaCantidad <= 0) {
        eliminarDelCarrito(index);
        return;
    }

    if (nuevaCantidad > item.stockMaximo) {
        alert("No puedes superar el stock disponible en esta sucursal (" + item.stockMaximo + " u.).");
        return;
    }

    item.cantidad = nuevaCantidad;
    renderizarCarrito();
};

// 6. ELIMINAR ITEM DEL CARRITO
window.eliminarDelCarrito = function(index) {
    carritoVenta.splice(index, 1);
    renderizarCarrito();
};

// 7. VACIAR CARRITO Y CANCELAR VENTA
document.querySelector('.clear-cart-btn').addEventListener('click', () => {
    if (carritoVenta.length > 0 && confirm("¿Estás seguro de vaciar el carrito?")) {
        carritoVenta = [];
        renderizarCarrito();
    }
});

document.querySelector('.cancel-sale-btn').addEventListener('click', () => {
    if (carritoVenta.length > 0 && confirm("¿Deseas cancelar la venta en curso?")) {
        carritoVenta = [];
        renderizarCarrito();
        idPagoSeleccionado = 0;
        cuotasSeleccionadas = 1;
        selectedPaymentText.textContent = 'Sin seleccionar';
        paymentButtons.forEach(btn => btn.classList.remove('active'));
        cardOptions.classList.remove('visible');
    }
});

// 8. CARGAR ESTADÍSTICAS REALES CONSULTANDO POR ID_EMPLEADO
async function cargarEstadisticasEmpleado() {
    try {
        const idEmpleado = obtenerIdEmpleado();
        const response = await fetch(`http://localhost:8081/api/empleado/stats?ID_Empleado=${idEmpleado}`);
        
        if (response.ok) {
            const data = await response.json();
            if (summarySalesEl) summarySalesEl.textContent = data.ventasRealizadas || 0;
            if (summaryCommissionEl) summaryCommissionEl.textContent = `$${(data.comisionAcumulada || 0).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        } else {
            if (summarySalesEl) summarySalesEl.textContent = '0';
            if (summaryCommissionEl) summaryCommissionEl.textContent = '$0';
        }
    } catch (e) {
        console.warn("No se pudieron cargar las estadísticas dinámicas:", e);
        if (summarySalesEl) summarySalesEl.textContent = '0';
        if (summaryCommissionEl) summaryCommissionEl.textContent = '$0';
    }
}

// CARGAR HISTORIAL DE VENTAS DE HOY DEL EMPLEADO
async function cargarHistorialVentasHoy() {
    const tbodyHistorial = document.querySelector('.sales-history tbody');
    const contadorHistorial = document.querySelector('.history-count');
    if (!tbodyHistorial) return;

    try {
        const idEmpleado = obtenerIdEmpleado();
        const response = await fetch(`http://localhost:8081/api/empleado/ventas-hoy?ID_Empleado=${idEmpleado}`);
        
        if (response.ok) {
            const ventas = await response.json();
            if (contadorHistorial) {
                contadorHistorial.textContent = `${ventas.length} operaciones`;
            }

            if (ventas.length === 0) {
                tbodyHistorial.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 25px; color: var(--muted);">
                            No hay ventas registradas en el día de hoy.
                        </td>
                    </tr>`;
                return;
            }

            tbodyHistorial.innerHTML = '';
            ventas.forEach(v => {
                const idFormateado = '#' + String(v.idVenta).padStart(6, '0');
                const metodoTexto = v.cuotas > 1 ? `${v.metodoPago} · ${v.cuotas} cuotas` : v.metodoPago;

                tbodyHistorial.innerHTML += `
                    <tr>
                        <td>${idFormateado}</td>
                        <td>${v.hora}</td>
                        <td>$${v.total.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
                        <td>${metodoTexto}</td>
                        <td>
                            <span class="tag entrada" style="background: rgba(41,153,90,.1); color: var(--success, #29995a); padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px;">
                                Completada
                            </span>
                        </td>
                    </tr>
                `;
            });
        }
    } catch (e) {
        console.warn("No se pudo cargar el historial de ventas:", e);
    }
}

// 9. FINALIZAR COMPRA ENVIANDO ID_PAGO, CUOTAS Y SUCURSAL ACTIVA AL BACKEND
btnFinalizar.addEventListener('click', async () => {
    if (carritoVenta.length === 0) {
        alert("El carrito está vacío. Agregá productos antes de finalizar.");
        return;
    }

    if (idPagoSeleccionado <= 0) {
        alert("Por favor, seleccioná un método de pago.");
        return;
    }

    const totalVenta = carritoVenta.reduce((acc, item) => acc + (item.precioVenta * item.cantidad), 0);
    const idEmpleado = obtenerIdEmpleado();
    const idSucursal = obtenerSucursalActiva();

    const datosVenta = {
        total: totalVenta,
        idPago: idPagoSeleccionado,       // ID relacional de la tabla pago (1 al 6)
        cuotas: cuotasSeleccionadas,       // Número entero de cuotas (1, 3 o 6)
        idEmpleado: idEmpleado,            // ID numérico del empleado activo
        idSucursal: idSucursal,            // ID de la sucursal activa para descontar stock localmente
        items: carritoVenta.map(i => ({
            idProducto: i.idProducto,
            cantidad: i.cantidad,
            precio: i.precioVenta          // Corregido a 'precio' para que VentaDAO.java lo lea correctamente
        }))
    };

    try {
        const respuesta = await fetch('http://localhost:8081/api/ventas/crear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosVenta)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok && resultado.exito) {
            alert("¡Venta finalizada con éxito! Se registró el cobro, se descontó el stock de la sucursal y se actualizó la comisión.");
            
            // Limpiamos carrito y reseteamos selecciones de pago
            carritoVenta = [];
            renderizarCarrito();
            idPagoSeleccionado = 0;
            cuotasSeleccionadas = 1;
            selectedPaymentText.textContent = 'Sin seleccionar';
            paymentButtons.forEach(btn => btn.classList.remove('active'));
            cardOptions.classList.remove('visible');
            
            cargarEstadisticasEmpleado(); 
            cargarHistorialVentasHoy(); // Actualiza la tabla inferior automáticamente
        } else {
            alert("Error al procesar la venta en el servidor.");
        }
    } catch (err) {
        console.error("Error de conexión:", err);
        alert("No se pudo conectar con el servidor Java para finalizar la venta.");
    }
});