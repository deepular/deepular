import { inject, InjectionToken, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ControllerDefinition } from '@deepkit/rpc';

type InferObservable<T> = T extends Observable<infer U> ? U : T;

type SignalifyFn<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => Signal<InferObservable<Awaited<ReturnType<T>>>>;

export type RemoteController<T> = {
  [P in keyof T]: T[P] extends (...args: any[]) => any
    ? SignalifyFn<T[P]>
    : never;
};

export class NgKitControllerDefinition<T> extends ControllerDefinition<T> {
  readonly _token = new InjectionToken<RemoteController<T>>(this.path);

  inject(): RemoteController<T> {
    return inject(this._token);
  }
}
