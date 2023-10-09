import {
  ReflectionKind,
  Type,
  TypeObjectLiteral,
  TypePropertySignature,
} from '@deepkit/type';

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

export function toSerializableDataType(type: Type): TypeObjectLiteral {
  const parent: TypeObjectLiteral = {
    kind: ReflectionKind.objectLiteral,
    types: [],
  };

  const newType: TypePropertySignature = {
    kind: ReflectionKind.propertySignature,
    name: 'data',
    parent,
    type,
  };

  parent.types = [newType];

  return parent;
}

export const getProviderNameForType = (
  typeName: string,
  ...generics: readonly string[]
): string =>
  generics.length ? `${typeName}<${generics.join(', ')}>` : typeName;
