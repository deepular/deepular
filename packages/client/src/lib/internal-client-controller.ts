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
import { ApplicationStable } from './application-stable';

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
    private readonly appStable: ApplicationStable,
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

  useTransferState(
    methodName: string,
    args: readonly unknown[],
    consumerIdx: ControllerConsumerIndex,
  ): boolean {
    return !this.appStable.value && this.hasTransferState(methodName, args, consumerIdx);
  }

  hasTransferState(
    methodName: string,
    args: readonly unknown[],
    consumerIdx: ControllerConsumerIndex,
  ): boolean {
    const transferStateKey = makeDeserializableControllerMethodStateKey(
      this.controllerName,
      methodName,
      args,
      consumerIdx,
    );
    return this.transferState.hasKey(transferStateKey);
  }

  getTransferState<T>(
    methodName: string,
    args: readonly unknown[],
    consumerIdx: ControllerConsumerIndex,
  ): T {
    const transferStateKey = makeDeserializableControllerMethodStateKey(
      this.controllerName,
      methodName,
      args,
      consumerIdx,
    );
    const transferStateValue = this.transferState.get(transferStateKey, null);

    if (!transferStateValue) {
      throw new TransferStateMissingForClientControllerMethodException(
        this,
        methodName,
      );
    }

    const bson = new Uint8Array(transferStateValue.data);
    const deserialize = this.deserializers.get(methodName) as NgKitDeserializer<T>;
    const { data } = deserialize(bson);

    return data;
  }
}
