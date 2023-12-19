import { rpc } from '@deepkit/rpc';

@rpc.controller()
export class SignalControllerController {
  @rpc.action()
  async getNumber(): Promise<number> {
    return Math.random();
  }
}
