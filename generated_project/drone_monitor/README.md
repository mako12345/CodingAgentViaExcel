# DroneMonitor - ドローン監視・制御Webアプリ

## 概要
FlaskベースのリアルタイムWebアプリ。複数ドローンの3D位置表示・ステータス監視・制御を行う。

## 主な機能
- Three.jsによる3Dグリッド描画（マウスで視点変更）
- 複数ドローン同時表示（WebSocket リアルタイム更新）
- 各ドローンのバッテリー/速度/高度などステータス数値表示
- Chart.jsによるステータスグラフ
- ログ画面（/logs）
- 設定画面（/settings）

## 起動方法
```
pip install -r requirements.txt
python app/main.py
```
ブラウザで http://localhost:5000 を開く

## 構成
- app/main.py       : Flaskサーバ + WebSocket
- app/drone_sim.py  : ドローン状態シミュレータ
- app/templates/    : HTMLテンプレート
- app/static/       : JS/CSS
