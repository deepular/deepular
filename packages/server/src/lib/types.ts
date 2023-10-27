import { rpcClass } from '@deepkit/rpc';
import { ClassType } from '@deepkit/core';
import { InjectorContext } from '@deepkit/injector';

export type RpcControllerMetadata = NonNullable<
  ReturnType<(typeof rpcClass)['_fetch']>
>;

export interface RpcController {
  readonly controller: ClassType;
  readonly metadata: RpcControllerMetadata;
  readonly injector: InjectorContext;
}
