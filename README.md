# できた！くん (じかんわり) / Kids Time Planner

小学 5 年生向けの自己管理時間割アプリ。
**道具・鏡・記録、そして同行者。** 監視しない、評価しない、管理しない、でも一緒にいる。

---

## ドキュメント

| 役割 | ファイル |
|---|---|
| 何を作るか (PRD) | [docs/Kids_TimePlanner_PRD_v1_1_1.docx](docs/Kids_TimePlanner_PRD_v1_1_1.docx) |
| どう作るか (Architecture) | [docs/Kids_TimePlanner_Architecture_v1_1.docx](docs/Kids_TimePlanner_Architecture_v1_1.docx) |
| 何時やるか (Plan) | [docs/Dekitakun_Project_Plan_v1_4.docx](docs/Dekitakun_Project_Plan_v1_4.docx) |
| 進捗スナップショット | [PHASE_STATUS.md](PHASE_STATUS.md) |

**迷ったら PHASE_STATUS.md を先に見る。** 何が終わっていて、何が次かが 1 画面で分かる。

---

## 開発

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b + vite build
npm run preview  # build 結果を確認
npm run lint
```

技術スタック: Vite + React 18 + TypeScript + LocalStorage (Phase 1〜3)

---

## 禁止ワード検査

実装前 / PR 前に以下を実行して 0 件を確認する：

```sh
grep -rni "failed\|failure\|missed\|incomplete\|error\|delayed\|遅れ\|遅延\|必ず\|しなければ\|まだ.*していない\|未完了\|失敗" src/
```

詳細は Architecture 6.1 / PRD 3.3 を参照。
