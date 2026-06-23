import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator, moduleMetadata } from '@storybook/angular';
import { EncuentroDetalleModalComponent } from './encuentro-detalle-modal.component';
import { UserService } from '../../../../core/services/user.service';
import { signal } from '@angular/core';

const mockUserService = {
  users: signal([{
      uid: 'user-current',
      nombre: 'Usuario Actual',
      photoURL: 'https://i.pravatar.cc/150?u=user-current'
    },
    {
      uid: 'user-3',
      nombre: 'Otro Usuario',
      photoURL: 'https://i.pravatar.cc/150?u=user-3'
    }])
};

const meta: Meta<EncuentroDetalleModalComponent> = {
  title: 'Secciones/entrenado/rutinas/Componentes/encuentro-detalle-modal',
  component: EncuentroDetalleModalComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      providers: [
        { provide: UserService, useValue: mockUserService }
      ]
    }),
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<EncuentroDetalleModalComponent>;

export const Default: Story = {
  args: {
    isOpen: true,
    encuentro: {
      id: 'convo-1',
      creadorId: 'user-partner',
      creadorNombre: 'Juan Pérez',
      creadorFoto: 'https://i.pravatar.cc/150?u=juanperez',
      gimnasioId: 'gym-123',
      fechaCreacion: new Date(),
      fechaEntrenamiento: new Date(Date.now() + 24 * 3600 * 1000),
      horaInicio: '18:00',
      horaFin: '19:30',
      mensaje: 'Entrenamiento de pecho a morir 💪 Traigan agua.',
      interesados: ['user-current', 'user-3'],
      activo: true,
      esOficial: false,
      esSemanal: false
    } as any
  }
};
