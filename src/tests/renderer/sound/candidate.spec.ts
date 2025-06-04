import { Record, importKIF, Move, SpecialMoveType, Square, specialMove } from "tsshogi";
import { Candidate, PieceOperationSound } from "@/renderer/sound/candidate";
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
| ・ ・ ・v銀 ・ ・v銀 ・ ・|一
| ・ ・ ・ ・ ・ ・ ・ ・ ・|二
| ・v銀 ・ ・ ・v銀 ・ ・ ・|三
| ・ ・ ・v金 ・ ・ ・ ・ ・|四
| ・ ・v金 ・ ・ ・ ・ ・ ・|五
| ・ ・ ・ ・ ・ ・ ・ ・ ・|六
| ・ ・ v金・ ・ ・ ・ ・v金|七
| ・ ・ ・ ・ ・ ・v金 ・ ・|八
| ・ v金・ ・ ・ ・ ・ ・ ・|九
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
    ];

    for (const c of testCases) {
      const data = c.initBoard + c.records;
      const record = importKIF(data) as Record;
      record.goto(0);
      expect(record.current.next).not.toBeNull();
      const pos = new PieceOperationSound(record);
      const result = pos.getPieceOperation();
      expect(result).toEqual(c.answer);
    }
  });
});

// describe("candidate", () => {
//   it("get no candidate", () => {
//     const data = `手合割：平手
//    1 ４八金(49)
//    2 ４二金(41)
//    3 ３八銀(39)
//    4 ３二銀(31)
//    11 投了
// `;
//     const record = importKIF(data) as Record;
//     record.goto(0);
//     expect(record.current.next).not.toBeNull();
//     const candidate = new Candidate(record);
//     expect(candidate.getCandidate()).toHaveLength(0);
//     record.goto(4);
//     expect(record.current.next).not.toBeNull();
//     expect(record.current.next?.move).toStrictEqual(specialMove(SpecialMoveType.RESIGN));
//   });

//   it("get multi candidate for gold move", () => {
//     const data = `
// 後手の持駒：金二
//   ９ ８ ７ ６ ５ ４ ３ ２ １
// +---------------------------+
// | ・ 金 ・ ・ ・ ・v金 ・ ・|一
// | 金 ・ ・ ・ ・ ・ ・ ・ ・|二
// | 金 金 金 ・ ・ 金 金 金 ・|三
// | ・ ・ ・ ・v王 ・ 金 ・ ・|四
// | ・ ・ ・ ・ 王 ・ ・ ・ ・|五
// | ・ ・ ・ ・ ・ ・v金 ・ ・|六
// |v金v金v金 ・ ・v金v金v金 ・|七
// |v金 ・ ・ ・ ・ ・ ・ ・ ・|八
// | ・v金 ・ ・ ・ ・ 金 ・ ・|九
// +---------------------------+
// 先手の持駒：金二
// 先手番
// 手数----指手---------消費時間--
//    1 ３二金(33)        ( 0:00/00:00:00)
//    2 ３八金(37)        ( 0:00/00:00:00)
//    3 ８二金(83)        ( 0:00/00:00:00)
//    4 ８八金(87)        ( 0:00/00:00:00)
//    5 ３三金(32)        ( 0:00/00:00:00)
//    6 ３七金(38)        ( 0:00/00:00:00)
//    7 ８三金(82)        ( 0:00/00:00:00)
//    8 ８七金(88)        ( 0:00/00:00:00)
//    9 ８二金打          ( 0:00/00:00:00)
//   10 ８八金打          ( 0:00/00:00:00)
//     `;
//     const testCases: { name: string; data: string; goto: number; expect: Square[] }[] = [
//       {
//         name: "1手目 先手",
//         data: data,
//         goto: 0,
//         expect: [new Square(4, 3), new Square(2, 3)],
//       },
//       {
//         name: "2手目 後手",
//         data: data,
//         goto: 1,
//         expect: [new Square(4, 7), new Square(2, 7)],
//       },
//       {
//         name: "3手目 先手",
//         data: data,
//         goto: 2,
//         expect: [new Square(8, 1), new Square(9, 2), new Square(9, 3), new Square(7, 3)],
//       },
//       {
//         name: "4手目 後手",
//         data: data,
//         goto: 3,
//         expect: [new Square(9, 7), new Square(7, 7), new Square(9, 8), new Square(8, 9)],
//       },
//       {
//         name: "9手目 (打つ) 先手",
//         data: data,
//         goto: 8,
//         expect: [
//           new Square(8, 1),
//           new Square(9, 2),
//           new Square(9, 3),
//           new Square(7, 3),
//           new Square(8, 3),
//         ],
//       },
//       {
//         name: "10手目 (打つ)",
//         data: data,
//         goto: 9,
//         expect: [
//           new Square(8, 9),
//           new Square(7, 7),
//           new Square(9, 7),
//           new Square(8, 7),
//           new Square(9, 8),
//         ],
//       },
//     ];

//     for (const c of testCases) {
//       console.log(c.name);
//       const record = importKIF(c.data) as Record;
//       record.goto(c.goto);
//       expect(record.current.next).not.toBeNull();

//       const candidate = new Candidate(record);
//       const cList: Square[] = candidate.getCandidate();
//       expect(cList).toHaveLength(c.expect.length);
//       expect(cList).toEqual(expect.arrayContaining(c.expect));
//     }
//   });

