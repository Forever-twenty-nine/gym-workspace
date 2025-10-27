// Mock for @angular/core
export const Injectable = () => (target: any) => target;
export const Component = () => (target: any) => target;

const createSignal = (initial: any) => {
  let value = initial;
  const sig = () => value;
  sig.set = (newValue: any) => { value = newValue; };
  sig.update = (fn: any) => { value = fn(value); };
  sig.asReadonly = () => sig;
  return sig;
};

export const signal = createSignal;
export const computed = (fn: any) => {
  const sig = createSignal(fn());
  return sig.asReadonly();
};

// Mock for input() and output()
export const input = Object.assign(
  (defaultValue?: any) => signal(defaultValue),
  {
    required: () => signal(undefined),
  }
);

export const output = () => {
  const subscribers: Array<(value: any) => void> = [];
  return {
    emit: (value: any) => subscribers.forEach(fn => fn(value)),
    subscribe: (fn: (value: any) => void) => {
      subscribers.push(fn);
      return { unsubscribe: () => {
        const index = subscribers.indexOf(fn);
        if (index > -1) subscribers.splice(index, 1);
      }};
    },
  };
};

export class InjectionToken {
  constructor(public description: string) {}
}

export const inject = (() => {}) as any;

export const ChangeDetectionStrategy = {
  OnPush: 0,
  Default: 1,
};

export type Signal = any;
export type WritableSignal = any;