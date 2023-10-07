import { rpc } from '@deepkit/rpc';
import { float } from '@deepkit/type';

import { AppControllerApi } from '../shared';

@rpc.controller(AppControllerApi)
export class AppController implements AppControllerApi {
  @rpc.action()
  count(): float {
    return Math.random();
  }
}
