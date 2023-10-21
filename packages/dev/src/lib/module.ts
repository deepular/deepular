import { createModule } from '@deepkit/app';

import { NgKitConfig } from './config';
import { FeaturesModule, PostCSSFeature, TailwindFeature } from './features';
import { NgKitViteConfig } from './vite.config';
import { BuildController, ServeController } from './cli';

export class NgKitModule extends createModule({
  config: NgKitConfig,
  forRoot: true,
  providers: [NgKitViteConfig, PostCSSFeature, TailwindFeature],
  controllers: [ServeController, BuildController],
}) {
  override imports = [new FeaturesModule()];
}
