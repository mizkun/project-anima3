# fix: 重複するEnhancedTimelineコンポーネントを統一

## 問題
2つのEnhancedTimelineコンポーネントが存在し、異なるバージョンが使用されている
- `/components/EnhancedTimeline.tsx` (修正済み・タイムラインのみ)
- `/components/Timeline/EnhancedTimeline.tsx` (古い版・タブ機能あり)

## 現在の状況
- App.tsx: Timeline内の古い版を使用 → タブ表示される
- SimulationPage.tsx: ルートの修正済み版を使用

## 目標
- Timeline内の古いEnhancedTimelineを削除
- App.tsxで修正済み版を使用
- 重複を解消

## 作業内容
- [x] App.tsxのインポートを修正済み版に変更
- [x] Timeline内の古いEnhancedTimelineを削除
- [x] 重複コンポーネントの確認・統一
- [x] 関連する不要コンポーネントの削除

## 完了条件
- [x] EnhancedTimelineが1つのみ存在
- [x] 全ての場所で統一されたコンポーネントを使用
- [x] タブ機能の重複が完全に解消

## 実装内容
1. **App.tsx**: インポートパスを修正済み版に変更
2. **Timeline/EnhancedTimeline.tsx**: 古い版を削除
3. **SceneCreationDialog.tsx**: 重複機能のため削除
4. **SceneHistoryList.tsx**: 重複機能のため削除

✅ **完了**: EnhancedTimelineコンポーネントが統一されました 