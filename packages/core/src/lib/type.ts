import { getBSONDeserializer, getBSONSerializer } from "@deepkit/bson";
import { Observable } from 'rxjs';
import { inject, signal, TransferState, StateKey, makeStateKey } from '@angular/core';
import { ReflectionMethod, Type, ReflectionKind } from '@deepkit/type';

export function unwrapType(type: Type): Type {
  switch (type.kind) {
    case ReflectionKind.promise:
      return type.type;

    case ReflectionKind.class:
      if (type.typeName === Observable.name) return type;

      return type;

    default:
      return type;
  }
}
