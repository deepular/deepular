import { Signal } from '@angular/core';
import { Observable } from 'rxjs';

type ObservableType<T> = T extends Observable<infer U> ? U : T;

// TODO: infer observable
type SignalifyFn<T extends ((...args: any[]) => any)> = (...args: Parameters<T>) => Signal<ObservableType<Awaited<ReturnType<T>>>>;

export type RemoteController<T> = {
  [P in keyof T]: T[P] extends (...args: any[]) => any ? SignalifyFn<T[P]> : never
};
