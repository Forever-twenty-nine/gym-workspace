import type { Preview } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideIonicAngular } from '@ionic/angular/standalone';

const preview: Preview = {
  decorators: [
    applicationConfig({
      providers: [
        provideIonicAngular(),
      ],
    }),
  ],
  parameters: {
    viewport: {
      defaultViewport: 'mobile2',
    },
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
};

export default preview;