import { Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { RemoteController } from '@deepkit/rpc';

type InferObservable<T> = T extends Observable<infer U> ? U : T;

export interface SignalControllerMethod<T, A extends unknown[]> {
  readonly value: Signal<T>;
  readonly update: (value: T) => void;
  readonly loading: Signal<boolean>;
  readonly refetch: ((...args: A) => Promise<T>) | (() => Promise<T>);
}

type SignalifyFn<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => SignalControllerMethod<
  Signal<InferObservable<Awaited<ReturnType<T>>>>,
  Parameters<T>
>;

export type SignalController<T> = {
  [P in keyof T]: T[P] extends (...args: any[]) => any
    ? SignalifyFn<T[P]>
    : never;
};

export type ServerController<T> = RemoteController<T>;

export const SignalControllerTypeName = 'SignalController';

export const ServerControllerTypeName = 'ServerController';

export type ControllerTypeName = typeof SignalControllerTypeName | typeof ServerControllerTypeName;

export const CONTROLLER_TYPE_NAMES = [
  SignalControllerTypeName,
  ServerControllerTypeName,
] as const;

export const isControllerTypeName = (name: string): name is ControllerTypeName =>
  CONTROLLER_TYPE_NAMES.includes(name as never);
