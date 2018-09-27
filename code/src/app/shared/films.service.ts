import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Film } from "./film";

import { Observable } from "rxjs/Observable";
import { FilmsResponse } from "./films-response";
import { CircuitBreaker } from "../circuit-breaker/circuit-breaker";
import "../circuit-breaker/recover-with.operator";
import "rxjs/add/operator/takeWhile";

@Injectable()
export class FilmsService {

  private static readonly baseUrl: string = "https://swapi.co/api/films/";

  cb: CircuitBreaker;

  constructor(private httpClient: HttpClient) {
    this.cb = new CircuitBreaker(5, 15000);
  }

  getFilms(): Observable<FilmsResponse> {

    const headers = new HttpHeaders();
    headers.set("Accept", "application/json");

    const altSource = new Observable<FilmsResponse>((observer) => {
      observer.next(FilmsResponse.empty);
      observer.complete();
    });

    return this.httpClient
      .get<FilmsResponse>(FilmsService.baseUrl, { headers })
      .recoverWith(this.cb, altSource);
  }
}
