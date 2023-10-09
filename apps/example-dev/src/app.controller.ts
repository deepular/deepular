import { rpc } from '@deepkit/rpc';
import { float } from '@deepkit/type';

@rpc.controller('AppController') // TODO: name should be optional, and if not defined set to the class name
export class AppController {
  @rpc.action()
  count(): float {
    return Math.random();
  }
}
