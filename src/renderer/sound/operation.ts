import {
  ImmutableRecord,
  ImmutableBoard,
  Move,
  PieceType,
  Square,
  Color,
  SpecialMove,
  movableDirections,
  reverseDirection,
  Piece,
} from "tsshogi";

import { SoundType } from "@/renderer/assets/sound";

enum pieceOperations {
  // 複数選択できる場合は、tier1を優先して選ぶ
  AGARU = "上", // 上方向への移動 tier 1
  YORU = "寄", // 左右方向への移動　tier 1
  HIKU = "引", // 下方向への移動 tier 1
  HIDARI = "左", // 左方向への移動
  MIGI = "右", // 右方向への移動
  SUGU = "直", // 真上方向への移動
  HIDARI_AGARU = "左上", // 左上方向
  HIDARI_HIKU = "左引", // 左下方向
  MIGI_AGARU = "右上", // 右上方向
  MIGI_HIKU = "右引", // 右下方向
  UTU = "打", // 手駒から打つ場合
}

export class PieceOperationSound {
  private _record: ImmutableRecord;
  private _nextMove: Move;
  private _skip: boolean;
  private _nextTo: Square;
  private _nextFrom: Square;
  private _fromHand: boolean;
  private _pieceType: PieceType;
  private _color: Color;

  constructor(record: ImmutableRecord) {
    const initSquare = new Square(0, 0);
    const initPieceType = PieceType.PAWN;
    const initMove = new Move(initSquare, initSquare, false, Color.BLACK, initPieceType, null);

    this._record = record;
    this._nextMove = initMove;
    this._skip = true;
    if (this._record.current.next != null && this._record.current.next.move instanceof Move) {
      this._nextMove = this._record.current.next.move;
      this._skip = false;
    }
    this._nextTo = this._nextMove.to;
    this._pieceType = this._nextMove.pieceType;
    this._color = this._nextMove.color;
    this._nextFrom = initMove.to;
    this._fromHand = true;
    if (this._nextMove.from instanceof Square) {
      this._nextFrom = this._nextMove.from;
      this._fromHand = false;
    }
  }

  hasAgaru(to: Square, from: Square, color: Color): boolean {
    if (color === Color.BLACK) {
      if (to.rank < from.rank) {
        return true;
      }
    } else {
      if (to.rank > from.rank) {
        return true;
      }
    }
    return false;
  }

  hasYoru(to: Square, from: Square): boolean {
    if (to.rank === from.rank && (to.file > from.file || to.file < from.file)) {
      // 寄る
      return true;
    }
    return false;
  }

  hasHiku(to: Square, from: Square, color: Color): boolean {
    if (color === Color.BLACK) {
      if (to.rank > from.rank) {
        return true;
      }
    } else {
      if (to.rank < from.rank) {
        return true;
      }
    }
    return false;
  }

  hasHidari(to: Square, from: Square, color: Color): boolean {
    if (color === Color.BLACK) {
      if (to.file < from.file) {
        return true;
      }
    } else {
      if (to.file > from.file) {
        return true;
      }
    }
    return false;
  }

  hasMigi(to: Square, from: Square, color: Color): boolean {
    if (color === Color.BLACK) {
      if (to.file > from.file) {
        return true;
      }
    } else {
      if (to.file < from.file) {
        return true;
      }
    }
    return false;
  }

  hasSugu(to: Square, from: Square, color: Color): boolean {
    if (color === Color.BLACK) {
      if (to.rank + 1 === from.rank && to.file === from.file) {
        return true;
      }
    } else {
      if (to.rank - 1 === from.rank && to.file === from.file) {
        return true;
      }
    }
    return false;
  }

  hasHidariAgaru(to: Square, from: Square, color: Color): boolean {
    if (color === Color.BLACK) {
      if (to.file === from.file - 1 && to.rank === from.rank - 1) {
        return true;
      }
    } else {
      if (to.file === from.file + 1 && to.rank === from.rank + 1) {
        return true;
      }
    }
    return false;
  }

  hasMigiAgaru(to: Square, from: Square, color: Color): boolean {
    if (color === Color.BLACK) {
      if (to.file === from.file + 1 && to.rank === from.rank - 1) {
        return true;
      }
    } else {
      if (to.file === from.file - 1 && to.rank === from.rank + 1) {
        return true;
      }
    }
    return false;
  }

  hasHidariHiku(to: Square, from: Square, color: Color): boolean {
    if (color === Color.BLACK) {
      if (to.file === from.file - 1 && to.rank === from.rank + 1) {
        return true;
      }
    } else {
      if (to.file === from.file + 1 && to.rank === from.rank - 1) {
        return true;
      }
    }
    return false;
  }

  hasMigiHiku(to: Square, from: Square, color: Color): boolean {
    if (color === Color.BLACK) {
      if (to.file === from.file + 1 && to.rank === from.rank + 1) {
        return true;
      }
    } else {
      if (to.file === from.file - 1 && to.rank === from.rank - 1) {
        return true;
      }
    }
    return false;
  }

  dragonHorseLeftRight(self: Square, other: Square, color: Color): pieceOperations[] {
    if (color === Color.BLACK) {
      if (self.file > other.file) {
        return [pieceOperations.HIDARI];
      } else if (self.file < other.file) {
        return [pieceOperations.MIGI];
      }
    } else {
      if (self.file < other.file) {
        return [pieceOperations.HIDARI];
      } else if (self.file > other.file) {
        return [pieceOperations.MIGI];
      }
    }
    return [];
  }

