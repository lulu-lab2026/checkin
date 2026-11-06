/**
 * Check.In — English
 * Copy this file to add a new language: translate the values,
 * change the code in I18n.register() and add a <script> tag.
 */
I18n.register('en', {
  meta: {
    name: 'English',
    locale: 'en-GB',
    weekStart: 1          // week starts on Monday
  },

  nav: {
    label: 'Main navigation',
    home: 'Home',
    records: 'Records',
    language: 'Language'
  },

  greeting: {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening'
  },

  status: {
    idle: 'No active workday',
    ready: 'Workday started',
    working: 'Working',
    paused: 'On a break',
    finished: 'Workday finished'
  },

  home: {
    workedToday: 'Worked today',
    openSince: 'You have a workday open since {date}.'
  },

  actions: {
    start: 'Start Workday',
    startHint: 'Open a new workday',
    checkIn: 'Check-In',
    checkInHint: 'Start the timer',
    checkOut: 'Check-Out',
    checkOutHint: 'Pause the timer',
    end: 'End Workday',
    endHint: 'Close and calculate'
  },

  events: {
    start: 'Workday started',
    in: 'Check-In',
    out: 'Check-Out',
    autoOut: 'Automatic Check-Out',
    end: 'Workday ended'
  },

  log: {
    title: "Today's log",
    empty: 'No actions yet. Tap “Start Workday” to begin.',
    workday: 'Workday {n}',
    inProgress: 'In progress'
  },

  total: {
    label: 'Total Hours',
    format: '{h} h {m} min'
  },

  records: {
    prev: 'Previous month',
    next: 'Next month',
    today: 'Today',
    monthTotal: 'Month total',
    daysWorked: 'Days worked',
    average: 'Daily average',
    detail: 'Day details',
    selectDay: 'Select a day in the calendar to see all of its records.',
    noRecords: 'There are no records for this day.',
    dayTotal: 'Day total',
    delete: "Delete this day's records",
    colNum: '#',
    colAction: 'Action',
    colTime: 'Time',
    colSpan: 'Segment'
  },

  toast: {
    started: 'Workday started at {time}',
    checkIn: 'Checked in at {time}',
    checkOut: 'Checked out at {time}',
    ended: 'Workday finished · {total}',
    autoClosed: 'The open Check-In was closed automatically.',
    noDay: 'Tap “Start Workday” first.',
    alreadyActive: 'A workday is already in progress.',
    alreadyIn: 'You are already checked in. Check out first.',
    notIn: 'Check in before checking out.',
    deleted: "The day's records were deleted.",
    storageError: 'Could not save. Please check your browser storage.',
    installed: 'App installed!'
  },

  modal: {
    deleteTitle: 'Delete these records?',
    deleteBody: 'All records for {date} will be deleted. This cannot be undone.',
    cancel: 'Cancel',
    confirmDelete: 'Delete',
    ok: 'Got it'
  },

  install: {
    button: 'Install app',
    iosTitle: 'Install Check.In on your iPhone',
    iosBody: 'In Safari, tap the Share button and choose “Add to Home Screen”. Check.In will then open like a native app.'
  }
});
