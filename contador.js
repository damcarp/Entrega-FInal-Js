document.addEventListener('DOMContentLoaded', () => {
    fetch('datos_iniciales.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar el archivo JSON');
            }
            return response.json();
        })
        .then(data => {
            inicializarDesdeJSON(data);
        })
        .catch(error => {
            console.error('Error al cargar datos iniciales:', error);
        });

document.getElementById('confirmarDatos').addEventListener('click', confirmarDatos);
});

// Variable para almacenar la configuración y los alumnos
let alumnos = [];

// Iicializar datos desde JSON
function inicializarDesdeJSON(data) {
    if (data.duracionDelCurso) {
        document.getElementById('duracionCurso').value = data.duracionDelCurso;
    }
    if (data.cantidadDeAlumnos) {
        document.getElementById('cantidadAlumnos').value = data.cantidadDeAlumnos;
    }
    if (data.alumnos && Array.isArray(data.alumnos)) {
        alumnos = data.alumnos.map(nombre => new Alumno(nombre));
        localStorage.setItem('alumnos', JSON.stringify(alumnos));
    }
}

// Cnfirmar datos del curso
function confirmarDatos() {
    const duracionDelCurso = parseInt(document.getElementById('duracionCurso').value);
    const cantidadDeAlumnos = parseInt(document.getElementById('cantidadAlumnos').value);

    // Validación
    if (!duracionDelCurso || duracionDelCurso <= 0) {
        alert("Por favor ingresa un número válido para la duración del curso.");
        return;
    }

    if (!cantidadDeAlumnos || cantidadDeAlumnos <= 0) {
        alert("Por favor ingresa un número válido para la cantidad de alumnos.");
        return;
    }

    // Guardar datos iniciales en localStorage
    localStorage.setItem("duracionDelCurso", duracionDelCurso);
    localStorage.setItem("cantidadDeAlumnos", cantidadDeAlumnos);

    document.getElementById('inputs').style.display = 'none';
    document.getElementById('bienvenida').style.display = 'none';
        
    let nombresHTML = "<h3>Ingresa los nombres de los alumnos:</h3>";
    for (let i = 0; i < cantidadDeAlumnos; i++) {
        nombresHTML += `
            <label for="alumno${i}">Alumno ${i + 1}:</label>
            <input type="text" id="alumno${i}" required><br>            
        `;
    }
    nombresHTML += `<button id="confirmarAlumnos">Confirmar Alumnos</button>`;
    document.getElementById('nombresAlumnos').innerHTML = nombresHTML;

    // Mostrar el formulario de nombres
    document.getElementById('nombresAlumnos').classList.add('show');

    document.getElementById('confirmarAlumnos').addEventListener('click', confirmarAlumnos);
}

// Confirmar los alumnos
function confirmarAlumnos() {
    const cantidadDeAlumnos = parseInt(localStorage.getItem('cantidadDeAlumnos'));

    // Limpiar la lista de alumnos antes de volver a agregar
    alumnos = [];

    for (let i = 0; i < cantidadDeAlumnos; i++) {
        const nombre = document.getElementById(`alumno${i}`).value.trim();

        // Validaciones adicionales
        if (!nombre) {
            alert("Por favor ingresa todos los nombres de los alumnos.");
            return;
        }

        if (!/^[A-Za-záéíóúÁÉÍÓÚüÜ\s]+$/.test(nombre)) {
            alert(`El nombre '${nombre}' contiene caracteres no válidos. Solo se permiten letras y espacios.`);
            return;
        }

        if (alumnos.some(alumno => alumno.nombre.toLowerCase() === nombre.toLowerCase())) {
            alert(`El nombre '${nombre}' ya está registrado. Por favor ingresa un nombre único.`);
            return;
        }

        alumnos.push(new Alumno(nombre));
    }

    localStorage.setItem("alumnos", JSON.stringify(alumnos));

    document.getElementById('nombresAlumnos').style.display = 'none';

    iniciarAsistencia();
}

