import type { Meta, StoryObj } from '@storybook/angular';
import {
  applicationConfig,
  componentWrapperDecorator,
} from '@storybook/angular';
import { signal } from '@angular/core';
import { Plan, User, Rol } from 'gym-library';
import { AuthService } from '../../../core/services/auth.service';
import {
  BackgroundComponent,
  BG_IMAGES,
} from './background.component';

const meta: Meta<BackgroundComponent> = {
  title: 'Componentes Compartidos/background',
  component: BackgroundComponent,
  tags: ['autodocs'],
  argTypes: {
    image: {
      control: 'text',
      description:
        'Override de imagen. Si se omite, se resuelve según el rol del usuario.',
    },
    isPremium: {
      control: 'boolean',
      description:
        'Override de premium. Si se omite, se lee del AuthService.',
    },
  },
  decorators: [
    componentWrapperDecorator(
      (story) => `<ion-app class="relative h-[400px] overflow-hidden">${story}</ion-app>`
    ),
  ],
};

export default meta;
type Story = StoryObj<BackgroundComponent>;

const mockAuth = (
  role: Rol,
  plan: Plan,
): { providers: Array<{ provide: typeof AuthService; useValue: Partial<AuthService> }> } => ({
  providers: [
    {
      provide: AuthService,
      useValue: { currentUser: signal<User>({ role, plan } as User) },
    },
  ],
});

/** Entrenado en plan FREE → siempre gradiente. */
export const Free: Story = {
  decorators: [applicationConfig(mockAuth(Rol.ENTRENADO, Plan.FREE))],
};

/** Entrenado en plan PREMIUM → muestra test-gym-1.jpg. */
export const Premium: Story = {
  decorators: [applicationConfig(mockAuth(Rol.ENTRENADO, Plan.PREMIUM))],
};

/** Entrenador premium → trainer-bg.png. */
export const TrainerPremium: Story = {
  decorators: [applicationConfig(mockAuth(Rol.ENTRENADOR, Plan.PREMIUM))],
};

/** Gimnasio premium → gym-social-bg.png. */
export const GymPremium: Story = {
  decorators: [applicationConfig(mockAuth(Rol.GIMNASIO, Plan.PREMIUM))],
};

/** Personal trainer (mismo fondo que entrenador). */
export const PersonalTrainerPremium: Story = {
  decorators: [applicationConfig(mockAuth(Rol.PERSONAL_TRAINER, Plan.PREMIUM))],
};

/** Override explícito: premium false anula el del AuthService. */
export const OverrideIsPremium: Story = {
  args: { isPremium: false },
  decorators: [applicationConfig(mockAuth(Rol.ENTRENADO, Plan.PREMIUM))],
};

/** Override explícito: image custom ignora el del rol. */
export const OverrideImage: Story = {
  args: { image: 'assets/images/bg.jpg' },
  decorators: [applicationConfig(mockAuth(Rol.ENTRENADO, Plan.PREMIUM))],
};

/** Sin usuario autenticado: solo gradiente. */
export const NoUser: Story = {
  decorators: [
    applicationConfig({
      providers: [
        { provide: AuthService, useValue: { currentUser: signal<User | null>(null) } },
      ],
    }),
  ],
};

/** Mapa de URLs disponible para inspección. */
export const ImageMap = {
  render: () => ({
    template: `
      <pre style="font-family: monospace; font-size: 12px; color: #fff; padding: 12px;">
{{ imageMap | json }}
      </pre>
    `,
    moduleMetadata: { imports: [] },
  }),
  // @ts-expect-error - storybook control helper
  imageMap: BG_IMAGES,
};
