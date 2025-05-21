
# **詳細仕様書 - Project Anima**

## **1. はじめに**

### **1.1. プロジェクト概要**

本ドキュメントは、AIキャラクターシミュレーター「Project Anima」（以下、本システム）の開発に関する詳細仕様を定義するものである。  
本システムは、ユーザーが定義したAIキャラクターたちが、与えられたコンテクストに基づいて自律的に思考し、行動・発言する様子をシミュレートする。  
シミュレーション結果はテキストファイルとして出力され、ユーザーはこれを小説、シナリオ等のエンターテイメントコンテンツ制作の素材として活用することを目的とする。

### **1.2. プロジェクトの目的**

* クリエイターに対し、深みのあるキャラクター創造と、キャラクター同士のリアルなインタラクションが織りなす物語生成の強力な支援ツールを提供する。  
* キャラクターの自律的な思考と成長、ユーザーによる介入を通じたダイナミックな物語展開のシミュレーションを実現する。  
* 短期的には、本システムを用いて制作された作品が「note創作大賞」等のコンテストで評価されることを支援する。  
* 中長期的には、本システムから生まれたキャラクターや物語が多様なエンターテイメントコンテンツへ展開し、独自のIPとして成長することに貢献する。

### **1.3. ターゲットユーザー**

* 物語を愛するクリエイター全般（小説家、シナリオライター、ゲームクリエイター、TRPGのゲームマスター等）。  
* 特に、本システムを活用して独自の物語を創造し、作品として発表することを目指す意欲的なクリエイター（当面は開発者自身を主たるユーザーとする）。

### **1.4. 開発の背景と解決したい課題**

クリエイターは、魅力的で多面的なキャラクターの創造、一貫性のある行動・感情の描写、キャラクター間の「生きた」インタラクションの構築、アイデア枯渇の打開といった課題に直面している。本システムは、これらの課題に対し、AIによるキャラクターシミュレーションという新たなアプローチで解決策を提供する。

## **2. システム概要**

### **2.1. システム構成案**

本システムは、主に以下のコンポーネントから構成される。

* **キャラクター設定管理モジュール**: キャラクターの不変情報（Character_ID含む）、長期情報をYAMLファイルから読み込み、管理する。  
* **場面管理モジュール**: 場面情報（場所、時間、状況、登場キャラクターのCharacter_IDリスト、Scene_ID）をYAMLファイルから読み込み、管理する。  
* **コンテクスト生成モジュール**: 現在のターンにおいて、思考を行うキャラクターのコンテクスト（不変情報、長期情報、場面情報、短期情報、オプションで直前場面の短期情報サマリー）を統合して生成する。  
* **思考実行モジュール (LLM連携)**: 生成されたコンテクストを元に、LangGraphフレームワークを通じてLLM APIに思考生成プロンプトを送信し、キャラクターの思考・行動・発言を取得する。  
* **情報更新モジュール**: LLMからの応答に基づき、キャラクターの短期情報、および必要に応じて長期情報（LLMエージェントによる自動更新）を更新する。  
* **シミュレーション進行管理モジュール**: ターンの進行を管理し、ユーザーからの介入（場面状況変更、キャラクターへの天啓など）を受け付ける。  
* **データ入出力モジュール**: キャラクター設定ファイル(YAML)、場面設定ファイル(YAML)の読み込み、シミュレーションログ(JSON/YAML)の場面ごとのファイル出力を担当する。

graph TD  
    A[ユーザー] -->|介入/場面ファイル指定| B(シミュレーション進行管理モジュール)  
    C1["キャラクター設定ファイル (YAML)"] --> D(キャラクター設定管理モジュール)  
    C2["場面設定ファイル (YAML)"] --> F(場面管理モジュール)  
    D --> E(コンテクスト生成モジュール)  
    F --> E  
    G["短期情報 (現在の場面)"] --> E  
    OPT_LOG["(オプション)直前場面ログ"] --> E  
    E --> H{"思考実行モジュール (LLM連携 with LangGraph)"}  
    H -->|思考/行動/発言| I(情報更新モジュール)  
    I --> G  
    I -->|長期情報更新| D  
    B --> H  
    H --> J[ログ出力モジュール]  
    J --> K["シミュレーションログ (JSON/YAML)"]

