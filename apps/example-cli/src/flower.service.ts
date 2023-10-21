export class FlowerService {
  get(): Flower {
    return { name: 'tulip' };
  }
}

export interface Flower {
  readonly name: string;
}
