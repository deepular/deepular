import { InjectorContext } from '@deepkit/injector';
import { Injector } from '@deepkit/injector';
import { typeOf } from '@deepkit/type'
import { TransferState } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BSONSerializer } from '@deepkit/bson';
import { SignalController } from '@ngkit/core';

import { ServerControllersModule } from './server-controllers.module';
import { ServerModule } from './server.module';
import { InternalServerController } from './internal-server-controller';

describe('ServerControllersModule', () => {
  describe('addSignalController', () => {
    test('rpc controller method that returns a promise', async () => {
      await new Promise<void>((done, fail) => {
        const method = vitest.fn()

        class TestRpcController {
          method = method
        }

        const rpcController = {
          controller: TestRpcController,
          injector: InjectorContext.forProviders([TestRpcController]),
        };

        const serverControllersModule: ServerControllersModule & any = new ServerControllersModule({
          rpcControllers: new Set([rpcController]),
        } as ServerModule);

        // TransferState is undefined during tests
        // serverControllersModule.addProvider({
        //   provide: TransferState,
        //   transient: true,
        //   useValue: new TransferState(),
        // });

        const signalControllerType = typeOf<SignalController<TestRpcController>>();

        serverControllersModule.addSignalController(signalControllerType, TestRpcController.name);

        const serialize: BSONSerializer = (data: any) => new TextEncoder().encode(JSON.stringify(data));

        vitest.spyOn(serverControllersModule, 'getInternalServerController').mockReturnValue({
          methodNames: ['method'],
          serializers: new Map([['method', serialize]]),
        } as InternalServerController);

        const injector = Injector.fromModule(serverControllersModule);

        // transferState: TransferState is somehow undefined during tests
        const signalController = injector.get<SignalController<TestRpcController>>(signalControllerType);

        const mockValue  = Math.random();

        method.mockResolvedValueOnce(mockValue);

        TestBed.runInInjectionContext(() => {
          const { error, value } = signalController.method();
          setTimeout(() => {
            try {
              expect(error()).toBe(null);
              expect(value()).toEqual(mockValue);
              done();
            } catch (err) {
              fail(err);
            }
          });
        });
      })
    });
  });
});
