import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './button';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['brand', 'primary', 'secondary', 'ghost', 'destructive'],
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg', 'icon'],
    },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Brand: Story = {
  args: { variant: 'brand', children: 'Start session' },
};

export const Primary: Story = {
  args: { variant: 'primary', children: 'Continue' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Cancel' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Skip' },
};

export const Destructive: Story = {
  args: { variant: 'destructive', children: 'Delete' },
};

export const Disabled: Story = {
  args: { variant: 'primary', children: 'Disabled', disabled: true },
};

/** All five variants laid out for side-by-side scanning. */
export const VariantGallery: Story = {
  args: { children: '' },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="brand">Brand</Button>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
};

/** All four sizes against the brand variant for type-scale verification. */
export const SizeGallery: Story = {
  args: { children: '' },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="brand" size="sm">
        Small
      </Button>
      <Button variant="brand" size="default">
        Default
      </Button>
      <Button variant="brand" size="lg">
        Large
      </Button>
      <Button variant="brand" size="icon" aria-label="Icon">
        →
      </Button>
    </div>
  ),
};
