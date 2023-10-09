import { TransferState } from '@angular/core';
import { deserializeType, ReflectionClass } from '@deepkit/type';
import {
  getNgKitDeserializer,
  makeDeserializableStateKey,
  makeSerializedClassTypeStateKey,
  NgKitDeserializer,
  unwrapType,
} from '@ngkit/core';

import { TransferStateMissingForClientControllerMethodError } from './errors';

export class ClientController {
  readonly deserializers: ReadonlyMap<string, NgKitDeserializer<unknown>>;

  readonly methodNames: readonly string[];

  constructor(
    private readonly controllerName: string,
    private readonly transferState: TransferState,
  ) {
    const serializedClassType = this.transferState.get(
      makeSerializedClassTypeStateKey(this.controllerName),
      null,
    );
    if (!serializedClassType) {
      throw new Error(
        `Missing serialized class type for ${this.controllerName}`,
      );
    }
    const controllerType = deserializeType(serializedClassType);

    const controllerReflectionClass = ReflectionClass.from(controllerType);

    this.deserializers = new Map<string, NgKitDeserializer<unknown>>(
      controllerReflectionClass.getMethods().map(method => {
        const returnType = unwrapType(method.getReturnType());
        const deserialize = getNgKitDeserializer(returnType);
        return [method.name, deserialize];
      }),
    );

    this.methodNames = [...this.deserializers.keys()];
  }

  getTransferState<T>(methodName: string, args: readonly unknown[]): T | null {
    const transferStateKey = makeDeserializableStateKey(
      this.controllerName,
      methodName,
      args,
    );

    if (!this.transferState.hasKey(transferStateKey)) {
      throw new TransferStateMissingForClientControllerMethodError(
        this,
        methodName,
      );
    }

    const transferStateValue = this.transferState.get(transferStateKey, null);
    if (!transferStateValue) {
      throw new Error('Something went wrong');
    }
    this.transferState.remove(transferStateKey);

    const bson = new Uint8Array(transferStateValue.data);
    const deserialize = this.deserializers.get(methodName)!;
    const { data } = deserialize(bson);

    return data as T;
  }
}
