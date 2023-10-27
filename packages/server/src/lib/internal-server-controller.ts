import {
  getNgKitSerializer,
  getProviderNameForType,
  NgKitSerializer,
  unwrapType,
} from '@ngkit/core';
import { ReflectionClass, resolveRuntimeType } from '@deepkit/type';
import { BSONSerializer } from '@deepkit/bson';
import { ClassType } from '@deepkit/core';

export class InternalServerController {
  static getProviderToken(classType: ClassType): string {
    return getProviderNameForType(
      InternalServerController.name,
      classType.name,
    );
  }

  readonly serializers: ReadonlyMap<string, NgKitSerializer>;

  readonly methodNames: readonly string[];

  constructor(controllerClassType: ClassType) {
    const controllerType = resolveRuntimeType(controllerClassType);
    const controllerReflectionClass = ReflectionClass.from(controllerType);

    const controllerReflectionMethods = controllerReflectionClass.getMethods();

    this.methodNames = controllerReflectionMethods.map(method => method.name);

    this.serializers = new Map<string, BSONSerializer>(
      controllerReflectionClass.getMethods().map(method => {
        const returnType = unwrapType(method.getReturnType());
        const serialize = getNgKitSerializer(returnType);
        return [method.name, serialize];
      }),
    );
  }
}
