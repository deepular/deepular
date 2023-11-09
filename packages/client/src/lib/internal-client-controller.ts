import { TransferState } from '@angular/core';
import { deserializeType, ReflectionClass } from '@deepkit/type';
import {
  ControllerConsumerIndex,
  getNgKitDeserializer,
  getProviderNameForType,
  makeDeserializableControllerMethodStateKey,
  makeSerializedClassTypeStateKey,
  NgKitDeserializer,
  unwrapType,
} from '@ngkit/core';

import { TransferStateMissingForClientControllerMethodException } from './errors';

export class InternalClientController {
  static getProviderToken(controllerName: string): string {
    return getProviderNameForType(
      InternalClientController.name,
      controllerName,
    );
  }

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

  getTransferState<T>(
    methodName: string,
    args: readonly unknown[],
    consumerIdx: ControllerConsumerIndex,
  ): T | null {
    const transferStateKey = makeDeserializableControllerMethodStateKey(
      this.controllerName,
      methodName,
      args,
      consumerIdx,
    );

    if (!this.transferState.hasKey(transferStateKey)) {
      throw new TransferStateMissingForClientControllerMethodException(
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
