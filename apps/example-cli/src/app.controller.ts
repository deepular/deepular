import { rpc } from '@deepkit/rpc';
import { float } from '@deepkit/type';

@rpc.controller('AppController')
export class AppController {
  @rpc.action()
  count(): float {
    return Math.random();
  }
}
