"""
ContextBuilderクラスのユニットテスト

このモジュールは、core/context_builder.pyのContextBuilderクラスをテストします。
"""

import os
import pytest
from unittest.mock import MagicMock, patch

from core.context_builder import ContextBuilder
from core.data_models import (
    ImmutableCharacterData,
    LongTermCharacterData,
    SceneInfoData,
    TurnData,
    ExperienceData,
    GoalData,
    MemoryData,
    SceneLogData,
    InterventionData,
    RevelationDetails,
    SceneUpdateDetails,
)


@pytest.fixture
def mock_character_manager():
    """CharacterManagerのモックを作成するフィクスチャ"""
    mock = MagicMock()

    # サンプルの不変情報
    immutable_data = ImmutableCharacterData(
        character_id="test_char_1",
        name="テスト太郎",
        age=25,
        occupation="学生",
        base_personality="明るく社交的、好奇心旺盛",
    )

    # サンプルの長期情報
    long_term_data = LongTermCharacterData(
        character_id="test_char_1",
        experiences=[
            ExperienceData(event="大学入学", importance=8),
            ExperienceData(event="海外旅行", importance=7),
            ExperienceData(event="コンテスト優勝", importance=9),
            ExperienceData(event="初めてのアルバイト", importance=5),
        ],
        goals=[
            GoalData(goal="卒業論文を完成させる", importance=9),
            GoalData(goal="友人との関係を深める", importance=6),
            GoalData(goal="海外留学する", importance=8),
            GoalData(goal="プログラミングを習得する", importance=7),
        ],
        memories=[
            MemoryData(
                memory="友人と喫茶店で会話",
                scene_id_of_memory="scene_001",
                related_character_ids=["test_char_2"],
            ),
            MemoryData(
                memory="図書館で勉強",
                scene_id_of_memory="scene_002",
                related_character_ids=[],
            ),
            MemoryData(
                memory="教授に相談",
                scene_id_of_memory="scene_003",
                related_character_ids=["test_char_3"],
            ),
            MemoryData(
                memory="部活の打ち上げ",
                scene_id_of_memory="scene_004",
                related_character_ids=["test_char_2", "test_char_4", "test_char_5"],
            ),
            MemoryData(
                memory="テスト勉強",
                scene_id_of_memory="scene_005",
                related_character_ids=[],
            ),
            MemoryData(
                memory="学園祭の準備",
                scene_id_of_memory="scene_006",
                related_character_ids=["test_char_2", "test_char_4"],
            ),
        ],
    )

    # 別のキャラクターの不変情報
    immutable_data_2 = ImmutableCharacterData(
        character_id="test_char_2",
        name="テスト花子",
        age=24,
        occupation="学生",
        base_personality="冷静沈着、分析的",
    )

    # モックメソッドの戻り値を設定
    def get_immutable_context(character_id):
        if character_id == "test_char_1":
            return immutable_data
        elif character_id == "test_char_2":
            return immutable_data_2
        else:
            # 存在しないキャラクターの場合
            from core.character_manager import CharacterNotFoundError

            raise CharacterNotFoundError(f"Character with ID {character_id} not found")

    mock.get_immutable_context.side_effect = get_immutable_context
    mock.get_long_term_context.return_value = long_term_data

    return mock


@pytest.fixture
def mock_scene_manager():
    """SceneManagerのモックを作成するフィクスチャ"""
    mock = MagicMock()

    # サンプルの場面情報
    scene_data = SceneInfoData(
        scene_id="test_scene_001",
        location="大学の教室",
        time="午後3時",
        situation="授業終了後、空いている教室で友人と会話している。窓からは夕日が差し込み、教室は橙色に染まっている。廊下からは帰宅する学生たちの声が聞こえる。",
        participant_character_ids=["test_char_1", "test_char_2", "unknown_char"],
    )

    # モックメソッドの戻り値を設定
    mock.get_current_scene_info.return_value = scene_data

    return mock


