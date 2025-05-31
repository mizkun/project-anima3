"""
シミュレーション履歴管理モジュール

シミュレーションの履歴保存・読み込み・再開機能を提供する。
LINEのトーク画面のような感覚でシミュレーションセッションを管理できる設計。
"""

import os
import json
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict

from ..core.data_models import SimulationHistoryEntry


class SimulationHistoryManager:
    """シミュレーション履歴管理クラス

    シミュレーションの履歴保存・読み込み・再開機能を提供する。
    LINEのトーク画面のようなシミュレーション履歴の閲覧・再開が可能。
    """

    def __init__(self, history_dir: str = "data/simulation_histories"):
        self.history_dir = Path(history_dir)
        self.history_dir.mkdir(parents=True, exist_ok=True)
        self.history_file = self.history_dir / "simulation_histories.json"

    def save_simulation_entry(self, entry: SimulationHistoryEntry) -> bool:
        """シミュレーション履歴エントリを保存"""
        try:
            histories = self.load_all_histories()

            # 既存エントリがあれば更新、なければ追加
            existing_index = next(
                (
                    i
                    for i, h in enumerate(histories)
                    if h.simulation_id == entry.simulation_id
                ),
                None,
            )

            if existing_index is not None:
                histories[existing_index] = entry
            else:
                histories.append(entry)

            # アクティブな履歴は1つだけにする
            if entry.is_active:
                for hist in histories:
                    if hist.simulation_id != entry.simulation_id:
                        hist.is_active = False

            self._save_histories(histories)
            return True

        except Exception as e:
            print(f"シミュレーション履歴保存エラー: {e}")
            return False

    def load_all_histories(self) -> List[SimulationHistoryEntry]:
        """全シミュレーション履歴を読み込み"""
        try:
            if not self.history_file.exists():
                return []

            with open(self.history_file, "r", encoding="utf-8") as f:
                data = json.load(f)

            return [SimulationHistoryEntry(**item) for item in data]

        except Exception as e:
            print(f"シミュレーション履歴読み込みエラー: {e}")
            return []

    def get_active_simulation(self) -> Optional[SimulationHistoryEntry]:
        """現在アクティブなシミュレーション履歴を取得"""
        histories = self.load_all_histories()
        for history in histories:
            if history.is_active:
                return history
        return None

    def resume_simulation(self, simulation_id: str) -> Optional[SimulationHistoryEntry]:
        """指定されたシミュレーションを再開用に取得"""
        histories = self.load_all_histories()
        for history in histories:
            if history.simulation_id == simulation_id:
                # アクセス時刻を更新
                history.last_accessed_at = datetime.now()
                self.save_simulation_entry(history)
                return history
        return None

    def pause_simulation(self, simulation_id: str) -> bool:
        """シミュレーションを一時停止"""
        histories = self.load_all_histories()
        for history in histories:
            if history.simulation_id == simulation_id:
                history.status = "paused"
                history.is_active = False
                return self.save_simulation_entry(history)
        return False

    def delete_simulation_history(self, simulation_id: str) -> bool:
        """シミュレーション履歴を削除"""
        try:
            histories = self.load_all_histories()
            histories = [h for h in histories if h.simulation_id != simulation_id]
            self._save_histories(histories)
            return True
        except Exception as e:
            print(f"シミュレーション履歴削除エラー: {e}")
            return False

    def get_simulation_statistics(self) -> Dict:
        """シミュレーション統計情報を取得"""
        histories = self.load_all_histories()
        return {
            "total": len(histories),
            "active": len([h for h in histories if h.status == "active"]),
            "paused": len([h for h in histories if h.status == "paused"]),
            "completed": len([h for h in histories if h.status == "completed"]),
            "archived": len([h for h in histories if h.status == "archived"]),
        }

    def _save_histories(self, histories: List[SimulationHistoryEntry]) -> None:
        """履歴リストをファイルに保存"""
        with open(self.history_file, "w", encoding="utf-8") as f:
            json.dump(
                [history.model_dump() for history in histories],
                f,
                ensure_ascii=False,
                indent=2,
                default=str,
            )
