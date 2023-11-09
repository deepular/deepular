import { Resolver, ServerController } from '@ngkit/core';

import type { HomeController } from './home.controller';

export class HomeResolver implements Resolver<{}> {
  constructor(private readonly controller: ServerController<HomeController>) {}

  async resolve() {
    return await this.controller.fetchData();
  }
}
