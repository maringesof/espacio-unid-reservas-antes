/**
 * app.js
 * Conecta la interfaz (HTML) con la lógica de SistemaReservas.
 */

const sistema = new SistemaReservas();

// Estado de la pantalla
let usuarioActual = 1;
let reservaPendiente = null;

// Elementos del HTML
const selectUsuario = document.getElementById("selectUsuario");
const formFiltros = document.getElementById("formFiltros");
const filtroFecha = document.getElementById("filtroFecha");
const filtroTipo = document.getElementById("filtroTipo");
const filtroCapacidad = document.getElementById("filtroCapacidad");
const listaEspacios = document.getElementById("listaEspacios");
const tablaHistorial = document.getElementById("tablaHistorial");
const listaAuditoria = document.getElementById("listaAuditoria");
const dialogoReserva = document.getElementById("dialogoReserva");
const dialogoConfirmacion = document.getElementById("dialogoConfirmacion");
const mensaje = document.getElementById("mensaje");

// ---------- Utilidades de interfaz ----------

/** Crea un elemento con clase y texto (usa textContent para evitar inyección de HTML). */
function crear(etiqueta, clase = "", texto = "") {
  const el = document.createElement(etiqueta);
  if (clase) el.className = clase;
  if (texto) el.textContent = texto;
  return el;
}

function mostrarMensaje(texto, tipo = "exito") {
  mensaje.textContent = texto;
  mensaje.className = `mensaje ${tipo}`;
  mensaje.hidden = false;
  clearTimeout(mostrarMensaje.temporizador);
  mostrarMensaje.temporizador = setTimeout(() => (mensaje.hidden = true), 3500);
}

function llenarDetalle(dl, datos) {
  dl.replaceChildren();
  for (const [clave, valor] of Object.entries(datos)) {
    dl.append(crear("dt", "", clave), crear("dd", "", valor));
  }
}

function nombreTipo(tipo) {
  let nombre = "";
  if (tipo === "LABORATORIO") {
    nombre = "Laboratorio";
  } else if (tipo === "SALA") {
    nombre = "Sala";
  } else if (tipo === "CANCHA") {
    nombre = "Cancha";
  } else if (tipo === "AUDITORIO") {
    nombre = "Auditorio";
  } else if (tipo === "ESTUDIANTE") {
    nombre = "Estudiante";
  } else if (tipo === "PROFESOR") {
    nombre = "Profesor";
  } else if (tipo === "ADMINISTRATIVO") {
    nombre = "Administrativo";
  } else {
    nombre = tipo;
  }
  return nombre;
}

// ---------- Render: usuarios ----------

function renderUsuarios() {
  selectUsuario.replaceChildren();
  for (const u of sistema.usuarios) {
    const opcion = crear("option", "", `${u.nombre} (${nombreTipo(u.tipoUsuario)})`);
    opcion.value = u.idUsuario;
    selectUsuario.append(opcion);
  }
  selectUsuario.value = usuarioActual;
}

// ---------- Render: espacios y disponibilidad (RF-3, RF-4) ----------

function renderEspacios() {
  const fecha = filtroFecha.value;
  const espacios = sistema.consultarEspacios({
    tipoEspacio: filtroTipo.value,
    capacidadMinima: Number(filtroCapacidad.value) || 0,
  });

  listaEspacios.replaceChildren();
  if (espacios.length === 0) {
    listaEspacios.append(crear("p", "vacio", "No hay espacios que cumplan esos filtros."));
    return;
  }

  for (const espacio of espacios) {
    const tarjeta = crear("article", "espacio");
    tarjeta.append(
      crear("h3", "", espacio.nombre),
      crear("p", "dato", `${nombreTipo(espacio.tipoEspacio)} · ${espacio.ubicacion} · Capacidad ${espacio.capacidad}`)
    );

    const franjas = crear("div", "franjas");
    for (const franja of sistema.consultarDisponibilidad(espacio.idEspacio, fecha)) {
      const boton = crear("button", `franja ${franja.estado.toLowerCase()}`,
        `${franja.horaInicio} - ${franja.horaFin}`);
      boton.type = "button";
      boton.title = franja.estado === "DISPONIBLE" ? "Disponible: clic para reservar"
        : franja.estado === "OCUPADO" ? "Ocupado" : "Ya pasó";
      boton.disabled = franja.estado !== "DISPONIBLE";
      boton.addEventListener("click", () => abrirDialogoReserva(espacio, fecha, franja));
      franjas.append(boton);
    }
    tarjeta.append(franjas);
    listaEspacios.append(tarjeta);
  }
}

// ---------- RF-6: crear reserva ----------