@pytest.fixture
def sample_turn_data():
    """サンプルの短期ログ（ターンデータ）を作成するフィクスチャ"""
    return [
        TurnData(
            turn_number=1,
            character_id="test_char_2",
            character_name="テスト花子",
            think="テスト太郎に今日の予定を聞いてみよう",
            act="テスト太郎の方を向いて微笑む",
            talk="今日この後、予定ある？",
        ),
        TurnData(
            turn_number=2,
            character_id="test_char_1",
            character_name="テスト太郎",
            think="花子さんと一緒に何かできたら楽しいかも",
            act="バッグから手帳を取り出してページをめくる",
            talk="今日は特に予定ないよ。どうしたの？",
        ),
        TurnData(
            turn_number=3,
            character_id="test_char_2",
            character_name="テスト花子",
            think="よかった、誘えそう",
            act="嬉しそうな表情をする",
            talk="実は新しいカフェができたから、一緒に行かない？",
        ),
        TurnData(
            turn_number=4,
            character_id="test_char_1",
            character_name="テスト太郎",
            think="カフェか、いいね！",
            act="手帳をしまい、立ち上がる",
            talk="いいね！行こう行こう！どこにあるの？",
        ),
        TurnData(
            turn_number=5,
            character_id="test_char_2",
            character_name="テスト花子",
            think="喜んでくれて良かった",
            act="スマホを取り出して地図を見せる",
            talk="ここだよ。駅の近くで、評判良いみたい。",
        ),
        TurnData(
            turn_number=6,
            character_id="test_char_1",
            character_name="テスト太郎",
            think="近くて便利だな",
            act="スマホを覗き込む",
            talk="おー、近いね！今から行こうか。",
        ),
    ]


@pytest.fixture
def sample_scene_log_data(sample_turn_data):
    """サンプルの場面ログデータを作成するフィクスチャ"""
    scene_info = SceneInfoData(
        scene_id="test_scene_001",
        location="大学の教室",
        time="午後3時",
        situation="授業終了後、空いている教室で友人と会話している。窓からは夕日が差し込み、教室は橙色に染まっている。廊下からは帰宅する学生たちの声が聞こえる。",
        participant_character_ids=["test_char_1", "test_char_2", "unknown_char"],
    )

    # ユーザー介入サンプル
    interventions = [
        InterventionData(
            applied_before_turn_number=3,
            intervention_type="REVELATION",
            intervention=RevelationDetails(
                description="テスト太郎に秘密の情報を天啓として伝える",
                revelation_content="テスト花子はあなたに好意を持っているようだ",
            ),
            target_character_id="test_char_1",
        ),
        InterventionData(
            applied_before_turn_number=5,
            intervention_type="SCENE_SITUATION_UPDATE",
            intervention=SceneUpdateDetails(
                description="場面状況の変化",
                updated_situation_element="突然、廊下から大きな物音がした",
            ),
            target_character_id=None,  # 場面全体への介入
        ),
    ]

    # SceneLogDataの作成
    return SceneLogData(
        scene_info=scene_info,
        interventions_in_scene=interventions,
        turns=sample_turn_data,
    )


def test_context_builder_initialization(mock_character_manager, mock_scene_manager):
    """ContextBuilderの初期化をテスト"""
    context_builder = ContextBuilder(mock_character_manager, mock_scene_manager)

    assert context_builder.character_manager == mock_character_manager
    assert context_builder.scene_manager == mock_scene_manager


def test_format_immutable_context(mock_character_manager, mock_scene_manager):
    """_format_immutable_contextメソッドをテスト"""
    context_builder = ContextBuilder(mock_character_manager, mock_scene_manager)
    immutable_data = mock_character_manager.get_immutable_context("test_char_1")

    formatted_context = context_builder._format_immutable_context(immutable_data)

    # 新しいフォーマットの検証
    assert "【キャラクター基本情報】" in formatted_context
    assert "テスト太郎は" in formatted_context
    assert "25歳の" in formatted_context
    assert "学生です" in formatted_context
    assert "性格特性:" in formatted_context
    assert "明るく社交的、好奇心旺盛" in formatted_context

    # Noneの場合のテスト
    none_formatted = context_builder._format_immutable_context(None)
    assert "情報がありません" in none_formatted


