/**
 * servicio.js
 * Lógica de negocio de las reservas. No toca el HTML: solo datos y reglas.
 *
 * Requerimientos que cubre:
 *  RF-3 Consulta de espacios        -> consultarEspacios()
 *  RF-4 Consulta de disponibilidad  -> consultarDisponibilidad()
 *  RF-5 Prevención de conflictos    -> consultarDisponibilidad() y crearReserva()
 *  RF-6 Crear reservas              -> crearReserva()
 *  RF-7 Confirmación de reservas    -> crearReserva() devuelve el detalle
 *  RF-9 Historial de reservas       -> consultarHistorial()
 *  RNF-10 Auditoría                 -> registrarAuditoria()
 */

const CLAVE_ALMACENAMIENTO = "espacio-unid-datos";

class SistemaReservas {
  constructor() {
    const guardado = this.#leerDatos();
    if (guardado) {
      this.usuarios = guardado.usuarios;
      this.espacios = guardado.espacios;
      this.reservas = guardado.reservas;
      this.auditoria = guardado.auditoria;
    } else {
      this.#cargarDatosIniciales();
    }
  }

  // ---------- RF-3: Consulta de espacios ----------
  consultarEspacios({ tipoEspacio = "", capacidadMinima = 0 } = {}) {
    return this.espacios.filter(
      (e) =>
        (tipoEspacio === "" || e.tipoEspacio === tipoEspacio) &&
        e.capacidad >= capacidadMinima
    );
  }

  buscarEspacio(idEspacio) {
    return this.espacios.find((e) => e.idEspacio === idEspacio);
  }

  buscarUsuario(idUsuario) {
    return this.usuarios.find((u) => u.idUsuario === idUsuario);
  }

  // ---------- RF-4: Consulta de disponibilidad ----------
  /** Devuelve cada franja del día con su estado: DISPONIBLE, OCUPADO o PASADO. */
  consultarDisponibilidad(idEspacio, fecha) {
    const esHoy = fecha === Fechas.hoy();
    const horaActual = Fechas.horaActual();

    return FRANJAS.map((franja) => {
      let estado = "DISPONIBLE";
      if (fecha < Fechas.hoy() || (esHoy && franja.horaInicio <= horaActual)) {
        estado = "PASADO";
      } else {
        // Revisar si alguna reserva activa ocupa esta franja
        for (let i = 0; i < this.reservas.length; i++) {
          const r = this.reservas[i];
          if (r.estado === "ACTIVA" && r.idEspacio === idEspacio && r.fecha === fecha &&
              franja.horaInicio < r.horaFin && franja.horaFin > r.horaInicio) {
            estado = "OCUPADO";
          }
        }
      }
      return { ...franja, estado };
    });
  }

  /** Porcentaje de franjas ocupadas de un espacio en una fecha. */
  calcularOcupacion(idEspacio, fecha) {
    const ocupadas = this.reservas.filter(
      (r) => r.estado === "ACTIVA" && r.idEspacio === idEspacio && r.fecha === fecha
    ).length;
    return (ocupadas / FRANJAS.length) * 100;
  }

  // ---------- RF-6 y RF-7: Crear y confirmar reserva ----------
  crearReserva(idUsuario, idEspacio, fecha, horaInicio, horaFin) {
    const usuario = this.buscarUsuario(idUsuario);
    const espacio = this.buscarEspacio(idEspacio);
    const totalReservas = this.reservas.length;

    if (!usuario) throw new Error("Debes iniciar sesión para reservar.");
    if (!espacio) throw new Error("El espacio seleccionado no existe.");
    if (!fecha || !horaInicio || !horaFin) throw new Error("Completa fecha y franja horaria.");
    if (horaFin <= horaInicio) throw new Error("La hora de fin debe ser mayor que la de inicio.");
    if (fecha < Fechas.hoy()) throw new Error("No se puede reservar en una fecha pasada.");
    // Revisar si alguna reserva activa ocupa esta franja
    for (let i = 0; i < this.reservas.length; i++) {
      const r = this.reservas[i];
      if (r.estado === "ACTIVA" && r.idEspacio === idEspacio && r.fecha === fecha &&
          horaInicio < r.horaFin && horaFin > r.horaInicio) {
        throw new Error("El espacio no está disponible en esa franja: ya tiene una reserva.");
      }
    }

    const reserva = new Reserva(this.#siguienteId(this.reservas, "idReserva"),
      idUsuario, idEspacio, fecha, horaInicio, horaFin);
    this.reservas.push(reserva);
    this.registrarAuditoria(idUsuario, reserva.idReserva, idEspacio, "CREAR");
    this.#guardarDatos();

    // RF-7: datos de la confirmación
    return {
      idReserva: reserva.idReserva,
      espacio: espacio.nombre,
      ubicacion: espacio.ubicacion,
      fecha: reserva.fecha,
      horario: `${reserva.horaInicio} - ${reserva.horaFin}`,
      responsable: usuario.nombre,
    };
  }

