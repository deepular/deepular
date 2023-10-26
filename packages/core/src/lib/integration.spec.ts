import { Component, ElementRef } from '@angular/core';
// nx-ignore-next-line
import { render } from '@ngkit/testing';

test('default ng component providers should be available for dependency injection', async () => {
  @Component({
    selector: 'test',
    standalone: true,
    template: `<div>Test</div>`,
  })
  class TestComponent {
    constructor(elementRef: ElementRef) {}
  }

  await render(TestComponent);
});
