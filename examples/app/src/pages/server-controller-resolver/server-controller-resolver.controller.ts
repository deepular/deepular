import { rpc } from '@deepkit/rpc';

@rpc.controller()
export class ServerControllerResolverController {
  @rpc.action()
  fetch(): string {
    return 'World';
  }
}
