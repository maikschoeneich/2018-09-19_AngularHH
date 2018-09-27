import { CircuitBreakerState } from "./circuit-breaker/circuit-breaker-state";
import { FilmsService } from "./shared/films.service";
import { Component, OnInit } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { Film } from "./shared/film";
import { catchError, map, timeout } from "rxjs/operators";
import { FilmsResponse } from "./shared/films-response";

import { empty } from "rxjs/observable/empty";
import { CircuitBreaker } from "./circuit-breaker/circuit-breaker";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit {

  title = "Star Wars API";
  films: Observable<Film[]>;
  timeout: number;

  constructor(public filmsService: FilmsService) { }

  ngOnInit(): void {
    this.reload();
  }

  reload() {
    this.films = this.filmsService.getFilms()
      .pipe(
        map((response: FilmsResponse) => response.results),
        catchError((error: any) => {
          console.error(error);
          return empty<Film[]>();
        })
      );
  }

  get stateText(): string {
    return CircuitBreakerState[this.filmsService.cb.state];
  }
}
