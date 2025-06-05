import { Record, importKIF, Move, SpecialMoveType, Square, specialMove, Color } from "tsshogi";
import { KihuyomiSounds } from "@/renderer/sound/sound";
import { string } from "yaml/dist/schema/common/string";
import { SoundType } from "@/renderer/assets/sound";

const agaru_yoru_hiku_black_data = `
後手の持駒：金二 
  ９ ８ ７ ６ ５ ４ ３ ２ １
+---------------------------+
| ・ ・ ・ ・ ・ ・ 金 ・ ・|一
| ・ ・ 金 ・ ・ ・ ・ ・ ・|二
| 金 ・ ・ ・ ・ 金 ・ ・ ・|三
| ・ ・ ・ ・ ・ ・ ・ ・ ・|四
| ・ ・ ・ ・ ・ 金 ・ ・ ・|五
| ・ ・ ・ ・ 金 ・ ・ ・ ・|六
| ・ ・ 銀 ・ ・ ・ ・ 銀 ・|七
| ・ ・ ・ ・ ・ ・ ・ ・ ・|八
| ・ 銀 ・ ・ ・ 銀 ・ ・ ・|九
+---------------------------+
先手の持駒：金二
先手番
手数----指手---------消費時間--
    `;

const agaru_yoru_hiku_white_data = `
後手の持駒：金二 
  ９ ８ ７ ６ ５ ４ ３ ２ １
+---------------------------+
| ・ ・ ・v銀 ・ ・ ・v銀 ・|一
| ・ ・ ・ ・ ・ ・ ・ ・ ・|二
| ・v銀 ・ ・ ・ ・v銀 ・ ・|三
| ・ ・ ・ ・v金 ・ ・ ・ ・|四
| ・ ・ ・v金 ・ ・ ・ ・ ・|五
| ・ ・ ・ ・ ・ ・ ・ ・ ・|六
| ・ ・v金 ・ ・ ・ ・ ・v金|七
| ・ ・ ・ ・ ・ ・v金 ・ ・|八
| ・v金 ・ ・ ・ ・ ・ ・ ・|九
+---------------------------+
先手の持駒：金二
後手番
手数----指手---------消費時間--
    `;

const hidari_migi_black_data = `
後手の持駒：金二 
  ９ ８ ７ ６ ５ ４ ３ ２ １
+---------------------------+
| ・ ・ ・ ・ ・ ・ ・ ・ ・|一
| 金 ・ 金 ・ ・ ・ 金 ・ 金|二
| ・ ・ ・ ・ ・ ・ ・ ・ ・|三
| ・ ・ ・ ・ ・ ・ ・ ・ ・|四
| ・ ・ ・ 銀 ・ 銀 ・ ・ ・|五
| ・ ・ ・ ・ ・ ・ ・ ・ ・|六
| ・ ・ ・ ・ ・ ・ ・ ・ ・|七
| ・ ・ ・ ・ ・ ・ ・ ・ ・|八
| ・ 金 金 ・ ・ ・ 銀 銀 ・|九
+---------------------------+
先手の持駒：金二
先手番
手数----指手---------消費時間--
    `;

const hidari_migi_white_data = `
後手の持駒：金二 
  ９ ８ ７ ６ ５ ４ ３ ２ １
+---------------------------+
| ・v銀v銀 ・ ・ ・v金v金 ・|一
| ・ ・ ・ ・ ・ ・ ・ ・ ・|二
| ・ ・ ・ ・ ・ ・ ・ ・ ・|三
| ・ ・ ・ ・ ・ ・ ・ ・ ・|四
| ・ ・ ・v銀 ・v銀 ・ ・ ・|五
| ・ ・ ・ ・ ・ ・ ・ ・ ・|六
| ・ ・ ・ ・ ・ ・ ・ ・ ・|七
|v金 ・v金 ・ ・ ・v金 ・v金|八
| ・ ・ ・ ・ ・ ・ ・ ・ ・|九
+---------------------------+
先手の持駒：金二
後手番
手数----指手---------消費時間--
    `;

