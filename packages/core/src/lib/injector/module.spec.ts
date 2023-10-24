import { Component, Injectable, ɵNG_COMP_DEF, ɵNG_INJ_DEF, ɵNG_PROV_DEF } from '@angular/core';
import { screen } from '@testing-library/angular';
// nx-ignore-next-line
import { render, setupModule } from '@ngkit/testing';

import { createModule } from './module';
import { TestBed } from '@angular/core/testing';

test('exported declarations', async () => {
  @Component({
    selector: 'ng-test',
    template: `<div data-testid="test">Test</div>`,
  })
  class TestComponent {}

  class TestModule extends createModule({
    declarations: [TestComponent],
    exports: [TestComponent]
  }) {}

  @Component({
    selector: 'ng-fixture',
    imports: [new TestModule()],
    standalone: true,
    template: `<ng-test></ng-test>`,
  })
  class FixtureComponent {}

  await render(FixtureComponent);

  expect(screen.getByTestId('test')).toBeInTheDocument();
})

// test that TestService is only available in TestComponent but not FixtureComponent because it's not exported from TestModule
test('provider should only be available in module scope because it has not been exported', async () => {
  class TestService {
    value = 1;
  }

  @Component({
    selector: 'test',
    template: `{{ test.value }}`,
  })
  class TestComponent {
    constructor(protected test: TestService) {}
  }

  class TestModule extends createModule({
    declarations: [TestComponent],
    providers: [TestService],
    // exports: [TestService],
  }) {}

  const testBed = setupModule(new TestModule());

  testBed.createComponent(TestComponent);

  testBed.resetTestingModule();

  @Component({
    selector: 'fixture',
    imports: [new TestModule()],
    standalone: true,
    template: `{{ test.value }}`,
  })
  class FixtureComponent {
    constructor(protected test: TestService) {}
  }

  await render(FixtureComponent);
});
