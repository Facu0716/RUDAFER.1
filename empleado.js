// ==========================================
// RUDAFER - SISTEMA DE VENTAS
// Carrito de venta
// ==========================================

const productos = [
    {
        codigo: "7791234567890",
        nombre: "Pintura interior 1L",
        precio: 8200,
        stock: 15
    },
    {
        codigo: "7790000000001",
        nombre: "Disco de corte Tyrolit",
        precio: 3500,
        stock: 20
    },
    {
        codigo: "7790000000002",
        nombre: "Tarugo 8 mm",
        precio: 120,
        stock: 100
    }
];


// ==========================================
// CARRITO
// ==========================================

let carrito = [];


// ==========================================
// ELEMENTOS DEL HTML
// ==========================================

const codigoInput = document.getElementById("barcode-input");
const botonEscanear = document.getElementById("scan-button");
const tablaProductos = document.getElementById("sale-products");


// ==========================================
// FORMATO DE DINERO
// ==========================================

function formatoMoneda(valor) {

    return "$" + valor.toLocaleString("es-AR");

}


// ==========================================
// ESCANEAR PRODUCTO
// ==========================================

function escanearProducto() {

    const codigo = codigoInput.value.trim();

    if (codigo === "") {
        alert("Ingresá o escaneá un código de producto.");
        return;
    }

    const producto = productos.find(
        producto => producto.codigo === codigo
    );

    if (!producto) {

        alert(
            "No se encontró ningún producto con el código:\n" +
            codigo
        );

        codigoInput.select();
        return;
    }


    // Buscar si ya está en el carrito

    const productoEnCarrito = carrito.find(
        item => item.codigo === codigo
    );


    if (productoEnCarrito) {

        // Evitar superar el stock

        if (productoEnCarrito.cantidad >= producto.stock) {

            alert("No hay más stock disponible de este producto.");
            codigoInput.value = "";
            codigoInput.focus();
            return;

        }

        productoEnCarrito.cantidad++;

    } else {

        carrito.push({
            codigo: producto.codigo,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1,
            stock: producto.stock
        });

    }


    // Actualizar pantalla

    renderizarCarrito();

    codigoInput.value = "";
    codigoInput.focus();

}


// ==========================================
// MOSTRAR CARRITO
// ==========================================

function renderizarCarrito() {

    tablaProductos.innerHTML = "";


    if (carrito.length === 0) {

        tablaProductos.innerHTML = `
            <tr>
                <td colspan="100%" style="text-align:center;">
                    No hay productos en la venta.
                </td>
            </tr>
        `;

        actualizarTotales();
        return;

    }


    carrito.forEach((producto, indice) => {

    const subtotal = producto.precio * producto.cantidad;

    const fila = document.createElement("tr");

    fila.className = "product-row";

    fila.innerHTML = `

        <!-- PRODUCTO -->
        <td>

            <div class="product-information">

                <div class="product-placeholder">
                    ${producto.nombre.charAt(0).toUpperCase()}
                </div>

                <div>

                    <strong>
                        ${producto.nombre}
                    </strong>

                    <span>
                        Producto
                    </span>

                </div>

            </div>

        </td>


        <!-- CÓDIGO -->
        <td>
            ${producto.codigo}
        </td>


        <!-- PRECIO -->
        <td>
            ${formatoMoneda(producto.precio)}
        </td>


        <!-- CANTIDAD -->
        <td>

            <div class="quantity-control">

                <button
                    type="button"
                    class="quantity-button"
                    data-action="restar"
                    data-index="${indice}">
                    −
                </button>

                <span>
                    ${producto.cantidad}
                </span>

                <button
                    type="button"
                    class="quantity-button"
                    data-action="sumar"
                    data-index="${indice}">
                    +
                </button>

            </div>

        </td>


        <!-- SUBTOTAL -->
        <td>

            <strong>
                ${formatoMoneda(subtotal)}
            </strong>

        </td>


        <!-- ELIMINAR -->
        <td>

            <button
                type="button"
                class="delete-product"
                data-action="eliminar"
                data-index="${indice}"
                aria-label="Eliminar producto">
                ×
            </button>

        </td>

    `;

    tablaProductos.appendChild(fila);

});


    actualizarTotales();

}


// ==========================================
// BOTONES DEL CARRITO
// ==========================================

tablaProductos.addEventListener("click", function(event) {

    const boton = event.target.closest("button");

    if (!boton) return;


    const accion = boton.dataset.action;
    const indice = Number(boton.dataset.index);


    if (accion === "sumar") {

        aumentarCantidad(indice);

    }


    if (accion === "restar") {

        disminuirCantidad(indice);

    }


    if (accion === "eliminar") {

        eliminarProducto(indice);

    }

});


// ==========================================
// AUMENTAR CANTIDAD
// ==========================================

function aumentarCantidad(indice) {

    const producto = carrito[indice];

    if (producto.cantidad >= producto.stock) {

        alert("No hay más stock disponible.");
        return;

    }

    producto.cantidad++;

    renderizarCarrito();

}


// ==========================================
// DISMINUIR CANTIDAD
// ==========================================

function disminuirCantidad(indice) {

    const producto = carrito[indice];

    if (producto.cantidad > 1) {

        producto.cantidad--;

    } else {

        carrito.splice(indice, 1);

    }

    renderizarCarrito();

}


// ==========================================
// ELIMINAR PRODUCTO
// ==========================================

function eliminarProducto(indice) {

    carrito.splice(indice, 1);

    renderizarCarrito();

}


// ==========================================
// CALCULAR TOTALES
// ==========================================

function actualizarTotales() {

    let total = 0;
    let cantidadProductos = 0;


    carrito.forEach(producto => {

        total += producto.precio * producto.cantidad;

        cantidadProductos += producto.cantidad;

    });


    // Total principal

    const saleTotal = document.getElementById("sale-total");

    if (saleTotal) {
        saleTotal.textContent = formatoMoneda(total);
    }


    // Cantidad de productos

    const productCount = document.getElementById("product-count");

    if (productCount) {
        productCount.textContent = cantidadProductos;
    }


    // Total del checkout

    const checkoutTotal = document.getElementById("checkout-total");

    if (checkoutTotal) {
        checkoutTotal.textContent = formatoMoneda(total);
    }

}


// ==========================================
// BOTÓN ESCANEAR
// ==========================================

if (botonEscanear) {

    botonEscanear.addEventListener(
        "click",
        escanearProducto
    );

}


// ==========================================
// ENTER EN EL ESCÁNER
// ==========================================

if (codigoInput) {

    codigoInput.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                event.preventDefault();

                escanearProducto();

            }

        }
    );

}


// ==========================================
// INICIO
// ==========================================

renderizarCarrito();

console.log("RUDAFER - carrito iniciado");