/** @jsxImportSource ../src */
import { Meta, Story } from '@storybook/react';
import {r, ref} from '../src';

interface Props {
  step: number;
}

function useCounterViewModel(props: Props) {
  const count = ref(0);

  return {
    get count() {
      return count.current;
    },
    increment() {
      count.current += props.step;
    },
    decrement() {
      count.current -= props.step;
    },
  };
}

function Counter(props: Props) {
  const counterModel = useCounterViewModel(props);

  return r(() => (
    <div>
      <div>Count: {counterModel.count}</div>
      <div>
        <button type="button" onClick={counterModel.increment}>
          Increment
        </button>
        <button type="button" onClick={counterModel.decrement}>
          Decrement
        </button>
      </div>
    </div>
  ));
}

const meta: Meta<Props> = {
  title: 'Advanced Counter',
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
