import { soundSourceMap, SoundType } from "@/renderer/assets/sound";
import {
  ImmutableNode,
  ImmutableRecord,
  SpecialMoveType,
  Color,
  SpecialMove,
  Move,
  PieceType,
  Square,
  Direction,
} from "tsshogi";
import { XY } from "@/renderer/sound/xy";

export class SoundManager {
  private synth: SpeechSynthesis;
  private audioContext: AudioContext;
  private audioBuffers: Map<string, AudioBuffer>; // 音源名をキーにAudioBufferを保存

  constructor() {
    this.synth = window.speechSynthesis;
    // 互換性のため AudioContext と webkitAudioContext を併用
    const win = window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
    this.audioContext = new (win.AudioContext || win.webkitAudioContext!)();
    this.audioBuffers = new Map();
    Object.values(SoundType).forEach((st) => {
      this.preloadSounds(st);
    });
  }

  async preloadSounds(name: SoundType): Promise<void> {
    const path = soundSourceMap[name as keyof typeof soundSourceMap];
    const response = await fetch(path);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.audioBuffers.set(name, audioBuffer);
  }

  async playSequence(names: SoundType[]): Promise<void> {
    let nextScheduleTime = this.audioContext.currentTime;
    names.forEach((name) => {
      const audioBuffer = this.audioBuffers.get(name);
      if (!audioBuffer) {
        return;
      }
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start(nextScheduleTime);
      nextScheduleTime = nextScheduleTime + audioBuffer.duration;
    });
  }

  turnVoice(nextMove: Move): SoundType[] {
    const voices: SoundType[] = [];
    if (nextMove.color === Color.BLACK) {
      voices.push(SoundType.BLACK);
    } else if (nextMove.color === Color.WHITE) {
      voices.push(SoundType.WHITE);
    }
    return voices;
  }

  getPlaceVoice(currentMove: Move, nextMove: Move): SoundType[] {
    const voices: SoundType[] = [];
    if (nextMove.capturedPieceType != null && nextMove.to.equals(currentMove.to)) {
      voices.push(SoundType.ONAJIKU);
      return voices;
    }
    const nextPlace = `${nextMove.to.file}${nextMove.to.rank}`;
    if (Object.values(SoundType).includes(nextPlace as SoundType)) {
      voices.push(nextPlace as SoundType);
    }

    return voices;
  }

  getPieceVoice(nextMove: Move): SoundType[] {
    const voices: SoundType[] = [];
    switch (nextMove.pieceType) {
      case PieceType.KING:
        voices.push(SoundType.GYOKU);
        break;
      case PieceType.GOLD:
        voices.push(SoundType.KIN);
        break;
      case PieceType.SILVER:
        voices.push(SoundType.GIN);
        break;
      case PieceType.KNIGHT:
        voices.push(SoundType.KEI);
        break;
      case PieceType.LANCE:
        voices.push(SoundType.KYO);
        break;
      case PieceType.BISHOP:
        voices.push(SoundType.KAKU);
        break;
      case PieceType.ROOK:
        voices.push(SoundType.HISHA);
        break;
      case PieceType.PAWN:
        voices.push(SoundType.FU);
        break;
      case PieceType.PROM_PAWN:
        voices.push(SoundType.TOKIN);
        break;
      case PieceType.PROM_SILVER:
        voices.push(SoundType.NARIGIN);
        break;
      case PieceType.PROM_KNIGHT:
        voices.push(SoundType.NARIKEI);
        break;
      case PieceType.PROM_LANCE:
        voices.push(SoundType.NARIKYO);
        break;
      case PieceType.HORSE:
        voices.push(SoundType.UMA);
        break;
      case PieceType.DRAGON:
        voices.push(SoundType.RYU);
        break;
    }
    return voices;
  }

  isChangeablePiece(pieceType: PieceType): boolean {
    if (
      pieceType === PieceType.PAWN ||
      pieceType === PieceType.LANCE ||
      pieceType === PieceType.KNIGHT ||
      pieceType === PieceType.SILVER ||
      pieceType === PieceType.BISHOP ||
      pieceType === PieceType.ROOK
    ) {
      return true;
    }
    return false;
  }

  changeVoice(nextMove: Move): SoundType[] {
    const voices: SoundType[] = [];
    if (nextMove.promote) {
      voices.push(SoundType.NARU);
    }
    // ならないかつfromが持ち駒からではない
    if (
      !nextMove.promote &&
      nextMove.from instanceof Square &&
      this.isChangeablePiece(nextMove.pieceType)
    ) {
      if (nextMove.color === Color.BLACK && nextMove.to.rank <= 3) {
        voices.push(SoundType.NARAZU);
      } else if (nextMove.color === Color.WHITE && nextMove.to.rank >= 7) {
        voices.push(SoundType.NARAZU);
      }
    }
    return voices;
  }

  utuVoice(nextMove: Move): SoundType[] {
    const voices: SoundType[] = [];
    if (!(nextMove.from instanceof Square)) {
      if (Object.values(PieceType).includes(nextMove.from)) {
        voices.push(SoundType.UTU);
      }
    }
    return voices;
  }