def test_format_long_term_context(mock_character_manager, mock_scene_manager):
    """_format_long_term_contextメソッドをテスト"""
    context_builder = ContextBuilder(mock_character_manager, mock_scene_manager)
    long_term_data = mock_character_manager.get_long_term_context("test_char_1")

    formatted_context = context_builder._format_long_term_context(long_term_data)

    # 新しいフォーマットの検証
    assert "【経験と記憶】" in formatted_context
    assert "【過去の重要な経験】" in formatted_context
    assert "【現在の目標/願望】" in formatted_context
    assert "【記憶】" in formatted_context

    # 重要度によるソートと件数制限の検証（経験）
    # コンテスト優勝(9)が最初に来るはず
    experiences_text = formatted_context.split("【過去の重要な経験】")[1].split(
        "【現在の目標/願望】"
    )[0]
    assert "コンテスト優勝" in experiences_text
    assert experiences_text.index("コンテスト優勝") < experiences_text.index("大学入学")
    # 重要度が低い「初めてのアルバイト」(5)は制限により表示されないはず
    assert "初めてのアルバイト" not in experiences_text
    # MAX_EXPERIENCES(3)件だけ表示されるか
    assert experiences_text.count("- ") <= context_builder.MAX_EXPERIENCES

    # 重要度によるソートと件数制限の検証（目標）
    goals_text = formatted_context.split("【現在の目標/願望】")[1].split("【記憶】")[0]
    assert "卒業論文を完成させる" in goals_text
    assert goals_text.index("卒業論文を完成させる") < goals_text.index("海外留学する")
    # MAX_GOALS(3)件だけ表示されるか
    assert goals_text.count("- ") <= context_builder.MAX_GOALS

    # 件数制限の検証（記憶）
    memories_text = formatted_context.split("【記憶】")[1]
    # MAX_MEMORIES(5)件だけ表示されるか
    assert memories_text.count("- ") <= context_builder.MAX_MEMORIES
    # 最新の記憶が表示されているか
    assert "学園祭の準備" in memories_text
    # 関連キャラクター情報が含まれているか
    assert "関連キャラクター: テスト花子" in memories_text

    # Noneの場合のテスト
    none_formatted = context_builder._format_long_term_context(None)
    assert "情報がありません" in none_formatted


def test_format_scene_context(mock_character_manager, mock_scene_manager):
    """_format_scene_contextメソッドをテスト"""
    context_builder = ContextBuilder(mock_character_manager, mock_scene_manager)
    scene_data = mock_scene_manager.get_current_scene_info()

    formatted_context = context_builder._format_scene_context(scene_data)

    # 新しいフォーマットの検証
    assert "【現在の場面情報】" in formatted_context
    assert "場所は「大学の教室」、時刻は「午後3時」です" in formatted_context
    assert "状況:" in formatted_context
    assert "授業終了後、空いている教室で友人と会話している" in formatted_context
    assert (
        "この場面に参加しているキャラクター: テスト太郎, テスト花子, unknown_char"
        in formatted_context
    )

    # Noneの場合のテスト
    none_formatted = context_builder._format_scene_context(None)
    assert "情報がありません" in none_formatted


def test_format_short_term_context_with_limit(
    mock_character_manager, mock_scene_manager, sample_turn_data
):
    """_format_short_term_contextメソッドの件数制限をテスト"""
    context_builder = ContextBuilder(mock_character_manager, mock_scene_manager)

    # 件数制限のテスト（MAX_TURNSより多いターンデータ）
    formatted_context = context_builder._format_short_term_context(sample_turn_data)

    # 新しいフォーマットの検証
    assert "【最近のやり取り】" in formatted_context
    # 思考内容が含まれていないことを確認
    assert "花子さんと一緒に何かできたら楽しいかも" not in formatted_context
    # 行動と発言の形式を確認
    assert (
        "テスト花子：スマホを取り出して地図を見せる 「ここだよ。駅の近くで、評判良いみたい。」"
        in formatted_context
    )
    # MAX_TURNS件だけ表示されているか（最新のものから）
    assert (
        formatted_context.count("テスト") <= context_builder.MAX_TURNS * 2
    )  # 各ターンに名前が2回出るため
    # 最新のターンが含まれているか
    assert "おー、近いね！今から行こうか。" in formatted_context
    # 最古のターンが含まれていないか（MAX_TURNS=5なので、6ターンあると最初のは表示されない）
    assert "今日この後、予定ある？" not in formatted_context

    # 空のターンデータの場合のテスト
    formatted_empty_context = context_builder._format_short_term_context([])
    assert "まだやり取りは始まっていません" in formatted_empty_context


