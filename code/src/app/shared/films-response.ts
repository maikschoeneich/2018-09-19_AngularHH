
import { Film } from "./film";

export class FilmsResponse {
  static readonly empty: FilmsResponse = { results: [] };
  results: Film[];
}
