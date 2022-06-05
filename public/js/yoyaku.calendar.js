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
          + '<td class="yoyaku-calendar-edi">',
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
      str     = "",
      waku    = yoyaku.model.getWaku(),
      reserve = yoyaku.model.getReserve(),
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
      for (i = 0; i < myclsWaku[0].data[j].length; i++) {
        // 数値でなければきっと文字列で、日付か時間帯なのでそのまま表示
        if (isNaN(myclsWaku[0].data[j][i])) {
          str += '<td>' + myclsWaku[0].data[j][i] + '</td>';
        // 数値なら枠のID
        } else {
          str += '<td></td>';
        }
      }
      str += '</tr>';
    }
    jqueryMap.$main.append(str);

/*
    for (j = 0; j < 4; j++) {
      weeks = yoyaku.util.getWeek(configMap.targetYear,
                               configMap.targetMonth-1, //月だけ0始まり
                               configMap.targetDay,
                               j);
      // 曜日あたり1行目：日付
      str = '<tr>';
      for (i = 0; i < 8; i++) {
        if (i == 0) {
          str += '<td>日付</td>';
        } else {
          str += '<td>';
          //-1は最初の一つがA/Bでずれるから
          str += String(weeks[i-1].month) + '/' + String(weeks[i-1].day);
          str += '</td>';
        }
      }
      str += '</tr>';
      // 曜日あたり2行目：日課
      str += '<tr>';
      for (i = 0; i < 8; i++) {
        if (i == 0) {
          str += '<td>日課</td>';
        } else {
          str += configMap.tbNikka;
          //-1は最初の一つがA/Bでずれるから
          calOneDay = stateMap.cl.find(selectfunc(weeks[i-1].year, weeks[i-1].month, weeks[i-1].day));
          if ( calOneDay != null ) {
            if ( calOneDay.nikka != null ) {
              str += calOneDay.nikka;
            }

            // 3行目の準備
            if ( calOneDay.gyouji != null ) {
              gyouji[i] = calOneDay.gyouji
            } else {
              gyouji[i] = "";
            }
          } else {
            gyouji[i] = "";
          }
          str += '</td>';
        }
      }
      str += '</tr>';
      // 曜日あたり3行目：行事(今は教務で入力する形だが、連絡を全教員が入力するように
      // これは別に移したほうがよい。そしたら、ABより詳細は授業の日課とかいれるか)
      str += '<tr>';
      for (i =0; i < 8; i++) {
        if (i == 0) {
          str += '<td>行事</td>';
        } else {
          str += configMap.tbGyouji;
          str += gyouji[i];
          str += '</td>';
        }
      }
      str += '</tr>';
      jqueryMap.$main.append(str);
    }
*/
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
