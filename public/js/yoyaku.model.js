/*
 * yoyaku.model.js
 * モデルモジュール
 */

yoyaku.model = (function () {
  'use strict';

  var initModule, login, logout, islogind, getAKey,
      initLocal, iskyouin, getWaku, readyReserve, getReserve, updateReserve,
      deleteReserve, getMyID, getMyName, getMyCls, getMeibo,//関数
      accessKey, userKind, cls, name, waku, reserve, meibo; //モジュールスコープ変数

  initLocal = function () {
    accessKey   = {};
    userKind    = 0;
    cls         = "";
    name        = "";
    waku        = [];
    reserve     = [];
    meibo       = [];
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

        // 名簿を取っておく
        yoyaku.data.sendToServer('getMeibo', {AKey : accessKey,
                                             clientState : 'init'});
      // ログイン失敗
      } else {
        $.gevent.publish('loginFailure', [msg]);
      }
    });

    // 名簿　取得完了
    yoyaku.data.registerReceive('getMeiboResult', function (msg) {
      meibo = msg.res;

      // 枠情報を取っておく
      yoyaku.data.sendToServer('getwaku', {AKey : accessKey,
                                           clientState : 'init'});
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
      } else if (msg.clientState == 'afterUpdate') {
        $.gevent.publish('readyReserveDone', [{}]);
      }
    });

    // 登録成功
    yoyaku.data.registerReceive('updateReserveSuccess', function (msg) {
      $.gevent.publish('updateReserveSuccess', [{}]);
    });

    // 登録失敗
    yoyaku.data.registerReceive('updateReserveFailure', function (msg) {
      $.gevent.publish('updateReserveFailure', [{}]);
    });

    // 削除結果
    yoyaku.data.registerReceive('deleteReserveResult', function (msg) {
      $.gevent.publish('deleteReserveResult', [{}]);
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
  // 枠IDはクラスで一つだから、枠ID(reserveTarget)とクラスで
  // 面談が特定できる。
  updateReserve = function ( reserveData ) {
    let queryObj = {AKey          : accessKey,
                    userId        : reserveData.userId,
                    name          : reserveData.name,
                    reserveTarget : reserveData.reserveTarget,
                    cls           : cls};
//    console.log( queryObj );
    yoyaku.data.sendToServer('updateReserve',queryObj);
  }

  deleteReserve = function ( reserveTarget ) {
    let queryObj = {AKey          : accessKey,
                    reserveTarget : reserveTarget,
                    cls           : cls};
//    console.log( queryObj );
    yoyaku.data.sendToServer('deleteReserve',queryObj);
  }

  getMyID = function () {
    return accessKey.userId;
  }

  getMyName = function () {
    return name;
  }

  getMyCls = function () {
    return cls;
  }

  getMeibo = function () {
    return meibo;
  }

  readyReserve　= function () {
    // 予約情報を取る
    yoyaku.data.sendToServer('getReserve', {AKey : accessKey,
                                            clientState : 'afterUpdate'});
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
          deleteReserve    : deleteReserve,
          getMyID          : getMyID,
          getMyName        : getMyName,
          getMyCls         : getMyCls,
          readyReserve     : readyReserve,
          getMeibo         : getMeibo
        };
}());
