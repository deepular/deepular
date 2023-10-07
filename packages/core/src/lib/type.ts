import { Observable } from 'rxjs';
import { Type, ReflectionKind } from '@deepkit/type';

export function unwrapType(type: Type): Type {
  switch (type.kind) {
    case ReflectionKind.promise:
      return type.type;

    case ReflectionKind.class:
      // TODO: Observable
      // if (type.typeName === Observable.name) return type;

      return type;

    default:
      return type;
  }
}
