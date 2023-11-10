import {
  beforeEach,
  vitest,
  Mock,
  test,
  describe,
  expect,
  afterEach,
} from 'vitest';
import { RpcClient } from '@deepkit/rpc';
import { ChangeDetectorRef, TransferState } from '@angular/core';
import { typeOf } from '@deepkit/type';
import { ServerController, SignalController } from '@ngkit/core';
import { Injector } from '@deepkit/injector';
import { TestBed } from '@angular/core/testing';

import { ClientControllersModule } from './client-controllers.module';
import { TransferStateMissingForClientControllerMethodException } from './errors';

interface TestRpcController {
  method(arg1?: any): number;
}

describe('client controllers', () => {
  let transferState: {
    get: Mock;
    hasKey: Mock;
  };
  let remoteController: {
    method: Mock;
  };
  let internalClientController: {
    methodNames: readonly string[];
    deserializers: ReadonlyMap<string, Mock>;
    getTransferState: Mock;
  };
  let clientControllersModule: ClientControllersModule & any;

  beforeEach(() => {
    const rpcClient = new RpcClient({
      connect: vitest.fn(),
    });

    clientControllersModule = new ClientControllersModule(rpcClient);

    transferState = {
      get: vitest.fn(),
      hasKey: vitest.fn(),
    };

    clientControllersModule.addProvider({
      provide: TransferState,
      transient: true,
      useValue: transferState,
    });

    const deserialize = vitest.fn().mockImplementation(args => args);

    internalClientController = {
      methodNames: ['method'],
      deserializers: new Map([['method', deserialize]]),
      getTransferState: vitest.fn(),
    };

    vitest
      .spyOn(clientControllersModule, 'getInternalClientController')
      .mockReturnValue(internalClientController);

    remoteController = {
      method: vitest.fn(),
    };

    vitest
      .spyOn(clientControllersModule, 'getRemoteController')
      .mockReturnValue(remoteController);
  });

  describe('server controller method', () => {
    let serverController: ServerController<TestRpcController>;

    beforeEach(() => {
      const serverControllerType =
        typeOf<ServerController<TestRpcController>>();

      clientControllersModule.addServerController(
        serverControllerType,
        'TestRpcController',
      );

      const injector = Injector.fromModule(clientControllersModule);

      serverController =
        injector.get<ServerController<TestRpcController>>(serverControllerType);
    });

    test('returns transfer state', async () => {
      const value = Math.random();

      internalClientController.getTransferState.mockReturnValue(value);

      await expect(serverController.method()).resolves.toEqual(value);

      expect(remoteController.method).not.toHaveBeenCalled();
    });

    test('calls remote controller method when transfer state is missing', async () => {
      transferState.hasKey.mockReturnValue(false);

      const value = Math.random();

      remoteController.method.mockReturnValue(value);

      internalClientController.getTransferState.mockImplementationOnce(() => {
        throw new TransferStateMissingForClientControllerMethodException(
          internalClientController as any,
          'method',
        );
      });

      await expect(serverController.method()).resolves.toEqual(value);

      expect(remoteController.method).toHaveBeenCalled();
    });
  });

  describe('signal controller method', () => {
    let signalController: SignalController<TestRpcController>;
    let changeDetectorRef: {
      detectChanges: Mock;
    };

    beforeEach(() => {
      const signalControllerType =
        typeOf<SignalController<TestRpcController>>();

      clientControllersModule.addSignalController(
        signalControllerType,
        'TestRpcController',
      );

      const injector = Injector.fromModule(clientControllersModule);

      changeDetectorRef = {
        detectChanges: vitest.fn(),
      };

      TestBed.configureTestingModule({
        providers: [
          {
            provide: ChangeDetectorRef,
            useValue: changeDetectorRef,
          },
        ],
      });

      signalController =
        injector.get<SignalController<TestRpcController>>(signalControllerType);
    });

    afterEach(() => {
      TestBed.resetTestingModule();
    });

    describe('refetch', () => {
      test('with arguments', async () => {
        const transferStateValue = Math.random();

        internalClientController.getTransferState.mockReturnValue(
          transferStateValue,
        );

        await TestBed.runInInjectionContext(async () => {
          const { value, refetch } = signalController.method();

          expect(value()).toEqual(transferStateValue);

          const newValue = Math.random();

          remoteController.method.mockReturnValue(newValue);

          await refetch({});

          expect(remoteController.method.mock.calls[0]).toMatchInlineSnapshot(`
          [
            {},
          ]
        `);

          expect(value()).toEqual(newValue);
        });
      });

      test('without arguments', async () => {
        const transferStateValue = Math.random();

        internalClientController.getTransferState.mockReturnValue(
          transferStateValue,
        );

        await TestBed.runInInjectionContext(async () => {
          const { value, refetch } = signalController.method({});

          expect(value()).toEqual(transferStateValue);

          const newValue = Math.random();

          remoteController.method.mockReturnValue(newValue);

          await refetch();

          expect(remoteController.method.mock.calls[0]).toMatchInlineSnapshot(`
          [
            {},
          ]
        `);

          expect(value()).toEqual(newValue);
        });
      });
    });
  });
});
