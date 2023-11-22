import { describe, test, expect, vitest, beforeEach, Mock } from 'vitest';
import { InjectorContext } from '@deepkit/injector';
import { Injector } from '@deepkit/injector';
import { typeOf } from '@deepkit/type';
import { TransferState } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ServerController, SignalController } from '@ngkit/core';
// nx-ignore-next-line
import { tick } from '@ngkit/testing';

import { ServerControllersModule } from './server-controllers.module';
import { ServerModule } from './server.module';

interface TestRpcController {
  method(arg1?: any): number;
}

describe('server controllers', () => {
  let method: Mock;
  let transferState: {
    set: Mock;
  };
  let internalServerController: {
    methodNames: readonly string[];
    serializers: ReadonlyMap<string, Mock>;
  };
  let serverControllersModule: ServerControllersModule & any;

  beforeEach(() => {
    method = vitest.fn();

    class TestRpcController {
      method = method;
    }

    const rpcController = {
      controller: TestRpcController,
      injector: InjectorContext.forProviders([TestRpcController]),
    };

    const serverModule = {
      rpcControllers: new Set([rpcController]),
    } as ServerModule

    serverControllersModule = new ServerControllersModule(serverModule);

    serverControllersModule.rpcControllers = new Map([[rpcController.controller.name, rpcController]]);

    transferState = {
      set: vitest.fn(),
    };

    serverControllersModule.addProvider({
      provide: TransferState,
      transient: true,
      useValue: transferState,
    });

    const serialize = vitest.fn().mockImplementation(args => args);

    internalServerController = {
      methodNames: ['method'],
      serializers: new Map([['method', serialize]]),
    };

    vitest
      .spyOn(serverControllersModule, 'getInternalServerController')
      .mockReturnValue(internalServerController);
  });

  describe('server controller method', () => {
    let serverController: ServerController<TestRpcController>;

    beforeEach(() => {
      const serverControllerType =
        typeOf<ServerController<TestRpcController>>();

      serverControllersModule.addServerController(
        serverControllerType,
        'TestRpcController',
      );

      const injector = Injector.fromModule(serverControllersModule);

      serverController =
        injector.get<ServerController<TestRpcController>>(serverControllerType);
    });

    test('works', async () => {
      const value = Math.random();
      method.mockResolvedValueOnce(value);

      await expect(serverController.method({ test: '' })).resolves.toEqual(
        value,
      );

      expect(transferState.set).toHaveBeenCalledWith(
        'TestRpcController#method([{"test":""}])0',
        { data: value },
      );
    });
  });

  describe('signal controller method', () => {
    let signalController: SignalController<TestRpcController>;

    beforeEach(() => {
      const signalControllerType =
        typeOf<SignalController<TestRpcController>>();

      serverControllersModule.addSignalController(
        signalControllerType,
        'TestRpcController',
      );

      const injector = Injector.fromModule(serverControllersModule);

      signalController =
        injector.get<SignalController<TestRpcController>>(signalControllerType);
    });

    test('result', async () => {
      const mockValue = Math.random();
      method.mockResolvedValueOnce(mockValue);

      await TestBed.runInInjectionContext(async () => {
        const { value, error, loading } = signalController.method();

        expect(value()).toBe(undefined);
        expect(error()).toBe(null);
        expect(loading()).toBe(true);

        await tick();

        expect(value()).toEqual(mockValue);
        expect(error()).toBe(null);
        expect(loading()).toBe(false);
        expect(transferState.set).toHaveBeenCalledWith(
          'TestRpcController#method([])0',
          { data: mockValue },
        );
      });
    });
  });
});
