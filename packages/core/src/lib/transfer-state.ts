import { getBSONDeserializer, getBSONSerializer } from "@deepkit/bson";
import { Observable } from 'rxjs';
import { inject, signal, TransferState, StateKey, makeStateKey } from '@angular/core';
import { ReflectionMethod, Type, ReflectionKind } from '@deepkit/type';

import { ngKitSerializer } from "./serializer";

export function makeNgKitStateKey<T>(instance: any, methodName: string): StateKey<T> {
  return makeStateKey(`${instance.constructor.name}#${methodName}`);
}
