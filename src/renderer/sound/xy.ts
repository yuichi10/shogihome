import { Color } from "tsshogi";

export class XY {
  static UP = new XY(0, -1);
  static DOWN = new XY(0, 1);
  static LEFT = new XY(-1, 0);
  static RIGHT = new XY(1, 0);
  static UP_LEFT = new XY(-1, -1);
  static UP_RIGHT = new XY(1, -1);
  static DOWN_LEFT = new XY(-1, 1);
  static DOWN_RIGHT = new XY(1, 1);
  static KNIGHT_LEFT = new XY(-1, -2);
  static KNIGHT_RIGHT = new XY(1, -2);
  static KNIGHT_LEFT_WHITE = new XY(1, 2);
  static KNIGHT_RIGHT_WHITE = new XY(-1, 2);
  private _x: number;
  private _y: number;
  constructor(x: number, y: number) {
    this._x = x;
    this._y = y;
  }

  get x(): number {
    return this._x;
  }
  get y(): number {
    return this._y;
  }

  dx_dy(): { dx: number; dy: number } {
    return { dx: this.x, dy: this.y };
  }

  static UE(color: Color): XY {
    return color === Color.BLACK ? this.UP : this.DOWN;
  }

  static HIDARI(color: Color): XY {
    return color === Color.BLACK ? this.LEFT : this.RIGHT;
  }

  static MIGI(color: Color): XY {
    return color === Color.BLACK ? this.RIGHT : this.LEFT;
  }

  static HIKU(color: Color): XY {
    return color === Color.BLACK ? this.DOWN : this.UP;
  }

  static HIDARI_AGARU(color: Color): XY {
    return color === Color.BLACK ? this.UP_LEFT : this.DOWN_RIGHT;
  }

  static HIDARI_HIKU(color: Color): XY {
    return color === Color.BLACK ? this.DOWN_LEFT : this.UP_RIGHT;
  }

  static MIGI_AGARU(color: Color): XY {
    return color === Color.BLACK ? this.UP_RIGHT : this.DOWN_LEFT;
  }

  static MIGI_HIKU(color: Color): XY {
    return color === Color.BLACK ? this.DOWN_RIGHT : this.UP_LEFT;
  }

  static KNIGHT_HIDARI(color: Color): XY {
    return color === Color.BLACK ? this.KNIGHT_LEFT : this.KNIGHT_LEFT_WHITE;
  }

  static KNIGHT_MIGI(color: Color): XY {
    return color === Color.BLACK ? this.KNIGHT_RIGHT : this.KNIGHT_RIGHT_WHITE;
  }
}