  aroundPieceDirection(movableDirection: XY[], record: ImmutableRecord, nextMove: Move): XY[] {
    const aroundPieceDirection: XY[] = [];
    const nextPieceType = nextMove.pieceType;
    if (movableDirection.length === 0) {
      return aroundPieceDirection;
    }

    for (const direction of movableDirection) {
      const fromAroundSquare = nextMove.to.neighbor(direction.X, direction.Y);
      const piece = record.position.board.at(fromAroundSquare);

      if (
        piece !== null &&
        piece !== undefined &&
        piece.type === nextPieceType &&
        ((nextMove.from instanceof Square && !fromAroundSquare.equals(nextMove.from)) ||
          nextMove.from === nextPieceType)
      ) {
        aroundPieceDirection.push(direction);
      }
    }
    return aroundPieceDirection;
  }

  longRangeSamePieceSearch(longRangePattern: XY[], record: ImmutableRecord, nextMove: Move): XY[] {
    const aroundPieceDirection: XY[] = [];

    for (const pattern of longRangePattern) {
      for (let i = 0; i < 10; i++) {
        const searchSquare = nextMove.to.neighbor(pattern.X * i, pattern.Y * i);
        const piece = record.position.board.at(searchSquare);
        if (
          searchSquare.file < 1 ||
          searchSquare.file > 9 ||
          searchSquare.rank < 1 ||
          searchSquare.rank > 9
        ) {
          break; // 盤外に出たら終了
        }
        if (piece !== null && piece !== undefined && piece.type !== nextMove.pieceType) {
          break;
        }
        if (
          piece !== null &&
          piece !== undefined &&
          piece.type === nextMove.pieceType &&
          ((nextMove.from instanceof Square && !searchSquare.equals(nextMove.from)) ||
            nextMove.from === nextMove.pieceType)
        ) {
          aroundPieceDirection.push(pattern);
          break; // 一つでも見つかれば、これ以上調べる必要はない
        }
      }
    }
    return aroundPieceDirection;
  }

  goldOtherMoves(record: ImmutableRecord, nextMove: Move): SoundType[] {
    const voices: SoundType[] = [];

    const movableDirection: XY[] = [
      new XY(1, 0), // 左
      new XY(-1, 0), // 右
      new XY(0, 1), // 下
      new XY(0, -1), // 上
      new XY(1, 1), // 左下
      new XY(-1, 1), // 右下
    ];
    const aroundPieceDirection = this.aroundPieceDirection(movableDirection, record, nextMove);

    // 他にも動かせる駒があるとき
    if (aroundPieceDirection.length > 0) {
      //　打つ場合
      if (nextMove.from === nextMove.pieceType) {
        voices.push(SoundType.UTU);
        return voices;
      }
    }
    return voices;
  }

  shilverOtherMoves(record: ImmutableRecord, nextMove: Move): SoundType[] {
    const voices: SoundType[] = [];
    const movableDirection: XY[] = [
      new XY(0, 1), // 下
      new XY(1, 1), // 左下
      new XY(-1, 1), // 右下
      new XY(1, -1), // 左上
      new XY(-1, -1), // 右上
    ];
    const aroundPieceDirection = this.aroundPieceDirection(movableDirection, record, nextMove);
    // 他にも動かせる駒があるとき
    if (aroundPieceDirection.length > 0) {
      //　打つ場合
      if (nextMove.from === nextMove.pieceType) {
        voices.push(SoundType.UTU);
        return voices;
      }
    }
    return voices;
  }

  knightOtherMoves(record: ImmutableRecord, nextMove: Move): SoundType[] {
    const voices: SoundType[] = [];
    const movableDirection: XY[] = [new XY(-1, 2), new XY(1, 2)];
    const aroundPieceDirection = this.aroundPieceDirection(movableDirection, record, nextMove);
    // 他にも動かせる駒があるとき
    if (aroundPieceDirection.length > 0) {
      //　打つ場合
      if (nextMove.from === nextMove.pieceType) {
        voices.push(SoundType.UTU);
        return voices;
      }
    }
    return voices;
  }

  lanceOtherMoves(record: ImmutableRecord, nextMove: Move): SoundType[] {
    const voices: SoundType[] = [];
    const searchDirection: XY[] = [new XY(0, 1)]; // 下方向のみ
    const samePieces = this.longRangeSamePieceSearch(searchDirection, record, nextMove);

    if (samePieces.length > 0) {
      if (nextMove.from === nextMove.pieceType) {
        voices.push(SoundType.UTU);
        return voices;
      }
    }

    return voices;
  }

  rookOtherMoves(record: ImmutableRecord, nextMove: Move): SoundType[] {
    const voices: SoundType[] = [];
    const searchDirection: XY[] = [new XY(0, 1), new XY(0, -1), new XY(1, 0), new XY(-1, 0)];
    const samePieces = this.longRangeSamePieceSearch(searchDirection, record, nextMove);

    if (samePieces.length > 0) {
      if (nextMove.from === nextMove.pieceType) {
        voices.push(SoundType.UTU);
        return voices;
      }
    }
    return voices;
  }