def test_build_context_for_character(
    mock_character_manager, mock_scene_manager, sample_turn_data
):
    """build_context_for_characterメソッドをテスト（辞書型の返り値を確認）"""
    context_builder = ContextBuilder(mock_character_manager, mock_scene_manager)

    context_dict = context_builder.build_context_for_character(
        "test_char_1", sample_turn_data, "前の場面では友人たちと昼食をとった。"
    )

    # 返り値が辞書型であることを確認
    assert isinstance(context_dict, dict)

    # 必要なキーが全て含まれていることを確認
    expected_keys = [
        "immutable_context",
        "long_term_context",
        "scene_context",
        "short_term_context",
        "previous_scene_context",
        "full_context",
    ]
    for key in expected_keys:
        assert key in context_dict

    # 各コンテクストの内容を確認
    assert "【キャラクター基本情報】" in context_dict["immutable_context"]
    assert "【経験と記憶】" in context_dict["long_term_context"]
    assert "【現在の場面情報】" in context_dict["scene_context"]
    assert "【前の場面のサマリー】" in context_dict["previous_scene_context"]
    assert "【最近のやり取り】" in context_dict["short_term_context"]

    # full_contextに全ての情報が含まれていることを確認
    full_context = context_dict["full_context"]
    assert "【キャラクター基本情報】" in full_context
    assert "【経験と記憶】" in full_context
    assert "【現在の場面情報】" in full_context
    assert "【前の場面のサマリー】" in full_context
    assert "前の場面では友人たちと昼食をとった。" in full_context
    assert "【最近のやり取り】" in full_context

    # 前の場面のサマリーがない場合
    context_dict_without_summary = context_builder.build_context_for_character(
        "test_char_1", sample_turn_data
    )

    # previous_scene_contextキーがないことを確認
    assert "previous_scene_context" not in context_dict_without_summary
    # full_contextに前の場面のサマリーが含まれていないことを確認
    assert "【前の場面のサマリー】" not in context_dict_without_summary["full_context"]


def test_build_context_with_no_scene_loaded(mock_character_manager, sample_turn_data):
    """シーンがロードされていない状態でのbuild_context_for_characterテスト"""
    # SceneManagerのモックを作成し、get_current_scene_infoがNoneを返すように設定
    mock_scene_manager = MagicMock()
    mock_scene_manager.get_current_scene_info.return_value = None

    context_builder = ContextBuilder(mock_character_manager, mock_scene_manager)

    # シーンがロードされていない場合は例外がスローされるはず
    with pytest.raises(ValueError, match="No scene is currently loaded."):
        context_builder.build_context_for_character("test_char_1", sample_turn_data)


def test_information_filtering_and_priority(mock_character_manager, mock_scene_manager):
    """情報のフィルタリングと優先順位付けをテスト"""
    # カスタム設定のContextBuilderを作成
    context_builder = ContextBuilder(mock_character_manager, mock_scene_manager)
    context_builder.MAX_EXPERIENCES = 1  # 経験は1件だけ表示
    context_builder.MAX_GOALS = 1  # 目標も1件だけ表示
    context_builder.MAX_MEMORIES = 2  # 記憶は2件だけ表示
    context_builder.MAX_TURNS = 2  # ターンも2件だけ表示

    # サンプルのターンデータ
    sample_turns = [
        TurnData(
            turn_number=1,
            character_id="test_char_1",
            character_name="テスト太郎",
            think="考え事中",
            act="腕を組む",
            talk="ふむふむ",
        ),
        TurnData(
            turn_number=2,
            character_id="test_char_2",
            character_name="テスト花子",
            think="返事をしよう",
            act="微笑む",
            talk="何を考えてるの？",
        ),
        TurnData(
            turn_number=3,
            character_id="test_char_1",
            character_name="テスト太郎",
            think="正直に答えよう",
            act="頭をかく",
            talk="明日の予定を考えてたんだ",
        ),
    ]

    # 長期情報のフォーマットテスト
    long_term_data = mock_character_manager.get_long_term_context("test_char_1")
    formatted_long_term = context_builder._format_long_term_context(long_term_data)

    # 経験が1件だけ（最重要の「コンテスト優勝」）表示されているか
    assert formatted_long_term.count("重要な経験") == 1
    assert "コンテスト優勝" in formatted_long_term
    assert "大学入学" not in formatted_long_term

    # 目標が1件だけ（最重要の「卒業論文を完成させる」）表示されているか
    assert formatted_long_term.count("目標/願望") == 1
    assert "卒業論文を完成させる" in formatted_long_term
    assert "海外留学する" not in formatted_long_term

    # 記憶が2件だけ（最新の2件）表示されているか
    memories_section = formatted_long_term.split("【記憶】")[1]
    assert memories_section.count("- ") == 2
    assert "学園祭の準備" in memories_section
    assert "テスト勉強" in memories_section
    assert "部活の打ち上げ" not in memories_section

    # 短期情報のフォーマットテスト
    formatted_short_term = context_builder._format_short_term_context(sample_turns)

    # ターンが2件だけ（最新の2件）表示されているか
    assert (
        formatted_short_term.count("テスト太郎")
        + formatted_short_term.count("テスト花子")
        == 2
    )
    assert "明日の予定を考えてたんだ" in formatted_short_term
    assert "何を考えてるの？" in formatted_short_term
    assert "ふむふむ" not in formatted_short_term