function Alumno(nombre) {
    this.nombre = nombre;
    this.asistencias = [];

    this.registrarAsistencia = function(presente) {
        this.asistencias.push(presente);
    };

    this.getPorcentajeAsistencia = function() {
        const clasesAsistidas = this.asistencias.filter(a => a).length;
        return (clasesAsistidas / this.asistencias.length) * 100;
    };

    this.getEstado = function() {
        const porcentajeAsistencia = this.getPorcentajeAsistencia();
        return porcentajeAsistencia < 75 ? "Reprobado por Inasistencias" : "Aprobado";
    };
}

// Función para iniciar la asistencia
function iniciarAsistencia() {
    const duracionDelCurso = parseInt(localStorage.getItem('duracionDelCurso'));
    let diaActual = 1;

    function tomarAsistencia() {
        if (diaActual > duracionDelCurso) {
            mostrarResultados();
            return;
        }

        let asistenciaHTML = `<h3>Día ${diaActual}: Registro de asistencias</h3>`;
        alumnos.forEach((alumno, index) => {
            asistenciaHTML += `
                <label>${alumno.nombre}:</label>
                <div class="presencia">
                    <label><input type="radio" name="presente${index}" value="si"> Presente</label>
                    <label><input type="radio" name="presente${index}" value="no"> Ausente</label>
                </div>
                <hr>
            `;
        });
        asistenciaHTML += `<button id="confirmarAsistencia">Confirmar Asistencias</button>`;
        document.getElementById('resultados').innerHTML = asistenciaHTML;

        document.getElementById('resultados').classList.add('show');

        document.getElementById('confirmarAsistencia').addEventListener('click', () => {
            const todasLasAsistencias = alumnos.map((alumno, index) => {
                const presencia = document.querySelector(`input[name="presente${index}"]:checked`);
                if (!presencia) {
                    alert(`Por favor selecciona si ${alumno.nombre} está presente o ausente.`);
                    return false;
                }
                alumno.registrarAsistencia(presencia.value === "si");
                return true;
            });

            const todoConfirmado = todasLasAsistencias.every((asistencia) => asistencia);

            if (todoConfirmado) {
                diaActual++;
                tomarAsistencia();
            }
        });
    }

    tomarAsistencia();
}

// Función para mostrar los resultados al final
function mostrarResultados() {
    let tablaHTML = `
        <table border="1" cellpadding="5">
            <thead>
                <tr>
                    <th>Alumno</th>
                    <th>Asistencias</th>
                    <th>Ausencias</th>
                    <th>Total</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Variables para los datos del gráfico
    let etiquetas = [];
    let datosAsistencias = [];
    let datosAusencias = [];

    alumnos.forEach((alumno) => {
        const asistencias = alumno.asistencias.filter(a => a).length;
        const ausencias = alumno.asistencias.length - asistencias;

        tablaHTML += `
            <tr>
                <td>${alumno.nombre}</td>
                <td>${asistencias}</td>
                <td>${ausencias}</td>
                <td>${alumno.asistencias.length}</td>
                <td class="${alumno.getEstado() === "Reprobado por Inasistencias" ? 'reprobado' : 'aprobado'}">${alumno.getEstado()}</td>
            </tr>
        `;

        // Preparar los datos para el gráfico
        etiquetas.push(alumno.nombre);
        datosAsistencias.push(asistencias);
        datosAusencias.push(ausencias);
    });

    tablaHTML += "</tbody></table>";

    // Agregar la tabla HTML
    const resultadosContainer = document.getElementById('resultados');
    resultadosContainer.innerHTML = `
        <div class="resultados-container" style="margin-top: 20px; padding: 20px;">
            ${tablaHTML}
        </div>
    `;

    if (!document.getElementById('graficoAsistencia')) {
        const canvas = document.createElement('canvas');
        canvas.id = 'graficoAsistencia';
        document.querySelector('.resultados-container').appendChild(canvas);
    }

    // Generar el gráfico
    crearGraficoAsistencia(etiquetas, datosAsistencias, datosAusencias);
}

// Función para crear el gráfico
function crearGraficoAsistencia(etiquetas, datosAsistencias, datosAusencias) {
    const ctx = document.getElementById('graficoAsistencia').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: etiquetas,
            datasets: [{
                label: 'Asistencias',
                data: datosAsistencias,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            },
            {
                label: 'Ausencias',
                data: datosAusencias,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}
