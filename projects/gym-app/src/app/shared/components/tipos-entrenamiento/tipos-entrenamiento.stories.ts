import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { TiposEntrenamientoComponent } from './tipos-entrenamiento';
import { AuthService } from '../../../core/services/auth.service';
import { TipoEntrenamientoService } from '../../../core/services/tipo-entrenamiento.service';
import { signal } from '@angular/core';

const mockAuthService = {
  currentUser: signal({ uid: 'test-user', gimnasioId: 'gym1' })
};

const mockTipoEntrenamientoService = {
  tipos: signal([
    { id: '1', nombre: 'Funcional', gimnasioId: 'gym1' },
    { id: '2', nombre: 'CrossFit', gimnasioId: 'gym1' },
  ]),
  initializeListener: () => {}
};

const meta: Meta<TiposEntrenamientoComponent> = {
  title: 'Shared/Components/Tipos Entrenamiento Manager',
  component: TiposEntrenamientoComponent,
  decorators: [
    moduleMetadata({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: TipoEntrenamientoService, useValue: mockTipoEntrenamientoService }
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj<TiposEntrenamientoComponent>;

export const Default: Story = {
  args: {},
};
