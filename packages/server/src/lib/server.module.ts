import { AppModule, ControllerConfig, createModule } from '@deepkit/app';
import { InjectorContext } from '@deepkit/injector';
import {
  APP_INITIALIZER,
  ApplicationConfig,
  Provider,
  TransferState,
} from '@angular/core';
import {
  CORE_CONFIG,
  makeSerializedClassTypeStateKey,
  mergeApplicationConfig,
} from '@ngkit/core';
import { provideServerRendering } from '@angular/platform-server';
import { reflect, SerializedTypes, serializeType } from '@deepkit/type';
import { rpcClass } from '@deepkit/rpc';

import { ServerConfig } from './config';
import { ServerListener } from './server-listener';
import { RpcController } from './types';

export class ServerModule extends createModule({
  config: ServerConfig,
  listeners: [ServerListener],
  forRoot: true,
}) {
  readonly rpcControllers = new Set<RpcController>();
  readonly rpcControllerSerializedClassTypes = new Map<
    string,
    SerializedTypes
  >();

  override postProcess(): void {
    this.rpcControllers.forEach(({ controller }) => {
      const controllerType = reflect(controller);
      this.rpcControllerSerializedClassTypes.set(
        controller.name,
        serializeType(controllerType),
      );
    });

    const ngAppInit: Provider = {
      provide: APP_INITIALIZER,
      deps: [TransferState],
      multi: true,
      useFactory: (transferState: TransferState) => {
        return () => {
          this.rpcControllerSerializedClassTypes.forEach(
            (serializedClassType, name) => {
              transferState.set(
                makeSerializedClassTypeStateKey(name),
                serializedClassType,
              );
            },
          );
        };
      },
    };

    const serverConfig: ApplicationConfig = {
      providers: [provideServerRendering(), ngAppInit],
    };

    const appConfig = mergeApplicationConfig(
      CORE_CONFIG,
      serverConfig,
      this.config.app,
    );
    this.configure({ app: appConfig });
  }

  override processController(
    module: AppModule<never>,
    { controller }: ControllerConfig,
  ) {
    if (!controller) return;

    const metadata = rpcClass._fetch(controller);
    if (!metadata) return;

    const injector = new InjectorContext(module).createChildScope('rpc');

    this.rpcControllers.add({
      controller,
      metadata,
      injector,
    });
  }
}
