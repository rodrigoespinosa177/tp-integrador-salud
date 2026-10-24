export const usuarios = [
  {
    _id: 'u1',
    first_name: 'Ana',
    last_name: 'Admin',
    dni: '30111222',
    email: 'admin@test.com',
    password: '123456',
    rol: 'administrator',
    phone: '2611111111',
    birthdate: '1990-05-10',
  },
  {
    _id: 'u2',
    first_name: 'Nora',
    last_name: 'Enfermera',
    dni: '30333444',
    email: 'nurse@test.com',
    password: '123456',
    rol: 'nurse',
    phone: '2612222222',
    birthdate: '1988-03-22',
  },
  {
    _id: 'u3',
    first_name: 'Pablo',
    last_name: 'Paciente',
    dni: '30555666',
    email: 'patient@test.com',
    password: '123456',
    rol: 'patient',
    phone: '2613333333',
    birthdate: '2000-11-02',
  },
  {
    _id: 'u4',
    first_name: 'Lucía',
    last_name: 'Gómez',
    dni: '30777888',
    email: 'lucia@test.com',
    password: '123456',
    rol: 'patient',
    phone: '2614444444',
    birthdate: '1995-07-19',
  },
];

// Simula la demora de un servidor real
export const esperar = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export const turnos = [
  {
    _id: 't1',
    patient_id: 'u3',
    date: '2026-10-28',
    hour: '09:30',
    status: 'pending',
    motive: 'Control general',
    assigned_by_id: 'u3',
  },
  {
    _id: 't2',
    patient_id: 'u3',
    date: '2026-10-15',
    hour: '11:00',
    status: 'completed',
    motive: 'Dolor de cabeza',
    assigned_by_id: 'u1',
  },
  {
    _id: 't3',
    patient_id: 'u4',
    date: '2026-10-28',
    hour: '10:00',
    status: 'confirmed',
    motive: 'Fiebre y tos',
    assigned_by_id: 'u1',
  },
];

// Genera un ID único para lo que se crea con los mocks
export const nuevoId = (prefijo) => `${prefijo}${Date.now()}`;

export const signos = [
  {
    _id: 's1',
    medical_appointment_id: 't2',
    nurse_id: 'u2',
    date: '2026-10-15T11:10:00',
    vital_signs: 'PA 120/80 · T 36.8 °C · FC 76 · SpO2 98%',
    symptoms: 'Cefalea frontal desde hace 2 días',
    observations: 'Se indica hidratación y control',
  },
];
