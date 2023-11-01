import { describe, test, expect, vitest } from 'vitest';
import { InjectorContext } from '@deepkit/injector';
import { Injector } from '@deepkit/injector';
import { reflect, typeOf } from '@deepkit/type';
import { TransferState } from '@angular/core';
import { TestBed, tick } from '@angular/core/testing';
import { BSONSerializer } from '@deepkit/bson';
import { ServerController, SignalController } from '@ngkit/core';

import { ServerControllersModule } from './server-controllers.module';
import { ServerModule } from './server.module';
import { InternalServerController } from './internal-server-controller';
import { sleep } from '@deepkit/core';

describe('ServerControllersModule', () => {
  describe('addServerController', () => {
    test('server controller method works', async () => {
      const method = vitest.fn();

      class TestRpcController {
        method = method;
      }

      const rpcController = {
        controller: TestRpcController,
        injector: InjectorContext.forProviders([TestRpcController]),
      };

      const serverControllersModule: ServerControllersModule & any =
        new ServerControllersModule({
          rpcControllers: new Set([rpcController]),
        } as ServerModule);

      const transferState = new TransferState();

      const transferStateSetSpy = vitest.spyOn(transferState, 'set');

      serverControllersModule.addProvider({
        provide: TransferState,
        transient: true,
        useValue: transferState,
      });

      const serverControllerType =
        typeOf<ServerController<TestRpcController>>();

      serverControllersModule.addServerController(
        serverControllerType,
        TestRpcController.name,
      );

      const serialize = vitest.fn().mockImplementation(args => args);

      vitest
        .spyOn(serverControllersModule, 'getInternalServerController')
        .mockReturnValue({
          methodNames: ['method'],
          serializers: new Map([['method', serialize]]),
        } as InternalServerController);

      const injector = Injector.fromModule(serverControllersModule);

      const serverController =
        injector.get<ServerController<TestRpcController>>(serverControllerType);

      const mockValue = Math.random();
      method.mockResolvedValueOnce(mockValue);

      const result = await serverController.method({ test: '' });

      expect(result).toBe(mockValue);
      expect(transferStateSetSpy).toHaveBeenCalledWith(
        'TestRpcController#method([{"test":""}])0',
        { data: mockValue },
      );
    });
  });

  describe('addSignalController', () => {
    test('rpc controller method returns a promise', async () => {
      const method = vitest.fn();

      class TestRpcController {
        method = method;
      }

      const rpcController = {
        controller: TestRpcController,
        injector: InjectorContext.forProviders([TestRpcController]),
      };

      const serverControllersModule: ServerControllersModule & any =
        new ServerControllersModule({
          rpcControllers: new Set([rpcController]),
        } as ServerModule);

      const transferState = new TransferState();

      const transferStateSetSpy = vitest.spyOn(transferState, 'set');

      serverControllersModule.addProvider({
        provide: TransferState,
        transient: true,
        useValue: transferState,
      });

      const signalControllerType =
        typeOf<SignalController<TestRpcController>>();

      serverControllersModule.addSignalController(
        signalControllerType,
        TestRpcController.name,
      );

      const serialize = vitest.fn().mockImplementation(args => args);

      vitest
        .spyOn(serverControllersModule, 'getInternalServerController')
        .mockReturnValue({
          methodNames: ['method'],
          serializers: new Map([['method', serialize]]),
        } as InternalServerController);

      const injector = Injector.fromModule(serverControllersModule);

      const signalController =
        injector.get<SignalController<TestRpcController>>(signalControllerType);

      const mockValue = Math.random();
      method.mockResolvedValueOnce(mockValue);

      await TestBed.runInInjectionContext(async () => {
        const { value, error, loading } = signalController.method();

        expect(value()).toBe(undefined)
        expect(error()).toBe(null);
        expect(loading()).toBe(true);

        // wait for promise to have been resolved
        await sleep(0);

        expect(value()).toBe(mockValue);
        expect(error()).toBe(null);
        expect(loading()).toBe(false);
        expect(transferStateSetSpy).toHaveBeenCalledWith(
          'TestRpcController#method([])0',
          { data: mockValue },
        );
      });
    });
  });
});
