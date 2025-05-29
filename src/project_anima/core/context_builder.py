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
        SceneLogData,
    )


class ContextBuilder:
    """
    LLM用のコンテクストを構築するクラス

    このクラスは、キャラクターマネージャーとシーンマネージャーから情報を取得し、
    キャラクターの思考生成や長期情報更新のためのコンテクストを整形します。
    """

    # 情報量制御のためのデフォルト設定
    # MAX_EXPERIENCES = 3  # 表示する最大経験数 - 制限撤廃
    # MAX_GOALS = 3  # 表示する最大目標数 - 制限撤廃
    # MAX_MEMORIES = 5  # 表示する最大記憶数 - 制限撤廃
    MAX_TURNS = 5  # 表示する最大ターン数
    MAX_SIGNIFICANT_TURNS = 10  # 重要な出来事として表示する最大ターン数

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

    def build_context_for_long_term_update(
        self, character_id: str, current_scene_log: "SceneLogData"
    ) -> Dict[str, str]:
        """
        キャラクターの長期情報更新のためのコンテクストを構築する

        Args:
            character_id: 長期情報を更新するキャラクターのID
            current_scene_log: 現在の場面の完全なログデータ

        Returns:
            整形されたコンテクスト文字列を格納した辞書
            {
                "character_name": "キャラクターの名前",
                "existing_long_term_context_str": "キャラクターの既存の長期情報",
                "recent_significant_events_or_thoughts_str": "最近の重要な出来事や思考"
            }
        """
        # キャラクター情報の取得
        immutable_data = self.character_manager.get_immutable_context(character_id)
        long_term_data = self.character_manager.get_long_term_context(character_id)

        # キャラクター名の取得
        character_name = immutable_data.name

        # 既存の長期情報を整形
        existing_long_term_context_str = self._format_long_term_context(long_term_data)

        # 最近の重要な出来事や思考を整形
        recent_significant_events_or_thoughts_str = self._extract_significant_events(
            character_id, current_scene_log
        )

        # 辞書形式で返す
        return {
            "character_name": character_name,
            "existing_long_term_context_str": existing_long_term_context_str,
            "recent_significant_events_or_thoughts_str": recent_significant_events_or_thoughts_str,
        }

    def _extract_significant_events(
        self, character_id: str, scene_log: "SceneLogData"
    ) -> str:
        """
        場面ログから特定のキャラクターにとって重要な出来事や思考を抽出する

        Args:
            character_id: 対象キャラクターのID
            scene_log: 場面の完全なログデータ

        Returns:
            重要な出来事や思考を整形した文字列
        """
        if not scene_log or not scene_log.turns:
            return "まだ重要な出来事は発生していません。"

        # 場面情報の取得
        scene_info = scene_log.scene_info

        # 結果を格納する文字列
        result = f"【場面の状況】\n{scene_info.situation}\n\n"

        # ユーザー介入があれば追加
        if scene_log.interventions_in_scene:
            result += "【ユーザー介入】\n"
            for intervention in scene_log.interventions_in_scene:
                # 特定のキャラクターへの介入か、または場面全体への介入かを判断
                if (
                    intervention.target_character_id == character_id
                    or intervention.target_character_id is None
                ):
                    # 介入タイプに応じた記述を追加
                    if intervention.intervention_type == "SCENE_SITUATION_UPDATE":
                        result += f"- ターン{intervention.applied_before_turn_number}前: 場面状況が更新されました：{intervention.intervention.updated_situation_element}\n"
                    elif intervention.intervention_type == "REVELATION":
                        result += f"- ターン{intervention.applied_before_turn_number}前: あなたは天啓を受けました：{intervention.intervention.revelation_content}\n"
                    else:
                        result += f"- ターン{intervention.applied_before_turn_number}前: {intervention.intervention_type}タイプの介入がありました\n"

            result += "\n"

        # 対象キャラクターのターンと、他キャラクターの行動・発言を抽出
        result += "【重要な出来事や会話】\n"

        # 直近のMAX_SIGNIFICANT_TURNS分のターンを取得（古いものが先、新しいものが後）
        limited_turns = (
            scene_log.turns[-self.MAX_SIGNIFICANT_TURNS :]
            if len(scene_log.turns) > self.MAX_SIGNIFICANT_TURNS
            else scene_log.turns
        )

        for turn in limited_turns:
            # 対象キャラクター自身のターンの場合
            if turn.character_id == character_id:
                # 思考内容は自分自身のものなので含める
                result += (
                    f"ターン{turn.turn_number}: あなたは考えました：「{turn.think}」\n"
                )

                # 行動と発言があれば追加
                if turn.act:
                    result += (
                        f"ターン{turn.turn_number}: あなたは行動しました：{turn.act}\n"
                    )
                if turn.talk:
                    result += f"ターン{turn.turn_number}: あなたは発言しました：「{turn.talk}」\n"
            else:
                # 他のキャラクターの場合は、行動と発言のみを含める（思考は見えない）
                if turn.act:
                    result += f"ターン{turn.turn_number}: {turn.character_name}は行動しました：{turn.act}\n"
                if turn.talk:
                    result += f"ターン{turn.turn_number}: {turn.character_name}は発言しました：「{turn.talk}」\n"

        return result

    def _format_immutable_context(
        self, immutable_data: "ImmutableCharacterData"
    ) -> str:
        """
        不変情報をフォーマットする

        キャラクターの基本情報を自然な文章として整形します。

        Args:
            immutable_data: 不変情報データ

        Returns:
            整形された不変情報文字列
        """
        if immutable_data is None:
            return "【キャラクター基本情報】\n情報がありません。"

        # 基本情報を文章形式で整形
        context = f"【キャラクター基本情報】\n"
        context += f"{immutable_data.name}は"

        # 年齢情報があれば追加
        if immutable_data.age:
            context += f"、{immutable_data.age}歳の"

        # 職業情報があれば追加
        if immutable_data.occupation:
            context += f"{immutable_data.occupation}です。"
        else:
            context += "人物です。"

        # 性格特性を追加
        context += f"\n\n性格特性:\n{immutable_data.base_personality}"

        return context

    def _format_long_term_context(self, long_term_data: "LongTermCharacterData") -> str:
        """
        長期情報をフォーマットする

        キャラクターの経験、目標、記憶を整形します。情報量を制御するため、
        各カテゴリで表示する項目数を制限します。

        Args:
            long_term_data: 長期情報データ

        Returns:
            整形された長期情報文字列
        """
        if long_term_data is None:
            return "【経験と記憶】\n情報がありません。"

        context = "【経験と記憶】\n"

        # 経験情報の整形（重要度順にソート、制限なし）
        if long_term_data.experiences:
            # 重要度の高い順にソート
            sorted_experiences = sorted(
                long_term_data.experiences, key=lambda x: x.importance, reverse=True
            )
            # 制限を削除 - すべての経験を表示
            # limited_experiences = sorted_experiences[: self.MAX_EXPERIENCES]

            context += "【過去の重要な経験】\n"
            for exp in sorted_experiences:
                context += f"- {exp.event} (重要度: {exp.importance}/10)\n"
        else:
            context += "【過去の重要な経験】\n特に記録されている経験はありません。\n"

        # 目標情報の整形（重要度順にソート、制限なし）
        if long_term_data.goals:
            # 重要度の高い順にソート
            sorted_goals = sorted(
                long_term_data.goals, key=lambda x: x.importance, reverse=True
            )
            # 制限を削除 - すべての目標を表示
            # limited_goals = sorted_goals[: self.MAX_GOALS]

            context += "\n【現在の目標/願望】\n"
            for goal in sorted_goals:
                context += f"- {goal.goal} (重要度: {goal.importance}/10)\n"
        else:
            context += "\n【現在の目標/願望】\n特に記録されている目標はありません。\n"

        # 記憶情報の整形（制限なし）
        if long_term_data.memories:
            # 制限を削除 - すべての記憶を表示
            # limited_memories = long_term_data.memories[-self.MAX_MEMORIES :]

            context += "\n【記憶】\n"
            for memory in long_term_data.memories:
                # 関連キャラクター名の取得を試みる
                related_names = []
                for char_id in memory.related_character_ids:
                    try:
                        char_data = self.character_manager.get_immutable_context(
                            char_id
                        )
                        related_names.append(char_data.name)
                    except:
                        related_names.append(char_id)

                related_str = "、".join(related_names) if related_names else "なし"
                context += f"- {memory.memory} (場面: {memory.scene_id_of_memory}, 関連キャラクター: {related_str})\n"
        else:
            context += "\n【記憶】\n特に記録されている記憶はありません。\n"

        return context

    def _format_scene_context(self, scene_data: "SceneInfoData") -> str:
        """
        場面情報をフォーマットする

        場面の状況を自然な文章として整形します。

        Args:
            scene_data: 場面情報データ

        Returns:
            整形された場面情報文字列
        """
        if scene_data is None:
            return "【現在の場面情報】\n情報がありません。"

        # 場面情報を文章形式で整形
        context = "【現在の場面情報】\n"

        # 場所と時間の情報を結合
        location_time = ""
        if scene_data.location:
            location_time += f"場所は「{scene_data.location}」"

        if scene_data.time:
            if location_time:
                location_time += f"、時刻は「{scene_data.time}」"
            else:
                location_time += f"時刻は「{scene_data.time}」"

        if location_time:
            context += f"{location_time}です。\n\n"

        # 状況説明
        context += f"状況:\n{scene_data.situation}\n\n"

        # 参加キャラクターの名前を取得して表示
        participant_names = []
        for char_id in scene_data.participant_character_ids:
            try:
                immutable_data = self.character_manager.get_immutable_context(char_id)
                participant_names.append(immutable_data.name)
            except Exception:
                # エラーが発生した場合はIDをそのまま使用
                participant_names.append(char_id)

        if participant_names:
            context += (
                f"この場面に参加しているキャラクター: {', '.join(participant_names)}"
            )

        return context

    def _format_short_term_context(self, short_term_log: List["TurnData"]) -> str:
        """
        短期情報（会話履歴など）をフォーマットする

        最近のターン情報を会話形式で整形します。情報量を制御するため、
        表示するターン数を制限します。

        Args:
            short_term_log: 短期情報（ターンのリスト）

        Returns:
            整形された短期情報文字列
        """
        if not short_term_log:
            return "【最近のやり取り】\nまだやり取りは始まっていません。"

        # 直近のN件のみ表示
        limited_log = (
            short_term_log[-self.MAX_TURNS :]
            if len(short_term_log) > self.MAX_TURNS
            else short_term_log
        )

        context = "【最近のやり取り】\n"
        for turn in limited_log:
            # 思考は内面なので含めない（キャラクターには他者の思考は見えない）
            if turn.act and turn.talk:
                context += f"{turn.character_name}：{turn.act} 「{turn.talk}」\n\n"
            elif turn.act:
                context += f"{turn.character_name}：{turn.act}\n\n"
            elif turn.talk:
                context += f"{turn.character_name}：「{turn.talk}」\n\n"
            else:
                context += (
                    f"{turn.character_name}：(何も行動せず、何も話さなかった)\n\n"
                )

        return context.strip()
