# CHANGELOG

## unreleased changes
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