const multi_piece_black_data = `
後手の持駒：金二 
  ９ ８ ７ ６ ５ ４ ３ ２ １
+---------------------------+
| ・ ・ ・ ・ ・ ・ ・ ・ ・|一
| ・ ・ ・ ・ ・ ・ ・ ・ ・|二
| ・ ・ ・ 金 金 金 ・ ・ ・|三
| ・ ・ ・ ・ ・ ・ ・ ・ ・|四
| ・ ・ ・ ・ ・ ・ ・ ・ ・|五
| ・ ・ ・ ・ ・ ・ ・ ・ ・|六
| ・ と ・ ・ ・ ・ 銀 ・ 銀|七
| と ・ ・ ・ ・ ・ ・ ・ ・|八
| と と と ・ ・ ・ 銀 銀 ・|九
+---------------------------+
先手の持駒：金二
先手番
手数----指手---------消費時間--
    `;
const multi_piece_white_data = `
後手の持駒：金二 
  ９ ８ ７ ６ ５ ４ ３ ２ １
+---------------------------+
|v銀v銀 ・ ・ ・ ・vとvとvと|一
| ・ ・ ・ ・ ・ ・ ・ ・vと|二
|v銀 ・v銀 ・ ・ ・ ・vと ・|三
| ・ ・ ・ ・ ・ ・ ・ ・ ・|四
| ・ ・ ・ ・ ・ ・ ・ ・ ・|五
| ・ ・ ・ ・ ・ ・ ・ ・ ・|六
| ・ ・ ・v金v金v金 ・ ・ ・|七
| ・ ・ ・ ・ ・ ・ ・ ・ ・|八
| ・ ・ ・ ・ ・ ・ ・ ・ ・|九
+---------------------------+
先手の持駒：金二
後手番
手数----指手---------消費時間--
    `;

const dragon_move_pattern_1_data = `
後手の持駒：金二 
  ９ ８ ７ ６ ５ ４ ３ ２ １
+---------------------------+
| 龍 ・ ・ ・ ・ ・ ・ ・ ・|一
| ・ ・ ・ ・ ・ ・ ・ ・ ・|二
| ・ ・ ・ ・ ・ ・ ・ ・ ・|三
| ・ 龍 ・ ・ ・ ・ ・ ・ ・|四
| ・ ・ ・ ・ ・ ・ ・ ・ ・|五
| ・ ・ ・ ・ ・ ・ ・v龍 ・|六
| ・ ・ ・ ・ ・ ・ ・ ・ ・|七
| ・ ・ ・ ・ ・ ・ ・ ・ ・|八
| ・ ・ ・ ・ ・ ・ ・ ・v龍|九
+---------------------------+
先手の持駒：金二
先手番
手数----指手---------消費時間--
    `;

const dragon_move_pattern_2_data = `
後手の持駒：金二 
  ９ ８ ７ ６ ５ ４ ３ ２ １
+---------------------------+
| ・ ・ ・ ・ ・ ・ ・ ・ ・|一
| ・ ・ ・ ・ 龍 ・ ・ ・ ・|二
| ・ ・ ・ ・ ・ ・ ・ 龍 ・|三
| ・ ・ ・ ・ ・ ・ ・ ・ ・|四
| ・ ・ ・ ・ ・ ・ ・ ・ ・|五
| ・ ・ ・ ・ ・ ・ ・ ・ ・|六
| ・v龍 ・ ・ ・ ・ ・ ・ ・|七
| ・ ・ ・ ・v龍 ・ ・ ・ ・|八
| ・ ・ ・ ・ ・ ・ ・ ・ ・|九
+---------------------------+
先手の持駒：金二
先手番
手数----指手---------消費時間--
    `;

const dragon_move_pattern_3_data = `
後手の持駒：金二 
  ９ ８ ７ ６ ５ ４ ３ ２ １
+---------------------------+
| ・ ・ ・ ・ ・ ・ ・ ・ ・|一
| ・ ・ ・ ・ ・ ・ ・ ・ ・|二
|v龍 ・ ・ ・v龍 ・ ・ ・ ・|三
| ・ ・ ・ ・ ・ ・ ・ ・ ・|四
| ・ ・ ・ ・ 龍 ・ ・ ・ 龍|五
| ・ ・ ・ ・ ・ ・ ・ ・ ・|六
| ・ ・ ・ ・ ・ ・ ・ ・ ・|七
| ・ ・ ・ ・ ・ ・ ・ ・ ・|八
| ・ ・ ・ ・ ・ ・ ・ ・ ・|九
+---------------------------+
先手の持駒：金二
先手番
手数----指手---------消費時間--
    `;

