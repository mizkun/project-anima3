"""
AIキャラクターシミュレーションに必要なデータモデル定義

このモジュールは、Project Animaで使用される主要なデータ構造をPydanticモデルとして定義します。
これらのモデルは、キャラクター情報、場面情報、シミュレーションログなどを表現し、
YAML/JSONとの相互変換やバリデーションを担当します。
"""

from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field


class ExperienceData(BaseModel):
    """キャラクターの経験を表すデータモデル"""
    event: str = Field(description="過去の重要な経験")
    importance: int = Field(ge=1, le=10, description="重要度 (1-10段階)")


class GoalData(BaseModel):
    """キャラクターの目標/願望を表すデータモデル"""
    goal: str = Field(description="達成したい目標/願望")
    importance: int = Field(ge=1, le=10, description="重要度 (1-10段階)")


class MemoryData(BaseModel):
    """キャラクターの記憶を表すデータモデル"""
    memory: str = Field(description="特定の記憶")
    scene_id_of_memory: str = Field(description="記憶が発生した場面のScene_ID")
    related_character_ids: List[str] = Field(default_factory=list, description="関連キャラクターのIDリスト")


class ImmutableCharacterData(BaseModel):
    """キャラクターの不変情報を表すデータモデル
    
    キャラクターの基本的な設定情報を保持し、シミュレーションを通じて変化しない。
    """
    character_id: str = Field(description="システムが割り当てる一意のID")
    name: str = Field(description="キャラ名")
    age: Optional[int] = Field(None, description="年齢")
    occupation: Optional[str] = Field(None, description="職業")
    base_personality: str = Field(description="基本的な性格特性の記述")
    # その他、必要に応じて追加のフィールドを定義可能


class LongTermCharacterData(BaseModel):
    """キャラクターの長期情報を表すデータモデル
    
    キャラクターの経験、目標、記憶など、シミュレーションを通じて更新される情報を保持する。
    """
    character_id: str = Field(description="対応する不変情報と同じID")
    experiences: List[ExperienceData] = Field(default_factory=list, description="過去の重要な経験のリスト")
    goals: List[GoalData] = Field(default_factory=list, description="達成したい目標/願望のリスト")
    memories: List[MemoryData] = Field(default_factory=list, description="特定の記憶のリスト")


class SceneInfoData(BaseModel):
    """場面情報を表すデータモデル
    
    シミュレーションの場面の基本情報（場所、時間、状況など）を保持する。
    """
    scene_id: str = Field(description="各場面を識別するID")
    location: Optional[str] = Field(None, description="場所")
    time: Optional[str] = Field(None, description="時間")
    situation: str = Field(description="場面の状況説明")
    participant_character_ids: List[str] = Field(description="参加キャラクターのIDリスト")
    previous_scene_log_reference: Optional[str] = Field(
        None, 
        description="直前場面のログファイル名など、短期情報を引き継ぐ場合の手がかり (オプション)"
    )


# 介入タイプごとの詳細クラスを定義
class SceneUpdateDetails(BaseModel):
    """場面状況更新のための介入詳細"""
    description: str = Field(description="介入の説明文")
    updated_situation_element: str = Field(description="更新された場面状況の要素")


class RevelationDetails(BaseModel):
    """キャラクターへの天啓のための介入詳細
    
    特定のキャラクターに対して「天啓」として情報を与える介入。
    対象キャラクターIDは親のInterventionDataで指定するため不要。
    """
    description: str = Field(description="介入の説明文")
    revelation_content: str = Field(description="キャラクターへの天啓内容")


class GenericInterventionDetails(BaseModel):
    """その他の未定義介入タイプのためのフォールバックモデル
    
    現時点で具体的なモデルが定義されていない介入タイプのための汎用コンテナ。
    将来の拡張性を考慮して、任意のデータを保持できる構造になっている。
    """
    description: str = Field(description="介入の説明文")
    extra_data: Dict[str, Any] = Field(default_factory=dict, description="介入固有のデータ")


class InterventionData(BaseModel):
    """ユーザー介入を表すデータモデル
    
    各種ユーザー介入の情報を保持し、適用されるタイミングや対象を指定する。
    介入の詳細内容はinterventionに含まれ、intervention_typeに応じた
    適切な詳細モデルのインスタンスが格納される。
    """
    applied_before_turn_number: int = Field(description="どのターンの前に適用されたか")
    intervention_type: str = Field(description="介入の種類 (例: SCENE_SITUATION_UPDATE, REVELATION)")
    intervention: Union[SceneUpdateDetails, RevelationDetails, GenericInterventionDetails] = Field(
        description="介入の詳細情報（介入タイプに応じた構造）"
    )
    target_character_id: Optional[str] = Field(
        None, 
        description="介入対象のキャラクターID（キャラクター対象の介入の場合のみ必須）"
    )


class TurnData(BaseModel):
    """1ターンの記録を表すデータモデル"""
    turn_number: int = Field(description="ターン番号")
    character_id: str = Field(description="行動したキャラクターのID")
    character_name: str = Field(description="行動したキャラクターの名前 (ログの可読性のため)")
    think: str = Field(description="キャラクターの思考内容")
    act: Optional[str] = Field(None, description="キャラクターの行動内容 (行動しない場合はNone)")
    talk: Optional[str] = Field(None, description="キャラクターの発言内容 (発言しない場合はNone)")


class SceneLogData(BaseModel):
    """1場面の全ログを表すデータモデル
    
    場面情報、ユーザー介入記録、各ターンの記録を含む完全なログデータ。
    """
    scene_info: SceneInfoData = Field(description="場面の基本情報")
    interventions_in_scene: List[InterventionData] = Field(
        default_factory=list, 
        description="この場面で発生したユーザー介入のリスト"
    )
    turns: List[TurnData] = Field(
        default_factory=list, 
        description="この場面で実行された各ターンのリスト"
    ) 