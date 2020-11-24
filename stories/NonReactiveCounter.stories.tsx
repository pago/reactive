/** @jsxImportSource ../src */
import { useState } from 'react';
import { Meta, Story } from '@storybook/react';

interface Props {
  step: number;
}

const Counter = function Counter(props: Props) {
  const [count, setCount] = useState(0);

  return (
    <div>
      <div>Count: {count}</div>
      <div>
        <button
          type="button"
          onClick={() => setCount(current => current + props.step)}
        >
          Increment
        </button>
        <button
          type="button"
          onClick={() => setCount(current => current - props.step)}
        >
          Decrement
        </button>
      </div>
    </div>
  );
};

const meta: Meta<Props> = {
  title: 'NonReactiveCounter',
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
