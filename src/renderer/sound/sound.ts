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

enum PieceOperation {
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

  promoteVoice(nextMove: Move): SoundType[] {
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

  // moveDirectionに入っているXY毎の方向にいるコマを調査して、それが自分と同じコマだったらその方向を返す。
  aroundPieceDirection(movableDirection: XY[], record: ImmutableRecord, nextMove: Move): XY[] {
    const aroundPieceDirection: XY[] = [];
    const nextPieceType = nextMove.pieceType;
    if (movableDirection.length === 0) {
      return aroundPieceDirection;
    }

    for (const direction of movableDirection) {
      const fromAroundSquare = nextMove.to.neighbor(direction.x, direction.y);
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

  // 複数距離をいくような駒がlongRangePatternの方向に複数進んだ際に、nextMoveに来れる自分と同じ駒がいるか、調査。
  longRangeSamePieceSearch(longRangePattern: XY[], record: ImmutableRecord, nextMove: Move): XY[] {
    const aroundPieceDirection: XY[] = [];

    for (const pattern of longRangePattern) {
      for (let i = 0; i < 10; i++) {
        const searchSquare = nextMove.to.neighbor(pattern.x * i, pattern.y * i);
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

  // これはあくまで周辺のコマだけになっている。
  // TODO: 香車や飛車、角等　遠くにいる駒も検索できるようにする必要がある。
  pieceOperationCanddate(nextMove: Move, nextToFromOperation: XY): PieceOperation[] {
    const po: PieceOperation[] = [];

    if (Object.values(PieceType).includes(nextMove.from as PieceType)) {
      po.push(PieceOperation.UTU);
      return po;
    }

    // 左と右に関しては左に移動ではなく左にあるものが右にいくという形なので、Hidariに行くときはMIGIを設定している。
    const from = nextMove.to.neighbor(nextToFromOperation.x, nextToFromOperation.y);
    const to = nextMove.to;
    const ue = from.neighbor(XY.UE(nextMove.color).x, XY.UE(nextMove.color).y);
    const hidari = from.neighbor(XY.MIGI(nextMove.color).x, XY.MIGI(nextMove.color).y);
    const migi = from.neighbor(XY.HIDARI(nextMove.color).x, XY.HIDARI(nextMove.color).y);
    const hiku = from.neighbor(XY.HIKU(nextMove.color).x, XY.HIKU(nextMove.color).y);
    const hidariAgaru = from.neighbor(
      XY.MIGI_AGARU(nextMove.color).x,
      XY.MIGI_AGARU(nextMove.color).y,
    );
    const migiAgaru = from.neighbor(
      XY.HIDARI_AGARU(nextMove.color).x,
      XY.HIDARI_AGARU(nextMove.color).y,
    );
    const hidariHiku = from.neighbor(
      XY.MIGI_HIKU(nextMove.color).x,
      XY.MIGI_HIKU(nextMove.color).y,
    );
    const migiHiku = from.neighbor(
      XY.HIDARI_HIKU(nextMove.color).x,
      XY.HIDARI_HIKU(nextMove.color).y,
    );

    // 上
    if (ue.rank === to.rank) {
      po.push(PieceOperation.AGARU);
    }
    // 寄る
    if (
      (hidari.file === to.file && hidari.rank === to.rank) ||
      (migi.file === to.file && migi.rank === to.rank)
    ) {
      po.push(PieceOperation.YORU);
    }
    // 引く
    if (hiku.rank === to.rank) {
      po.push(PieceOperation.HIKU);
    }
    // 左
    if (hidari.file === to.file) {
      po.push(PieceOperation.HIDARI);
    }
    // 右
    if (migi.file === to.file) {
      po.push(PieceOperation.MIGI);
    }
    // 直ぐ
    if (ue.rank === to.rank && ue.file === to.file) {
      po.push(PieceOperation.SUGU);
    }
    // 左上
    if (hidariAgaru.rank === to.rank && hidariAgaru.file === to.file) {
      po.push(PieceOperation.HIDARI_AGARU);
    }
    // 左引く
    if (hidariHiku.rank === to.rank && hidariHiku.file === to.file) {
      po.push(PieceOperation.HIDARI_HIKU);
    }
    // 右上
    if (migiAgaru.rank === to.rank && migiAgaru.file === to.file) {
      po.push(PieceOperation.MIGI_AGARU);
    }
    // 右引く
    if (migiHiku.rank === to.rank && migiHiku.file === to.file) {
      po.push(PieceOperation.MIGI_HIKU);
    }
    return po;
  }

  // それぞれの動く可能性のある駒の呼び方一覧を取得する。
  operationCount(nextMove: Move, moveOperations: XY[]): Map<PieceOperation, number> {
    const count: Map<PieceOperation, number> = new Map<PieceOperation, number>();
    for (let i = 0; i < moveOperations.length; i++) {
      const ops = this.pieceOperationCanddate(nextMove, moveOperations[i]);

      for (const op of ops) {
        const opCount = count.get(op);
        if (opCount === undefined) {
          count.set(op, 1);
        } else {
          count.set(op, opCount + 1);
        }
      }
    }
    return count;
  }

  choiceOperation(operations: PieceOperation[]): PieceOperation {
    // 複数選択できる場合は、tier1を優先して返す
    // AGARU = "上", // 上方向への移動 tier 1
    // YORU = "寄", // 左右方向への移動　tier 1
    // HIKU = "引", // 下方向への移動 tier 1
    if (operations.length === 1) {
      return operations[0];
    }
    if (operations.includes(PieceOperation.AGARU)) {
      return PieceOperation.AGARU;
    } else if (operations.includes(PieceOperation.YORU)) {
      return PieceOperation.YORU;
    } else if (operations.includes(PieceOperation.HIKU)) {
      return PieceOperation.HIKU;
    }
    return operations[0];
  }

  // piceOperationによって音を変える。
  pieceOperationToSoundType(operation: PieceOperation): SoundType[] {
    const voices: SoundType[] = [];
    switch (operation) {
      case PieceOperation.AGARU:
        voices.push(SoundType.AGARU);
        break;
      case PieceOperation.YORU:
        voices.push(SoundType.YORU);
        break;
      case PieceOperation.HIKU:
        voices.push(SoundType.HIKU);
        break;
      case PieceOperation.HIDARI:
        voices.push(SoundType.HIDARI);
        break;
      case PieceOperation.MIGI:
        voices.push(SoundType.MIGI);
        break;
      case PieceOperation.SUGU:
        voices.push(SoundType.SUGU);
        break;
      case PieceOperation.HIDARI_AGARU:
        voices.push(SoundType.HIDARI);
        voices.push(SoundType.AGARU);
        break;
      case PieceOperation.HIDARI_HIKU:
        voices.push(SoundType.HIDARI);
        voices.push(SoundType.HIKU);
        break;
      case PieceOperation.MIGI_AGARU:
        voices.push(SoundType.MIGI);
        voices.push(SoundType.AGARU);
        break;
      case PieceOperation.MIGI_HIKU:
        voices.push(SoundType.MIGI);
        voices.push(SoundType.HIKU);
        break;
      case PieceOperation.UTU:
        voices.push(SoundType.UTU);
        break;
    }
    return voices;
  }

  goldOtherMoves(record: ImmutableRecord, nextMove: Move): SoundType[] {
    // 先手と後手で　上とか下の概念が変わる
    const voices: SoundType[] = [];

    const movableDirection: XY[] = [
      XY.HIDARI(nextMove.color),
      XY.MIGI(nextMove.color),
      XY.HIKU(nextMove.color),
      XY.UE(nextMove.color),
      XY.HIDARI_HIKU(nextMove.color),
      XY.MIGI_HIKU(nextMove.color),
    ];
    const aroundPieceDirection = this.aroundPieceDirection(movableDirection, record, nextMove);

    // 他にも動かせる駒があるとき
    if (aroundPieceDirection.length > 0) {
      //　打つ場合
      if (!(nextMove.from instanceof Square)) {
        voices.push(SoundType.UTU);
        return voices;
      }

      // 自身の行動方法
      const selfMove: XY = new XY(
        (nextMove.from.file - nextMove.to.file) * -1,
        nextMove.from.rank - nextMove.to.rank,
      );

      const selfOperation = this.pieceOperationCanddate(nextMove, selfMove);
      const otherOperationCount = this.operationCount(nextMove, aroundPieceDirection);

      const operationFinalList: PieceOperation[] = [];
      for (const ops of selfOperation) {
        if (otherOperationCount.get(ops) === undefined) {
          operationFinalList.push(ops);
        }
      }

      const operationExplain = this.choiceOperation(operationFinalList);
      voices.push(...this.pieceOperationToSoundType(operationExplain));
    }
    return voices;
  }

  shilverOtherMoves(record: ImmutableRecord, nextMove: Move): SoundType[] {
    const voices: SoundType[] = [];
    const movableDirection: XY[] = [
      XY.HIKU(nextMove.color),
      XY.HIDARI_HIKU(nextMove.color),
      XY.MIGI_HIKU(nextMove.color),
      XY.HIDARI_AGARU(nextMove.color),
      XY.MIGI_AGARU(nextMove.color),
    ];
    const aroundPieceDirection = this.aroundPieceDirection(movableDirection, record, nextMove);
    // 他にも動かせる駒があるとき
    if (aroundPieceDirection.length > 0) {
      //　打つ場合
      if (!(nextMove.from instanceof Square)) {
        voices.push(SoundType.UTU);
        return voices;
      }

      // 自身の行動方法
      const selfMove: XY = new XY(
        (nextMove.from.file - nextMove.to.file) * -1,
        nextMove.from.rank - nextMove.to.rank,
      );

      const selfOperation = this.pieceOperationCanddate(nextMove, selfMove);
      const otherOperationCount = this.operationCount(nextMove, aroundPieceDirection);

      const operationFinalList: PieceOperation[] = [];
      for (const ops of selfOperation) {
        if (otherOperationCount.get(ops) === undefined) {
          operationFinalList.push(ops);
        }
      }

      const operationExplain = this.choiceOperation(operationFinalList);
      voices.push(...this.pieceOperationToSoundType(operationExplain));
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
    const searchDirection: XY[] = [XY.HIKU(nextMove.color)]; // 下方向のみ
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

  operationVoice(record: ImmutableRecord): SoundType[] {
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
    voices.push(...this.promoteVoice(nextMove));
    voices.push(...this.operationVoice(record));

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