### **2.2. 主要技術スタック**

* プログラミング言語: Python (想定)  
* LLM連携フレームワーク: LangGraph  
* LLM API: (具体的なAPI名は未定だが、JSON形式での構造化出力をサポートするもの。GeminiまたはOpenAIを想定)  
* データフォーマット: YAML (入力用設定ファイル), JSON/YAML (出力ログ)

### **2.3. 用語定義**

* **ターン**: キャラクター一人が思考し、行動または発言を行う一連の処理単位。  
* **場面 (Scene)**: シミュレーションが行われる具体的な状況。Scene_ID、場所、時間、状況説明、参加キャラクターのCharacter_IDリストによって定義される。  
* **Scene_ID**: 各場面を一意に識別するためのID（例: "S001", "S002"など。場面設定ファイル名と一致させることを推奨）。  
* **Character_ID**: 各キャラクターを一意に識別するためのID（例: UUIDv4など。キャラクター作成時にシステムが採番し、不変情報としてYAMLに記録）。  
* **コンテクスト**: キャラクターが思考する際に参照する情報群。以下の4種類（＋オプション1種類）から構成される。  
  * **不変情報 (Immutable Context)**: キャラクターの基本設定（Character_ID、名前、年齢、職業、基本的な特性や性格など）。シミュレーションを通じて変化しない。  
  * **長期情報 (Long-term Context)**: キャラクターの経験、目標、記憶のリスト。シミュレーションを通じてLLMエージェントにより更新される。各要素はCharacter_IDに紐づく。  
  * **場面情報 (Scene Context)**: 現在の場面に関する情報（Scene_ID、場所、時間、状況説明、登場キャラクターのCharacter_IDリストなど）。場面設定ファイルから読み込まれる。  
  * **短期情報 (Short-term Context - Current Scene)**: **現在の場面における**、自分自身および他の登場キャラクターの直近の思考・行動・発言の履歴（Character_IDと共に記録）、およびユーザーによる介入情報。  
  * **(オプション) 短期情報 (Short-term Context - Previous Scene Summary)**: 直前の場面の短期情報の要約。コンテクスト長を考慮し、限定的に使用する。

## **3. 機能仕様**

### **3.1. 機能一覧**

（ユーザーストーリー最終版を元に、システム機能として再整理）

1. **機能名**: キャラクター基本設定管理  
   * **概要**: プロフィール(Character_ID, 名前,年齢等)を定義・編集。YAMLで管理。  
   * **関連ユーザーストーリーNo.** : 1, 2  
   * **優先度**: [M]  
2. **機能名**: キャラクター長期情報自動更新  
   * **概要**: LLMエージェントが経験・目標・記憶をCharacter_IDに紐づけて自動更新。YAMLで管理。  
   * **関連ユーザーストーリーNo.** : 3  
   * **優先度**: [M]  
3. **機能名**: 複数キャラクター管理  
   * **概要**: 最低2名以上のキャラクター情報(Character_IDで識別)を一元管理。  
   * **関連ユーザーストーリーNo.** : 4  
   * **優先度**: [M]  
4. **機能名**: 場面定義・開始  
   * **概要**: Scene_ID、場所、時間、状況、登場キャラ(Character_IDリスト)を定義しシミュレーション開始。  
   * **関連ユーザーストーリーNo.** : 5, 6  
   * **優先度**: [M]  
5. **機能名**: ターンベース進行  
   * **概要**: Character_IDで識別されるキャラクターが順番に思考・行動・発言。  
   * **関連ユーザーストーリーNo.** : 7  
   * **優先度**: [M]  
6. **機能名**: 場面状況へのユーザー介入  
   * **概要**: 天候変化、イベント発生など、場面状況をユーザーが変更可能。介入情報はログに記録。  
   * **関連ユーザーストーリーNo.** : 8  
   * **優先度**: [M]  
7. **機能名**: キャラクターへの天啓付与  
   * **概要**: 特定キャラ(Character_IDで指定)の思考に介入し、情報や認識のきっかけを提供。介入情報はログに記録。  
   * **関連ユーザーストーリーNo.** : 9  
   * **優先度**: [S]  