//   it("get multi candidate for shilver move", () => {
//     const data = `
// 後手の持駒：銀二
//   ９ ８ ７ ６ ５ ４ ３ ２ １
// +---------------------------+
// | 銀 ・ 銀 ・ ・ ・ 銀 ・ ・|一
// | ・ ・ ・ ・ ・ ・ ・ ・ ・|二
// | 銀 銀 銀 ・ ・ 銀v銀 銀 ・|三
// | ・ ・ ・ ・v王 ・ ・ ・ ・|四
// | ・ ・ ・ ・ 王 ・ ・ ・ ・|五
// | ・ ・ ・ ・ ・ ・v銀 ・ ・|六
// |v銀v銀v銀 ・ ・v銀 銀v銀 ・|七
// |v銀 ・ ・ ・ ・ ・ ・ ・ ・|八
// | ・v銀 ・ ・ ・ ・ 銀 ・ ・|九
// +---------------------------+
// 先手の持駒：銀二
// 先手番
// 手数----指手---------消費時間--
//    1 ８二銀(83)        ( 0:00/00:00:00)
//    2 ８八銀(87)        ( 0:00/00:00:00)
//    3 ３二銀(43)        ( 0:00/00:00:00)
//    4 ３八銀(47)        ( 0:00/00:00:00)
//    5 ８三銀(82)        ( 0:00/00:00:00)
//    6 ８七銀(88)        ( 0:00/00:00:00)
//    7 ４三銀(32)        ( 0:00/00:00:00)
//    8 ４七銀(38)        ( 0:00/00:00:00)
//    9 ８二銀打          ( 0:00/00:00:00)
//   10 ８八銀打          ( 0:00/00:00:00)
//     `;
//     const testCases: { name: string; data: string; goto: number; expect: Square[] }[] = [
//       {
//         name: "1手目 先手",
//         data: data,
//         goto: 0,
//         expect: [new Square(9, 1), new Square(7, 1), new Square(9, 3), new Square(7, 3)],
//       },
//       {
//         name: "2手目 後手",
//         data: data,
//         goto: 1,
//         expect: [new Square(9, 7), new Square(7, 7)],
//       },
//       {
//         name: "3手目 先手",
//         data: data,
//         goto: 2,
//         expect: [new Square(2, 3)],
//       },
//       {
//         name: "4手目 後手",
//         data: data,
//         goto: 3,
//         expect: [new Square(2, 7)],
//       },
//       {
//         name: "9手目 (打つ) 先手",
//         data: data,
//         goto: 8,
//         expect: [
//           new Square(9, 1),
//           new Square(7, 1),
//           new Square(9, 3),
//           new Square(7, 3),
//           new Square(8, 3),
//         ],
//       },
//       {
//         name: "10手目 (打つ)",
//         data: data,
//         goto: 9,
//         expect: [new Square(9, 7), new Square(8, 7), new Square(7, 7)],
//       },
//     ];

//     for (const c of testCases) {
//       console.log(c.name);
//       const record = importKIF(c.data) as Record;
//       record.goto(c.goto);
//       expect(record.current.next).not.toBeNull();

//       const candidate = new Candidate(record);
//       const cList: Square[] = candidate.getCandidate();
//       expect(cList).toHaveLength(c.expect.length);
//       expect(cList).toEqual(expect.arrayContaining(c.expect));
//     }
//   });

//   it("get multi candidate for lance move", () => {
//     const data = `
// 後手の持駒：香二
//   ９ ８ ７ ６ ５ ４ ３ ２ １
// +---------------------------+
// |v香 ・ ・ ・ ・ ・ ・ ・ ・|一
// | ・ ・ ・ ・ ・ ・ ・ ・ ・|二
// | ・ ・ ・ ・ ・ ・ ・ ・ ・|三
// | ・ ・ ・ ・v王 ・ ・ ・ ・|四
// | ・ ・ ・ ・ 王 ・ ・ ・ ・|五
// |v香 ・ ・ ・ ・ ・ ・ ・ 香|六
// | ・ ・ ・ ・ ・ ・ ・ ・ ・|七
// | ・ ・ ・ ・ ・ ・ ・ ・ ・|八
// | ・ ・ ・ ・ ・ ・ ・ ・ 香|九
// +---------------------------+
// 先手の持駒：香二
// 先手番
// 手数----指手---------消費時間--
//    1 １二香(16)        ( 0:00/00:00:00)
//    2 ９五香(91)        ( 0:00/00:00:00)
//    5 １五香打          ( 0:00/00:00:00)
//    6 ９八香打          ( 0:00/00:00:00)
//     `;
//     const testCases: { name: string; data: string; goto: number; expect: Square[] }[] = [
//       {
//         name: "1手目 先手",
//         data: data,
//         goto: 0,
//         expect: [],
//       },
//       {
//         name: "2手目 後手",
//         data: data,
//         goto: 1,
//         expect: [],
//       },
//       {
//         name: "3手目 先手",
//         data: data,
//         goto: 2,
//         expect: [new Square(1, 9)],
//       },
//       {
//         name: "4手目 後手",
//         data: data,
//         goto: 3,
//         expect: [new Square(9, 6)],
//       },
//     ];

//     for (const c of testCases) {
//       console.log(c.name);
//       const record = importKIF(c.data) as Record;
//       record.goto(c.goto);
//       expect(record.current.next).not.toBeNull();

//       const candidate = new Candidate(record);
//       const cList: Square[] = candidate.getCandidate();
//       expect(cList).toHaveLength(c.expect.length);
//       expect(cList).toEqual(expect.arrayContaining(c.expect));
//     }
//   });
// });
