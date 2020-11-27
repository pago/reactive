import { h } from 'preact';
import { ref, effect } from '@pago/reactive';
import logo from './logo.png';
import './App.css';

function App() {
  // Create the count state.
  const count = ref(0);
  // Create the counter (+1 every second).
  effect(onInvalidate => {
    const timer = setInterval(() => count.current++, 1000);
    onInvalidate(() => clearInterval(timer));
  });
  // Return the App component.
  return () => (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.jsx</code> and save to reload.
        </p>
        <p>
          Page has been open for <code>{count.current}</code> seconds.
        </p>
        <p>
          <a
            className="App-link"
            href="https://preactjs.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn Preact
          </a>
        </p>
      </header>
    </div>
  );
}

export default App;