8. **機能名**: 過去場面/ターンへの復帰  
   * **概要**: 過去の特定時点に戻り、異なる介入を試行可能。  
   * **関連ユーザーストーリーNo.** : 10  
   * **優先度**: [S]  
9. **機能名**: 思考プロセス可視化 (検討)  
   * **概要**: キャラクターがどの情報を重視したか等を表示（実現方法検討）。  
   * **関連ユーザーストーリーNo.** : 11  
   * **優先度**: [S]  
10. **機能名**: 短期情報自動記録・更新  
    * **概要**: 場面内の思考・行動・発言履歴(Character_IDと共に)、ユーザー介入情報を自動で記録・更新。  
    * **関連ユーザーストーリーNo.** : 12  
    * **優先度**: [M]  
11. **機能名**: 場面詳細情報記述  
    * **概要**: 場所・時間・雰囲気等をテキストで詳細に記述可能。  
    * **関連ユーザーストーリーNo.** : 13  
    * **優先度**: [M]  
12. **機能名**: 外部設定ファイル読み込み  
    * **概要**: YAML定義のキャラ不変/長期情報を読込。  
    * **関連ユーザーストーリーNo.** : 14  
    * **優先度**: [M]  
13. **機能名**: 長期情報への経験・記憶追記  
    * **概要**: シミュレーション中の重要イベントを長期情報YAMLにCharacter_IDに紐づけて追記・更新。  
    * **関連ユーザーストーリーNo.** : 15  
    * **優先度**: [S]  
14. **機能名**: シミュレーション結果出力  
    * **概要**: 場面毎の結果(Scene_ID, Character_ID, キャラ名,思考,行動,発言,場面情報,ユーザー介入情報)をJSON/YAMLで出力。  
    * **関連ユーザーストーリーNo.** : 16  
    * **優先度**: [M]  
15. **機能名**: 特定キャラ視点ログ出力(検討)  
    * **概要**: 特定キャラ(Character_IDで指定)視点でのみログを出力（実現方法検討）。  
    * **関連ユーザーストーリーNo.** : 17  
    * **優先度**: [C]  
16. **機能名**: 感情・関係性変化レポート(検討)  
    * **概要**: 感情の変遷や関係性の変化をまとめたレポート生成（実現方法検討）。  
    * **関連ユーザーストーリーNo.** : 18  
    * **優先度**: [S]  
17. **機能名**: LangGraph透過利用  
    * **概要**: LangGraphを意識せずシミュレーターを利用可能。  
    * **関連ユーザーストーリーNo.** : 19  
    * **優先度**: [M]  
18. **機能名**: 操作性 (開発者向け)  
    * **概要**: 開発者自身が利用するため、高度なUIは不要だが基本的な操作性は確保。  
    * **関連ユーザーストーリーNo.** : 20  
    * **優先度**: [C]

### **3.2. 主要機能詳細設計**

#### **3.2.1. キャラクター思考プロセス (ターン処理)**

1. **対象キャラクター決定**: 場面内の参加Character_IDリストに基づき、現在のターンで思考を行うキャラクターを決定する（順番制）。  
2. **コンテクスト収集**:  
   * 対象キャラクターの「不変情報」(Character_IDをキーにYAMLから取得)。  
   * 対象キャラクターの「長期情報」(Character_IDをキーにYAMLから取得、最新の状態)。  
   * 現在の「場面情報」(Scene_ID含む。場面設定ファイルから読み込まれたもの)。  
   * 現在の場面における「短期情報」（Character_IDと共に記録された自分と他者の直近の発言・行動履歴、および直前のユーザー介入情報）。  
   * **(オプション)** システム設定に基づき、直前の場面の短期情報ログから要約された情報、または指定されたターン数の情報を収集する。この情報は、場面間の連続性を高めるために限定的に使用される。  
