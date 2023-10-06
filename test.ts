import { bootstrapApplication } from '@angular/platform-browser';
import {
  ChangeDetectionStrategy,
  Component,
  ɵReflectionCapabilities as ReflectionCapabilities,
  ɵsetCurrentInjector as setCurrentInjector,
  Injectable, Injector, InjectFlags, InjectOptions, ProviderToken,
} from '@angular/core';

@Injectable()
export class TestService {}

/*@NgModule({
  providers: [TestService],
})
export class TestModule {}*/

@Component({
  standalone: true,
  template: `<div>Hello there!</div>`,
  providers: [TestService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestComponent {
  constructor(readonly svc: TestService) {
  }
}

const reflectionCapabilities = new ReflectionCapabilities();

console.log({
  parameters: reflectionCapabilities.parameters(TestComponent)[0],
  annotations: reflectionCapabilities.annotations(TestComponent)[0],
  factory: reflectionCapabilities.factory(TestComponent),
  propMetadata: reflectionCapabilities.propMetadata(TestComponent),
});

await bootstrapApplication(TestComponent)

class DeepkitInjector extends Injector {
  get<T>(token: ProviderToken<T>, notFoundValue: undefined, options: InjectOptions & { optional?: false }): T;
  get<T>(token: ProviderToken<T>, notFoundValue: null | undefined, options: InjectOptions): T | null;
  get<T>(token: ProviderToken<T>, notFoundValue?: T, options?: InjectOptions | InjectFlags): T;
  get<T>(token: ProviderToken<T>, notFoundValue?: T, flags?: InjectFlags): T;
  get(token: any, notFoundValue?: any): any;
  get(token: any, notFoundValue?: any, options?: (InjectOptions & { optional?: false }) | InjectOptions | InjectFlags): any {
  }
}

// use @deepkit/bson for https://angular.io/api/core/TransferState

function
