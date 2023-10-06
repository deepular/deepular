import { rpc } from '@deepkit/rpc';

@rpc.controller('app')
export class AppController {
  @rpc.action()
  test() {}
}
