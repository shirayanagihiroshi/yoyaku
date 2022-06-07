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
          + '<table class="yoyaku-calendar-main"></table>',
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
      createTable, updateReserve, searchReserve,

      setNotice;

  //---DOMメソッド---
  setJqueryMap = function () {
    var $container = stateMap.$container;
    jqueryMap = {
      $container   : $container,
      $notice      : $container.find( '.yoyaku-calendar-notice' ),
      $main        : $container.find( '.yoyaku-calendar-main' )
    };
  }

  //---イベントハンドラ---


  //---ユーティリティメソッド---
  createTable = function () {

    let i, j, myclsWaku,
      propDate = [],
      str      = "",
      waku     = yoyaku.model.getWaku(),
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

    // 自分のクラスの面談枠に絞り込む
    myclsWaku = waku.filter(f(yoyaku.model.getMyCls()));

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
            str += '<td>' + myclsWaku[0].data[j][i] + '</td>';
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

  searchReserve = function (reserveTarget) {
    let retval, idx,
      reserve = yoyaku.model.getReserve(),
      f = function (reserveTarget, cls) {
            return function (target) {
              if ( target.reserveTarget == reserveTarget && target.cls == cls) {
                return true;
              } else {
                return false;
              }
            }
          };

    idx = reserve.findIndex(f(reserveTarget, yoyaku.model.getMyCls()));
    //該当データがあれば
    if (idx != -1) {
      if (yoyaku.model.iskyouin()) {
        retval = reserve[idx].name;
      } else {
        retval = '×';
      }
    } else {
      retval = '○';
    }

    return retval;
  }

  updateReserve = function () {
    if (yoyaku.model.iskyouin()) {

    } else {
      if (stateMap.wakuID != 0) {
        let obj = {
          userId        : yoyaku.model.getMyID(),
          name          : yoyaku.model.getMyName(),
          reserveTarget : stateMap.wakuID
        }
        yoyaku.model.updateReserve(obj);
      }
    }
  }

  setNotice = function () {
    let str;

    str = '1箇所のみ予約できます。希望する箇所をタップしてください。○：可能、×：不可。';

    jqueryMap.$notice.html(str)
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

    // 重複して登録すると、何度もイベントが発行される。それを避けるため、一旦削除
    $(document).off('click');
    $(document).off('blur');

    // 出欠または理由が選択されたらON/OFFする。
    $(document).on('click', '.yoyaku-calendar-edi', function (event) {
      let idx,
        reserve  = yoyaku.model.getReserve(),
        f = function (userId) {
              return function (target) {
                if ( target.userId == userId) {
                  return true;
                } else {
                  return false;
                }
              }
            };

      if (yoyaku.model.iskyouin()) {

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
      }
    }
    return true;
  }

  return {
    configModule  : configModule,
    initModule    : initModule,
    removeCalendar: removeCalendar,
    updateReserve : updateReserve
  };
}());
