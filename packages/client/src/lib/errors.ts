import type { InternalClientController } from './internal-client-controller';

export class TransferStateMissingForClientControllerMethodException extends Error {
  constructor(
    readonly target: InternalClientController,
    readonly methodName: string,
  ) {
    super('Transfer state is missing missing for client controller');
  }
}
