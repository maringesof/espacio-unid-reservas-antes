# Espacio Unid · Módulo de reservas (versión inicial)

Aplicación web sencilla para **consultar la disponibilidad y reservar espacios físicos de la universidad** (laboratorios, salas, canchas y auditorios). Es un prototipo del módulo de Reservas del proyecto *Espacio Unid* de la materia Métricas de Calidad de Software.

Está hecha solo con **HTML, CSS y JavaScript**: no necesita instalar nada ni una base de datos. Los datos se guardan en el navegador (`localStorage`).

## Funcionalidades

| Requerimiento | Qué hace la app |
|---|---|
| RF-3 Consulta de espacios | Lista los espacios y los filtra por tipo y capacidad mínima |
| RF-4 Consulta de disponibilidad | Muestra las franjas de la fecha elegida: disponibles, ocupadas o ya pasadas |
| RF-5 Prevención de conflictos | No permite dos reservas activas del mismo espacio, fecha y franja |
| RF-6 Crear reservas | Al hacer clic en una franja disponible se confirma y registra la reserva |
| RF-7 Confirmación de reservas | Muestra número de reserva, espacio, fecha, horario y responsable |
| RF-9 Historial de reservas | Tabla "Mis reservas" del usuario con opción de cancelar |
| RNF-10 Auditoría | Bitácora con fecha, hora, usuario, reserva y tipo de operación |

Se puede cambiar de usuario (estudiante, profesor o administrativo) desde el selector de la parte superior para simular varias personas reservando.

## Estructura

```
espacio-unid-reservas-antes/
├── index.html        # Interfaz
├── css/
│   └── styles.css    # Estilos
└── js/
    ├── modelos.js    # Clases: Usuario, Espacio, Reserva, RegistroAuditoria
    ├── servicio.js   # Lógica de negocio: SistemaReservas (reglas y validaciones)
    └── app.js        # Conecta la interfaz con la lógica
```

La lógica (`servicio.js`) está separada de la interfaz (`app.js`), igual que en el diagrama de clases del proyecto.

## Cómo ejecutarlo

1. Abre la carpeta en **Visual Studio Code**.
2. Opción A: haz doble clic en `index.html` para abrirlo en el navegador.
3. Opción B (recomendada): instala la extensión **Live Server**, clic derecho sobre `index.html` → **Open with Live Server**.

Para volver a los datos de ejemplo usa el botón **Reiniciar datos de prueba**.

## Cómo subirlo a GitHub

1. Crea un repositorio vacío en GitHub (sin README), por ejemplo `espacio-unid-reservas-antes`.
2. En la terminal de VS Code, dentro de la carpeta del proyecto:

```bash
git init
git add .
git commit -m "Versión inicial del módulo de reservas"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/espacio-unid-reservas-antes.git
git push -u origin main
```

3. (Opcional) Para publicarlo como página web: en GitHub ve a **Settings → Pages**, elige la rama `main` y la carpeta `/ (root)`. En unos minutos queda en `https://TU-USUARIO.github.io/espacio-unid-reservas-antes/`.

## Integrantes

- David Esteban Páez González
- Mariangel Perilla Rangel
- David Santiago Camacho
- Erick Leandro Criollo
