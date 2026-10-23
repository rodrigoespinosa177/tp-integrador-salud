export const usuarios = [
  {
    _id: 'u1',
    first_name: 'Ana',
    last_name: 'Admin',
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
    email: 'patient@test.com',
    password: '123456',
    rol: 'patient',
    phone: '2613333333',
    birthdate: '2000-11-02',
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
];

// Genera un ID único para lo que se crea con los mocks
export const nuevoId = (prefijo) => `${prefijo}${Date.now()}`;
