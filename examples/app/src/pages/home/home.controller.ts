import { rpc } from '@deepkit/rpc';

@rpc.controller()
export class HomeController {
  @rpc.action()
  fetchData(): string {
    return 'World';
  }
}
