import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { ProgresoHistorialDetalleComponent } from './progreso-historial-detalle.component';
import { mockProviders } from '../../../social/testing-mocks';
import { FirebaseStorageService } from '../../../../core/services/firebase-storage.service';
import { SocialShareService } from '../../../../core/services/social-share.service';

const mockStorageService = {
  getProgressPhotoPath: (uid: string, sesionId: string, extension: string) => `users/${uid}/progress/${sesionId}.${extension}`,
  uploadFile: (path: string, blob: Blob) => Promise.resolve('https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=600')
};

const mockSocialShareService = {
  compartirSesionRutina: (sesion: any, text: string, callback: any) => {
    callback();
    return Promise.resolve();
  }
};

const meta: Meta<ProgresoHistorialDetalleComponent> = {
  title: 'Secciones/entrenado/rutinas/components/progreso-historial-detalle',
  component: ProgresoHistorialDetalleComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [
        ...mockProviders,
        { provide: FirebaseStorageService, useValue: mockStorageService },
        { provide: SocialShareService, useValue: mockSocialShareService }
      ]
    }),
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<ProgresoHistorialDetalleComponent>;

export const Default: Story = {
  args: {
    isOpen: true,
    sesionSeleccionada: {
      id: 'sesion-1',
      entrenadoId: 'user-partner',
      nombreUsuario: 'Juan Pérez',
      fotoUsuario: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      fechaInicio: new Date(),
      duracion: 3600,
      completada: true,
      likes: ['user-current'],
      fechaCompartida: new Date(),
      fotoProgreso: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=600',
      rutinaResumen: {
        id: 'rut-1',
        nombre: 'Hipertrofia de Pecho',
        ejercicios: [
          { id: 'ej-1', nombre: 'Press de Banca', series: 4, repeticiones: 12 },
          { id: 'ej-2', nombre: 'Aperturas con Mancuernas', series: 4, repeticiones: 12 }
        ]
      }
    } as any
  }
};
