/*
 * yoyaku.shell.js
 * シェルモジュール
 */
yoyaku.shell = (function () {
  'use strict';

  //---モジュールスコープ変数---
  var configMap = {
    anchor_schema_map : {
      status : {matiuke         : true,
                dialog          : true,
                calendar        : true, //従属変数なし
                setting         : true  //従属変数なし
              },
      _status : {
        dialogKind : { login          : true,  // status : dialog のとき使用
                       logout         : true,  // status : dialog のとき使用
                       invalid        : true,  // status : dialog のとき使用
                       verify         : true,  // status : dialog のとき使用
                       verifydel      : true,  // status : dialog のとき使用
                       Updone         : true,  // status : dialog のとき使用
                       nowusableverify :true,  // status : dialog のとき使用
                       wakuverify     : true,  // status : dialog のとき使用
                       wakuUpdateDone : true}  // status : dialog のとき使用
      }
      // アンカーマップとして許容される型を事前に指定するためのもの。
      // 例えば、color : {red : true, blue : true}
      // とすれば、キーcolorの値は'red'か'blue'のみ許容される。
      // 単にtrueとすれば、どんな値も許容される。従属キーに対しても同じ。
      // ここでキーとして挙げていないものをキーとして使用するのは許容されない。
    },
    main_html : String()
      + '<div class="yoyaku-shell-head">'
        + '<p>面談の日程 web予約</p>'
        + '<button class="yoyaku-shell-head-acct"></button>'
      + '</div>'
      + '<div class="yoyaku-shell-main">'
      + '</div>'
    },
    stateMap = {
      $container : null,
      anchor_map : {},
      errStr     : ""    // エラーダイアログで表示する文言を一時的に保持。
                         // ここになきゃいけない情報でないので良い場所を見つけたら移す
    },
    jqueryMap = {},
    copyAnchorMap, changeAnchorPart, onHashchange, setModal,
    setJqueryMap, initModule, stateCtl;

  //---DOMメソッド---
  setJqueryMap = function () {
    var $container = stateMap.$container;
    jqueryMap = {
      $container : $container,
      $acct      : $container.find( '.yoyaku-shell-head-acct' ),
      $main      : $container.find( '.yoyaku-shell-main' )
    };
  }

  //---イベントハンドラ---
  onHashchange = function ( event ) {
    var anchor_map_previous = copyAnchorMap(),
        anchor_map_proposed,
        _s_status_previous, _s_status_proposed;

    // アンカーの解析を試みる
    try {
      anchor_map_proposed = $.uriAnchor.makeAnchorMap();
    } catch ( error ) {
      $.uriAnchor.setAnchor( anchor_map_previous, null, true );
      return false;
    }
    stateMap.anchor_map = anchor_map_proposed;

    // makeAnchorMapは独立したキー毎に、'_s_キー'というのを作る。
    // 該当するキー値と、そのキーに従属したキー値が含まれる。
    // おそらくここの処理のように、変更の有無を調べやすくするためのもの。
    // spaの本には単に便利な変数と書いてあった。
    _s_status_previous = anchor_map_previous._s_status;
    _s_status_proposed = anchor_map_proposed._s_status;

    // 変更されている場合の処理
    if ( !anchor_map_previous || _s_status_previous !== _s_status_proposed ) {

      stateCtl(anchor_map_proposed);
    }

    return false;
  }

  // 真のイベントハンドラ
  // 状態管理 URLの変更を感知して各種処理を行う。
  // 履歴に残る操作は必ずここを通る。
  // なお、従属変数は'_s_キー'に入っている。
  stateCtl = function ( anchor_map ) {
    let clearMainContent = function () {
      yoyaku.dialog.removeDialog();
      yoyaku.dialogOkCancel.removeDialog();
    };

    // ダイアログの場合
    if ( anchor_map.status == 'dialog' ) {
      if ( anchor_map._status.dialogKind == 'login' ) {
        setModal(true);
        yoyaku.dialog.configModule({});
        yoyaku.dialog.initModule( jqueryMap.$container );
      } else if ( anchor_map._status.dialogKind == 'logout' ) {
        setModal(true);
        yoyaku.dialogOkCancel.configModule({showStr : 'ログアウトしますか？',
                                         okFunc  : yoyaku.model.logout,
                                         ngFunc  : yoyaku.dialogOkCancel.closeMe});
        yoyaku.dialogOkCancel.initModule( jqueryMap.$container );
      } else if ( anchor_map._status.dialogKind == 'invalid' ) {
        setModal(true);
        yoyaku.dialogOkCancel.configModule({showStr : stateMap.errStr,
                                         // OKでもキャンセルと同じ動きをさせる
                                         okFunc  : yoyaku.dialogOkCancel.closeMe,
                                         ngFunc  : yoyaku.dialogOkCancel.closeMe});
        yoyaku.dialogOkCancel.initModule( jqueryMap.$container );
      } else if ( anchor_map._status.dialogKind == 'verify' ) {
        setModal(true);
        yoyaku.dialogOkCancel.configModule({showStr : stateMap.errStr,
                                         okFunc  : yoyaku.calendar.updateReserve,
                                         ngFunc  : yoyaku.dialogOkCancel.closeMe});
        yoyaku.dialogOkCancel.initModule( jqueryMap.$container );
      } else if ( anchor_map._status.dialogKind == 'Updone' ) {
        setModal(true);
        yoyaku.dialogOkCancel.configModule({showStr : stateMap.errStr,
                                         okFunc  : yoyaku.model.readyReserve,
                                         ngFunc  : yoyaku.model.readyReserve});
        yoyaku.dialogOkCancel.initModule( jqueryMap.$container );
      } else if ( anchor_map._status.dialogKind == 'verifydel' ) {
        setModal(true);
        yoyaku.dialogOkCancel.configModule({showStr : stateMap.errStr,
                                         okFunc  : yoyaku.calendar.deleteReserve,
                                         ngFunc  : yoyaku.dialogOkCancel.closeMe});
        yoyaku.dialogOkCancel.initModule( jqueryMap.$container );
      } else if ( anchor_map._status.dialogKind == 'nowusableverify' ) {
        setModal(true);
        yoyaku.dialogOkCancel.configModule({showStr : stateMap.errStr,
                                         okFunc  : yoyaku.setting.updateNowUsable,
                                         ngFunc  : yoyaku.dialogOkCancel.closeMe});
        yoyaku.dialogOkCancel.initModule( jqueryMap.$container );
      } else if ( anchor_map._status.dialogKind == 'wakuverify' ) {
        setModal(true);
        yoyaku.dialogOkCancel.configModule({showStr : stateMap.errStr,
                                         okFunc  : yoyaku.setting.updateWaku,
                                         ngFunc  : yoyaku.dialogOkCancel.closeMe});
        yoyaku.dialogOkCancel.initModule( jqueryMap.$container );
      } else if ( anchor_map._status.dialogKind == 'wakuUpdateDone' ) {
        setModal(true);
        yoyaku.dialogOkCancel.configModule({showStr : stateMap.errStr,
                                         okFunc  : yoyaku.model.renewWaku,
                                         ngFunc  : yoyaku.dialogOkCancel.closeMe});
        yoyaku.dialogOkCancel.initModule( jqueryMap.$container );
      }

    // カレンダー画面の場合
    } else if ( anchor_map.status == 'calendar' ) {
      setModal(false);
      yoyaku.dialog.removeDialog();
      yoyaku.dialogOkCancel.removeDialog();
      yoyaku.setting.removeSetting();

      yoyaku.calendar.configModule({});
      yoyaku.calendar.initModule( jqueryMap.$main );

    // 設定画面の場合
    } else if ( anchor_map.status == 'setting' ) {
      setModal(false);
      yoyaku.dialog.removeDialog();
      yoyaku.dialogOkCancel.removeDialog();
      yoyaku.calendar.removeCalendar();

      yoyaku.setting.configModule({});
      yoyaku.setting.initModule( jqueryMap.$main );

    // 待ち受け画面の場合
    } else if ( anchor_map.status == 'matiuke' ) {
      setModal(false);
      yoyaku.dialog.removeDialog();
      yoyaku.dialogOkCancel.removeDialog();
    }
  }

  //---ユーティリティメソッド---
  copyAnchorMap = function () {
    // $.extendはマージ。第2引数へ第3引数をマージする。
    // 第1引数のtrueはディープコピーを意味する。
    return $.extend( true, {}, stateMap.anchor_map );
  }

  // それ以前の履歴が残らないようにするには replace_flag を true にする。
  // option_map は null でよい。
  // 通常の使用では arg_map のみ渡せばよい。
  changeAnchorPart = function ( arg_map, option_map = null, replace_flag = false ) {
    var anchor_map_revise = copyAnchorMap(),
        bool_return = true,
        key_name, key_name_dep;

    // アンカーマップへ変更を統合
    KEYVAL:
    for ( key_name in arg_map ) {
      if ( arg_map.hasOwnProperty( key_name ) ) {
        // 反復中に従属キーを飛ばす
        if ( key_name.indexOf( '_' ) === 0 ) { continue KEYVAL; }

        // 独立キーを更新する
        anchor_map_revise[key_name] = arg_map[key_name];

        // 合致する独立キーを更新する
        key_name_dep = '_' + key_name;
        if ( arg_map[key_name_dep] ) {
          anchor_map_revise[key_name_dep] = arg_map[key_name_dep];
        } else {
          delete anchor_map_revise[key_name_dep];
          delete anchor_map_revise['_s' + key_name_dep];
        }
      }
    }

    //uriの更新開始。成功しなければ元に戻す
    try {
      $.uriAnchor.setAnchor( anchor_map_revise, option_map, replace_flag );
    } catch {
      // uriを既存の状態に置き換える
      $.uriAnchor.setAnchor( stateMap.anchor_map, null, true );
      bool_return = false;
    }

    return bool_return;
  }

  // flg:trueで呼ぶと、ダイアログ以外はタッチ無効
  // flg:falseで呼ぶと有効に戻る。
  setModal = function ( flg ) {
    let setModalconfig;

    if ( flg == true ) {
      setModalconfig = 'none';
    } else {
      setModalconfig = 'auto';
    }
    //クリックイベント等を有効化or無効化
    jqueryMap.$acct.css('pointer-events', setModalconfig);
    jqueryMap.$main.css('pointer-events', setModalconfig);
  }

  //---パブリックメソッド---
  initModule = function ( $container ) {

    stateMap.$container = $container; //ここで渡されるのはyoyaku全体
    $container.html( configMap.main_html );
    setJqueryMap();

    // 許容されるuriアンカーの型を指定
    $.uriAnchor.configModule ({
      schema_map : configMap.anchor_schema_map
    });

    // 以降、各種イベント処理の登録
    // ログインダイアログ表示
    $.gevent.subscribe( $container, 'tryLogin', function (event, msg_map) {
      changeAnchorPart({
        status : 'dialog',
        _status : {
          dialogKind : 'login'
        }
      });
    });

    // ダイアログ消去
    $.gevent.subscribe( $container, 'cancelDialog', function (event, msg_map) {
      changeAnchorPart({
        status : 'matiuke'
      });
    });

    // ログイン成功
    $.gevent.subscribe( $container, 'loginSuccess', function (event, msg_map) {

      // 設計上、これらはonHashchangeで処理すべきだが、そのためには
      // なぜダイアログを閉じたのかという情報が必要になり面倒。いい案を考える。
      yoyaku.acct.configModule({showStr : msg_map.name});
      yoyaku.acct.initModule( jqueryMap.$acct );

      changeAnchorPart({
        status : 'calendar'
      }, null, true); //ログイン前には戻したくないので、履歴を消去
    });

    // ログイン失敗
    $.gevent.subscribe( $container, 'loginFailure', function (event, msg_map) {
      //履歴には残さず、しれっとダイヤログを書き直してやり直しさせる。
      yoyaku.dialog.removeDialog();
      yoyaku.dialog.configModule({});
      yoyaku.dialog.initModule( jqueryMap.$container );
    });

    // ログアウトダイアログ表示
    $.gevent.subscribe( $container, 'tryLogout', function (event, msg_map) {
      changeAnchorPart({
        status : 'dialog',
        _status : {
          dialogKind : 'logout'
        }
      });
    });

    // ログアウト成功
    $.gevent.subscribe( $container, 'logoutSuccess', function (event, msg_map) {
      // 設計上、これらはonHashchangeで処理すべきだが、そのためには
      // なぜダイアログを閉じたのかという情報が必要になり面倒。いい案を考える。
      yoyaku.acct.configModule({showStr : "ログインする"});
      yoyaku.acct.initModule( jqueryMap.$acct );
      jqueryMap.$main.html( "" );


    changeAnchorPart({
      status : 'matiuke'
      }, null, true); //ログイン前には戻したくないので、履歴を消去
    });

    // ログアウト失敗
    $.gevent.subscribe( $container, 'logoutFailure', function (event, msg_map) {
      //どうする？
    });

    // ダイアログ消去
    $.gevent.subscribe( $container, 'cancelDialog', function (event, msg_map) {
      changeAnchorPart({
        status : 'matiuke'
      });
    });

    // 登録確認ダイアログ
    $.gevent.subscribe( $container, 'verifyUpdate', function (event, msg_map) {
      stateMap.errStr = msg_map.errStr;
      changeAnchorPart({
        status : 'dialog',
        _status : {
          dialogKind : 'verify'
        }
      });
    });

    // 削除確認ダイアログ
    $.gevent.subscribe( $container, 'verifyCancel', function (event, msg_map) {
      stateMap.errStr = msg_map.errStr;
      changeAnchorPart({
        status : 'dialog',
        _status : {
          dialogKind : 'verifydel'
        }
      });
    });

    // 登録成功ダイアログ
    $.gevent.subscribe( $container, 'updateReserveSuccess', function (event, msg_map) {
      stateMap.errStr = '予約しました。';
      changeAnchorPart({
        status : 'dialog',
        _status : {
          dialogKind : 'Updone'
        }
      });
    });

    // 登録失敗ダイアログ
    $.gevent.subscribe( $container, 'updateReserveFailure', function (event, msg_map) {
      stateMap.errStr = '予約できませんでした。他の方が予約した可能性があります。';
      changeAnchorPart({
        status : 'dialog',
        _status : {
          dialogKind : 'Updone'
        }
      });
    });

    // 削除完了ダイアログ
    $.gevent.subscribe( $container, 'deleteReserveResult', function (event, msg_map) {
      stateMap.errStr = '予約を削除しました。';
      changeAnchorPart({
        status : 'dialog',
        _status : {
          dialogKind : 'Updone'
        }
      });
    });

    $.gevent.subscribe( $container, 'readyReserveDone', function (event, msg_map) {
      changeAnchorPart({
        status : 'calendar'
      });
    });

    // 設定画面へ
    $.gevent.subscribe( $container, 'setting', function (event, msg_map) {
      changeAnchorPart({
        status : 'setting'
      });
    });

    // 設定画面からカレンダーに戻る
    $.gevent.subscribe( $container, 'backToCalendar', function (event, msg_map) {
      changeAnchorPart({
        status : 'calendar'
      });
    });

    // 予約機能有効化無効化確認ダイアログ
    $.gevent.subscribe( $container, 'verifyOnOff', function (event, msg_map) {
      stateMap.errStr = msg_map.errStr;
      changeAnchorPart({
        status : 'dialog',
        _status : {
          dialogKind : 'nowusableverify'
        }
      });
    });

    // 予約機能有効化無効化 設定しましたダイアログ
    $.gevent.subscribe( $container, 'updateNowUsableResult', function (event, msg_map) {
      stateMap.errStr = '予約機能の有効・無効を変更しました。';
      changeAnchorPart({
        status : 'dialog',
        _status : {
          dialogKind : 'wakuUpdateDone'
        }
      });
    });

    // 日時の枠設定確認ダイアログ
    $.gevent.subscribe( $container, 'verifyWaku', function (event, msg_map) {
      stateMap.errStr = msg_map.errStr;
      changeAnchorPart({
        status : 'dialog',
        _status : {
          dialogKind : 'wakuverify'
        }
      });
    });

    // 日時の枠設定 設定しましたダイアログ
    $.gevent.subscribe( $container, 'updateWakuResult', function (event, msg_map) {
      stateMap.errStr = '日時の枠を設定しました。';
      changeAnchorPart({
        status : 'dialog',
        _status : {
          dialogKind : 'wakuUpdateDone'
        }
      });
    });

    yoyaku.acct.configModule({showStr : 'ログインする'});
    yoyaku.acct.initModule( jqueryMap.$acct );

    $(window)
      .bind( 'hashchange', onHashchange )
      .trigger( 'hashchange' );

  }

  return { initModule : initModule };
}());
