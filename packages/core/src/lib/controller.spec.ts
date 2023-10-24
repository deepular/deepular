import { Observable } from 'rxjs';


import { SignalController } from './controller';

test('RemoteController', () => {
  class TestController {
    // @ts-ignore
    async load1(): Promise<string> {}

    // @ts-ignore
    async load2(): string {}

    // @ts-ignore
    load3(): Observable<string> {}

    // @ts-ignore
    async load4(): Promise<Observable<string>> {}
  }

  const test: SignalController<TestController> = new TestController() as unknown as SignalController<TestController>;
})
