import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TablaTurnos from './TablaTurnos';

const turnos = [
  {
    _id: 't1',
    patient_id: 'u3',
    date: '2026-10-28',
    hour: '09:30',
    status: 'pending',
    motive: 'Control general',
  },
];

describe('TablaTurnos', () => {
  it('muestra un mensaje cuando no hay turnos', () => {
    render(<TablaTurnos turnos={[]} />);
    expect(screen.getByText('No hay turnos para mostrar.')).toBeInTheDocument();
  });

  it('muestra la fecha formateada y el estado en español', () => {
    render(<TablaTurnos turnos={turnos} />);
    expect(screen.getByText('28/10/2026')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('muestra la columna de paciente solo si se le pasan pacientes', () => {
    const { rerender } = render(<TablaTurnos turnos={turnos} />);
    expect(screen.queryByText('Paciente')).not.toBeInTheDocument();

    rerender(
      <TablaTurnos turnos={turnos} pacientes={{ u3: 'Pablo Paciente' }} />,
    );
    expect(screen.getByText('Pablo Paciente')).toBeInTheDocument();
  });
});
