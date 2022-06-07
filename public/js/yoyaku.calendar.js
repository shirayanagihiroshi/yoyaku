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
        settable_map : {}
      },
      stateMap = {
        $container : null
      },
      jqueryMap = {},
      setJqueryMap, configModule, initModule, removeCalendar,
      createTable,

      verify, setNotice;

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
  verify = function () {
    // チェックすべき内容はないので、ユーザがOKなら良い
    $.gevent.publish('verifyClUpdate', [{errStr:'日課、行事を入力しますか？'}]);
  }


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
            str += ' ' + configMap.propJi + '="' + myclsWaku[0].data[j][0] + '">';
            str += myclsWaku[0].data[j][i] + '</td>';
          }
        }
      }

      str += '</tr>';
    }
    jqueryMap.$main.append(str);
  }

  setNotice = function () {
    let str;

    str = 'テスト';

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
      let beforeVal = $(this).html();

      if (beforeVal == 'A') {
        $(this).html('B');
      } else if (beforeVal == 'B') {
        $(this).html("");
      } else {
        $(this).html('A');
      }
      console.log( $(this).attr(configMap.propHi) );
      console.log( $(this).attr(configMap.propJi) );
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
    removeCalendar: removeCalendar
  };
}());
