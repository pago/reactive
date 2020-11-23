/** @jsxImportSource ../src */

import React, { createContext } from 'react';
import { Meta, Story } from '@storybook/react';

import { observe, inject, r } from '../src';

const ColorContext = createContext('red');

interface Props {
  color: string;
}

function App(props: Props) {
  observe(() => {
    console.log(`New color: "${props.color}"`);
  });
  return r(() => (
    <div>
      <h1>Current color is "{props.color}"</h1>
      <ColorContext.Provider value={props.color}>
        <Text />
      </ColorContext.Provider>
    </div>
  ));
}

function Text() {
  const color = inject(ColorContext);
  return r(() => <p style={{ color: color.current }}>Hello World!</p>);
}

const meta: Meta<Props> = {
  title: 'Static Context',
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
