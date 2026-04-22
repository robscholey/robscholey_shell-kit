import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  // Stories live alongside their components so the IDE keeps them paired
  // and the autodiscover pattern stays scoped to public surface only.
  stories: ['../src/ui/components/**/*.stories.@(ts|tsx|mdx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  // Tailwind v4's Vite plugin handles utility-class generation. Folded into
  // Storybook's Vite config via viteFinal so the preview iframe gets the
  // same transform pipeline shell-kit consumers do.
  viteFinal: async (config) => {
    const { default: tailwindcss } = await import('@tailwindcss/vite');
    config.plugins = [...(config.plugins ?? []), tailwindcss()];
    return config;
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
};

export default config;
