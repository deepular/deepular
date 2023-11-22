import { BehaviorSubject, finalize, tap } from 'rxjs';
import { ApplicationRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export class ApplicationStable extends BehaviorSubject<boolean> {
  constructor(appRef: ApplicationRef, destroyRef: DestroyRef) {
    super(false);

    appRef.isStable.pipe(
      takeUntilDestroyed(destroyRef),
      finalize(() => this.complete()),
      tap(value => this.next(value)),
    ).subscribe();
  }
}
