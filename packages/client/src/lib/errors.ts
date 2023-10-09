import type { ClientController } from './client-controller';

export class TransferStateMissingForClientControllerMethodError extends Error {
  constructor(
    readonly target: ClientController,
    readonly methodName: string,
  ) {
    super('Transfer state is missing missing for client controller');
  }
}
