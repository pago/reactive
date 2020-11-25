import { useRef } from 'react';
import { Meta, Story } from '@storybook/react';
import { useRefValue, ref } from '../src';

interface Props {
  step: number;
  count: any; // TODO: Need a way to properly export & import types
}

const Counter = function Counter(props: Props) {
  const count = useRefValue(props.count);

  return (
    <div>
      <div>Count: {count}</div>
      <div>
        <button
          type="button"
          onClick={() => (props.count.current += props.step)}
        >
          Increment
        </button>
        <button
          type="button"
          onClick={() => (props.count.current -= props.step)}
        >
          Decrement
        </button>
      </div>
    </div>
  );
};

function App(props: Props) {
  const count = useRef(ref(0)); // little bit of inception here... :)
  return <Counter count={count.current} step={props.step} />;
}

const meta: Meta<Props> = {
  title: 'NonReactiveCounter',
  component: App,
  parameters: {
    controls: { expanded: true },
  },
};

export default meta;

const Template: Story<Props> = args => <App {...args} />;

// By passing using the Args format for exported stories, you can control the props for a component for reuse in a test
// https://storybook.js.org/docs/react/workflows/unit-testing
export const Default = Template.bind({});

Default.args = {
  step: 1,
};
