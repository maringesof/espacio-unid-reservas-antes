/**
 * modelos.js
 * Clases del dominio de Espacio Unid (basadas en el diagrama de clases).
 */

class Usuario {
  constructor(idUsuario, nombre, correoInstitucional, tipoUsuario) {
    this.idUsuario = idUsuario;
    this.nombre = nombre;
    this.correoInstitucional = correoInstitucional;
    this.tipoUsuario = tipoUsuario; // ESTUDIANTE | PROFESOR | ADMINISTRATIVO
  }
}

class Espacio {
  constructor(idEspacio, nombre, ubicacion, capacidad, tipoEspacio) {
    this.idEspacio = idEspacio;
    this.nombre = nombre;
    this.ubicacion = ubicacion;
    this.capacidad = capacidad;
    this.tipoEspacio = tipoEspacio; // LABORATORIO | SALA | CANCHA | AUDITORIO
  }
}

class Disponibilidad {
  constructor(idDisponibilidad, idEspacio, fecha, horaInicio, horaFin, estado) {
    this.idDisponibilidad = idDisponibilidad;
    this.idEspacio = idEspacio;
    this.fecha = fecha;
    this.horaInicio = horaInicio;
    this.horaFin = horaFin;
    this.estado = estado; // DISPONIBLE | OCUPADO
  }

  estaDisponible() {
    return this.estado === "DISPONIBLE";
  }

  cambiarEstado(nuevoEstado) {
    this.estado = nuevoEstado;
  }
}

class Reserva {
  constructor(idReserva, idUsuario, idEspacio, fecha, horaInicio, horaFin) {
    this.idReserva = idReserva;
    this.idUsuario = idUsuario;
    this.idEspacio = idEspacio;
    this.fecha = fecha;           // "AAAA-MM-DD"
    this.horaInicio = horaInicio; // "HH:MM"
    this.horaFin = horaFin;       // "HH:MM"
    this.estado = "ACTIVA";       // ACTIVA | CANCELADA
    this.fechaGenerada = new Date().toISOString();
  }
}

class RegistroAuditoria {
  constructor(idAuditoria, idUsuario, idReserva, idEspacio, tipoOperacion) {
    const ahora = new Date();
    this.idAuditoria = idAuditoria;
    this.idUsuario = idUsuario;
    this.idReserva = idReserva;
    this.idEspacio = idEspacio;
    this.tipoOperacion = tipoOperacion; // CREAR | CANCELAR
    this.fecha = Fechas.aTexto(ahora);
    this.hora = ahora.toTimeString().slice(0, 5);
  }
}

/** Franjas horarias en las que se puede reservar un espacio. */
const FRANJAS = [
  { horaInicio: "07:00", horaFin: "09:00" },
  { horaInicio: "09:00", horaFin: "11:00" },
  { horaInicio: "11:00", horaFin: "13:00" },
  { horaInicio: "14:00", horaFin: "16:00" },
  { horaInicio: "16:00", horaFin: "18:00" },
];

/** Utilidades de fecha en hora local (evita el desfase de toISOString con UTC). */
const Fechas = {
  aTexto(fecha) {
    const a = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, "0");
    const d = String(fecha.getDate()).padStart(2, "0");
    return `${a}-${m}-${d}`;
  },
  hoy() {
    return Fechas.aTexto(new Date());
  },
  horaActual() {
    return new Date().toTimeString().slice(0, 5);
  },
  legible(textoFecha) {
    const [a, m, d] = textoFecha.split("-").map(Number);
    return new Date(a, m - 1, d).toLocaleDateString("es-CO", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  },
};
