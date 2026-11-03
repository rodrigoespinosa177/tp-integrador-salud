import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FormularioTurno from './FormularioTurno';
import { obtenerHorariosOcupados } from '../api/turnos.api';

vi.mock('../api/turnos.api', () => ({
  obtenerHorariosOcupados: vi.fn(),
}));

beforeEach(() => {
  obtenerHorariosOcupados.mockResolvedValue([]);
});

// Completa fecha, hora y motivo como lo haría el usuario
async function completar(fecha, hora = '10:30') {
  fireEvent.change(screen.getByLabelText('Fecha'), {
    target: { value: fecha },
  });
  await screen.findByRole('option', { name: hora });
  fireEvent.change(screen.getByLabelText('Hora'), {
    target: { value: hora },
  });
  fireEvent.change(screen.getByLabelText('Motivo'), {
    target: { value: 'Control' },
  });
}

describe('FormularioTurno', () => {
  it('envía los datos cargados al guardar', async () => {
    const onGuardar = vi.fn().mockResolvedValue();
    render(<FormularioTurno onGuardar={onGuardar} />);

    await completar('2099-12-31');
    fireEvent.click(screen.getByRole('button', { name: 'Sacar turno' }));

    await waitFor(() =>
      expect(onGuardar).toHaveBeenCalledWith({
        date: '2099-12-31',
        hour: '10:30',
        motive: 'Control',
      }),
    );
  });

  it('ofrece franjas de 08:00 a 17:00 cada 30 minutos y deshabilita las ocupadas', async () => {
    obtenerHorariosOcupados.mockResolvedValue(['09:30']);
    render(<FormularioTurno onGuardar={vi.fn()} />);

    // Sin fecha, el desplegable está bloqueado
    const hora = screen.getByLabelText('Hora');
    expect(hora).toBeDisabled();
    expect(
      screen.getByRole('option', { name: 'Elegí primero una fecha' }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Fecha'), {
      target: { value: '2099-12-31' },
    });

    expect(await screen.findByRole('option', { name: '08:00' })).toBeEnabled();
    expect(screen.getByLabelText('Hora')).toBeEnabled();
    expect(screen.getByRole('option', { name: '17:00' })).toBeEnabled();
    expect(screen.queryByRole('option', { name: '17:30' })).toBeNull();
    expect(
      screen.getByRole('option', { name: '09:30 (ocupado)' }),
    ).toBeDisabled();
    expect(obtenerHorariosOcupados).toHaveBeenCalledWith('2099-12-31');
  });

  it('no deja guardar sin elegir un horario', async () => {
    const onGuardar = vi.fn();
    render(<FormularioTurno onGuardar={onGuardar} />);

    fireEvent.change(screen.getByLabelText('Fecha'), {
      target: { value: '2099-12-31' },
    });
    fireEvent.change(screen.getByLabelText('Motivo'), {
      target: { value: 'Control' },
    });
    fireEvent.submit(
      screen.getByRole('button', { name: 'Sacar turno' }).closest('form'),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Elegí un horario',
    );
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it('al cambiar de fecha se vuelve a elegir el horario', async () => {
    render(<FormularioTurno onGuardar={vi.fn()} />);

    await completar('2099-12-31');
    expect(screen.getByLabelText('Hora')).toHaveValue('10:30');

    fireEvent.change(screen.getByLabelText('Fecha'), {
      target: { value: '2099-12-30' },
    });
    await waitFor(() => expect(screen.getByLabelText('Hora')).toBeEnabled());
    expect(screen.getByLabelText('Hora')).toHaveValue('');
  });

  it('muestra un error y no guarda si la fecha es anterior a hoy', async () => {
    const onGuardar = vi.fn();
    render(<FormularioTurno onGuardar={onGuardar} />);

    await completar('2000-01-01');
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
    await completar('2099-12-31');
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

  it('el sobreturno solo se ofrece al admin y habilita los horarios ocupados', async () => {
    obtenerHorariosOcupados.mockResolvedValue(['09:30']);
    const onGuardar = vi.fn().mockResolvedValue();
    const { unmount } = render(<FormularioTurno onGuardar={vi.fn()} />);
    expect(screen.queryByLabelText(/Sobreturno/)).not.toBeInTheDocument();
    unmount();

    render(
      <FormularioTurno
        onGuardar={onGuardar}
        listaPacientes={[{ _id: 'u3', first_name: 'Pablo', last_name: 'P' }]}
        permitirSobreturno
      />,
    );
    fireEvent.change(screen.getByLabelText('Paciente'), {
      target: { value: 'u3' },
    });
    fireEvent.change(screen.getByLabelText('Fecha'), {
      target: { value: '2099-12-31' },
    });
    fireEvent.change(screen.getByLabelText('Motivo'), {
      target: { value: 'Urgencia' },
    });

    const ocupada = await screen.findByRole('option', {
      name: '09:30 (ocupado)',
    });
    expect(ocupada).toBeDisabled();

    fireEvent.click(screen.getByLabelText(/Sobreturno/));
    expect(ocupada).toBeEnabled();
    fireEvent.change(screen.getByLabelText('Hora'), {
      target: { value: '09:30' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sacar turno' }));

    await waitFor(() =>
      expect(onGuardar).toHaveBeenCalledWith({
        date: '2099-12-31',
        hour: '09:30',
        motive: 'Urgencia',
        patient_id: 'u3',
        is_overbooking: true,
      }),
    );
  });
});
