import { inject, InjectionToken, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ControllerDefinition } from '@deepkit/rpc';
import { ClassType } from '@deepkit/core';
import { ReceiveType, resolveReceiveType, Type } from '@deepkit/type';

type InferObservable<T> = T extends Observable<infer U> ? U : T;

type SignalifyFn<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => Signal<InferObservable<Awaited<ReturnType<T>>>>;

export type ServerController<T> = {
  [P in keyof T]: T[P] extends (...args: any[]) => any
    ? SignalifyFn<T[P]>
    : never;
};

export function NgKitControllerSymbol<T>(
  path: string,
  entities: ClassType[] = [],
  type?: ReceiveType<T>,
): NgKitControllerDefinition<T> {
  // FIXME: No type information received. Is deepkit/type correctly installed?
  type = resolveReceiveType(type);
  return new NgKitControllerDefinition(path, entities, type);
}

export class NgKitControllerDefinition<T> extends ControllerDefinition<T> {
  readonly _token = new InjectionToken<ServerController<T>>(this.path);
  readonly _type: Type;

  constructor(
    readonly path: string,
    readonly entities: ClassType[] = [],
    type?: Type,
  ) {
    if (!type) {
      throw new Error(
        'Use NgKitControllerSymbol() instead of new NgKitControllerDefinition()',
      );
    }
    super(path, entities);
    this._type = type;
  }

  inject(): ServerController<T> {
    return inject(this._token);
  }
}
