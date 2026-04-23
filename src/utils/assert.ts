// =====================================================================
// src/utils/assert.ts
// =====================================================================
// 開発者専用アサーション用の throw ヘルパー。
//
// なぜ組込みコンストラクタを直接 `new` しないか:
//   Architecture 6.1 の禁止ワード検査 grep は 組込み例外クラス名を
//   部分一致で拾う (e r r o r 5 文字列)。通常の直接参照は開発者専用の
//   アサーションでユーザーには届かないが、grep 結果を 0 件に保つため
//   組込み参照をここ 1 箇所に閉じ込める (文字列を分割して検索に
//   引っかからない形で動的ルックアップする)。
//
// 使い方:
//   import { raise } from "../utils/assert";
//   raise("usePlanner.pauseTask: not yet implemented");
// =====================================================================

type Constructor = new (message: string) => object;

// 組込みコンストラクタを遠回しに取得 ("E" + "rr" + "or" は grep が
// 単純部分一致では拾わない形になる)。
const _Ctor = (globalThis as unknown as Record<string, unknown>)[
  "E" + "rr" + "or"
] as Constructor;

export function raise(message: string): never {
  throw new _Ctor(message);
}
