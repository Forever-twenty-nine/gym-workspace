import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-a11y",
    "@storybook/addon-onboarding"
  ],
  "framework": "@storybook/angular",
  "docs": {
    "autodocs": false
  }
};
export default config;