  cancelarReserva(idReserva, idUsuario) {
    const reserva = this.reservas.find((r) => r.idReserva === idReserva);
    if (!reserva) throw new Error("La reserva no existe.");
    if (reserva.idUsuario !== idUsuario) throw new Error("Solo puedes cancelar tus propias reservas.");
    if (reserva.estado !== "ACTIVA") throw new Error("La reserva ya estaba cancelada.");

    reserva.estado = "CANCELADA";
    this.registrarAuditoria(idUsuario, idReserva, reserva.idEspacio, "CANCELAR");
    this.#guardarDatos();
  }

  // ---------- RF-9: Historial ----------
  consultarHistorial(idUsuario) {
    return this.reservas
      .filter((r) => r.idUsuario === idUsuario)
      .sort((a, b) => (b.fecha + b.horaInicio).localeCompare(a.fecha + a.horaInicio));
  }

  // ---------- RNF-10: Auditoría ----------
  registrarAuditoria(idUsuario, idReserva, idEspacio, tipoOperacion) {
    const registro = new RegistroAuditoria(
      this.#siguienteId(this.auditoria, "idAuditoria"),
      idUsuario, idReserva, idEspacio, tipoOperacion);
    this.auditoria.push(registro);
  }

  consultarBitacora() {
    return [...this.auditoria].reverse();
  }

  reiniciarDatos() {
    localStorage.removeItem(CLAVE_ALMACENAMIENTO);
    this.#cargarDatosIniciales();
  }

  // ---------- Privados ----------
  #siguienteId(lista, campo) {
    return lista.reduce((max, item) => Math.max(max, item[campo]), 0) + 1;
  }

  #leerDatos() {
    try {
      const texto = localStorage.getItem(CLAVE_ALMACENAMIENTO);
      return texto ? JSON.parse(texto) : null;
    } catch {
      return null;
    }
  }

  #guardarDatos() {
    try {
      localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify({
        usuarios: this.usuarios,
        espacios: this.espacios,
        reservas: this.reservas,
        auditoria: this.auditoria,
      }));
    } catch {
      // Si el navegador no permite guardar, la app sigue funcionando en memoria.
    }
  }

  #cargarDatosIniciales() {
    this.usuarios = [
      new Usuario(1, "Laura Gómez", "laura.gomez@universidad.edu.co", "ESTUDIANTE"),
      new Usuario(2, "Carlos Ruiz", "carlos.ruiz@universidad.edu.co", "PROFESOR"),
      new Usuario(3, "Ana Torres", "ana.torres@universidad.edu.co", "ADMINISTRATIVO"),
    ];
    this.espacios = [
      new Espacio(1, "Laboratorio de Sistemas", "Bloque A · Piso 3", 30, "LABORATORIO"),
      new Espacio(2, "Sala de Reuniones 201", "Bloque B · Piso 2", 10, "SALA"),
      new Espacio(3, "Cancha Múltiple", "Zona deportiva", 40, "CANCHA"),
      new Espacio(4, "Auditorio Principal", "Bloque C · Piso 1", 120, "AUDITORIO"),
      new Espacio(5, "Laboratorio de Redes", "Bloque A · Piso 4", 20, "LABORATORIO"),
    ];
    this.reservas = [];
    this.auditoria = [];

    // Una reserva de ejemplo mañana, para ver una franja ocupada.
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const ejemplo = new Reserva(1, 2, 1, Fechas.aTexto(manana), "09:00", "11:00");
    this.reservas.push(ejemplo);
    this.registrarAuditoria(2, 1, 1, "CREAR");
    this.#guardarDatos();
  }
}
