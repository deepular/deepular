import { Component, Injectable } from '@angular/core';
import { screen } from '@testing-library/angular';

import { render } from '../../testing';
import { createModule } from './module';

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

test('class provider', async () => {
  class TestService {}


  class TestModule extends createModule({
    providers: [TestService],
    // FIXME: should only be available if exported
    exports: [TestService],
  }) {}

  @Component({
    selector: 'ng-fixture',
    imports: [new TestModule()],
    standalone: true,
    template: `<ng-test></ng-test>`,
  })
  class FixtureComponent {
    constructor(protected test: TestService) {}
  }

  await render(FixtureComponent);
});