3. **思考生成プロンプト構築**: 上記コンテクスト情報を埋め込んだ思考生成プロンプトを生成する。プロンプトは、キャラクターのCharacter_IDと名前を明示し、性格、目標、現在の状況、過去の経験、直近の会話の流れ（現在の場面およびオプションで直前場面の情報）などを考慮し、次にどのような「思考」「行動」「発言」をすべきかをLLMに問いかける形式とする。  
4. **LLM API呼び出し (LangGraph経由)**:  
   * 構築したプロンプトをLangGraphを通じてLLM APIに送信する。  
   * LLMからの応答は、以下のキーを持つJSON形式であることを期待する:  
     {  
       "think": "キャラクターの思考内容の文字列",  
       "act": "キャラクターの行動内容の文字列 (行動しない場合は空文字またはnull)",  
       "talk": "キャラクターの発言内容の文字列 (発言しない場合は空文字またはnull)"  
     }

5. **応答解釈と短期情報更新**:  
   * LLMからのJSON応答をパースする。  
   * think, act, talkの内容を、現在のターンのキャラクター(Character_ID)の行動として「短期情報」に記録する。  
6. **長期情報更新トリガー (該当する場合)**:  
   * 現在のターンの出来事（ユーザーの介入、キャラクターの重要な発見や決断など）が、キャラクターの「長期情報」（経験、目標、記憶）に影響を与えると判断された場合、LLMを用いたエージェント（別の専用プロンプトで動作）を起動し、対象キャラクター(Character_ID)の長期情報の更新案を生成させ、YAMLファイルに反映する。この更新は、主にユーザーがコンソールから明示的に指示した場合に行われます。将来的には、オプションとして、特定のイベント発生時に自動的に更新を行う機能の導入も検討します。

#### **3.2.2. コンテクスト管理**

* **不変情報**: characters/<character_name_or_id>/immutable.yaml のようなパスで管理。（フォルダ名は人間が分かりやすい名前とし、ファイル内にCharacter_IDを必須とする）  
  character_id: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" # システムが割り当てる一意のID  
  name: "キャラ名"  
  age: 20  
  occupation: "職業"  
  base_personality: "基本的な性格特性の記述..."  
  # その他、不変の設定項目

* **長期情報**: characters/<character_name_or_id>/long_term.yaml のようなパスで管理。  
  character_id: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" # 対応する不変情報と同じID  
  experiences:  
    - event: "過去の重要な経験1"  
      importance: 8 # 1-10段階  
    - event: "過去の重要な経験2"  
      importance: 6  
  goals: # キャラクターの願望リスト  
    - goal: "達成したい大きな夢（例：世界一の小説家になる）"  
      importance: 9  
    - goal: "日常的な小さな願い（例：美味しいケーキが食べたい）"  
      importance: 3  
  memories:  
    - memory: "特定の記憶（誰かに何かを言われた、など）"  
      scene_id_of_memory: "S000" # 記憶が発生した場面のScene_ID  
      related_character_ids: ["yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy"] #関連キャラクターのIDリスト

* **場面情報 (ファイル入力形式)**: scenes/<scene_id>.yaml のようなパスで管理。  
  # scenes/S001.yaml のようなファイルで提供  
  scene_id: "S001"  
  location: "学校の教室"  
  time: "放課後"  
  situation: "夕日が差し込み、生徒はほとんど帰宅している。窓際の席でAとBが話している。"  
  participant_character_ids: ["xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy"] # 参加キャラクターのIDリスト  
  # (オプション) previous_scene_log_reference: "scene_S000.json" # 直前の場面のログファイル名など、短期情報を引き継ぐ場合の手がかり

