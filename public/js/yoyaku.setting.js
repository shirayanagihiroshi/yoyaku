/*
 * yoyaku.setting.js
 * 面談の日時や時間の設定、保護者の入力を許可するかどうか設定するモジュール
 */
yoyaku.setting = (function () {
  'use strict';

  //---モジュールスコープ変数---
  var configMap = {
        main_html : String()
          + '<div class="yoyaku-setting-back"><-前の画面へ戻る</div>'
          + '<div class="yoyaku-title-1">予約機能の有効・無効設定</div>'
          + '<div class="yoyaku-now-usable1">現在,予約機能は有効です</div>'
          + '<div class="yoyaku-now-usable2">現在,予約機能は無効です</div>'
          + '<div class="yoyaku-now-usable3">まだ日時の枠が未設定です</div>'
          + '<button class="yoyaku-setting-usable-change"></button>'
          + '<div class="yoyaku-title-2">!danger zone!</div>'
          + '<div class="yoyaku-title-3">日時の枠の設定(これを行うと,このクラスの予約データは一旦全て消えます！)</div>'
          + '<textarea class="yoyaku-setting-waku"></textarea>'
          + '<button class="yoyaku-setting-waku-ok">日時の枠を設定する</button>',
        settable_map : {}
      },
      stateMap = {
        $container : null,
        onOffSetting : true,
        waku : []
      },
      jqueryMap = {},
      setJqueryMap, configModule, initModule, removeSetting,
      backToCalendar, onUsableChange, onWakuSet, setView,
      updateNowUsable, updateWaku;

  //---DOMメソッド---
  setJqueryMap = function () {
    var $container = stateMap.$container;
    jqueryMap = {
      $container   : $container,
      $back        : $container.find( '.yoyaku-setting-back' ),
      $titel1      : $container.find( '.yoyaku-title-1' ),
      $usable1     : $container.find( '.yoyaku-now-usable1' ),
      $usable2     : $container.find( '.yoyaku-now-usable2' ),
      $usable3     : $container.find( '.yoyaku-now-usable3' ),
      $usableButton: $container.find( '.yoyaku-setting-usable-change' ),
      $titel2      : $container.find( '.yoyaku-title-2' ),
      $titel3      : $container.find( '.yoyaku-title-3' ),
      $waku        : $container.find( '.yoyaku-setting-waku' ),
      $wakuOk      : $container.find( '.yoyaku-setting-waku-ok' )
    };
  }

  //---イベントハンドラ---
  backToCalendar = function ( ) {
    $.gevent.publish('backToCalendar', [{}]);
  }

  onUsableChange = function ( ) {
    let str, waku = yoyaku.model.getWaku();

    if (waku[0].nowusable == true) {
      jqueryMap.$usable2.css('display', 'none');
      str = '無効';

      stateMap.onOffSetting = false;
    } else {
      jqueryMap.$usable1.css('display', 'none');
      str = '有効';

      stateMap.onOffSetting = true;
    }
    $.gevent.publish('verifyOnOff', [{errStr:'予約機能を' + str + 'にしますか？'}]);
  }

  onWakuSet = function ( ) {
    stateMap.waku = JSON.parse(jqueryMap.$waku.val());

    $.gevent.publish('verifyWaku', [{errStr:'日時の枠を設定しますか？なお、不整合を防ぐため、このクラスの予約情報は一旦全て削除されます'}]);
  }

  //---ユーティリティメソッド---

  setView = function () {

    let str, waku = yoyaku.model.getWaku();

    // 日時枠が未設定なら
    if (waku.length == 0) {
      jqueryMap.$usableButton.css('display', 'none');

      jqueryMap.$usable1.css('display', 'none');
      jqueryMap.$usable2.css('display', 'none');
    } else {

    // 日時枠が設定済なら
      jqueryMap.$usableButton.css('display', 'block');

      if (waku[0].nowusable == true) {
        jqueryMap.$usable2.css('display', 'none');
        jqueryMap.$usable3.css('display', 'none');
        str = '無効にする';
      } else {
        jqueryMap.$usable1.css('display', 'none');
        jqueryMap.$usable3.css('display', 'none');
        str = '有効にする';
      }

      jqueryMap.$usableButton.html(str);
    }
  }

  //---パブリックメソッド---
  configModule = function ( input_map ) {
    yoyaku.util.setConfigMap({
      input_map : input_map,
      settable_map : configMap.settable_map,
      config_map : configMap
    });
    return true;
  }

  initModule = function ( $container ) {
    $container.html( configMap.main_html );
    stateMap.$container = $container;
    setJqueryMap();

    setView();

    jqueryMap.$back
        .click( backToCalendar );

    jqueryMap.$usableButton
        .click( onUsableChange );

    jqueryMap.$wakuOk
        .click( onWakuSet );

    return true;
  }

  removeSetting = function ( ) {
    //初期化と状態の解除
    if ( jqueryMap != null ) {
      if ( jqueryMap.$container ) {
        jqueryMap.$back.remove();
        jqueryMap.$wakuOk.remove();
        jqueryMap.$waku.remove();
      }
    }
    return true;
  }

  updateNowUsable = function ( ) {
    yoyaku.model.updateNowUsable( stateMap.onOffSetting );
  }

  updateWaku = function ( ) {
    yoyaku.model.updateWaku( stateMap.waku );
  }

  return {
    configModule  : configModule,
    initModule    : initModule,
    removeSetting : removeSetting,
    updateNowUsable : updateNowUsable,
    updateWaku    : updateWaku
  };
}());
