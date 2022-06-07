'use strict';

//------モジュールスコープ変数s--------
  var
    keys     = require('./lib/keys'),
    fs       = require('fs'),
    express  = require('express'),
    app      = express(),
    router   = express.Router(),
    http     = require('https').createServer({
      key  : fs.readFileSync(keys.privkeyFilePath),
      cert : fs.readFileSync(keys.certFilePath)
    }, app ),
    io       = require('socket.io')( http ),
    crypt    = require('./lib/crypt'),
    db       = require('./lib/database'),
    utils    = require('./lib/util_s'),
    port     = 4001;

//------モジュールスコープ変数e--------

//------ユーティリティメソッドs--------
io.on("connection", function (socket) {
  // 単に取得するだけの処理はまとめておく
  // ログインなど特殊なのは別処理
  let commonDBFind = function (msg, collectionName, resultMessageName) {

    // アクセスキーの確認のために'user'にアクセスしている
    db.findManyDocuments('user', {userId:msg.AKey.userId}, {projection:{_id:0}}, function (result) {
      // ログイン中のユーザにのみ回答
      if (result.length != 0 && msg.AKey.token == result[0].token ) {
        db.findManyDocuments(collectionName, msg.SKey, {projection:{_id:0}}, function (res) {
          let obj = {res         : res,
                     clientState : msg.clientState};
          //console.log('findDocuments done');
          io.to(socket.id).emit(resultMessageName, obj); // 送信者のみに送信
        });
      } else {
        // ここにアナザーログインを実装すること
        io.to(socket.id).emit('anotherLogin', {}); // 送信者のみに送信
      }
    });
  };

  socket.on('tryLogin', function (msg) {
    db.findManyDocuments('user', {userId:msg.userId}, {projection:{_id:0}}, function (result) {
      if (result.length != 0) {
        crypt.compare(msg.passWord, result[0].passWord, function (res) {
          //パスワードが一致
          if (res) {
            let token = String(Math.random()).slice(2,12);

            //お手軽なランダム文字列をトークンとして設定し、ログイン状態とする
            db.updateDocument('user', {userId:msg.userId}, {$set:{token:token}}, function (res) {
              io.to(socket.id).emit('loginResult', {result   : true,
                                                    userId   : msg.userId,
                                                    token    : token,
                                                    userKind : result[0].userKind,
                                                    name     : result[0].name,
                                                    cls      : result[0].cls}); // 送信者のみに送信
            });

          //パスワードが違う
          } else {
            io.to(socket.id).emit('loginResult', {result: false}); // 送信者のみに送信
          }
        });
      // 該当ユーザがいない
      } else {
        io.to(socket.id).emit('loginResult', {result: false}); // 送信者のみに送信
      }
    });
  });

  socket.on('tryLogout', function (msg) {
    db.findManyDocuments('user', {userId:msg.userId}, {projection:{_id:0}}, function (result) {
      if (result.length != 0) {
        //トークンを空文字列とし、ログアウト状態とする
        db.updateDocument('user', {userId:msg.userId}, {$set:{token:""}}, function (res) {
          io.to(socket.id).emit('logoutResult', {result: true}); // 送信者のみに送信
        });
      // 該当ユーザがいない
      } else {
        io.to(socket.id).emit('logoutResult', {result: false}); // 送信者のみに送信
      }
    });
  });

  socket.on('getwaku', function (msg) {
    console.log("getwaku");

    commonDBFind(msg, 'waku', 'getwakuResult');
  });

  socket.on('getReserve', function (msg) {
    console.log("getReserve");

    commonDBFind(msg, 'reserve', 'getReserveResult');
  });

  socket.on('getMeibo', function (msg) {
    console.log("getMeibo");

    commonDBFind(msg, 'user', 'getMeiboResult');
  });

  socket.on('updateReserve', function (msg) {

    /*
    let i;
    console.log("* * updateReserve * *");
    console.log("gakunen:" + msg.syukketsuData.gakunen);
    console.log("cls:"     + msg.syukketsuData.cls);
    console.log("month:"   + msg.syukketsuData.month);
    console.log("day:"     + msg.syukketsuData.day);
    console.log("member:");
    for (i = 0; i < msg.syukketsuData.member.length; i++) {
      console.log(msg.syukketsuData.member[i]);
    }*/

    db.findManyDocuments('user', {userId:msg.AKey.userId}, {projection:{_id:0}}, function (result) {
      // ログイン中のユーザにのみ回答
      if (result.length != 0 && msg.AKey.token == result[0].token ) {
        // 同じ枠に対する登録は許さない。
        db.findManyDocuments('reserve', {cls:msg.cls, reserveTarget:msg.reserveTarget}, {projection:{_id:0}}, function (resultCyoufukuchk) {
          if (resultCyoufukuchk.length != 0) {
            console.log("reserve already exist");
            io.to(socket.id).emit('updateReserveFailure', {}); // 送信者のみに送信
          } else {
            db.updateDocument('reserve',
                              {cls           : msg.cls,
                               reserveTarget : msg.reserveTarget,
                               userId        : msg.userId},
                              {$set : {cls           : msg.cls,
                                       reserveTarget : msg.reserveTarget,
                                       userId        : msg.userId,
                                       name          : msg.name}}, function (res) {

              //console.log('updateSyukketsu done' + res);
              io.to(socket.id).emit('updateReserveSuccess', res); // 送信者のみに送信
            });
          }
        });
      } else {
        io.to(socket.id).emit('anotherLogin', {}); // 送信者のみに送信
      }
    });
  });

  socket.on('deleteReserve', function (msg) {
    /*
    console.log("* * deleteRenraku * *");
    console.log("gakunen:" + msg.SKey.gakunen);
    console.log("cls:"     + msg.SKey.cls);
    console.log("bangou:"  + msg.SKey.bangou);
    console.log("month:"   + msg.SKey.month);
    console.log("day:"     + msg.SKey.day);
    */
    db.findManyDocuments('user', {userId:msg.AKey.userId}, {projection:{_id:0}}, function (result) {
      // ログイン中のユーザにのみ回答
      if (result.length != 0 && msg.AKey.token == result[0].token ) {
        db.deleteManyDocuments('reserve',
                               {reserveTarget : msg.reserveTarget,
                               cls            : msg.cls},
                               function (res) {

          //console.log('insertRenrakuResult done' + res);
          io.to(socket.id).emit('deleteReserveResult', res); // 送信者のみに送信
        });
      } else {
        io.to(socket.id).emit('anotherLogin', {}); // 送信者のみに送信
      }
    });
  });

  // 切断
  socket.on("disconnect", () => {
    console.log("user disconnected");
    // tokenを失効させる。
    // upsert:trueとした関係で、ログインせずに切断したときにtokenだけを持つ
    // ドキュメントが生成された模様。該当のものが見つかったときのみ処理するようにする。

    // ログイン直後にログアウトしたか他の端末でログインしたというエラーメッセージが表示される
    // 端末がある模様。トークンを削除しないことにする
    // ログアウトしたかどうかの判定はできなくなる
    /*
    db.findManyDocuments('user', {token:socket.id}, function (result) {
      if ( result.length != 0 ) {
        db.updateDocument('user', {token:socket.id}, {$set:{token:""}}, function (res) {
          // do nothing
        });
      }
    });
    */
  });
});

//------ユーティリティメソッドe--------

//------サーバ構成s--------
  app.use( express.json() ); //bodyParseだったやつ
  app.use( function ( request, response, next ) {
    // js,css更新用
    if (request.url.indexOf( '/js/' ) >= 0) {
      utils.setWatch( request.url, 'script' , function ( url_path_inner ) {
        io.emit( 'script', url_path_inner ); //送信元を含む全員に送信
      });
    }
    else if (request.url.indexOf( '/css/' ) >= 0) {
      utils.setWatch( request.url, 'stylesheet' , function ( url_path_inner ) {
        io.emit( 'stylesheet', url_path_inner ); //送信元を含む全員に送信
      });
    }
    next();
  });
  app.use( express.static( __dirname + '/public' ) ); // ややはまった。これがsetwatchの設定の前にあるとだめ
  app.get('/', function ( request, response ) {
    console.log('request.url');
    console.log(request.url);

    response.sendFile( __dirname +'/public/yoyaku.html' );
  });

//------サーバ構成e--------
//------サーバ起動s--------
  http.listen( port, function () {
    console.log(
      'express server listening on port %d in %s mode',
      port, app.settings.env)
  });

//------サーバ起動e--------
