import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { ChatListModalComponent } from './chat-list-modal.component';
import { signal } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { MensajeService } from '../../../../core/services/mensaje.service';
import { ModalController } from '@ionic/angular/standalone';
import { Mensaje, Rol, TipoMensaje, User } from 'gym-library';

const mockMensajes: Mensaje[] = [
  {
    id: '1', remitenteId: 'u2', remitenteTipo: Rol.ENTRENADO, destinatarioId: 'u1', destinatarioTipo: Rol.ENTRENADO,
    contenido: '¿Vamos al gym hoy?', tipo: TipoMensaje.TEXTO, leido: false, entregado: true, fechaEnvio: new Date()
  },
  {
    id: '2', remitenteId: 'u1', remitenteTipo: Rol.ENTRENADO, destinatarioId: 'u3', destinatarioTipo: Rol.ENTRENADO,
    contenido: 'Ya terminé la rutina.', tipo: TipoMensaje.TEXTO, leido: true, entregado: true, fechaEnvio: new Date(Date.now() - 86400000) // Ayer
  },
  {
    id: '3', remitenteId: 'u4', remitenteTipo: Rol.ENTRENADO, destinatarioId: 'u1', destinatarioTipo: Rol.ENTRENADO,
    contenido: 'Gracias por la ayuda.', tipo: TipoMensaje.TEXTO, leido: true, entregado: true, fechaEnvio: new Date(Date.now() - 86400000 * 3) // Hace 3 días
  }
];

const mockAuth = {
  currentUser: signal<Partial<User>>({ uid: 'u1', role: Rol.ENTRENADO })
};

const mockUserService = {
  getUserByUid: (uid: string) => {
    const users: Record<string, Partial<User>> = {
      'u2': { uid: 'u2', nombre: 'María González' },
      'u3': { uid: 'u3', nombre: 'Carlos Ruiz' },
      'u4': { uid: 'u4', nombre: 'Ana López' }
    };
    return signal(users[uid]);
  }
};

const mockMensajeService = {
  mensajes: signal<Mensaje[]>(mockMensajes)
};

const meta: Meta<ChatListModalComponent> = {
  title: 'Shared/Components/ChatListModal',
  component: ChatListModalComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [
        { provide: AuthService, useValue: mockAuth },
        { provide: UserService, useValue: mockUserService },
        { provide: MensajeService, useValue: mockMensajeService },
        { provide: ModalController, useValue: { dismiss: () => {}, create: () => ({ present: () => {} }) } }
      ]
    }),
    componentWrapperDecorator((story) => `<div style="height: 600px; width: 400px; border: 1px solid #ccc; position: relative; overflow: hidden;">${story}</div>`)
  ]
};

export default meta;
type Story = StoryObj<ChatListModalComponent>;

export const Default: Story = {};
