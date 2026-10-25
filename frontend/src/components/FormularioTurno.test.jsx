import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FormularioTurno from './FormularioTurno';

// Completa fecha, hora y motivo como lo haría el usuario
function completar(fecha) {
  fireEvent.change(screen.getByLabelText('Fecha'), {
    target: { value: fecha },
  });
  fireEvent.change(screen.getByLabelText('Hora'), {
    target: { value: '10:30' },
  });
  fireEvent.change(screen.getByLabelText('Motivo'), {
    target: { value: 'Control' },
  });
}

describe('FormularioTurno', () => {
  it('envía los datos cargados al guardar', async () => {
    const onGuardar = vi.fn().mockResolvedValue();
    render(<FormularioTurno onGuardar={onGuardar} />);

    completar('2099-12-31');
    fireEvent.click(screen.getByRole('button', { name: 'Sacar turno' }));

    await waitFor(() =>
      expect(onGuardar).toHaveBeenCalledWith({
        date: '2099-12-31',
        hour: '10:30',
        motive: 'Control',
      }),
    );
  });

  it('muestra un error y no guarda si la fecha es anterior a hoy', async () => {
    const onGuardar = vi.fn();
    render(<FormularioTurno onGuardar={onGuardar} />);

    completar('2000-01-01');
    // submit directo: saltea el bloqueo del navegador para probar nuestra validación
    fireEvent.submit(
      screen.getByRole('button', { name: 'Sacar turno' }).closest('form'),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La fecha no puede ser anterior a hoy',
    );
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it('para el paciente no muestra los selectores de paciente ni de estado', () => {
    render(<FormularioTurno onGuardar={vi.fn()} />);
    expect(screen.queryByLabelText('Paciente')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Estado')).not.toBeInTheDocument();
  });

  it('en modo admin envía también el paciente y el estado', async () => {
    const onGuardar = vi.fn().mockResolvedValue();
    const listaPacientes = [
      { _id: 'u3', first_name: 'Pablo', last_name: 'Paciente' },
    ];
    render(
      <FormularioTurno
        onGuardar={onGuardar}
        listaPacientes={listaPacientes}
        permitirEstado
      />,
    );

    fireEvent.change(screen.getByLabelText('Paciente'), {
      target: { value: 'u3' },
    });
    completar('2099-12-31');
    fireEvent.change(screen.getByLabelText('Estado'), {
      target: { value: 'confirmed' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sacar turno' }));

    await waitFor(() =>
      expect(onGuardar).toHaveBeenCalledWith({
        date: '2099-12-31',
        hour: '10:30',
        motive: 'Control',
        patient_id: 'u3',
        status: 'confirmed',
      }),
    );
  });
});