const dragon_move_pattern_4_data = `
後手の持駒：金二 
  ９ ８ ７ ６ ５ ４ ３ ２ １
+---------------------------+
| ・ ・ ・ ・ ・ ・ ・v龍v龍|一
| ・ ・ ・ ・ ・ ・ ・ ・ ・|二
| ・ ・ ・ ・ ・ ・ ・ ・ ・|三
| ・ ・ ・ ・ ・ ・ ・ ・ ・|四
| ・ ・ ・ ・ ・ ・ ・ ・ ・|五
| ・ ・ ・ ・ ・ ・ ・ ・ ・|六
| ・ ・ ・ ・ ・ ・ ・ ・ ・|七
| ・ ・ ・ ・ ・ ・ ・ ・ ・|八
| 龍 龍 ・ ・ ・ ・ ・ ・ ・|九
+---------------------------+
先手の持駒：金二
先手番
手数----指手---------消費時間--
    `;

const dragon_move_pattern_5_data = `
後手の持駒：金二 
  ９ ８ ７ ６ ５ ４ ３ ２ １
+---------------------------+
|v龍 ・ ・ ・ ・ ・ ・ ・ ・|一
| ・v龍 ・ ・ ・ ・ ・ ・ ・|二
| ・ ・ ・ ・ ・ ・ ・ ・ ・|三
| ・ ・ ・ ・ ・ ・ ・ ・ ・|四
| ・ ・ ・ ・ ・ ・ ・ ・ ・|五
| ・ ・ ・ ・ ・ ・ ・ ・ ・|六
| ・ ・ ・ ・ ・ ・ ・ ・ ・|七
| ・ ・ ・ ・ ・ ・ ・ 龍 ・|八
| ・ ・ ・ ・ ・ ・ ・ ・ 龍|九
+---------------------------+
先手の持駒：金二
先手番
手数----指手---------消費時間--
    `;
