
export class Shelf {
    constructor(
      public Column: number = 0,
      public Row: number = 0,
      public Pixels: number[][],
      public Colour: number[] = [0, 0, 0]
    ) { }
}
  