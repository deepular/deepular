import {
  ServerControllerTypeName,
  SignalControllerTypeName,
} from './controller';
import { TransferState } from '@angular/core';
import { isClassProvider, isFactoryProvider, Token } from '@deepkit/injector';
import { Type, TypeClass } from '@deepkit/type';
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
  protected readonly signalControllerTypes = new WeakMap<TypeClass, Type>();
  protected readonly serverControllerTypes = new WeakMap<TypeClass, Type>();
  protected readonly controllerTypes = new Set<TypeClass>();

  protected abstract addServerController(
    serverControllerType: Type,
    controllerType: TypeClass,
  ): void;

  protected abstract addSignalController(
    signalControllerType: Type,
    controllerType: TypeClass,
  ): void;

  override processProvider(
    _module: AppModule,
    _token: Token,
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
      const controllerType = parameter.type.typeArguments![0] as TypeClass;
      if (!this.signalControllerTypes.has(controllerType)) {
        this.signalControllerTypes.set(controllerType, parameter.type);
      }
      if (!this.controllerTypes.has(controllerType)) {
        this.controllerTypes.add(controllerType);
      }
    }

    const parametersWithServerController = providerFactoryParameters.filter(
      parameter => parameter.type.typeName === ServerControllerTypeName,
    );
    for (const parameter of parametersWithServerController) {
      const controllerType = parameter.type.typeArguments![0] as TypeClass;
      if (!this.serverControllerTypes.has(controllerType)) {
        this.serverControllerTypes.set(controllerType, parameter.type);
      }
      if (!this.controllerTypes.has(controllerType)) {
        this.controllerTypes.add(controllerType);
      }
    }
  }

  override postProcess() {
    for (const controllerType of this.controllerTypes) {
      const signalControllerType =
        this.signalControllerTypes.get(controllerType);
      if (signalControllerType) {
        this.addSignalController(signalControllerType, controllerType);
      }

      const serverControllerType =
        this.serverControllerTypes.get(controllerType);
      if (serverControllerType) {
        this.addServerController(serverControllerType, controllerType);
      }
    }
  }
}