  getOperationList(to: Square, from: Square, color: Color): Map<pieceOperations, boolean> {
    const opsList: Map<pieceOperations, boolean> = new Map();
    // 上がる
    if (this.hasAgaru(to, from, color)) {
      opsList.set(pieceOperations.AGARU, true);
    }
    //　寄る
    if (this.hasYoru(to, from)) {
      opsList.set(pieceOperations.YORU, true);
    }
    // 引く
    if (this.hasHiku(to, from, color)) {
      opsList.set(pieceOperations.HIKU, true);
    }
    // 左
    if (this.hasHidari(to, from, color)) {
      opsList.set(pieceOperations.HIDARI, true);
    }
    // 右
    if (this.hasMigi(to, from, color)) {
      opsList.set(pieceOperations.MIGI, true);
    }
    // 直ぐ
    if (this.hasSugu(to, from, color)) {
      opsList.set(pieceOperations.SUGU, true);
    }
    // 左上がる
    if (this.hasHidariAgaru(to, from, color)) {
      opsList.set(pieceOperations.HIDARI_AGARU, true);
    }
    // 左引く
    if (this.hasHidariHiku(to, from, color)) {
      opsList.set(pieceOperations.HIDARI_HIKU, true);
    }
    // 右上がる
    if (this.hasMigiAgaru(to, from, color)) {
      opsList.set(pieceOperations.MIGI_AGARU, true);
    }
    // 右引く
    if (this.hasMigiHiku(to, from, color)) {
      opsList.set(pieceOperations.MIGI_HIKU, true);
    }
    return opsList;
  }

  choosePieceOperation(operations: pieceOperations[]): pieceOperations {
    // 複数選択できる場合は、tier1を優先して返す
    // AGARU = "上", // 上方向への移動 tier 1
    // YORU = "寄", // 左右方向への移動　tier 1
    // HIKU = "引", // 下方向への移動 tier 1
    if (operations.length === 1) {
      return operations[0];
    }
    if (operations.includes(pieceOperations.AGARU)) {
      return pieceOperations.AGARU;
    } else if (operations.includes(pieceOperations.YORU)) {
      return pieceOperations.YORU;
    } else if (operations.includes(pieceOperations.HIKU)) {
      return pieceOperations.HIKU;
    }
    return operations[0];
  }

  // piceOperationによって音を変える。
  pieceOperationToSoundType(operation: pieceOperations): SoundType[] {
    const voices: SoundType[] = [];
    switch (operation) {
      case pieceOperations.AGARU:
        voices.push(SoundType.AGARU);
        break;
      case pieceOperations.YORU:
        voices.push(SoundType.YORU);
        break;
      case pieceOperations.HIKU:
        voices.push(SoundType.HIKU);
        break;
      case pieceOperations.HIDARI:
        voices.push(SoundType.HIDARI);
        break;
      case pieceOperations.MIGI:
        voices.push(SoundType.MIGI);
        break;
      case pieceOperations.SUGU:
        voices.push(SoundType.SUGU);
        break;
      case pieceOperations.HIDARI_AGARU:
        voices.push(SoundType.HIDARI);
        voices.push(SoundType.AGARU);
        break;
      case pieceOperations.HIDARI_HIKU:
        voices.push(SoundType.HIDARI);
        voices.push(SoundType.HIKU);
        break;
      case pieceOperations.MIGI_AGARU:
        voices.push(SoundType.MIGI);
        voices.push(SoundType.AGARU);
        break;
      case pieceOperations.MIGI_HIKU:
        voices.push(SoundType.MIGI);
        voices.push(SoundType.HIKU);
        break;
      case pieceOperations.UTU:
        voices.push(SoundType.UTU);
        break;
    }
    return voices;
  }

  // 駒の音の一覧を返す
  getPieceOperation(): SoundType[] {
    const selfOperationList = this.getOperationList(this._nextTo, this._nextFrom, this._color);
    const candidates = this._record.position
      .listAttackersByPiece(this._nextTo, new Piece(this._nextMove.color, this._pieceType))
      .filter((s) => !s.equals(this._nextFrom));

    // 他に候補がなければ何もしない
    if (candidates.length < 1) {
      return [];
    }

    const candidatesOperation: Map<pieceOperations, boolean> = new Map();

    for (const c of candidates) {
      const ops = this.getOperationList(this._nextTo, c, this._color);
      ops.forEach((v, k) => {
        candidatesOperation.set(k, v);
      });
    }

    // 1. 龍/馬では左右を利用するため、そのチェックを追加
    // 2. 龍/馬では直ぐを使わないので削除
    if (this._pieceType === PieceType.DRAGON || this._pieceType === PieceType.HORSE) {
      for (const c of candidates) {
        const ss = this.dragonHorseLeftRight(this._nextTo, c, this._color);
        for (const s of ss) {
          selfOperationList.set(s, true);
        }
      }
      selfOperationList.delete(pieceOperations.SUGU);
    }

    const finalOperationList: pieceOperations[] = [];
    for (const selfOps of selfOperationList.keys()) {
      if (!candidatesOperation.has(selfOps)) {
        finalOperationList.push(selfOps);
      }
    }

    const operation = this.choosePieceOperation(finalOperationList);
    return this.pieceOperationToSoundType(operation);
  }
}
