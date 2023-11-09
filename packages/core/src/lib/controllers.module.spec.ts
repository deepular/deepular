import { Type, TypeClass } from '@deepkit/type';

import { ControllersModule } from './controllers.module';
import { AppModule } from './injector';
import { ServerController, SignalController } from './controller';

describe('ControllersModule', () => {
  describe('processProvider', () => {
    test('adds signal controller type', () => {
      class TestControllersModule extends ControllersModule {
        protected addServerController(): void {}

        protected addSignalController(): void {}
      }

      const controllersModule: TestControllersModule & any =
        new TestControllersModule();

      type TestController = {};

      class TestService {
        constructor(test: SignalController<TestController>) {}
      }

      controllersModule.processProvider(new AppModule({}), null, TestService);

      expect(controllersModule.signalControllerTypes).toHaveLength(1);
    });

    test('adds server controller type', () => {
      class TestControllersModule extends ControllersModule {
        protected addServerController(): void {}

        protected addSignalController(): void {}
      }

      const controllersModule: TestControllersModule & any =
        new TestControllersModule();

      interface TestController {}

      class TestService {
        constructor(test: ServerController<TestController>) {}
      }

      controllersModule.processProvider(new AppModule({}), null, TestService);

      expect(controllersModule.serverControllerTypes).toHaveLength(1);
    });
  });
});
