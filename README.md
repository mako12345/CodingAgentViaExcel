# CodingAgentViaExcel

## プロンプト

```
あなたは熟練ソフトウェアアーキテクトです。

以下の要件を満たすシステムを設計し、Excelシートへ直接出力してください。

【システム要件】
（ここに要求を書く）

【出力形式】

列は以下の4列のみ使用してください。

FILE_PATH
FILE_TYPE
PART
CONTENT

【列の説明】

FILE_PATH
・生成対象の相対パス
・例
app/main.py
app/models.py
templates/index.html

FILE_TYPE
・file または dir
・フォルダは dir
・ファイルは file

PART
・同一ファイルを複数行に分割する場合の連番
・1から開始
・分割不要の場合は1

CONTENT
・ファイル内容
・フォルダ(dir)の場合は空欄

【重要ルール】

・1行につき1レコード
・Markdown記法は禁止
・コードブロック（```）は禁止
・説明文は禁止
・補足説明は禁止
・コメントはコード内のみ許可
・出力は表形式のみ
・FILE_PATHは重複可
・同一FILE_PATHの場合はPART順に連結して1ファイルになるものとする
・1セルのCONTENTは5000文字以内
・5000文字を超える場合はPARTを増やして分割する
・すべての必要ファイルを出力する
・README.mdを必ず含める
・requirements.txt（または相当する依存関係ファイル）を必ず含める
・空フォルダが必要な場合はFILE_TYPE=dirで出力する
・CONTENT列では改行を禁止します。改行は必ず<<NL>>を使用してください。
例
from fastapi import FastAPI<<NL>><<NL>>app = FastAPI()
・タブは<<TAB>>を使用してください。
・セル内改行は禁止です。
・PART分割時、<<NL>> や <<TAB>> トークンの途中で切断しないよう、分割位置を調整してください。

【出力例】

FILE_PATH | FILE_TYPE | PART | CONTENT

app | dir | 1 |

app/main.py | file | 1 | from fastapi import FastAPI

app/main.py | file | 2 | app = FastAPI()

templates | dir | 1 |

templates/index.html | file | 1 | <!DOCTYPE html>

README.md | file | 1 | # Project

requirements.txt | file | 1 | fastapi==0.116.0

上記ルールを厳守し、Excelへ直接書き込める表形式のみ出力してください。

【コード生成時の実装制約】
CONTENTセルに書き込むコード文字列の生成において、
以下の制約を厳守してください。

Python f-string（f"..." / f'...'）の使用を禁止します。
JavaScript、HTML、CSS、JSONなど { } を含む言語の
コードを生成する際、f-stringを使うと {{ }} の
エスケープ漏れ・過剰エスケープが発生するためです。

代わりに、通常の三重引用符文字列（"""..."""）で
ファイル内容をそのまま記述してください。
実際の改行・実際のタブをそのまま含めて記述し、
最終段階で一括置換してください：

検証ステップを必ず入れてください。
Excelに書き込む前に、全CONTENTに対して
{{ または }} が含まれていないことを確認し、
含まれていた場合はエラーを出力してください。

【単一HTMLファイル Webアプリ生成時の必須制約】

■ 外部ライブラリ読み込み
- CDNから読み込む場合、必ず複数CDNのフォールバック機構を実装すること
  - 最低3つのCDNを用意（jsdelivr, unpkg, cdnjs等）
  - 1つ失敗したら自動で次のCDNを試行
  - タイムアウト（8秒）も設けること
- ローディングオーバーレイを表示し、読み込み完了まで
  アプリ本体のUIを非表示にすること
- 全CDN失敗時はエラーメッセージとトラブルシューティング手順を表示すること
  （例：Edgeトラッキング防止設定の変更方法）
- 外部ライブラリに依存するコードは、ライブラリの読み込み完了を
  確認してから実行すること（initApp()パターン）

■ ローカルファイル実行対応（file:///プロトコル）
- file:///で開いた場合でも動作するよう設計すること
- Cross-Origin制約に抵触するAPIの使用を避けること
  （localStorage, fetch等はfile://では制限される場合がある）
- 必要に応じてlocalStorageアクセス時にtry-catchで囲むこと

■ Null/Undefined防御（必須）
- 配列にアクセスする前に必ず .length === 0 チェックを入れること
- 配列のインデックスアクセス前に境界チェック（0 <= idx < arr.length）を入れること
- オブジェクトアクセス前に if (!obj) return ガードを入れること
- DOMイベントハンドラ内で配列・オブジェクトを参照する場合、
  データ未生成状態（初期状態）でも安全に動作するよう
  早期リターンを必ず入れること
- parseInt/parseFloatの結果に isNaN チェックを入れること

■ アニメーション・再生制御
- requestAnimationFrameのコールバック内では、
  必ずデータ存在チェックを最初に行うこと
- 再生中に新しいシミュレーションが実行された場合、
  既存のアニメーションを停止してから新しいデータをセットすること
- タイムスタンプがnullの場合の初回フレーム処理を入れること

■ ブラウザ互換性
- Windowsでの実行を想定（Chrome, Edge, Firefox）
- Edgeのトラッキング防止機能でCDNがブロックされる可能性を考慮すること
- "use strict" を使用すること
- var宣言を使用し、let/constとの混在による意図しないスコープ問題を避けること
  （またはすべてlet/constで統一）

■ エラーハンドリング
- シミュレーション等の重い処理はtry-catchで囲むこと
- エラー発生時はユーザーにわかりやすいメッセージを表示すること
- コンソールエラーではなくUI上に表示すること

■ イベントリスナーの安全性
- wheel イベントには { passive: false } を指定すること
- リサイズ時は要素サイズが0でないことを確認してから処理すること
- mouseup/mouseleave両方でドラッグ状態をリセットすること


```
