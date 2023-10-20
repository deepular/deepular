import { AppModule, createModule } from '@deepkit/app';
import { ClassType, isClass } from '@deepkit/core';
import { ProviderWithScope, Token } from '@deepkit/injector';

import { NgKitViteConfig } from '../vite.config';
import { NgKitConfig, NgKitConfigFeatures } from '../config';
import { feature } from './decorators';

import { Feature } from './feature';
import { PostCSSFeature } from './postcss';
import { TailwindFeature } from './tailwind';

export class FeaturesModule extends createModule({ forRoot: true }) {
  readonly features = new Set<ClassType<Feature<unknown>>>();

  applyFeatureIfEnabled(featureType: ClassType<Feature<unknown>>): void {
    const featureImpl = this.injector!.get(featureType);
    const config = this.injector!.get(NgKitConfig);
    const viteConfig = this.injector!.get(NgKitViteConfig);

    const featureMeta = feature._fetch(featureType);
    if (!featureMeta) {
      throw new Error(
        `Feature ${featureType.name} is missing @feature.config() decorator`,
      );
    }

    const featureName = featureMeta.name as keyof NgKitConfigFeatures;
    let featureConfig: unknown = config.features[featureName];
    if (!featureConfig) return;
    featureConfig = featureConfig === true ? featureImpl.getConfig?.() : featureConfig;
    // if (!featureConfig) {
    //   throw new Error(`Missing configuration for feature ${featureType.name}`);
    // }

    featureMeta.requires.forEach(featureType =>
      this.applyFeatureIfEnabled(featureType),
    );

    viteConfig.apply(viteConfig =>
      featureImpl.applyConfig(featureConfig, viteConfig),
    );
  }

  override processProvider(
    module: AppModule<any>,
    token: Token,
    provider: ProviderWithScope,
  ) {
    if (!isClass(token)) return;

    const featureConfig = feature._fetch(token);
    if (!featureConfig) return;

    if (!module.isProvided(token as ClassType)) module.addProvider(provider);

    this.features.add(token as ClassType<Feature<unknown>>);
  }

  override process(): void {
    this.features.forEach(featureType => {
      this.applyFeatureIfEnabled(featureType);
    });
  }
}
