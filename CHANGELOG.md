# CHANGELOG

## 2.1.1
* ESM から import した際に型定義が正常に読み込まれないバグを修正

## 2.1.0
* `Trigger` のハンドラ関数の登録時に `filter` を指定できるように

## 2.0.1
* 内部のビルドシステム変更
  * CommonJS と ES Module の dual package に変更します
  * 利用側に影響はありません

## 2.0.0
* `Trigger` のハンドラ関数が Promise を渡した場合に一度で登録が解除されてしまわないように

## 1.0.1
* `Trigger#addOnce()` のハンドラ内で `destroy()` が呼ばれた際にクラッシュしてしまうバグを修正

## 1.0.0
* `Trigger` にジェネリクスが指定された場合は `Trigger#fire()` の引数を省略不可に

## 0.1.7
* strict に対応

## 0.1.6
* `Trigger#fire()` のハンドラ内で `Trigger#destroy()` が呼ばれた際にクラッシュしてしまうバグを修正

## 0.1.5
* 初期リリース