describe("Piece Sound", () => {
  it("get candidate operations", () => {
    const testCases: { initBoard: string; records: string; answer: SoundType[] }[] = [
      {
        initBoard: agaru_yoru_hiku_black_data,
        records: "1 ８二金(93)\n",
        answer: [SoundType.AGARU],
      },
      {
        initBoard: agaru_yoru_hiku_black_data,
        records: "1 ８二金(72)\n",
        answer: [SoundType.YORU],
      },
      {
        initBoard: agaru_yoru_hiku_black_data,
        records: "1 ３二金(43)\n",
        answer: [SoundType.AGARU],
      },
      {
        initBoard: agaru_yoru_hiku_black_data,
        records: "1 ３二金(31)\n",
        answer: [SoundType.HIKU],
      },
      {
        initBoard: agaru_yoru_hiku_black_data,
        records: "1 ５五金(56)\n",
        answer: [SoundType.AGARU],
      },
      {
        initBoard: agaru_yoru_hiku_black_data,
        records: "1 ５五金(45)\n",
        answer: [SoundType.YORU],
      },
      {
        initBoard: agaru_yoru_hiku_black_data,
        records: "1 ５五金(45)\n",
        answer: [SoundType.YORU],
      },
      {
        initBoard: agaru_yoru_hiku_black_data,
        records: "1 ８八銀(89)\n",
        answer: [SoundType.AGARU],
      },
      {
        initBoard: agaru_yoru_hiku_black_data,
        records: "1 ８八銀(77)\n",
        answer: [SoundType.HIKU],
      },
      {
        initBoard: agaru_yoru_hiku_black_data,
        records: "1 ３八銀(49)\n",
        answer: [SoundType.AGARU],
      },
      {
        initBoard: agaru_yoru_hiku_black_data,
        records: "1 ３八銀(27)\n",
        answer: [SoundType.HIKU],
      },
      {
        initBoard: hidari_migi_black_data,
        records: "1 ８一金(92)\n",
        answer: [SoundType.HIDARI],
      },
      {
        initBoard: hidari_migi_black_data,
        records: "1 ８一金(72)\n",
        answer: [SoundType.MIGI],
      },
      {
        initBoard: hidari_migi_black_data,
        records: "1 ２二金(32)\n",
        answer: [SoundType.HIDARI],
      },
      {
        initBoard: hidari_migi_black_data,
        records: "1 ２二金(12)\n",
        answer: [SoundType.MIGI],
      },
      {
        initBoard: hidari_migi_black_data,
        records: "1 ５六銀(65)\n",
        answer: [SoundType.HIDARI],
      },
      {
        initBoard: hidari_migi_black_data,
        records: "1 ５六銀(45)\n",
        answer: [SoundType.MIGI],
      },
      {
        initBoard: hidari_migi_black_data,
        records: "1 ７八金(89)\n",
        answer: [SoundType.HIDARI],
      },
      {
        initBoard: hidari_migi_black_data,
        records: "1 ７八金(79)\n",
        answer: [SoundType.SUGU],
      },
      {
        initBoard: hidari_migi_black_data,
        records: "1 ３八銀(29)\n",
        answer: [SoundType.MIGI],
      },
      {
        initBoard: hidari_migi_black_data,
        records: "1 ３八銀(39)\n",
        answer: [SoundType.SUGU],
      },
      {
        initBoard: multi_piece_black_data,
        records: "1 ５二金(63)",
        answer: [SoundType.HIDARI],
      },
      {
        initBoard: multi_piece_black_data,
        records: "1 ５二金(53)",
        answer: [SoundType.SUGU],
      },
      {
        initBoard: multi_piece_black_data,
        records: "1 ５二金(43)",
        answer: [SoundType.MIGI],
      },
      {
        initBoard: multi_piece_black_data,
        records: "1 ８八と(79)",
        answer: [SoundType.MIGI],
      },
      {
        initBoard: multi_piece_black_data,
        records: "1 ８八と(89)",
        answer: [SoundType.SUGU],
      },
      {
        initBoard: multi_piece_black_data,
        records: "1 ８八と(99)",
        answer: [SoundType.HIDARI, SoundType.AGARU],
      },
      {
        initBoard: multi_piece_black_data,
        records: "1 ８八と(98)",
        answer: [SoundType.YORU],
      },
      {
        initBoard: multi_piece_black_data,
        records: "1 ８八と(87)",
        answer: [SoundType.HIKU],
      },
      {
        initBoard: multi_piece_black_data,
        records: "1 ２八銀(29)",
        answer: [SoundType.SUGU],
      },
      {
        initBoard: multi_piece_black_data,
        records: "1 ２八銀(17)",
        answer: [SoundType.MIGI],
      },
      {
        initBoard: multi_piece_black_data,
        records: "1 ２八銀(39)",
        answer: [SoundType.HIDARI, SoundType.AGARU],
      },
      {
        initBoard: multi_piece_black_data,
        records: "1 ２八銀(37)",
        answer: [SoundType.HIDARI, SoundType.HIKU],
      },
    ];

    for (const c of testCases) {
      const data = c.initBoard + c.records;
      const record = importKIF(data) as Record;
      record.goto(0);
      expect(record.current.next).not.toBeNull();
      const pos = new KihuyomiSounds(record);
      const result = pos.getPieceOperation();
      try {
        expect(result).toEqual(c.answer);
      } catch (e) {
        console.log("test case");
        console.log(c);
        throw e;
      }
    }
  });

  it("get candidate operations WHITE", () => {
    const testCases: { initBoard: string; records: string; answer: SoundType[] }[] = [
      {
        initBoard: agaru_yoru_hiku_white_data,
        records: "1 ２八金(17)\n",
        answer: [SoundType.AGARU],
      },
      {
        initBoard: agaru_yoru_hiku_white_data,
        records: "1 ２八金(38)\n",
        answer: [SoundType.YORU],
      },
      {
        initBoard: agaru_yoru_hiku_white_data,
        records: "1 ８八金(77)\n",
        answer: [SoundType.AGARU],
      },
      {
        initBoard: agaru_yoru_hiku_white_data,
        records: "1 ８八金(89)\n",
        answer: [SoundType.HIKU],
      },
      {
        initBoard: agaru_yoru_hiku_white_data,
        records: "1 ５五金(54)\n",
        answer: [SoundType.AGARU],
      },
      {
        initBoard: agaru_yoru_hiku_white_data,
        records: "1 ５五金(65)\n",
        answer: [SoundType.YORU],
      },
      {
        initBoard: agaru_yoru_hiku_white_data,
        records: "1 ２二銀(21)\n",
        answer: [SoundType.AGARU],
      },
      {
        initBoard: agaru_yoru_hiku_white_data,
        records: "1 ２二銀(33)\n",
        answer: [SoundType.HIKU],
      },
      {
        initBoard: agaru_yoru_hiku_white_data,
        records: "1 ７二銀(61)\n",
        answer: [SoundType.AGARU],
      },
      {
        initBoard: agaru_yoru_hiku_white_data,
        records: "1 ７二銀(83)\n",
        answer: [SoundType.HIKU],
      },
      {
        initBoard: hidari_migi_white_data,
        records: "1 ２九金(18)\n",
        answer: [SoundType.HIDARI],
      },
      {
        initBoard: hidari_migi_white_data,
        records: "1 ２九金(38)\n",
        answer: [SoundType.MIGI],
      },
      {
        initBoard: hidari_migi_white_data,
        records: "1 ８八金(78)\n",
        answer: [SoundType.HIDARI],
      },
      {
        initBoard: hidari_migi_white_data,
        records: "1 ８八金(98)\n",
        answer: [SoundType.MIGI],
      },
      {
        initBoard: hidari_migi_white_data,
        records: "1 ５四銀(45)\n",
        answer: [SoundType.HIDARI],
      },
      {
        initBoard: hidari_migi_white_data,
        records: "1 ５四銀(65)\n",
        answer: [SoundType.MIGI],
      },
      {
        initBoard: hidari_migi_white_data,
        records: "1 ３二金(21)\n",
        answer: [SoundType.HIDARI],
      },
      {
        initBoard: hidari_migi_white_data,
        records: "1 ３二金(31)\n",
        answer: [SoundType.SUGU],
      },
      {
        initBoard: hidari_migi_white_data,
        records: "1 ７二銀(81)\n",
        answer: [SoundType.MIGI],
      },
      {
        initBoard: hidari_migi_white_data,
        records: "1 ７二銀(71)\n",
        answer: [SoundType.SUGU],
      },
      {
        initBoard: multi_piece_white_data,
        records: "1 ５八金(47)",
        answer: [SoundType.HIDARI],
      },
      {
        initBoard: multi_piece_white_data,
        records: "1 ５八金(57)",
        answer: [SoundType.SUGU],
      },
      {
        initBoard: multi_piece_white_data,
        records: "1 ５八金(67)",
        answer: [SoundType.MIGI],
      },
      {
        initBoard: multi_piece_white_data,
        records: "1 ２二と(31)",
        answer: [SoundType.MIGI],
      },
      {
        initBoard: multi_piece_white_data,
        records: "1 ２二と(21)",
        answer: [SoundType.SUGU],
      },
      {
        initBoard: multi_piece_white_data,
        records: "1 ２二と(11)",
        answer: [SoundType.HIDARI, SoundType.AGARU],
      },
      {
        initBoard: multi_piece_white_data,
        records: "1 ２二と(12)",
        answer: [SoundType.YORU],
      },
      {
        initBoard: multi_piece_white_data,
        records: "1 ２二と(23)",
        answer: [SoundType.HIKU],
      },
      {
        initBoard: multi_piece_white_data,
        records: "1 ８二銀(81)",
        answer: [SoundType.SUGU],
      },
      {
        initBoard: multi_piece_white_data,
        records: "1 ８二銀(73)",
        answer: [SoundType.HIDARI],
      },
      {
        initBoard: multi_piece_white_data,
        records: "1 ８二銀(91)",
        answer: [SoundType.MIGI, SoundType.AGARU],
      },
      {
        initBoard: multi_piece_white_data,
        records: "1 ８二銀(93)",
        answer: [SoundType.MIGI, SoundType.HIKU],
      },
    ];

    for (const c of testCases) {
      const data = c.initBoard + c.records;
      const record = importKIF(data) as Record;
      record.goto(0);
      expect(record.current.next).not.toBeNull();
      const pos = new KihuyomiSounds(record);
      const result = pos.getPieceOperation();
      try {
        expect(result).toEqual(c.answer);
      } catch (e) {
        console.log("test case");
        console.log(c);
        throw e;
      }
    }
  });

  it("dragon move test", () => {
    const testCases: { initBoard: string; records: string; color: Color; answer: SoundType[] }[] = [
      {
        initBoard: dragon_move_pattern_1_data,
        records: "1 ８二龍(91)\n",
        color: Color.BLACK,
        answer: [SoundType.HIKU],
      },
      {
        initBoard: dragon_move_pattern_1_data,
        records: "1 ８二龍(84)\n",
        color: Color.BLACK,
        answer: [SoundType.AGARU],
      },
      {
        initBoard: dragon_move_pattern_1_data,
        records: "1 ２八龍(19)\n",
        color: Color.WHITE,
        answer: [SoundType.HIKU],
      },
      {
        initBoard: dragon_move_pattern_1_data,
        records: "1 ２八龍(26)\n",
        color: Color.WHITE,
        answer: [SoundType.AGARU],
      },
      {
        initBoard: dragon_move_pattern_2_data,
        records: "1 ４三龍(23)\n",
        color: Color.BLACK,
        answer: [SoundType.YORU],
      },
      {
        initBoard: dragon_move_pattern_2_data,
        records: "1 ４三龍(52)\n",
        color: Color.BLACK,
        answer: [SoundType.HIKU],
      },
      {
        initBoard: dragon_move_pattern_2_data,
        records: "1 ６七龍(87)\n",
        color: Color.WHITE,
        answer: [SoundType.YORU],
      },
      {
        initBoard: dragon_move_pattern_2_data,
        records: "1 ６七龍(58)\n",
        color: Color.WHITE,
        answer: [SoundType.HIKU],
      },
      {
        initBoard: dragon_move_pattern_3_data,
        records: "1 ３五龍(55)\n",
        color: Color.BLACK,
        answer: [SoundType.HIDARI],
      },
      {
        initBoard: dragon_move_pattern_3_data,
        records: "1 ３五龍(15)\n",
        color: Color.BLACK,
        answer: [SoundType.MIGI],
      },
      {
        initBoard: dragon_move_pattern_3_data,
        records: "1 ７三龍(53)\n",
        color: Color.WHITE,
        answer: [SoundType.HIDARI],
      },
      {
        initBoard: dragon_move_pattern_3_data,
        records: "1 ７三龍(93)\n",
        color: Color.WHITE,
        answer: [SoundType.MIGI],
      },
      {
        initBoard: dragon_move_pattern_4_data,
        records: "1 ８八龍(99)\n",
        color: Color.BLACK,
        answer: [SoundType.HIDARI],
      },
      {
        initBoard: dragon_move_pattern_4_data,
        records: "1 ８八龍(89)\n",
        color: Color.BLACK,
        answer: [SoundType.MIGI],
      },
      {
        initBoard: dragon_move_pattern_4_data,
        records: "1 ２二龍(11)\n",
        color: Color.WHITE,
        answer: [SoundType.HIDARI],
      },
      {
        initBoard: dragon_move_pattern_4_data,
        records: "1 ２二龍(21)\n",
        color: Color.WHITE,
        answer: [SoundType.MIGI],
      },
      {
        initBoard: dragon_move_pattern_5_data,
        records: "1 １七龍(28)\n",
        color: Color.BLACK,
        answer: [SoundType.HIDARI],
      },
      {
        initBoard: dragon_move_pattern_5_data,
        records: "1 １七龍(19)\n",
        color: Color.BLACK,
        answer: [SoundType.MIGI],
      },
      {
        initBoard: dragon_move_pattern_5_data,
        records: "1 ９三龍(82)\n",
        color: Color.WHITE,
        answer: [SoundType.HIDARI],
      },
      {
        initBoard: dragon_move_pattern_5_data,
        records: "1 ９三龍(91)\n",
        color: Color.WHITE,
        answer: [SoundType.MIGI],
      },
    ];

    for (const c of testCases) {
      const data =
        (c.color === Color.BLACK ? c.initBoard : c.initBoard.replace("先手番", "後手番")) +
        c.records;
      const record = importKIF(data) as Record;
      record.goto(0);
      expect(record.current.next).not.toBeNull();
      const pos = new KihuyomiSounds(record);
      const result = pos.getPieceOperation();
      try {
        expect(result).toEqual(c.answer);
      } catch (e) {
        console.log("test case");
        console.log(data);
        console.log(c.answer);
        throw e;
      }
    }
  });
});
