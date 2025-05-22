"""
コンテクスト構築を担当するモジュール

このモジュールは、キャラクターの不変情報、長期情報、場面情報、短期情報を整形して
LLMに渡すためのコンテクストを構築するContextBuilderクラスを提供します。
"""

from typing import List, Optional, Dict, Any, TYPE_CHECKING

# 循環参照を避けるための型チェック時のみのインポート
if TYPE_CHECKING:
    from .character_manager import CharacterManager, CharacterNotFoundError
    from .scene_manager import SceneManager
    from .data_models import (
        ImmutableCharacterData,
        LongTermCharacterData,
        SceneInfoData,
        TurnData,
    )


class ContextBuilder:
    """
    LLM用のコンテクストを構築するクラス

    このクラスは、キャラクターマネージャーとシーンマネージャーから情報を取得し、
    キャラクターの思考生成や長期情報更新のためのコンテクストを整形します。
    """

    def __init__(self, character_manager, scene_manager):
        """
        ContextBuilderを初期化する

        Args:
            character_manager: キャラクター情報を提供するCharacterManagerインスタンス
            scene_manager: 場面情報を提供するSceneManagerインスタンス
        """
        self.character_manager = character_manager
        self.scene_manager = scene_manager

    def build_context_for_character(
        self,
        character_id: str,
        current_scene_short_term_log: List["TurnData"],
        previous_scene_summary: Optional[str] = None,
    ) -> Dict[str, str]:
        """
        キャラクターの思考生成のためのコンテクストを構築する

        Args:
            character_id: コンテクストを構築するキャラクターのID
            current_scene_short_term_log: 現在の場面の短期ログ（ターンのリスト）
            previous_scene_summary: 前の場面のサマリー（オプション）

        Returns:
            整形されたコンテクスト文字列を格納した辞書
            {
                "immutable_context": "キャラクターの不変情報...",
                "long_term_context": "キャラクターの長期情報...",
                "scene_context": "場面情報...",
                "short_term_context": "短期情報（会話履歴など）...",
                "previous_scene_context": "前の場面のサマリー...（存在する場合）",
                "full_context": "全てのコンテクストを結合した文字列"
            }
        """
        # 各種情報の取得
        immutable_data = self.character_manager.get_immutable_context(character_id)
        long_term_data = self.character_manager.get_long_term_context(character_id)
        scene_data = self.scene_manager.get_current_scene_info()

        if scene_data is None:
            raise ValueError("No scene is currently loaded.")

        # 各種コンテクストの整形
        immutable_context = self._format_immutable_context(immutable_data)
        long_term_context = self._format_long_term_context(long_term_data)
        scene_context = self._format_scene_context(scene_data)
        short_term_context = self._format_short_term_context(
            current_scene_short_term_log
        )

        # 前の場面のサマリーがある場合は追加
        previous_scene_context = ""
        if previous_scene_summary:
            previous_scene_context = f"【前の場面のサマリー】\n{previous_scene_summary}"

        # 全体のコンテクストを構築
        full_context = f"""
{immutable_context}

{long_term_context}

{scene_context}

{previous_scene_context if previous_scene_context else ""}

{short_term_context}
""".strip()

        # 辞書形式で返す
        context_dict = {
            "immutable_context": immutable_context,
            "long_term_context": long_term_context,
            "scene_context": scene_context,
            "short_term_context": short_term_context,
            "full_context": full_context,
        }

        # 前の場面のサマリーがある場合のみ追加
        if previous_scene_summary:
            context_dict["previous_scene_context"] = previous_scene_context

        return context_dict

    def _format_immutable_context(
        self, immutable_data: "ImmutableCharacterData"
    ) -> str:
        """
        不変情報をフォーマットする

        Args:
            immutable_data: 不変情報データ

        Returns:
            整形された不変情報文字列
        """
        # この段階では単純なフォーマットを行い、タスク4.1で詳細化する
        context = f"【キャラクター基本情報】\n"
        context += f"名前: {immutable_data.name}\n"

        if immutable_data.age:
            context += f"年齢: {immutable_data.age}\n"

        if immutable_data.occupation:
            context += f"職業: {immutable_data.occupation}\n"

        context += f"性格: {immutable_data.base_personality}\n"

        return context

    def _format_long_term_context(self, long_term_data: "LongTermCharacterData") -> str:
        """
        長期情報をフォーマットする

        Args:
            long_term_data: 長期情報データ

        Returns:
            整形された長期情報文字列
        """
        # この段階では単純なフォーマットを行い、タスク4.1で詳細化する
        context = "【経験と記憶】\n"

        if long_term_data.experiences:
            context += "- 経験:\n"
            for exp in long_term_data.experiences:
                context += f"  • {exp.event} (重要度: {exp.importance})\n"

        if long_term_data.goals:
            context += "- 目標:\n"
            for goal in long_term_data.goals:
                context += f"  • {goal.goal} (重要度: {goal.importance})\n"

        if long_term_data.memories:
            context += "- 記憶:\n"
            for memory in long_term_data.memories:
                context += f"  • {memory.memory} (場面: {memory.scene_id_of_memory})\n"

        return context

    def _format_scene_context(self, scene_data: "SceneInfoData") -> str:
        """
        場面情報をフォーマットする

        Args:
            scene_data: 場面情報データ

        Returns:
            整形された場面情報文字列
        """
        # この段階では単純なフォーマットを行い、タスク4.1で詳細化する
        context = "【現在の場面情報】\n"

        if scene_data.location:
            context += f"場所: {scene_data.location}\n"

        if scene_data.time:
            context += f"時間: {scene_data.time}\n"

        context += f"状況: {scene_data.situation}\n"

        # 参加キャラクターの名前を取得して表示
        participant_names = []
        for char_id in scene_data.participant_character_ids:
            try:
                immutable_data = self.character_manager.get_immutable_context(char_id)
                participant_names.append(immutable_data.name)
            except AttributeError as e:
                # character_managerがget_immutable_contextメソッドを持たない場合
                participant_names.append(char_id)
                print(
                    f"Warning: Could not get character name from ID: {char_id}. Error: {e}"
                )
            except Exception as e:
                # その他のエラー（CharacterNotFoundErrorなど）
                participant_names.append(char_id)
                print(
                    f"Warning: Error getting character name for ID: {char_id}. Error: {e}"
                )

        context += f"参加者: {', '.join(participant_names)}\n"

        return context

    def _format_short_term_context(self, short_term_log: List["TurnData"]) -> str:
        """
        短期情報（会話履歴など）をフォーマットする

        Args:
            short_term_log: 短期情報（ターンのリスト）

        Returns:
            整形された短期情報文字列
        """
        # この段階では単純なフォーマットを行い、タスク4.1で詳細化する
        if not short_term_log:
            return "【会話履歴】\nまだ会話は始まっていません。"

        context = "【会話履歴】\n"
        for turn in short_term_log:
            context += f"ターン{turn.turn_number}: {turn.character_name}\n"
            context += f"  思考: {turn.think}\n"

            if turn.act:
                context += f"  行動: {turn.act}\n"

            if turn.talk:
                context += f"  発言: {turn.talk}\n"

            context += "\n"

        return context
