import {
  ServerControllerTypeName,
  SignalControllerTypeName,
} from './controller';
import { TransferState } from '@angular/core';
import { isClassProvider, isFactoryProvider, Token } from '@deepkit/injector';
import { Type } from '@deepkit/type';
import { isClass } from '@deepkit/core';

import {
  AppModule,
  createModule,
  getProviderFactoryParameters,
  provideNgDependency,
  ProviderWithScope,
} from './injector';

export abstract class ControllersModule extends createModule({
  providers: [provideNgDependency(TransferState)],
  exports: [TransferState],
  forRoot: true,
}) {
  protected readonly signalControllerTypes = new Map<string, Type>();
  protected readonly serverControllerTypes = new Map<string, Type>();
  protected readonly controllerNames = new Set<string>();

  abstract clone(): ControllersModule;

  protected abstract addServerController(
    serverControllerType: Type,
    controllerName: string,
  ): void;

  protected abstract addSignalController(
    signalControllerType: Type,
    controllerName: string,
  ): void;

  override processProvider(
    _module: AppModule | undefined,
    _token: Token | undefined,
    provider: ProviderWithScope,
  ) {
    if (
      !isFactoryProvider(provider) &&
      !isClassProvider(provider) &&
      !isClass(provider)
    )
      return;

    const providerFactoryParameters = getProviderFactoryParameters(provider);

    const parametersWithSignalController = providerFactoryParameters.filter(
      parameter => parameter.type.typeName === SignalControllerTypeName,
    );
    for (const parameter of parametersWithSignalController) {
      const controllerName = parameter.type.typeArguments![0].typeName!;
      if (!this.signalControllerTypes.has(controllerName)) {
        this.signalControllerTypes.set(controllerName, parameter.type);
      }
      if (!this.controllerNames.has(controllerName)) {
        this.controllerNames.add(controllerName);
      }
    }

    const parametersWithServerController = providerFactoryParameters.filter(
      parameter => parameter.type.typeName === ServerControllerTypeName,
    );
    for (const parameter of parametersWithServerController) {
      const controllerName = parameter.type.typeArguments![0].typeName!;
      if (!this.serverControllerTypes.has(controllerName)) {
        this.serverControllerTypes.set(controllerName, parameter.type);
      }
      if (!this.controllerNames.has(controllerName)) {
        this.controllerNames.add(controllerName);
      }
    }
  }

  override postProcess() {
    for (const controllerName of this.controllerNames) {
      const signalControllerType =
        this.signalControllerTypes.get(controllerName);
      if (signalControllerType) {
        this.addSignalController(signalControllerType, controllerName);
      }

      const serverControllerType =
        this.serverControllerTypes.get(controllerName);
      if (serverControllerType) {
        this.addServerController(serverControllerType, controllerName);
      }
    }
  }
}
