/*
 * yoyaku.js
 * ルート名前空間モジュール
 */
var yoyaku = (function () {
  'use strict';

  var initModule = function ( $container ) {
    yoyaku.model.initModule();
    yoyaku.shell.initModule($container);
  }

  return { initModule : initModule };
}());
