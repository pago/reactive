import React from 'react';
import { Meta, Story } from '@storybook/react';

import { wrap, ref } from '../src';

interface Props {
  step: number;
}

const Counter = wrap(function Counter(props: Props) {
  const count = ref(0);

  return () => (
    <div>
      <div>Count: {count.current}</div>
      <div>
        <button type="button" onClick={() => (count.current += props.step)}>
          Increment
        </button>
        <button type="button" onClick={() => (count.current -= props.step)}>
          Decrement
        </button>
      </div>
    </div>
  );
});

const meta: Meta<Props> = {
  title: 'Counter',
  component: Counter,
  parameters: {
    controls: { expanded: true },
  },
};

export default meta;

const Template: Story<Props> = args => <Counter {...args} />;

// By passing using the Args format for exported stories, you can control the props for a component for reuse in a test
// https://storybook.js.org/docs/react/workflows/unit-testing
export const Default = Template.bind({});

Default.args = {
  step: 1,
};