  bishopOtherMoves(record: ImmutableRecord, nextMove: Move): SoundType[] {
    const voices: SoundType[] = [];
    const searchDirection: XY[] = [new XY(1, 1), new XY(-1, -1), new XY(1, -1), new XY(-1, 1)];
    const samePieces = this.longRangeSamePieceSearch(searchDirection, record, nextMove);

    if (samePieces.length > 0) {
      if (nextMove.from === nextMove.pieceType) {
        voices.push(SoundType.UTU);
        return voices;
      }
    }
    return voices;
  }

  dragonOtherMoves(record: ImmutableRecord, nextMove: Move): SoundType[] {
    const voices: SoundType[] = [];
    const searchDirection: XY[] = [new XY(0, 1), new XY(0, -1), new XY(1, 0), new XY(-1, 0)];
    const aroundSearchDirection: XY[] = [
      new XY(1, 1),
      new XY(-1, -1),
      new XY(1, -1),
      new XY(-1, 1),
    ];
    const samePieces = this.longRangeSamePieceSearch(searchDirection, record, nextMove);
    samePieces.push(...this.aroundPieceDirection(aroundSearchDirection, record, nextMove));

    return voices;
  }

  horseOtherMoves(record: ImmutableRecord, nextMove: Move): SoundType[] {
    const voices: SoundType[] = [];
    const searchDirection: XY[] = [new XY(1, 1), new XY(-1, -1), new XY(1, -1), new XY(-1, 1)];
    const aroundSearchDirection: XY[] = [new XY(0, 1), new XY(0, -1), new XY(1, 0), new XY(-1, 0)];
    const samePieces = this.longRangeSamePieceSearch(searchDirection, record, nextMove);
    samePieces.push(...this.aroundPieceDirection(aroundSearchDirection, record, nextMove));

    return voices;
  }

  moveDetailVoice(record: ImmutableRecord): SoundType[] {
    const voices: SoundType[] = [];
    const nextMove = record.current.next?.move as Move | null;
    if (!nextMove) {
      return voices;
    }
    switch (nextMove.pieceType) {
      case PieceType.GOLD:
      case PieceType.PROM_PAWN:
      case PieceType.PROM_KNIGHT:
      case PieceType.PROM_LANCE:
      case PieceType.PROM_SILVER:
        voices.push(...this.goldOtherMoves(record, nextMove));
        break;
      case PieceType.SILVER:
        voices.push(...this.shilverOtherMoves(record, nextMove));
        break;
      case PieceType.KNIGHT:
        voices.push(...this.knightOtherMoves(record, nextMove));
        break;
      case PieceType.LANCE:
        voices.push(...this.lanceOtherMoves(record, nextMove));
        break;
      case PieceType.ROOK:
        voices.push(...this.rookOtherMoves(record, nextMove));
        break;
      case PieceType.BISHOP:
        voices.push(...this.bishopOtherMoves(record, nextMove));
        break;
      case PieceType.DRAGON:
        voices.push(...this.dragonOtherMoves(record, nextMove));
        break;
      case PieceType.HORSE:
        voices.push(...this.horseOtherMoves(record, nextMove));
        break;
    }
    return voices;
  }

  gameVoice(record: ImmutableRecord): SoundType[] {
    const voices: SoundType[] = [];
    const current = record.current;
    const currentMove = current.move as Move | null;
    if (!currentMove) {
      return voices;
    }
    const nextMove = current.next?.move as Move | null;
    if (!nextMove) {
      return voices;
    }
    voices.push(...this.turnVoice(nextMove));
    voices.push(...this.getPlaceVoice(currentMove, nextMove));
    voices.push(...this.getPieceVoice(nextMove));
    voices.push(...this.changeVoice(nextMove));
    voices.push(...this.moveDetailVoice(record));

    return voices;
  }

  gameEndVoice(record: ImmutableRecord): SoundType[] {
    const current = record.current;
    const voices: SoundType[] = [];
    if (
      current.next?.move &&
      "type" in current.next.move &&
      current.next?.move.type === SpecialMoveType.RESIGN
    ) {
      if (current.next?.nextColor === Color.BLACK) {
        voices.push(SoundType.MADE);
        voices.push(SoundType.WHITE_WIN);
      } else if (current.next?.nextColor === Color.WHITE) {
        voices.push(SoundType.MADE);
        voices.push(SoundType.BLACK_WIN);
      }
    }
    return voices;
  }

  createVoiceArray(record: ImmutableRecord): SoundType[] {
    const voices: SoundType[] = [];
    // 勝敗が決まったときの処理
    voices.push(...this.gameEndVoice(record));
    if (voices.length > 0) {
      return voices;
    }
    voices.push(...this.gameVoice(record));
    return voices;
  }

  read(record: ImmutableRecord): void {
    const current = record.current;
    const voices = this.createVoiceArray(record);
    console.log(current);
    this.playSequence(voices);
  }
}
