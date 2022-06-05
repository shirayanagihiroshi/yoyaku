/*
 * yoyaku.model.js
 * モデルモジュール
 */

yoyaku.model = (function () {
  'use strict';

  var initModule, login, logout, islogind, getAKey,
      initLocal, iskyouin, getWaku, getReserve, updateReserve,
      getMyCls, //関数
      accessKey, userKind, cls, name, waku, reserve; //モジュールスコープ変数

  initLocal = function () {
    accessKey   = {};
    userKind    = 0;
    cls         = "";
    name        = "";
    waku        = [];
    reserve     = [];
  }

  initModule = function () {

    initLocal();

    yoyaku.data.initModule();

    yoyaku.data.registerReceive('loginResult', function (msg) {
      let eventName;
      // ログイン成功
      if ( msg.result == true ) {
        accessKey = { userId : msg.userId,
                      token  : msg.token};
        userKind  = msg.userKind;
        name      = msg.name;
        cls       = msg.cls;

        // 枠情報を取っておく
        yoyaku.data.sendToServer('getwaku', {AKey : accessKey,
                                             clientState : 'init'});
      // ログイン失敗
      } else {
        $.gevent.publish('loginFailure', [msg]);
      }
    });

    // 枠情報　取得完了
    yoyaku.data.registerReceive('getwakuResult', function (msg) {
      waku = msg.res;

      // 予約情報も取っておく
      yoyaku.data.sendToServer('getReserve', {AKey : accessKey,
                                              clientState : 'init'});
    });

    // 予約情報　取得完了
    yoyaku.data.registerReceive('getReserveResult', function (msg) {
      reserve = msg.res;

      if (msg.clientState == 'init') {
        $.gevent.publish('loginSuccess', [{ name: name }]);
      }
    });

    yoyaku.data.registerReceive('logoutResult', function (msg) {
      let eventName;
      // ログアウト成功
      if ( msg.result == true ) {
        eventName = 'logoutSuccess';

        initLocal();
      // ログアウト失敗
      } else {
        // 失敗したとして、どうする？
        eventName = 'logoutFailure';
      }
      $.gevent.publish(eventName, [msg]);
    });

  };//initModule end


  login = function (queryObj) {
    yoyaku.data.sendToServer('tryLogin',queryObj);
  };

  logout = function () {
    console.log(accessKey);
    yoyaku.data.sendToServer('tryLogout',{userId : accessKey.userId,
                                       token  : accessKey.token});
  };

  islogind = function () {
    //accessKeyがtokenプロパティを持ち
    if ( Object.keys(accessKey).indexOf('token') !== -1 ) {
      //さらに空でない文字列が設定されていればログイン済
      if ( accessKey.token !== undefined ) {
        if (accessKey.token != "") {
          return true;
        }
      }
    }
    return false;
  };

  getAKey = function () {
    return accessKey;
  };

  // userKind : 教員   : 10
  //          : 保護者 : 20
  iskyouin = function () {
    // 仮
    return true;

    if (userKind == 10) {
      return true;
    } else {
      return false;
    }
  }

  getWaku = function () {
    return waku;
  }

  getReserve = function () {
    return reserve;
  }

  // 面談枠には予め枠のIDを振ってある。
  // 枠のIDはクラスで一つだから、枠ID(yoyakuTarget)とクラスで
  // 面談が特定できる。
  updateReserve = function ( reserveData ) {
    let queryObj = {AKey          : accessKey,
                    userId        : reserveData.userId,
                    name          : reserveDaya.name,
                    reserveTarget : reserveData.reserveTarget,
                    cls           : cls};
    console.log( queryObj );
    skt.data.sendToServer('updateReserve',queryObj);
  }

  getMyCls = function () {
    return cls;
  }

  return { initModule      : initModule,
          login            : login,
          logout           : logout,
          islogind         : islogind,
          getAKey          : getAKey,
          iskyouin         : iskyouin,
          getWaku          : getWaku,
          getReserve       : getReserve,
          updateReserve    : updateReserve,
          getMyCls         : getMyCls
        };
}());
