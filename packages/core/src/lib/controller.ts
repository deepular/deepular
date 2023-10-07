import { Signal } from '@angular/core';
import { Observable } from 'rxjs';

type InferObservable<T> = T extends Observable<infer U> ? U : T;

export interface ServerControllerMethod<T, A extends unknown[]> {
  readonly value: Signal<T>;
  readonly update: (value: T) => void;
  readonly loading: Signal<boolean>;
  readonly refetch: ((...args: A) => Promise<T>) | (() => Promise<T>);
}

type SignalifyFn<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => ServerControllerMethod<
  Signal<InferObservable<Awaited<ReturnType<T>>>>,
  Parameters<T>
>;

export type ServerController<T> = {
  [P in keyof T]: T[P] extends (...args: any[]) => any
    ? SignalifyFn<T[P]>
    : never;
};
