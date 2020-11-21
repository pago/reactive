import React from 'react';
import { Meta, Story } from '@storybook/react';

import { wrap, ref, observe } from '../src';

interface Props {
  step: number;
  delay: number;
}

const Timer = wrap(function Timer(props: Props) {
  const count = ref(0);

  observe(function incrementEffect() {
    const timer = setInterval(() => {
      // update is needed because we are reading from and writing to count
      count.update(current => current + props.step);
    }, props.delay);

    return () => clearInterval(timer);
  });

  return () => (
    <div>
      <div>Count: {count.current}</div>
    </div>
  );
});

const meta: Meta<Props> = {
  title: 'Timer',
  component: Timer,
  parameters: {
    controls: { expanded: true },
  },
};

export default meta;

const Template: Story<Props> = args => <Timer {...args} />;

// By passing using the Args format for exported stories, you can control the props for a component for reuse in a test
// https://storybook.js.org/docs/react/workflows/unit-testing
export const Default = Template.bind({});

Default.args = {
  step: 1,
  delay: 1000,
};
