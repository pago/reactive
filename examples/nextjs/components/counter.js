import { ref } from '@pago/reactive';

export function Counter() {
  const count = ref(0);

  return () => (
    <div>
      <p>Count: {count.current}</p>
      <div>
        <button type="button" onClick={() => count.current++}>
          Increment
        </button>
        <button type="button" onClick={() => count.current--}>
          Decrement
        </button>
      </div>
    </div>
  );
}
