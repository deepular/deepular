import { ɵisNgModule, Injectable } from '@angular/core';
import { createModule, NG_INJ_DEF, NG_MOD_DEF } from './module';
import { Injector } from '@deepkit/injector';

test('instantiated ngkit module used in standalone component', () => {});

test('ng module def', async () => {
  @Injectable({
    providedIn: 'root',
  })
  class TestService {}

  // @ts-ignore
  console.log(TestService[NG_INJ_DEF]);

  /*class TestModule extends createModule({
    providers: [TestService],
    exports: [TestService],
    forRoot: true,
  }) {}

  const injector = Injector.fromModule(new TestModule());

  const test = injector.module.getImportedModuleByClass(TestModule);

  test.setup()

  const ngModuleDef = test[NG_MOD_DEF];
  const injectorDef = test[NG_INJ_DEF];

  console.log({
    ngModuleDef,
    injectorDef,
  });

  console.log(ɵisNgModule(TestModule), { ngModuleDef });*/
});
