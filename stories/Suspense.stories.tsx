/** @jsxImportSource ../src */

import React, { Suspense } from 'react';
import { Meta, Story } from '@storybook/react';

import {observe, r, ref} from '../src';

interface Props {}

function getSuspendedValue() {
  //   const value = ref(0);
  const { resolve, signal } = delay();
  let value: string;
  let isResolved = false;

  setTimeout(() => {
    value = 'Hello World';
    isResolved = true;
    resolve();
  }, 1000);

  return {
    get current() {
      if (!isResolved) {
        throw signal;
      }
      return value;
      //return value.current;
    },
  };
}

function App() {
  const message = getSuspendedValue();
  const announcement = ref(`"Random" message of the day...`);

  setTimeout(() => {
    announcement.current = 'Halfway there...';
  }, 500)

  return r(() => (
    <div>
      <h1>{announcement.current}</h1>
      <Suspense fallback={<p>...wait for it.</p>}>
        <Placeholder />
        <Text message={message} />
        <Placeholder />
      </Suspense>
      <Suspense fallback={<p>...wait for the loud version it.</p>}>
        <LoudText message={message} />
      </Suspense>
    </div>
  ));
}

interface TextModel {
  message: { current: string };
}
function Text({ message }: TextModel) {
  console.log('Text: Mounting component');
  observe(() => {
    console.log('Text: Starting expensive process...');
    return () => console.log('Text: Expensive process cleaned up');
  });
  return r(() => <p>{message.current}</p>);
}

function LoudText({ message }: TextModel) {
  console.log(`LoudText: Mounting component`);
  observe(() => {
    console.log('LoudText: Starting expensive process...');
    return () => console.log('LoudText: Expensive process cleaned up');
  });
  const loudMessage = message.current + '!';
  return r(() => <p>{loudMessage}</p>);
}

function Placeholder() {
  observe(function neverCleanup() {
    console.log('Placeholder: Start');
    return () => console.log(`Placeholder: Cleanup`);
  });
  return r(() => (
      <p>Just some text</p>
  ));
}

function delay<T = any>() {
  let resolve: (value?: T) => void = undefined as any;
  const signal = new Promise(res => (resolve = res));
  return { signal, resolve };
}

const meta: Meta<Props> = {
  title: 'Suspense',
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

Default.args = {};
