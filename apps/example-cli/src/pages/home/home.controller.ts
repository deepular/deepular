import { rpc } from '@deepkit/rpc';

@rpc.controller('HomeController')
export class HomeController {
  @rpc.action()
  fetchData(): {} {
    return {};
  }
}
