import { Signal } from '@angular/core';
import { Observable } from 'rxjs';

type InferObservable<T> = T extends Observable<infer U> ? U : T;

type SignalifyFn<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => Signal<InferObservable<Awaited<ReturnType<T>>>>;

export type ServerController<T> = {
  [P in keyof T]: T[P] extends (...args: any[]) => any
    ? SignalifyFn<T[P]>
    : never;
};