* **短期情報 (ログファイル構造)**: 場面ごとにメモリ上で管理し、場面終了時にログファイルとして出力。  
  // ログファイル: logs/<simulation_id>/scene_S001.json (ファイル名にScene_IDを使用)  
  {  
    "scene_info": {  
      "scene_id": "S001",  
      "location": "学校の教室",  
      "time": "放課後",  
      "situation": "夕日が差し込み、生徒はほとんど帰宅している。窓際の席でAとBが話している。",  
      "participant_character_ids": ["xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy"]  
    },  
    "interventions_in_scene": [ // この場面で発生したユーザー介入のリスト  
      {  
        "applied_before_turn_number": 2, // どのターンの前に適用されたか  
        "intervention_type": "SCENE_SITUATION_UPDATE", // 3.2.3参照  
        "details": {  
          "description": "ユーザーが場面の状況を「突然雨が降ってきた」と更新しました。",  
          "updated_situation_element": "突然雨が降ってきた"  
        }  
      },  
      {  
        "applied_before_turn_number": 3, // 介入がターンに直接紐づかない場合や、ターン開始前の場合  
        "intervention_type": "REVELATION",  
        "target_character_id": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",  
        "details": {  
          "revelation_content": "あなたはシミュレーション内の存在かもしれない"  
        }  
      }  
    ],  
    "turns": [  
      {  
        "turn_number": 1,  
        "character_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",  
        "character_name": "キャラA", // ログの可読性のため名前も併記  
        "think": "Bは何か悩んでいるようだ...",  
        "act": "Bの方を向く",  
        "talk": "「どうしたんだい、元気ないね？」"  
      },  
      {  
        "turn_number": 2, // このターンの前に上記のSCENE_SITUATION_UPDATE介入が適用される  
        "character_id": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",  
        "character_name": "キャラB",  
        "think": "Aに気づかれたか...それに雨も降ってきたな。", // 介入を反映した思考  
        "act": null,  
        "talk": "「いや、別に……ちょっと考え事だよ」"  
      },  
      {  
        "turn_number": 3, // このターンの前に上記のREVELATION介入がキャラBに適用される  
        "character_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",  
        "character_name": "キャラA",  
        "think": "（Bの様子が少し変わったような……雨のせいだけではなさそうだ）",  
        "act": "窓の外を見る",  
        "talk": "「すごい雨になってきたね」"  
      }  
      // ...以降のターン  
    ]  
  }

#### **3.2.3. ユーザーによる介入**

ユーザーはコンソール（または簡易なUI）を通じて、以下の介入が可能。これらの介入はログに記録される。

1. **ターン進行**: 次のキャラクターのターンに進める。（これは基本的な操作であり、通常ログには記録しないが、デバッグ等のために記録することも検討可能）  
2. **長期情報更新指示**: 指定したキャラクター(Character_IDで指定)の長期情報（経験、目標、記憶）をLLMエージェントに更新させるよう指示する。  
   * ログ記録例: intervention_type: "LONG_TERM_INFO_UPDATE_REQUEST", target_character_id: "xxxxxxxx-xxxx-...", details: {...}  
3. **場面状況介入**:  
   * 場面の状況説明を更新する（例：「突然雨が降ってきた」と追記）。  
   * 新たなキャラクター(Character_IDで指定)を場面に追加する／場面から退出させる。  
   * 場面を終了させる。  
   * ログ記録例: intervention_type: "SCENE_SITUATION_UPDATE", details: {change_type: "ADD_EVENT", description:"突然雨が降ってきた"}  
4. **天啓付与 (機能No.7)**: 特定のキャラクター(Character_IDで指定)に対し、次の思考に影響を与える特別な情報を注入する。  
   * ログ記録例: intervention_type: "REVELATION", target_character_id: "xxxxxxxx-xxxx-...", details: {revelation_content: "..."}

## **4. データ仕様**

### **4.1. データ構造**

* キャラクター情報: 上記3.2.2.記載の immutable.yaml (Character_ID含む), long_term.yaml (Character_ID含む) の通り。  
* **場面情報**: scenes/<scene_id>.yaml ファイルで定義。Scene_ID、participant_character_idsを含む。  
* シミュレーションログ: 上記3.2.2.記載の短期情報（各ターンの記録はCharacter_IDとキャラ名を含む）およびユーザー介入情報（target_character_idを含む）を含む、場面ごとのJSONまたはYAMLファイル。各ファイルが一つの場面に対応する。

### **4.2. ファイル形式と入出力**

* **入力**:  
  * キャラクター設定: 各キャラクターディレクトリ内の immutable.yaml, long_term.yaml。これらにはCharacter_IDが含まれる。  
  * **場面設定**: scenes/<scene_id>.yaml 形式のファイル。システム起動時または場面開始時に、ユーザーがコンソールからファイルパスを引数として指定することで読み込ませる。Scene_IDはこのファイル名またはファイル内の定義に従う。participant_character_idsもこのファイルで指定。  
  * **(オプション) 直前場面の短期情報**: システム設定に基づき、指定された直前場面のログファイル (logs/<simulation_id>/scene_<previous_scene_id>.json) を参照する。  