function abrirDialogoReserva(espacio, fecha, franja) {
  reservaPendiente = { idEspacio: espacio.idEspacio, fecha, ...franja };
  llenarDetalle(document.getElementById("detalleReserva"), {
    Espacio: espacio.nombre,
    Ubicación: espacio.ubicacion,
    Fecha: Fechas.legible(fecha),
    Horario: `${franja.horaInicio} - ${franja.horaFin}`,
    Responsable: sistema.buscarUsuario(usuarioActual).nombre,
  });
  dialogoReserva.showModal();
}

document.getElementById("formReserva").addEventListener("submit", () => {
  if (!reservaPendiente) return;
  const { idEspacio, fecha, horaInicio, horaFin } = reservaPendiente;
  reservaPendiente = null;

  try {
    const confirmacion = sistema.crearReserva(usuarioActual, idEspacio, fecha, horaInicio, horaFin);
    // RF-7: mostrar confirmación con los datos principales
    llenarDetalle(document.getElementById("detalleConfirmacion"), {
      "N.º de reserva": String(confirmacion.idReserva),
      Espacio: confirmacion.espacio,
      Fecha: Fechas.legible(confirmacion.fecha),
      Horario: confirmacion.horario,
      Responsable: confirmacion.responsable,
    });
    dialogoConfirmacion.showModal();
    renderTodo();
  } catch (error) {
    mostrarMensaje(error.message, "error");
    renderEspacios();
  }
});

document.getElementById("btnCancelarDialogo").addEventListener("click", () => {
  reservaPendiente = null;
  dialogoReserva.close();
});

// ---------- RF-9: historial ----------

function renderHistorial() {
  const reservas = sistema.consultarHistorial(usuarioActual);
  tablaHistorial.replaceChildren();

  if (reservas.length === 0) {
    const fila = crear("tr");
    const celda = crear("td", "vacio", "Aún no tienes reservas.");
    celda.colSpan = 6;
    fila.append(celda);
    tablaHistorial.append(fila);
    return;
  }

  for (const r of reservas) {
    const espacio = sistema.buscarEspacio(r.idEspacio);
    const fila = crear("tr");
    const estado = crear("td");
    estado.append(crear("span", `estado ${r.estado.toLowerCase()}`, r.estado === "ACTIVA" ? "Activa" : "Cancelada"));

    const acciones = crear("td");
    if (r.estado === "ACTIVA" && r.fecha >= Fechas.hoy()) {
      const boton = crear("button", "boton pequeno secundario", "Cancelar");
      boton.type = "button";
      boton.addEventListener("click", () => cancelar(r.idReserva));
      acciones.append(boton);
    }

    fila.append(
      crear("td", "", String(r.idReserva)),
      crear("td", "", espacio ? espacio.nombre : "—"),
      crear("td", "", r.fecha),
      crear("td", "", `${r.horaInicio} - ${r.horaFin}`),
      estado,
      acciones
    );
    tablaHistorial.append(fila);
  }
}

function cancelar(idReserva) {
  try {
    sistema.cancelarReserva(idReserva, usuarioActual);
    mostrarMensaje(`Reserva #${idReserva} cancelada. La franja vuelve a estar disponible.`);
    renderTodo();
  } catch (error) {
    mostrarMensaje(error.message, "error");
  }
}

// ---------- RNF-10: auditoría ----------

function renderAuditoria() {
  listaAuditoria.replaceChildren();
  const registros = sistema.consultarBitacora();
  if (registros.length === 0) {
    listaAuditoria.append(crear("li", "vacio", "Sin operaciones registradas."));
    return;
  }
  for (const a of registros) {
    const usuario = sistema.buscarUsuario(a.idUsuario);
    const espacio = sistema.buscarEspacio(a.idEspacio);
    const accion = a.tipoOperacion === "CREAR" ? "creó" : "canceló";
    const item = crear("li");
    item.append(
      crear("span", "marca", `${a.fecha} ${a.hora}`),
      crear("span", "", `${usuario ? usuario.nombre : "Usuario"} ${accion} la reserva #${a.idReserva} de ${espacio ? espacio.nombre : "un espacio"}`)
    );
    listaAuditoria.append(item);
  }
}

// ---------- Eventos generales ----------

function renderTodo() {
  renderEspacios();
  renderHistorial();
  renderAuditoria();
}

selectUsuario.addEventListener("change", () => {
  usuarioActual = Number(selectUsuario.value);
  renderTodo();
});

formFiltros.addEventListener("submit", (evento) => {
  evento.preventDefault();
  renderEspacios();
});

document.getElementById("btnReiniciar").addEventListener("click", () => {
  sistema.reiniciarDatos();
  usuarioActual = 1;
  renderUsuarios();
  renderTodo();
  mostrarMensaje("Datos de prueba reiniciados.");
});

// ---------- Inicio ----------
filtroFecha.min = Fechas.hoy();
filtroFecha.value = Fechas.hoy();
renderUsuarios();
renderTodo();
