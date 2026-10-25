// Pasos de la guía de cada rol.
// "selector" indica qué parte de la pantalla se resalta en cada paso.
export const PASOS_TUTORIAL = {
  login: [
    {
      selector: '.auth-form h1',
      titulo: 'Te damos la bienvenida a AMBO',
      texto:
        'Desde acá entrás a tu cuenta para ver y pedir turnos del centro de salud.',
    },
    {
      selector: '.auth-recorrido',
      titulo: 'Cómo funciona un turno',
      texto:
        'Lo pedís, el centro lo confirma y enfermería te atiende. En AMBO ves cada paso.',
    },
    {
      selector: '.auth-form > label',
      titulo: 'Tu email',
      texto: 'Escribí el email con el que creaste tu cuenta.',
    },
    {
      selector: '.campo-password',
      titulo: 'Tu contraseña',
      texto: 'Tocá el ojo para ver lo que escribiste y revisar que esté bien.',
    },
    {
      selector: '.auth-form button[type="submit"]',
      titulo: 'Ingresar',
      texto:
        'Te lleva directo a tu sección: paciente, enfermería o administración.',
    },
    {
      selector: '.auth-pie',
      titulo: '¿Primera vez?',
      texto:
        'Si sos paciente y todavía no tenés cuenta, la creás acá en un minuto.',
    },
    {
      selector: '.auth-guia',
      titulo: 'Volver a ver la guía',
      texto: 'Si te olvidás de algo, tocá Ver la guía y arranca de nuevo.',
    },
  ],
  patient: [
    {
      selector: '.pagina-encabezado',
      titulo: 'Te damos la bienvenida a AMBO',
      texto: 'En esta pantalla ves todos tus turnos y podés pedir uno nuevo.',
    },
    {
      selector: '.turno-destacado, .vacio',
      titulo: 'Tu próximo turno',
      texto:
        'Acá aparece el turno más cercano, con el día, la hora y el motivo de la consulta.',
    },
    {
      selector: '.pasos',
      titulo: 'En qué etapa está',
      texto:
        'Primero lo pedís, después el centro de salud lo confirma y, cuando enfermería te atiende, queda como atendido.',
    },
    {
      selector: '.pagina > form',
      titulo: 'Pedí un turno',
      texto:
        'Elegí la fecha, la hora y contá brevemente el motivo. El turno queda pendiente hasta que el centro lo confirme.',
    },
    {
      selector: '.bloque',
      titulo: 'Tus otros turnos',
      texto:
        'Los turnos anteriores y los que pediste para más adelante. Si no podés ir, cancelalo para liberar el horario.',
    },
    {
      selector: '.menu a[href="/perfil"]',
      titulo: 'Tus datos',
      texto:
        'En Mi perfil podés actualizar tu teléfono, tu email o tu contraseña.',
    },
    {
      selector: '.boton-ayuda',
      titulo: 'Volver a ver la guía',
      texto: 'Si te olvidás de algo, tocá Ayuda y la guía arranca de nuevo.',
    },
  ],

  nurse: [
    {
      selector: '.contenido h1',
      titulo: 'Te damos la bienvenida a AMBO',
      texto:
        'Desde esta pantalla atendés a los pacientes con turno confirmado.',
    },
    {
      selector: '.tabla-scroll',
      titulo: 'Turnos para atender',
      texto:
        'Ves los turnos confirmados, que son los que tenés que atender, y los que ya atendiste.',
    },
    {
      selector: '.tabla-scroll td button',
      titulo: 'Abrí la ficha del paciente',
      texto:
        'Tocá Signos para ver los registros del turno y cargar los signos vitales y síntomas. Al guardar, el turno queda como atendido.',
    },
    {
      selector: '.menu a[href="/perfil"]',
      titulo: 'Tus datos',
      texto:
        'En Mi perfil podés actualizar tus datos de contacto y tu contraseña.',
    },
    {
      selector: '.boton-ayuda',
      titulo: 'Volver a ver la guía',
      texto: 'Si te olvidás de algo, tocá Ayuda y la guía arranca de nuevo.',
    },
  ],

  administrator: [
    {
      selector: '.contenido h1',
      titulo: 'Te damos la bienvenida a AMBO',
      texto:
        'Desde el panel de administración gestionás las personas y los turnos del centro de salud.',
    },
    {
      selector: '.pestanias',
      titulo: 'Usuarios y turnos',
      texto:
        'Cambiá entre la gestión de usuarios y la de turnos con estas pestañas.',
    },
    {
      selector: '.filtros',
      titulo: 'Buscá rápido',
      texto:
        'Encontrá a cualquier persona por nombre, email o DNI, y filtrá por rol.',
    },
    {
      selector: '.tabla-scroll',
      titulo: 'Editá o dá de baja',
      texto:
        'Cada fila tiene sus acciones. Al eliminar, la persona queda inactiva pero su historial se conserva.',
    },
    {
      selector: '.pestanias ~ section form',
      titulo: 'Sumá personas nuevas',
      texto:
        'Creá cuentas para pacientes, enfermería u otros administradores, con su rol.',
    },
    {
      selector: '.boton-ayuda',
      titulo: 'Volver a ver la guía',
      texto: 'Si te olvidás de algo, tocá Ayuda y la guía arranca de nuevo.',
    },
  ],
};
