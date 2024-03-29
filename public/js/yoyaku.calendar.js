/*
 * yoyaku.calendar.js
 * 面談枠設定モジュール
 */
yoyaku.calendar = (function () {
  'use strict';

  //---モジュールスコープ変数---
  var configMap = {
        main_html : String()
          + '<div class="yoyaku-calendar-notice"></div>'
          + '<table class="yoyaku-calendar-main"></table>'
          + '<div class="yoyaku-calendar-to-setting">設定画面へ</div>'
          + '<div class="yoyaku-calendar-notice2"></div>',
        tbEdi : String()
          + '<td class="yoyaku-calendar-edi"',
        propHi : String()
          + 'data-hi',
        propJi : String()
          + 'data-ji',
        propWakuID : String()
          + 'data-wakuid',
        settable_map : {}
      },
      stateMap = {
        $container : null,
        wakuID     : 0
      },
      jqueryMap = {},
      setJqueryMap, configModule, initModule, removeCalendar,
      createTable, updateReserve, deleteReserve, searchReserve,
      setNotice,setNotice2, toSetting;

  //---DOMメソッド---
  setJqueryMap = function () {
    var $container = stateMap.$container;
    jqueryMap = {
      $container   : $container,
      $notice      : $container.find( '.yoyaku-calendar-notice' ),
      $main        : $container.find( '.yoyaku-calendar-main' ),
      $toSetting   : $container.find( '.yoyaku-calendar-to-setting' ),
      $notice2     : $container.find( '.yoyaku-calendar-notice2' )
    };
  }

  //---イベントハンドラ---

  toSetting = function () {
    $.gevent.publish('setting', [{}]);
  }

  //---ユーティリティメソッド---
  // テーブルの表示位置やサイズの調整は微妙。
  // データの日付にスペースを入れないと、なぜか文字がはみ出る。
  // スペースを入れると、改行がなされる模様。
  createTable = function () {

    let i, j,
      propDate = [],
      str      = "",
      myclsWaku = yoyaku.model.getWaku(),
      reserve  = yoyaku.model.getReserve(),
      f = function (cls) {
            return function (target) {
              if ( target.cls == cls ) {
                return true;
              } else {
                return false;
              }
            }
          };

    // 日時の枠を未設定の場合は表示しない
    if (myclsWaku.length == 0) {
      return;
    }

    for (j = 0; j < myclsWaku[0].data.length; j++) {
      str += '<tr>';

      // 日付の行なら
      if (myclsWaku[0].data[j][0] == "date") {

        for (i = 0; i < myclsWaku[0].data[j].length; i++) {
          // あとでプロパティに乗せるため取っておく
          propDate[i] = myclsWaku[0].data[j][i];

          if (i == 0) {
            str += '<td></td>'
          } else {
            // 無理やり半角スペースを入れる
            let words = myclsWaku[0].data[j][i].split('(');
            str += '<td>' + words[0] + ' (' + words[1] + '</td>';
          }
        }

      // 実際は一つのテーブルだが、テーブルの間っぽくみせるところなら
      } else if (myclsWaku[0].data[j][0] == "space") {
        for (i = 0; i < myclsWaku[0].data[j].length; i++) {
          str += '<td style="border-left: none;border-right: none;">　</td>';
        }

      // 普通の行
      } else {
        for (i = 0; i < myclsWaku[0].data[j].length; i++) {
          if (i == 0) {
            str += '<td>' + myclsWaku[0].data[j][i] + '</td>';
          } else {
            str += configMap.tbEdi;
            str += ' ' + configMap.propHi + '="' + propDate[i] + '"';
            str += ' ' + configMap.propJi + '="' + myclsWaku[0].data[j][0] + '"';
            str += ' ' + configMap.propWakuID + '="' + String(myclsWaku[0].data[j][i]) + '">'
            str += searchReserve(myclsWaku[0].data[j][i]) + '</td>';
          }
        }
      }

      str += '</tr>';
    }
    jqueryMap.$main.append(str);
  }

  // 枠IDから予約者を引き当てる
  searchReserve = function (reserveTarget) {
    let retval, idx,
      reserve = yoyaku.model.getReserve(), // 該当クラスの分だけが取れる。
      f = function (reserveTarget) {
            return function (target) {
              if ( target.reserveTarget == reserveTarget) {
                return true;
              } else {
                return false;
              }
            }
          };

    idx = reserve.findIndex(f(reserveTarget));
    //該当データがあれば
    if (idx != -1) {
      if (yoyaku.model.iskyouin()) {
        retval = reserve[idx].name;
      } else {
        // 自分だけは名前を表示
        if (reserve[idx].userId == yoyaku.model.getMyID()) {
          retval = reserve[idx].name;
        // 自分以外
        } else {
          retval = '×';
        }
      }
    } else {
      // 枠ID0は都合が悪くて出来ない時とする。
      if (reserveTarget == 0) {
        retval = '×';
      } else {
        retval = '○';
      }
    }

    return retval;
  }

  updateReserve = function () {
// 後から都合が悪くなって面談できなくなった場合は
// 教員が自分で予約枠を埋めて、不可とするようにする。
//    if (yoyaku.model.iskyouin()) {

//    } else {
      if (stateMap.wakuID != 0) {
        let obj = {
          userId        : yoyaku.model.getMyID(),
          name          : yoyaku.model.getMyName(),
          reserveTarget : stateMap.wakuID
        }
        yoyaku.model.updateReserve(obj);
      }
//    }
  }

  deleteReserve = function () {
    // 後から都合が悪くなって面談できなくなった場合は
    // 教員が自分で予約枠を埋めて、不可とするようにする。
//    if (yoyaku.model.iskyouin()) {

//    } else {
      if (stateMap.wakuID != 0) {
        yoyaku.model.deleteReserve(stateMap.wakuID);
      }
//    }
  }

  setNotice = function () {
    let str, waku = yoyaku.model.getWaku();

    if (waku.length != 0) {
      if (waku[0].nowusable == true) {
        str = '1箇所のみ予約できます。○：可能、×：不可';
      } else {
        str = '直前の日程の変更はお電話でお願いします';
      }
      jqueryMap.$notice.html(str)
    }
  }

  setNotice2 = function () {
    let i, idx,
      myclsMeibo = yoyaku.model.getMeibo(),
      reserve    = yoyaku.model.getReserve(),
      f = function (userId) {
             return function (target) {
               if ( target.userId == userId) {
                 return true;
               } else {
                 return false;
               }
             }
           };

    jqueryMap.$notice2.append('<li>まだ予約していない生徒</li>');
    for (i = 0; i < myclsMeibo.length; i++) {
      idx = reserve.findIndex(f(myclsMeibo[i].userId))
      if (idx == -1) {
        // 生徒は
        if (myclsMeibo[i].userKind == 20) {
          jqueryMap.$notice2.append('<li>' + myclsMeibo[i].name + '</li>');
        }
      }
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

    createTable();
    setNotice();
    if (yoyaku.model.iskyouin()) {
      setNotice2();

      jqueryMap.$toSetting
        .click( toSetting );

    } else {
      // 保護者には設定画面は見せない
      jqueryMap.$toSetting.css('display', 'none');
    }

    // 重複して登録すると、何度もイベントが発行される。それを避けるため、一旦削除
    $(document).off('click');
    $(document).off('blur');

    // 出欠または理由が選択されたらON/OFFする。
    $(document).on('click', '.yoyaku-calendar-edi', function (event) {
      let idx,
        reserve  = yoyaku.model.getReserve(),
        waku = yoyaku.model.getWaku(),
        f = function (userId) {
              return function (target) {
                if ( target.userId == userId) {
                  return true;
                } else {
                  return false;
                }
              }
            };

      //担任が無効にしていたら、操作を受け付けない
      if (!waku[0].nowusable == true) {
        return true;
      }

      if (yoyaku.model.iskyouin()) {
        // 予約が入っていないところのみ予約できる。
        if (searchReserve(Number($(this).attr(configMap.propWakuID))) == '○') {
          // 登録対象の枠IDを保持しておく
          stateMap.wakuID = Number($(this).attr(configMap.propWakuID));
          // ユーザに確認してから登録
          $.gevent.publish('verifyUpdate', [{errStr:$(this).attr(configMap.propHi) + $(this).attr(configMap.propJi) + 'を予約しますか？'}]);

        // 予約が入っているときは自分の予約ならキャンセル
        } else {
          let obj, f = function (reserveTarget) {
                         return function (target) {
                           if ( target.reserveTarget == reserveTarget ) {
                             return true;
                           } else {
                             return false;
                           }
                         }
                       };

          obj = reserve.find( f(Number($(this).attr(configMap.propWakuID))) );
          if ( obj.userId == yoyaku.model.getMyID() ) {
            // キャンセル対象の枠IDを保持しておく
            stateMap.wakuID = Number($(this).attr(configMap.propWakuID));
            // ユーザに確認してからキャンセル
            $.gevent.publish('verifyCancel', [{errStr:$(this).attr(configMap.propHi) + $(this).attr(configMap.propJi) + 'の予約をキャンセルしますか？'}]);
          }
        }

      } else {
        idx = reserve.findIndex(f(yoyaku.model.getMyID()));
        // まだ予約してないときのみ予約できる。
        if (idx == -1) {
          // 予約が入っていないところのみ予約できる。
          if (searchReserve(Number($(this).attr(configMap.propWakuID))) == '○') {
            // 登録対象の枠IDを保持しておく
            stateMap.wakuID = Number($(this).attr(configMap.propWakuID));
            // ユーザに確認してから登録
            $.gevent.publish('verifyUpdate', [{errStr:$(this).attr(configMap.propHi) + $(this).attr(configMap.propJi) + 'を予約しますか？'}]);
          }

        // 予約済の時は予約のキャンセルのみできる。
        } else {
          if (Number($(this).attr(configMap.propWakuID)) == reserve[idx].reserveTarget) {
            // キャンセル対象の枠IDを保持しておく
            stateMap.wakuID = Number($(this).attr(configMap.propWakuID));
            // ユーザに確認してからキャンセル
            $.gevent.publish('verifyCancel', [{errStr:$(this).attr(configMap.propHi) + $(this).attr(configMap.propJi) + 'の予約をキャンセルしますか？'}]);
          }
        }
      }
    });

    return true;
  }

  removeCalendar = function ( ) {
    //初期化と状態の解除
    if ( jqueryMap != null ) {
      if ( jqueryMap.$container ) {
        jqueryMap.$notice.remove();
        jqueryMap.$main.remove();
        jqueryMap.$notice2.remove();
      }
    }
    return true;
  }

  return {
    configModule  : configModule,
    initModule    : initModule,
    removeCalendar: removeCalendar,
    updateReserve : updateReserve,
    deleteReserve : deleteReserve
  };
}());
