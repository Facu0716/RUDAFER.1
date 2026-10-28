document.addEventListener("DOMContentLoaded", () => {
    const formLogin = document.querySelector(".login-form");

    if (formLogin) {
        formLogin.addEventListener("submit", async function (e) {
            e.preventDefault();

            const dniInput = document.getElementById("dni").value.trim();
            const passwordInput = document.getElementById("password").value.trim();

            const datosLogin = {
                dni: dniInput,
                contrasena: passwordInput
            };

            try {
                const respuesta = await fetch('http://localhost:8081/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosLogin)
                });

                let resultado = {};
                try {
                    resultado = await respuesta.json();
                } catch (err) {}

                if (respuesta.ok && resultado.exito) {
                    // Guardamos los datos de sesión incluyendo ID_Empleado y la Sucursal asignada
                    localStorage.setItem('usuarioNombre', resultado.nombre);
                    localStorage.setItem('usuarioRol', resultado.rol.toUpperCase());
                    localStorage.setItem('ID_Empleado', resultado.ID_Empleado); 
                    
                    // Almacenamos la sucursal fija que le pertenece a este empleado por DNI/Login
                    localStorage.setItem('rudafer_sucursal_activa', resultado.idSucursal || resultado.ID_Sucursal || 1); 

                    // Redirección directa según el rol[cite: 7]
                    if (resultado.rol.toUpperCase() === 'ADMINISTRADOR') {
                        window.location.href = 'INICIO.html';
                    } else {
                        window.location.href = 'INICIO.EMPLEADOS.html';
                    }
                } else {
                    alert(resultado.mensaje || "DNI o contraseña incorrectos.");
                }

            } catch (error) {
                console.error("Error de conexión con el servidor:", error);
                alert("No se pudo conectar con el servidor Java (localhost:8081).");
            }
        });
    }
});