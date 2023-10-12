import { ClassType } from '@deepkit/core';
import {
  ApplicationConfig,
  EnvironmentProviders as NgEnvironmentProviders,
  Provider as NgProvider,
} from '@angular/core';
import { ProviderWithScope } from '@ngkit/injector';

type Provider = NgProvider | ProviderWithScope;

export async function bootstrapApplication(
  rootComponent: ClassType,
  providers: readonly Provider[],
  platformProviders?: Provider[],
) {}
