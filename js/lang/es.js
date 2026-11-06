/**
 * Check.In — Español (idioma por defecto)
 * Todas las cadenas de la interfaz. Los marcadores {así} se
 * sustituyen en tiempo de ejecución.
 */
I18n.register('es', {
  meta: {
    name: 'Español',
    locale: 'es-ES',
    weekStart: 1          // la semana empieza en lunes
  },

  nav: {
    label: 'Navegación principal',
    home: 'Inicio',
    records: 'Registros',
    language: 'Idioma'
  },

  greeting: {
    morning: 'Buenos días',
    afternoon: 'Buenas tardes',
    evening: 'Buenas noches'
  },

  status: {
    idle: 'Sin jornada activa',
    ready: 'Jornada iniciada',
    working: 'Trabajando',
    paused: 'En pausa',
    finished: 'Jornada finalizada'
  },

  home: {
    workedToday: 'Trabajado hoy',
    openSince: 'Tienes una jornada abierta desde el {date}.'
  },

  actions: {
    start: 'Inicio de Trabajo',
    startHint: 'Abre una nueva jornada',
    checkIn: 'Check-In',
    checkInHint: 'Empieza a contar',
    checkOut: 'Check-Out',
    checkOutHint: 'Pausa el contador',
    end: 'Fin de Trabajo',
    endHint: 'Cierra y calcula'
  },

  events: {
    start: 'Inicio de trabajo',
    in: 'Check-In',
    out: 'Check-Out',
    autoOut: 'Check-Out automático',
    end: 'Fin de trabajo'
  },

  log: {
    title: 'Registro de hoy',
    empty: 'Aún no hay acciones. Pulsa «Inicio de Trabajo» para empezar tu jornada.',
    workday: 'Jornada {n}',
    inProgress: 'En curso'
  },

  total: {
    label: 'Total de Horas',
    format: '{h} h {m} min'
  },

  records: {
    prev: 'Mes anterior',
    next: 'Mes siguiente',
    today: 'Hoy',
    monthTotal: 'Total del mes',
    daysWorked: 'Días trabajados',
    average: 'Media por día',
    detail: 'Detalle del día',
    selectDay: 'Selecciona un día del calendario para ver todos sus registros.',
    noRecords: 'No hay registros para este día.',
    dayTotal: 'Total del día',
    delete: 'Eliminar registros del día',
    colNum: '#',
    colAction: 'Acción',
    colTime: 'Hora',
    colSpan: 'Tramo'
  },

  toast: {
    started: 'Jornada iniciada a las {time}',
    checkIn: 'Check-In registrado a las {time}',
    checkOut: 'Check-Out registrado a las {time}',
    ended: 'Jornada finalizada · {total}',
    autoClosed: 'El Check-In abierto se ha cerrado automáticamente.',
    noDay: 'Primero pulsa «Inicio de Trabajo».',
    alreadyActive: 'Ya tienes una jornada en curso.',
    alreadyIn: 'Ya has hecho Check-In. Haz Check-Out primero.',
    notIn: 'Haz Check-In antes de hacer Check-Out.',
    deleted: 'Registros del día eliminados.',
    storageError: 'No se pudo guardar. Revisa el almacenamiento del navegador.',
    installed: '¡App instalada!'
  },

  modal: {
    deleteTitle: '¿Eliminar los registros?',
    deleteBody: 'Se borrarán todos los registros del {date}. Esta acción no se puede deshacer.',
    cancel: 'Cancelar',
    confirmDelete: 'Eliminar',
    ok: 'Entendido'
  },

  install: {
    button: 'Instalar app',
    iosTitle: 'Instala Check.In en tu iPhone',
    iosBody: 'En Safari, pulsa el botón Compartir y elige «Añadir a pantalla de inicio». Check.In se abrirá como una app.'
  }
});
