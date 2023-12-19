import { TestBed } from '@angular/core/testing';
import { screen } from '@testing-library/angular';
import { Component, Injectable, NgModule } from '@angular/core';

import { render, setupTestingModule } from '../../testing';
import { createModule } from './module';
import { setupRootComponent } from './utils';

test('exported declarations can be used in parent module component', async () => {
  @Component({
    selector: 'ng-test',
    template: `<div data-testid="test">Test</div>`,
  })
  class TestComponent {}

  class TestModule extends createModule({
    declarations: [TestComponent],
    exports: [TestComponent],
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
});

test('angular providers', () => {});

// test that TestService is only available in TestComponent but not FixtureComponent because it's not exported from TestModule
test('provider in imported module should not be available in parent module when it has not been exported', () => {
  class TestService {
    value = 1;
  }

  class TestModule extends createModule({
    providers: [TestService],
  }) {}

  @Component({
    selector: 'fixture',
    imports: [new TestModule()],
    standalone: true,
    template: `{{ test.value }}`,
  })
  class FixtureComponent {
    constructor(protected test: TestService) {}
  }

  expect(() =>
    setupRootComponent(FixtureComponent),
  ).toThrowErrorMatchingInlineSnapshot(
    '"Undefined dependency \\"test: TestService\\" of FixtureComponent(?). Type has no provider."',
  );
});

test('providers in imported angular modules should be present in parent deepular module', () => {
  @Injectable()
  class TestNgService {}

  @NgModule({
    providers: [TestNgService],
  })
  class TestNgModule {}

  class TestService {
    constructor(readonly test: TestNgService) {}
  }

  class TestModule extends createModule({
    providers: [TestService],
  }) {
    override ngImports = [TestNgModule];
  }

  const injector = setupTestingModule(new TestModule()).getInjectorContext();

  expect(injector.get(TestService).test).toBeInstanceOf(TestNgService);
});

test('exported declarations in imported angular modules should be present in parent deepular module', () => {
  @Component({
    selector: 'ng-test',
    template: `<span data-testid="ng-test">TestNgComponent</span>`,
  })
  class TestNgComponent {}

  @NgModule({
    declarations: [TestNgComponent],
    exports: [TestNgComponent],
  })
  class TestNgModule {}

  @Component({
    selector: 'test',
    template: `<ng-test />`,
  })
  class TestComponent {
    constructor() {}
  }

  class TestModule extends createModule({
    declarations: [TestComponent],
  }) {
    override ngImports = [TestNgModule];
  }

  setupTestingModule(new TestModule());

  const component = TestBed.createComponent(TestComponent);
  expect(component.nativeElement).toMatchInlineSnapshot(`
      <div
        id="root1"
        ng-version="17.0.3"
      >
        <ng-test>
          <span
            data-testid="ng-test"
          >
            TestNgComponent
          </span>
        </ng-test>
      </div>
    `);
});
