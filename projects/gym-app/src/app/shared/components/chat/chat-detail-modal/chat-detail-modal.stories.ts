import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { ChatDetailModalComponent } from './chat-detail-modal.component';
import { signal } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { MensajeService } from '../../../../core/services/mensaje.service';
import { ModalController } from '@ionic/angular/standalone';
import { Mensaje, Rol, TipoMensaje, User } from 'gym-library';

const mockMensajes: Mensaje[] = [
  {
    id: '1', remitenteId: 'u1', remitenteTipo: Rol.ENTRENADO, destinatarioId: 'u2', destinatarioTipo: Rol.ENTRENADO,
    contenido: 'Hola, ¿cómo estás?', tipo: TipoMensaje.TEXTO, leido: true, entregado: true, fechaEnvio: new Date(Date.now() - 3600000)
  },
  {
    id: '2', remitenteId: 'u2', remitenteTipo: Rol.ENTRENADO, destinatarioId: 'u1', destinatarioTipo: Rol.ENTRENADO,
    contenido: 'Todo bien, listo para entrenar.', tipo: TipoMensaje.TEXTO, leido: true, entregado: true, fechaEnvio: new Date(Date.now() - 1800000)
  },
  {
    id: '3', remitenteId: 'u1', remitenteTipo: Rol.ENTRENADO, destinatarioId: 'u2', destinatarioTipo: Rol.ENTRENADO,
    contenido: 'Perfecto, nos vemos en 10.', tipo: TipoMensaje.TEXTO, leido: false, entregado: true, fechaEnvio: new Date(Date.now() - 60000)
  }
];

const mockAuth = {
  currentUser: signal<Partial<User>>({ uid: 'u1', role: Rol.ENTRENADO })
};

const mockUserService = {
  getUserByUid: (uid: string) => signal<Partial<User>>({ uid: 'u2', nombre: 'Juan Pérez' })
};

const mockMensajeService = {
  mensajes: signal<Mensaje[]>(mockMensajes),
  marcarComoLeido: async () => {},
  save: async () => {}
};

const meta: Meta<ChatDetailModalComponent> = {
  title: 'Shared/Components/ChatDetailModal',
  component: ChatDetailModalComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [
        { provide: AuthService, useValue: mockAuth },
        { provide: UserService, useValue: mockUserService },
        { provide: MensajeService, useValue: mockMensajeService },
        { provide: ModalController, useValue: { dismiss: () => {} } }
      ]
    }),
    componentWrapperDecorator((story) => `<div style="height: 600px; width: 400px; border: 1px solid #ccc; position: relative; overflow: hidden;">${story}</div>`)
  ]
};

export default meta;
type Story = StoryObj<ChatDetailModalComponent>;

export const Default: Story = {
  args: {
    otherUserId: 'u2'
  }
};