def test_build_context_for_long_term_update(
    mock_character_manager, mock_scene_manager, sample_scene_log_data
):
    """build_context_for_long_term_updateメソッドをテスト"""
    context_builder = ContextBuilder(mock_character_manager, mock_scene_manager)

    # テスト対象のメソッドを呼び出し
    context_for_lt_update = context_builder.build_context_for_long_term_update(
        "test_char_1", sample_scene_log_data
    )

    # 結果の検証
    assert "character_name" in context_for_lt_update
    assert context_for_lt_update["character_name"] == "テスト太郎"

    assert "existing_long_term_context_str" in context_for_lt_update
    assert "【経験と記憶】" in context_for_lt_update["existing_long_term_context_str"]

    assert "recent_significant_events_or_thoughts_str" in context_for_lt_update

    # 重要な出来事に場面状況が含まれているか
    assert (
        "【場面の状況】"
        in context_for_lt_update["recent_significant_events_or_thoughts_str"]
    )

    # ユーザー介入情報が含まれているか
    assert (
        "【ユーザー介入】"
        in context_for_lt_update["recent_significant_events_or_thoughts_str"]
    )
    assert (
        "テスト花子はあなたに好意を持っているようだ"
        in context_for_lt_update["recent_significant_events_or_thoughts_str"]
    )

    # キャラクターの思考・行動・発言が含まれているか
    assert (
        "【重要な出来事や会話】"
        in context_for_lt_update["recent_significant_events_or_thoughts_str"]
    )
    assert (
        "あなたは考えました"
        in context_for_lt_update["recent_significant_events_or_thoughts_str"]
    )
    assert (
        "テスト花子は発言しました"
        in context_for_lt_update["recent_significant_events_or_thoughts_str"]
    )


def test_extract_significant_events(
    mock_character_manager, mock_scene_manager, sample_scene_log_data
):
    """_extract_significant_eventsメソッドをテスト"""
    context_builder = ContextBuilder(mock_character_manager, mock_scene_manager)

    # テスト対象のメソッドを呼び出し
    events_str = context_builder._extract_significant_events(
        "test_char_1", sample_scene_log_data
    )

    # 結果の検証
    assert "【場面の状況】" in events_str
    assert "授業終了後" in events_str

    # ユーザー介入情報が含まれているか
    assert "【ユーザー介入】" in events_str
    assert "天啓を受けました" in events_str
    assert "テスト花子はあなたに好意を持っているようだ" in events_str

    # 自分のターン情報が含まれているか
    assert "あなたは考えました" in events_str
    assert "花子さんと一緒に何かできたら楽しいかも" in events_str

    # 他のキャラクターの情報が含まれているか
    assert "テスト花子は発言しました" in events_str
    assert "「今日この後、予定ある？」" in events_str

    # 他のキャラクターの思考は含まれていないこと
    assert "花子さんは考えました" not in events_str
    assert "テスト太郎に今日の予定を聞いてみよう" not in events_str


def test_extract_significant_events_with_empty_log(
    mock_character_manager, mock_scene_manager
):
    """_extract_significant_eventsメソッドが空のログを処理できることをテスト"""
    context_builder = ContextBuilder(mock_character_manager, mock_scene_manager)

    # 空のSceneLogData
    empty_log = SceneLogData(
        scene_info=SceneInfoData(
            scene_id="empty_scene",
            situation="空の場面",
            participant_character_ids=["test_char_1"],
        ),
        interventions_in_scene=[],
        turns=[],
    )

    # テスト対象のメソッドを呼び出し
    events_str = context_builder._extract_significant_events("test_char_1", empty_log)

    # 結果の検証
    assert "まだ重要な出来事は発生していません" in events_str
