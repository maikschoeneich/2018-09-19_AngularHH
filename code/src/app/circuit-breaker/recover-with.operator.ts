import { Observable } from "rxjs/Observable";
import { CircuitBreaker } from "./circuit-breaker";
import { timeout, takeUntil, takeWhile, catchError } from "rxjs/operators";
import { CircuitBreakerState } from "./circuit-breaker-state";
import "rxjs/add/observable/empty";

export function recoverWith<T>(
  this: Observable<T>,
  cb: CircuitBreaker,
  alternativeSource: Observable<T>
): Observable<T> {

  const source = this;
  return new Observable<T>((observer) => {
    if (cb.state !== CircuitBreakerState.Open) {
      source
        .pipe(
          timeout(cb.requestTimeout),
          catchError((error) => {
            return cb.onError(error, source, alternativeSource);
          })
        ).subscribe(
          (value: T) => observer.next(value),
          err => observer.error(err),
          () => {
            cb.onComplete();
            observer.complete();
          });
    } else {
      observer.complete();
    }
  });
}

Observable.prototype.recoverWith = recoverWith;

declare module "rxjs/Observable" {
  interface Observable<T> {
    recoverWith: typeof recoverWith;
  }
}
