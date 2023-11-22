// nx-ignore-next-line
import { render, setupTestingModule } from '@ngkit/testing';
import { Component, ElementRef } from '@angular/core';
import { NgIf } from '@angular/common';

import { createModule } from './injector';

test('fails to resolve declaration specific dependencies for providers', () => {
  class TestService {
    constructor(elementRef: ElementRef) {}
  }

  @Component({
    selector: 'test',
    template: ``,
  })
  class TestComponent {}

  class TestModule extends createModule({
    declarations: [TestComponent],
    providers: [TestService],
  }) {}

  const module = new TestModule();

  const svc = setupTestingModule(module);

  const injector = svc.getInjector(module);

  expect(() => injector.get(TestService)).toThrowErrorMatchingInlineSnapshot(`
    "ElementRef is only allowed as a dependency for declarations"
  `);
});

test('declaration specific dependencies should be available for components', async () => {
  @Component({
    selector: 'test',
    standalone: true,
    template: `<div>Test</div>`,
  })
  class TestComponent {
    constructor(elementRef: ElementRef) {}
  }

  await expect(async () => await render(TestComponent)).not.toThrowError();
});

test('standalone directives imported in standalone components', async () => {
  @Component({
    selector: 'test',
    standalone: true,
    imports: [NgIf],
    template: `<div *ngIf="true">Test</div>`,
  })
  class TestComponent {}

  await render(TestComponent);
});

test('standalone directives imported in modules and used in components', () => {
  class TestModule extends createModule({
    declarations: [],
  }) {
    override ngImports = [NgIf];
  }
});

test('directives declared in module and used in component', () => {});
