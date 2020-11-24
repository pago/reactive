/** @jsxImportSource ../src */
import { createContext, useContext } from 'react';
import { Meta, Story } from '@storybook/react';
import { toRefs, r, watchEffect } from '../src';

const ColorContext = createContext({ current: 'red' });

interface Props {
  color: string;
}

function App(props: Props) {
  watchEffect(() => {
    console.log(`New color: "${props.color}"`);
  });
  const { color } = toRefs(props);
  return r(() => (
    <div>
      <h1>"Random" message of the day...</h1>
      <ColorContext.Provider value={color}>
        <Text />
      </ColorContext.Provider>
    </div>
  ));
}

function Text() {
  const color = useContext(ColorContext);
  return r(() => <p style={{ color: color.current }}>Hello World!</p>);
}

const meta: Meta<Props> = {
  title: 'Dynamic Context',
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
  color: 'blue',
};