* **出力**:  
  * 場面ごとのシミュレーションログ: logs/<simulation_id>/scene_<scene_id>.json (または .yaml)  
    * ファイル名にScene_IDを使用する。  
    * ファイルには、その場面の場面情報(Scene_ID含む)と、その場面で発生した全ターンの記録（Character_ID、キャラクター名、思考、行動、発言）、およびその場面中に行われたユーザー介入の記録が含まれる。

## **5. フォルダ構成案**

project_anima/  
│  
├── main.py                   # メイン実行スクリプト (起動時に場面設定ファイルパスを引数に取る)  
│  
├── core/                     # コアロジック  
│   ├── simulation_engine.py  # シミュレーション進行管理  
│   ├── character_manager.py  # キャラクター情報管理  
│   ├── scene_manager.py      # 場面情報管理  
│   ├── context_builder.py    # コンテクスト生成  
│   ├── llm_adapter.py        # LLM API連携 (LangGraph使用)  
│   └── information_updater.py # 短期・長期情報更新  
│  
├── characters/               # キャラクター設定データ (フォルダ名は人間可読な名前を推奨)  
│   ├── alice/  
│   │   ├── immutable.yaml    # この中に character_id: "uuid_for_alice" が含まれる  
│   │   └── long_term.yaml    # この中に character_id: "uuid_for_alice" が含まれる  
│   └── bob/  
│       ├── immutable.yaml    # この中に character_id: "uuid_for_bob" が含まれる  
│       └── long_term.yaml    # この中に character_id: "uuid_for_bob" が含まれる  
│  
├── scenes/                   # ★場面設定ファイル格納場所  
│   ├── S001.yaml  
│   └── S002.yaml  
│  
├── logs/                     # シミュレーションログ出力先  
│   └── <simulation_id>/      # 各シミュレーション実行ごとのフォルダ  
│       ├── scene_S001.json   # Scene_IDをファイル名に使用  
│       └── scene_S002.json  
│  
├── prompts/                  # LLM用プロンプトテンプレート  
│   ├── think_generate.txt  
│   └── long_term_update.txt  
│  
└── utils/                    # ユーティリティ  
    └── file_handler.py       # YAML/JSONファイルの読み書き等

### **5.1. core/ ディレクトリ内の各Pythonファイルの役割と主要な関数・クラス（想定）**

* **simulation_engine.py**: シミュレーション全体の流れを制御する。  
  * **クラス**: SimulationEngine  
    * __init__(self, scene_file_path): 場面設定ファイルを読み込み、関連モジュールを初期化。  
    * start_simulation(self): シミュレーションを開始し、ターンを進行させるループを管理。  
    * next_turn(self): 次のキャラクターを決定し、思考・行動・発言を実行させる。  
    * process_user_intervention(self, intervention_data): ユーザーからの介入を処理し、関連モジュールに通知。  
    * _determine_next_character(self): 次に行動するキャラクターを決定するロジック。  
    * _log_turn_data(self, character_id, think, act, talk): ターンの結果をログに記録。  
    * _save_scene_log(self): 場面終了時にログをファイルに出力。  
* **character_manager.py**: キャラクターの情報を管理する。  
  * **クラス**: CharacterManager  
    * __init__(self, character_data_path): キャラクター設定ファイルが格納されているディレクトリパスを保持。  
    * load_character_data(self, character_id): 指定されたCharacter_IDの不変情報と長期情報をYAMLファイルから読み込む。  
    * get_immutable_context(self, character_id): 指定キャラクターの不変情報を返す。  
    * get_long_term_context(self, character_id): 指定キャラクターの長期情報を返す。  
    * update_long_term_context(self, character_id, new_long_term_data): 指定キャラクターの長期情報を更新し、YAMLファイルに保存。  
  * **データクラス (Pydantic等での定義を想定)**: ImmutableCharacterData, LongTermCharacterData (experiences, goals, memoriesの構造を含む)  
