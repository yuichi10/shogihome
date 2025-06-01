export class XY {
  private _x: number;
  private _y: number;
  constructor(
    public x: number,
    public y: number,
  ) {
    this._x = x;
    this._y = y;
  }

  get X(): number {
    return this._x;
  }
  get Y(): number {
    return this._y;
  }
}
