// Mock for @angular/core
export const Injectable = () => (target: any) => target;

const createSignal = (initial: any) => {
  let value = initial;
  const sig = () => value;
  sig.set = (newValue: any) => { value = newValue; };
  sig.update = (fn: any) => { value = fn(value); };
  sig.asReadonly = () => sig;
  return sig;
};

export const signal = createSignal;
export type Signal = any;
export type WritableSignal = any;