* **scene_manager.py**: 現在の場面情報を管理する。  
  * **クラス**: SceneManager  
    * __init__(self): 場面情報を初期化。  
    * load_scene_from_file(self, scene_file_path): 指定された場面設定YAMLファイルを読み込み、場面情報を設定。  
    * get_current_scene_info(self): 現在の場面情報（Scene_ID, location, time, situation, participant_character_idsなど）を返す。  
    * get_participant_character_ids(self): 現在の場面の参加キャラクターIDリストを返す。  
    * update_scene_situation(self, new_situation_description): ユーザー介入により場面の状況説明を更新。  
    * add_character_to_scene(self, character_id): 場面にキャラクターを追加。  
    * remove_character_from_scene(self, character_id): 場面からキャラクターを削除。  
  * **データクラス**: SceneData (scene_id, location, time, situation, participant_character_idsなどを含む)  
* **context_builder.py**: LLMに渡すコンテクストを構築する。  
  * **クラス**: ContextBuilder  
    * __init__(self, character_manager, scene_manager): 関連マネージャーのインスタンスを保持。  
    * build_context_for_character(self, character_id, current_scene_short_term_log, previous_scene_summary=None): 指定されたキャラクターの思考に必要なコンテクスト（不変、長期、場面、短期、オプションで前場面サマリー）を整形して文字列または構造化データとして生成。  
    * _format_immutable_context(self, immutable_data): 不変情報をプロンプト用に整形。  
    * _format_long_term_context(self, long_term_data): 長期情報をプロンプト用に整形（重要度や関連性を考慮して情報を取捨選択するロジックも含む可能性あり）。  
    * _format_scene_context(self, scene_data): 場面情報をプロンプト用に整形。  
    * _format_short_term_context(self, short_term_log): 短期情報（会話履歴など）をプロンプト用に整形。  
* **llm_adapter.py**: LLM APIとの連携を担当する。LangGraphのステートマシンやノード定義が含まれる。  
  * **クラス**: LLMAdapter (またはLangGraphのGraphを構築する関数群)  
    * __init__(self, api_key=None, model_name="gemini-pro"): LLM APIクライアントを初期化。  
    * generate_character_thought(self, context_prompt, prompt_template_path): 思考生成プロンプトを実行し、思考・行動・発言のJSON応答を取得。  
    * update_character_long_term_info(self, character_id, current_scene_log, prompt_template_path): 長期情報更新用のプロンプトを実行し、更新案を取得。  
  * LangGraphのノード関数:  
    * invoke_llm_for_thought(state): 思考生成のためにLLMを呼び出すノード。  
    * invoke_llm_for_long_term_update(state): 長期情報更新のためにLLMを呼び出すノード。  
    * その他、LangGraphのステート管理や条件分岐に必要なノード。  
* **information_updater.py**: シミュレーション情報を更新する。  
  * **クラス**: InformationUpdater  
    * __init__(self, character_manager): キャラクターマネージャーのインスタンスを保持。  
    * record_turn_to_short_term_log(self, scene_log_data, character_id, character_name, think, act, talk): 1ターンの結果を短期情報（場面ログ）に追加。  
    * record_intervention_to_log(self, scene_log_data, intervention_data): ユーザー介入情報を短期情報（場面ログ）に追加。  
    * trigger_long_term_update(self, character_id, llm_adapter, current_scene_log): LLMAdapterを介して長期情報の更新を実行し、CharacterManager経由で保存。

## **6. アーキテクチャに関する意思決定**

* キャラクターの思考生成および長期情報の更新には、LLM (Large Language Model) APIを利用する。  
* LLMとの連携処理の柔軟性と管理の容易さのため、LangGraphフレームワークを採用する。  
* ユーザーによる設定変更の容易性と可読性のため、キャラクターの基本設定および長期情報はYAML形式で管理する。各キャラクターはシステム内部で一意のCharacter_IDによって識別される。  
* シミュレーション結果のログは、機械判読性と拡張性を考慮し、JSONまたはYAML形式で場面ごとに出力する。