import { h, render } from 'preact';
import 'preact/devtools';
import '@pago/reactive/preact';
import App from './App.js';
import './index.css';

render(<App />, document.getElementById('root'));
