import { Observable } from "rxjs/Observable";
import { CircuitBreakerState } from "./circuit-breaker-state";

export class CircuitBreaker {

  private currentTimer: any;

  private _failureCount = 0;
  private failedRequest = 0;
  private successfulRequests = 0;

  state: CircuitBreakerState;

  constructor(private _threshold: number = 5, private _timeout: number = 60000, public requestTimeout: number = 1200) {
    this.state = CircuitBreakerState.Closed;
  }

  get failureCount() {
    return this._failureCount;
  }

  get threshold() {
    return this._threshold;
  }

  get serviceLevel() {
    return (this.successfulRequests / (this.failedRequest + this.successfulRequests)) * 100;
  }

  set threshold(value: number) {
    if (value <= 0) {
      throw new Error("threshold value needs to be bigger than zero");
    }
    this._threshold = value;
  }

  onComplete() {
    if (this.state === CircuitBreakerState.HalfOpen) {
      // If operation succeeded without error and circuit breaker
      // is in a half-open state, then reset
      this.reset();
    }

    this.successfulRequests++;
    if (this._failureCount > 0) {
      // Decrement failure count to improve service level
      this._failureCount--;
    }

  }

  onError<T>(error: any, source: Observable<T>, alternativeSource: Observable<T>): Observable<T> {
    this.failedRequest++;
    if (this.state === CircuitBreakerState.HalfOpen
      || this._failureCount >= this.threshold) {
      this.trip();
    } else if (this._failureCount < this.threshold) {
      // Operation failed in an open state, so increment failure count and throw exception
      this._failureCount++;
    }

    if (this.state === CircuitBreakerState.Open) {
      return alternativeSource;
    } else {
      return source.recoverWith(this, alternativeSource);
    }
  }

  private reset() {
    if (this.state !== CircuitBreakerState.Closed) {
      this.changeState(CircuitBreakerState.Closed);
      this.stopTimer();
    }
  }

  private trip() {
    if (this.state !== CircuitBreakerState.Open) {
      this.changeState(CircuitBreakerState.Open);
      this.startTimer();
    }
  }

  private changeState(newState: CircuitBreakerState) {
    // Change the circuit breaker state
    this.state = newState;
  }

  private startTimer() {
    this.currentTimer = setTimeout(() => {
      if (this.state === CircuitBreakerState.Open) {
        // Attempt to close circuit by switching to a half-open state
        this.changeState(CircuitBreakerState.HalfOpen);
        this.stopTimer();
      }
    }, this._timeout);
  }

  private stopTimer() {
    if (this.currentTimer) {
      clearTimeout(this.currentTimer);
      this.currentTimer = null;
    }
  }
}
