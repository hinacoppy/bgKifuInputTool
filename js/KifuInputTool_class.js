// KifuInputTool_class.js
'use strict';

class KifuInputTool {
  constructor(gametype = "normal") {
    this.gametype = gametype;
    const gameparam = BgUtil.getGametypeParam(this.gametype);
    this.ckrnum = gameparam[1]; //chequer num
    this.param0 = gameparam[0]; //my inner point = point num of one area
    this.param1 = this.param0 * 4 + 1; //array param of XGID position
    this.param2 = this.param0 * 4 + 2; //boff1
    this.param3 = this.param0 * 4 + 3; //boff2
    this.dicemx = gameparam[2]; //dice pip max

    this.player = false; //true=player1, false=player2
    this.gamescore = [];
    this.matchLength = 5;
    this.score = [0,0,0];
    this.matchwinflg = false;
    this.cubeValue = 1; // =2^0
    this.crawford = false;
    this.xgid = new Xgid(null);
    this.board = new BgBoard("bgKifuInputTool");
    this.board.resetBoard();
    this.kifuobj = new BgKifu();
    this.undoStack = [];
    this.animDelay = 800;
    this.gameFinished = true;
    this.flashflg = true;

    this.setDomNames();
    this.setEventHandler();
    this.setChequerDraggable();
    this.hideAllPanel(); //font awesome が描画するのを待つ必要がある
    this.panelholder.show();
    this.date.val(this.getToday());
  } //end of constructor()

  setDomNames() {
    //button
    this.doublebtn   = $("#doublebtn");
    this.resignbtn   = $("#resignbtn");
    this.takebtn     = $("#takebtn");
    this.dropbtn     = $("#dropbtn");
    this.donebtn     = $("#donebtn");
    this.undobtn     = $("#undobtn");
    this.forcedbtn   = $("#forcedbtn");
    this.passbtn     = $("#passbtn");
    this.newgamebtn  = $("#newmatchbtn");
    this.openingroll = $("#openingroll");
    this.passbtn     = $("#passbtn");
    this.gameendnextbtn= $("#gameendnextbtn");
    this.gameendokbtn  = $("#gameendokbtn");
    this.diceAsBtn     = $("#dice10,#dice11,#dice20,#dice21");
    this.fliphorizbtn  = $("#fliphorizbtn");
    this.rewindbtn     = $("#rewindbtn");
    this.downloadbtn   = $("#downloadbtn");
    this.allowillegal  = $("#allowillegal");
    this.pointTriangle = $(".point");
    this.resignokbtn   = $("#resignokbtn");
    this.resignclbtn   = $("#resignclbtn");

    //infos
    this.site       = $("#site");
    this.date       = $("#date");
    this.player1    = $("#player1");
    this.player2    = $("#player2");
    this.score1     = $("#score1");
    this.score2     = $("#score2");
    this.pip1       = $("#pip1");
    this.pip2       = $("#pip2");
    this.matchlen   = $("#matchlen");
    this.matchlen2  = $("#matchlen2");
    this.actiondisp = $("#actiondisp");

    //panel
    this.panelholder = $("#panelholder");
    this.allpanel    = $(".panel");
    this.rolldouble  = $("#rolldouble");
    this.doneundo    = $("#doneundo");
    this.gameend     = $("#gameend");
    this.takedrop    = $("#takedrop");
    this.resign      = $("#resign");

    //chequer
    this.chequerall  = $(".chequer");
    //pick dice
    this.pickdice    = $(".pickdice");

    //モーダルウィンドウを準備
    this.panelWindow = new FloatWindow({
      hoverid:  '#panelholder',
      headid:   '#panelHeader',
      bodyid:   '#panelBody',
      maxbtn:   '#maxBtn',
      minbtn:   '#minBtn',
      closebtn: '#closeBtn',
      width:    'auto',
      height:   '35px'
    });
  }

  setEventHandler() {
    //Button Click Event
    this.undobtn.       on('click', (e) => { e.preventDefault(); this.undoAction(); });
    this.donebtn.       on('click', (e) => { e.preventDefault(); this.doneAction(); });
    this.resignbtn.     on('click', (e) => { e.preventDefault(); this.resignAction(); });
    this.doublebtn.     on('click', (e) => { e.preventDefault(); this.doubleAction(); });
    this.takebtn.       on('click', (e) => { e.preventDefault(); this.takeAction(); });
    this.dropbtn.       on('click', (e) => { e.preventDefault(); this.dropAction(); });
    this.passbtn.       on('click', (e) => { e.preventDefault(); this.passAction(); });
    this.gameendnextbtn.on('click', (e) => { e.preventDefault(); this.gameendNextAction(); });
    this.gameendokbtn.  on('click', (e) => { e.preventDefault(); this.gameendOkAction(); });
    this.diceAsBtn.     on('click', (e) => { e.preventDefault(); this.diceAsDoneAction(e); });
    this.diceAsBtn.     on('contextmenu',  (e) => { e.preventDefault(); this.undoAction(); });
    this.newgamebtn.    on('click', (e) => { e.preventDefault(); this.newGameAction(); });
    this.rewindbtn.     on('click', (e) => { e.preventDefault(); this.rewindAction(); });
    this.fliphorizbtn.  on('click', (e) => { e.preventDefault(); this.flipHorizOrientation(); });
    this.downloadbtn.   on('click', (e) => { e.preventDefault(); this.kifuobj.downloadKifuAction(); });
    this.matchlen.      on("change", (e) => { e.preventDefault(); this.matchlen2.text(this.matchlen.val()); });
    this.allowillegal.  on("change", (e) => { e.preventDefault(); this.flashflg = !this.allowillegal.prop("checked"); });
    this.pickdice.      on('click', (e) => { e.preventDefault(); this.pickDiceAction(e.currentTarget.id.slice(-2)); });
    this.pointTriangle. on('click', (e) => { e.preventDefault(); this.pointClickAction(e); });
    this.resignokbtn.   on('click', (e) => { e.preventDefault(); this.resignOkAction(); });
    this.resignclbtn.   on('click', (e) => { e.preventDefault(); this.resignCancelAction(); });
    this.forcedbtn.     on('click', (e) => { e.preventDefault(); this.forcedMoveAction(); });
    $(window).          on('resize', (e) => { e.preventDefault(); this.board.redraw(); });
    $(document).        on('keydown', (e) => { this.keyInputAction(e.key); });
  }

  initGameOption() {
    this.matchLength = this.matchlen.val();
    this.score = [0,0,0];
    this.score1.text(0);
    this.score2.text(0);
  }

  beginNewGame(newmatch = false) {
    const initpos = "-b----E-C---eE---c-e----B-";
    this.xgid.initialize(initpos, newmatch, this.matchLength);
    this.board.showBoard2(this.xgid);
    this.showPipInfo();
    this.swapChequerDraggable(true, true);
    this.openingrollflag = true;
    this.hideAllPanel();
    this.showRollDoublePanel(true, this.openingrollflag);
    if (!newmatch) { this.showActionStr(null, "<br><br>"); }
    this.showActionStr(null, "Opening roll");
  }

  async rollAction(openroll = false) {
    this.undoStack = [];
    const dice = this.dice;
    if (openroll) {
      this.player = (dice[0] > dice[1]);
      this.xgid.turn = BgUtil.cvtTurnGm2Xg(this.player);
      this.gameFinished = false;
      this.openingrollflag = false;
    }
    this.xgid.dice = dice[2];
    this.xgid.usabledice = true;
    this.board.showBoard2(this.xgid);
    this.hideAllPanel();
    this.showDoneUndoPanel(this.player, openroll);
    await this.board.animateDice(this.animDelay);
    this.swapChequerDraggable(this.player);
    this.kifuobj.pushKifuXgid(this.xgid.xgidstr);
    this.pushXgidPosition();
  }

  undoAction() {
    //ムーブ前のボードを再表示
    if (this.undoStack.length == 0) { return; }
    const xgidstr = this.popXgidPosition();
    this.xgid = new Xgid(xgidstr, this.gametype);
    this.xgid.usabledice = true;
    this.makeDiceList(this.xgid.dice);
    this.donebtn.prop("disabled", (!this.xgid.moveFinished() && this.flashflg) );
    const forcebtnflg = this.xgid.isForcedMove();
    this.forcedbtn.toggle(forcebtnflg).prop("disabled", this.xgid.moveFinished());
    this.pushXgidPosition();
    this.board.showBoard2(this.xgid);
    this.swapChequerDraggable(this.player);
  }

  doneAction() {
    if (this.donebtn.prop("disabled")) { return; }
    if (this.gameFinished) { return; }
    if (this.xgid.isBearoffAll()) {
      this.bearoffAllAction();
      return;
    } // else
    this.showActionStr(this.player, this.peepXgidPosition(), this.xgid.xgidstr);
    this.swapTurn();
    this.xgid.dice = "00";
    this.swapXgTurn();
    this.showPipInfo();
    this.board.showBoard2(this.xgid);
    this.swapChequerDraggable(true, true);
    this.hideAllPanel();
    this.showRollDoublePanel(this.player);
    this.allowillegal.prop("checked", false);
    this.flashflg = true;
  }

  async doubleAction() {
    if (this.doublebtn.prop("disabled")) { return; }
    this.showActionStr(this.player, "Doubles => " + Math.pow(2, this.xgid.cube + 1));
    this.swapTurn();
    this.xgid.dbloffer = true;
    this.board.showBoard2(this.xgid); //double offer
    this.hideAllPanel();
    this.showTakeDropPanel(this.player);
    await this.board.animateCube(this.animDelay); //キューブを揺すのはshowBoard()の後
    this.kifuobj.pushKifuXgid(this.xgid.xgidstr);
    this.swapXgTurn(); //XGのturnを変えるのは棋譜用XGID出力後
  }

  takeAction() {
    this.showActionStr(this.player, "Takes");
    this.swapTurn();
    this.xgid.dice = "00";
    this.xgid.cube += 1;
    this.xgid.cubepos = this.xgid.turn;
    this.board.showBoard2(this.xgid);
    this.kifuobj.pushKifuXgid(this.xgid.xgidstr);
    this.swapXgTurn(); //XGのturnを変えるのは棋譜用XGID出力後
    this.hideAllPanel();
    this.showRollDoublePanel(this.player);
  }

  dropAction() {
    this.showActionStr(this.player, "Drops");
    this.swapTurn();
    this.calcScore(this.player); //dblofferフラグをリセットする前に計算する必要あり
    this.xgid.dbloffer = false;
    this.board.showBoard2(this.xgid);
    this.kifuobj.pushKifuXgid(this.xgid.xgidstr);
    this.hideAllPanel();
    this.showGameEndPanel(this.player);
    this.gameFinished = true;
  }

  passAction() {
    this.undoStack = [];
    this.xgid.dice = "66";
    this.pushXgidPosition();
    this.kifuobj.pushKifuXgid(this.xgid.xgidstr);
    this.doneAction();
  }

  gameendNextAction() {
    this.hideAllPanel();
    this.showScoreInfo();
    this.kifuobj.pushKifuXgid(''); //空行
    this.beginNewGame(false);
  }

  gameendOkAction() {
    this.hideAllPanel();
    this.showScoreInfo();
  }

  bearoffAllAction() {
    this.showActionStr(this.player, this.peepXgidPosition(), this.xgid.xgidstr);
    this.calcScore(this.player); // this.player is winner
    this.kifuobj.pushKifuXgid(this.xgid.xgidstr);
    this.hideAllPanel();
    this.showGameEndPanel(this.player);
    this.gameFinished = true;
  }

  diceAsDoneAction(e) {
    if (BgUtil.cvtTurnGm2Bd(this.player) != e.currentTarget.id.substring(4, 5)) { return; } //ex. id="dice10"
    this.doneAction();
  }

  newGameAction() {
    if (!confirm("Really New Match?")) { return; }
    this.initGameOption();
    this.kifuobj.clearKifuXgid();
    this.actiondisp.html("");
    this.beginNewGame(true);
  }

  rewindAction() {
    if (!this.kifuobj.peepKifuXgid()) { return; } //rewindで戻せるのは空行で区切られたゲーム境界まで
    const lastxgid = this.kifuobj.popKifuXgid();
    this.xgid = new Xgid(lastxgid);
    this.pushXgidPosition();
    this.player = (this.xgid.turn == 1);
    this.hideAllPanel();
    this.showDoneUndoPanel(this.player);
    this.undoAction();
  }

  flipHorizOrientation() {
    this.board.flipHorizFlag();
    this.board.flipHorizOrientation();
    this.board.redraw();
  }

  pickDiceAction(dice) {
    const dice1 = Number(dice.slice(0, 1));
    const dice2 = Number(dice.slice(1, 2));
    const dice3 = (dice1 < dice2) ? dice2 + "" + dice1 : dice; //ダイスは降順に並べる
    this.dice = [dice1, dice2, dice3];
    this.makeDiceList(dice3);

    if (this.openingrollflag && dice1 == dice2) { return; } //オープニングロールはゾロ目を選べない
    this.rolldouble.hide();
    this.rollAction(this.openingrollflag);
  }

  makeDiceList(dice) {
    const dice1 = Number(dice.slice(0, 1));
    const dice2 = Number(dice.slice(1, 2));
    if      (dice1 == dice2) { this.dicelist = [dice1, dice1, dice1, dice1]; }
    else if (dice1 <  dice2) { this.dicelist = [dice2, dice1]; } //大きい順
    else                     { this.dicelist = [dice1, dice2]; }
  }

  keyInputAction(key) {
    switch(this.panelshowing) {
    case "rolldouble": //ダイスロール時は、123456dを受け付ける
      if (["1", "2", "3", "4", "5", "6"].includes(key)) {
        this.keyBuffer += key;
        if (this.keyBuffer.length == 2) {
          this.pickDiceAction(this.keyBuffer);
        }
      } else if (key == "d") {
        this.doubleAction();
      } else {
        this.keyBuffer = ""; //それ以外のキーが押されたらバッファをクリア
      }
      break;
    case "doneundo": //done undo時は、Enter, Space, Escを受け付ける
      if (key == "Enter" || key == " ") {
        this.doneAction();
      } else if (key == "Escape") {
        this.undoAction();
      }
      break;
    case "takedrop": //take dropは、t p を受け付ける
      if (key == "t") {
        this.takeAction();
      } else if (key == "p") {
        this.dropAction();
      }
      break;
    default:
      break;
    }
  }

  resignAction() {
    this.hideAllPanel();
    this.showResignPanel();
  }

  resignOkAction() {
    this.showActionStr(this.player, "Resign");
    this.swapTurn();
    this.xgid.dice = "00";
    this.calcScore(this.player); //リザイン時に負け点数を選べるならここを修正
    this.board.showBoard2(this.xgid);
    this.kifuobj.pushKifuXgid(this.xgid.xgidstr);
    this.hideAllPanel();
    this.showGameEndPanel(this.player);
    this.gameFinished = true;
  }

  resignCancelAction() {
    this.hideAllPanel();
    this.showRollDoublePanel(this.player);
  }

  forcedMoveAction() {
    this.donebtn.prop("disabled", false);
    this.forcedbtn.prop("disabled", true);
    const afterxgidstr = this.xgid.getForcedMovedXgid();
    this.xgid = new Xgid(afterxgidstr);
    this.board.showBoard2(this.xgid);
  }

  showPipInfo() {
    this.pip1.text(this.xgid.get_pip(+1));
    this.pip2.text(this.xgid.get_pip(-1));
  }

  showScoreInfo() {
    this.score1.text(this.xgid.sc_me);
    this.score2.text(this.xgid.sc_yu);
  }

  showActionStr(obj0, obj1, obj2 = null) {
    const player = (obj0 === null) ? "" : (obj0 ? "<br>Bl " : "<br>Wh ");
    const action = (obj2 === null) ? obj1 : this.kifuobj.getActionStr(obj1, obj2);
    this.actiondisp.append(player + action);
    this.actiondisp[0].scrollTo(0, this.actiondisp[0].scrollHeight);
  }

  calcScore(player) {
    this.gamescore = this.xgid.get_gamesc( BgUtil.cvtTurnGm2Xg(player) );
    const w = BgUtil.cvtTurnGm2Bd( player);
    const l = BgUtil.cvtTurnGm2Bd(!player);
    const scr = this.gamescore[0] * this.gamescore[1];
    this.xgid.crawford = this.xgid.checkCrawford(this.score[w], scr, this.score[l]);
    this.score[w] += scr;
    this.xgid.sc_me = this.score[1];
    this.xgid.sc_yu = this.score[2];
    this.matchwinflg = (this.matchLength != 0) && (this.score[w] >= this.matchLength);
  }

  canDouble(player) {
    return !this.xgid.crawford && (this.xgid.cubepos == 0) || (this.xgid.cubepos == this.xgid.turn);
  }

  showTakeDropPanel(player) {
    this.showElement(this.takedrop);
    this.panelshowing = "takedrop";
  }

  showRollDoublePanel(player, openroll = false) {
    this.doublebtn.toggle(!openroll).prop("disabled", !this.canDouble(player) );
    this.resignbtn.toggle(!openroll);
    this.openingroll.toggle(openroll);

    const closeout = this.isCloseout(player);
    this.pickdice.toggle(!closeout); //ダイス一覧かpassボタンのどちらかを表示
    this.passbtn.toggle(closeout);

    const col1  = openroll ? "blue"  : (player ? "blue" : "white");
    const col2  = openroll ? "white" : (player ? "blue" : "white");
    const bgcol = openroll ? "#999"  : (player ? "#ddd" : "#444");
    $(".turn1").css("color", col1);
    $(".turn2").css("color", col2);
    this.rolldouble.css("background-color", bgcol);
    this.showElement(this.rolldouble);
    this.keyBuffer = "";
    this.panelshowing = "rolldouble";
  }

  showDoneUndoPanel(player, opening = false) {
    this.donebtn.prop("disabled", (!this.xgid.moveFinished() && this.flashflg) );
    const forcebtnflg = this.xgid.isForcedMove();
    this.forcedbtn.toggle(forcebtnflg).prop("disabled", this.xgid.moveFinished());
    this.showElement(this.doneundo);
    this.panelshowing = "doneundo";
  }

  makeGameEndPanal(player) {
    const playername = player ? this.player1.val() : this.player2.val();
    const mes1 = playername + " WIN" + ((this.matchwinflg) ? "<br>and the MATCH" : "");
    const mes1dash = "You WIN" + ((this.matchwinflg) ? " and the MATCH" : "");
    this.showActionStr(player, mes1dash);
    this.gameend.children('.mes1').html(mes1);

    const winlevel = ["", "SINGLE", "GAMMON", "BACK GAMMON"];
    const res = winlevel[this.gamescore[1]];
    const mes2 = "Get " + this.gamescore[0] * this.gamescore[1] + "pt (" + res + ")";
    this.showActionStr(player, mes2);
    this.gameend.children('.mes2').text(mes2);

    const mes3 = this.score[1] + " - " + this.score[2] + " (" +this.matchLength + "pt)";
    this.showActionStr(player, mes3);
    this.gameend.children('.mes3').html(mes3);
  }

  showGameEndPanel(player) {
    this.makeGameEndPanal(player);
    this.gameendnextbtn.toggle(!this.matchwinflg);
    this.gameendokbtn.toggle(this.matchwinflg);
    this.showElement(this.gameend);
  }

  showResignPanel(player) {
    this.showElement(this.resign);
  }

  hideAllPanel() {
    this.allpanel.hide();
    this.panelWindow.max();
    this.panelshowing = "none";
  }

  showElement(elem) {
    elem.show();
    const width = elem.outerWidth(true);
    const height = elem.outerHeight(true);
    this.panelholder.css("width", width).css("height", height+35);
    $("#panelBody").css("padding", 0);
  }

  pushXgidPosition() {
   this.undoStack.push(this.xgid.xgidstr);
  }

  popXgidPosition() {
    return this.undoStack.pop();
  }

  peepXgidPosition() {
    return this.undoStack[0];
  }

  swapTurn() {
    this.player = !this.player;
  }

  swapXgTurn() {
    this.xgid.turn = -1 * this.xgid.turn;
  }

  isCloseout(player) {
    const xgturn = BgUtil.cvtTurnGm2Xg(!player); //クローズアウトを確認するのは相手側
    return this.xgid.isCloseout(xgturn);
  }

  setButtonEnabled(button, enable) {
    button.prop("disabled", !enable);
  }

  getToday() {
    const date = new Date();
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    const datestr = year + "/" + month + "/" + day;
    return datestr;
  }

  setChequerDraggable() {
    //関数内広域変数
    var x;//要素内のクリックされた位置
    var y;
    var dragobj; //ドラッグ中のオブジェクト
    var zidx; //ドラッグ中のオブジェクトのzIndexを保持

    //この関数内の処理は、パフォーマンスのため jQuery Free で記述

    //ドラッグ開始時のコールバック関数
    const evfn_dragstart = ((origevt) => {
      origevt.preventDefault();
      dragobj = origevt.currentTarget; //dragする要素を取得し、広域変数に格納
      if (!dragobj.classList.contains("draggable")) { return; } //draggableでないオブジェクトは無視

      dragobj.classList.add("dragging"); //drag中フラグ(クラス追加/削除で制御)
      zidx = dragobj.style.zIndex;
      dragobj.style.zIndex = 999;

      //マウスイベントとタッチイベントの差異を吸収
      const event = (origevt.type === "mousedown") ? origevt : origevt.changedTouches[0];

      //要素内の相対座標を取得
      x = event.pageX - dragobj.offsetLeft;
      y = event.pageY - dragobj.offsetTop;

      //イベントハンドラを登録
      document.body.addEventListener("mousemove",  evfn_drag,    {passive:false});
      document.body.addEventListener("mouseleave", evfn_dragend, false);
      dragobj.      addEventListener("mouseup",    evfn_dragend, false);
      document.body.addEventListener("touchmove",  evfn_drag,    {passive:false});
      document.body.addEventListener("touchleave", evfn_dragend, false);
      document.body.addEventListener("touchend",   evfn_dragend, false);

      const ui = {position: { //dragStartAction()に渡すオブジェクトを作る
                   left: dragobj.offsetLeft,
                   top:  dragobj.offsetTop
                 }};
      this.dragStartAction(origevt, ui);
    });

    //ドラッグ中のコールバック関数
    const evfn_drag = ((origevt) => {
      origevt.preventDefault(); //フリックしたときに画面を動かさないようにデフォルト動作を抑制

      //マウスイベントとタッチイベントの差異を吸収
      const event = (origevt.type === "mousemove") ? origevt : origevt.changedTouches[0];

      //マウスが動いた場所に要素を動かす
      dragobj.style.top  = event.pageY - y + "px";
      dragobj.style.left = event.pageX - x + "px";
    });

    //ドラッグ終了時のコールバック関数
    const evfn_dragend = ((origevt) => {
      origevt.preventDefault();
      dragobj.classList.remove("dragging"); //drag中フラグを削除
      dragobj.style.zIndex = zidx;

      //イベントハンドラの削除
      document.body.removeEventListener("mousemove",  evfn_drag,    false);
      document.body.removeEventListener("mouseleave", evfn_dragend, false);
      dragobj.      removeEventListener("mouseup",    evfn_dragend, false);
      document.body.removeEventListener("touchmove",  evfn_drag,    false);
      document.body.removeEventListener("touchleave", evfn_dragend, false);
      document.body.removeEventListener("touchend",   evfn_dragend, false);

      const ui = {position: { //dragStopAction()に渡すオブジェクトを作る
                   left: dragobj.offsetLeft,
                   top:  dragobj.offsetTop
                 }};
      this.dragStopAction(origevt, ui);
    });

    //dragできるオブジェクトにdragstartイベントを設定
    for(const elm of this.chequerall) {
      elm.addEventListener("mousedown",  evfn_dragstart, false);
      elm.addEventListener("touchstart", evfn_dragstart, false);
    }
  }

  dragStartAction(event, ui) {
    this.dragObject = $(event.currentTarget); //dragStopAction()で使うがここで取り出しておかなければならない
    const id = event.currentTarget.id;
    this.dragStartPt = this.board.getDragStartPoint(id, BgUtil.cvtTurnGm2Bd(this.player));
    this.dragStartPos = ui.position;
    this.flashOnMovablePoint(this.dragStartPt);
  }

  checkDragEndPt(xg, dragstartpt, dragendpt) {
    let endpt = dragendpt;
    let ok = false;

    if (dragstartpt == dragendpt) {
      //同じ位置にドロップ(＝クリック)したときは、ダイスの目を使ったマスに動かす
      for (let i = 0; i < this.dicelist.length; i++) {
        //ダイス目でピッタリに上がれればその目を使って上げる
        const endptwk = this.dicelist.includes(dragstartpt) ? dragstartpt - this.dicelist[i]
                                                            : Math.max(dragstartpt - this.dicelist[i], 0);
        if (xg.isMovable(dragstartpt, endptwk)) {
          this.dicelist.splice(i, 1);
          endpt = endptwk;
          ok = true;
          break;
        }
      }
    } else {
      if (this.flashflg) {
        //ドロップされた位置が前後 1pt の範囲であれば OK とする。せっかちな操作に対応
        const ok0 = xg.isMovable(dragstartpt, dragendpt);
        const ok1 = xg.isMovable(dragstartpt, dragendpt + 1);
        const ok2 = xg.isMovable(dragstartpt, dragendpt - 1);
        if      (ok0)         { endpt = dragendpt;     ok = true; } //ちょうどの目にドロップ
        else if (ok1 && !ok2) { endpt = dragendpt + 1; ok = true; } //前後が移動可能な時は進めない
        else if (ok2 && !ok1) { endpt = dragendpt - 1; ok = true; } //ex.24の目で3にドロップしたときは進めない
      } else {
        //イリーガルムーブを許可したとき
        endpt = dragendpt;
        ok = (dragstartpt > dragendpt) && !this.xgid.isBlocked(dragendpt); //掴んだマスより前でブロックポイントでなければtrue
      }
      //D&Dで動かした後クリックで動かせるようにダイスリストを調整しておく
      //known bug:ダイス組み合わせの位置に動かしたときは、次のクリックムーブが正しく動かないことがある
      for (let i = 0; i < this.dicelist.length; i++) {
        if (this.dicelist[i] == (dragstartpt - endpt)) {
          this.dicelist.splice(i, 1);
          break;
        }
      }
    }
    return [endpt, ok];
  }

  dragStopAction(event, ui) {
    this.flashOffMovablePoint();
    const dragendpt = this.board.getDragEndPoint(ui.position, BgUtil.cvtTurnGm2Bd(this.player));

    let ok;
    [this.dragEndPt, ok] = this.checkDragEndPt(this.xgid, this.dragStartPt, dragendpt);
    const hit = this.xgid.isHitted(this.dragEndPt);

    if (ok) {
      if (hit) {
        const movestr = this.dragEndPt + "/" + this.param1;
        this.xgid = this.xgid.moveChequer2(movestr);
        const oppoplayer = BgUtil.cvtTurnGm2Bd(!this.player);
        const oppoChequer = this.board.getChequerHitted(this.dragEndPt, oppoplayer);
        const barPt = this.board.getBarPos(oppoplayer);
        if (oppoChequer) {
          oppoChequer.dom.animate(barPt, 300, () => { this.board.showBoard2(this.xgid); });
        }
      }
      const movestr = this.dragStartPt + "/" + this.dragEndPt;
      this.xgid = this.xgid.moveChequer2(movestr);
      if (!hit) {
        this.board.showBoard2(this.xgid);
      }
    } else {
      this.dragObject.animate(this.dragStartPos, 300);
    }
    this.swapChequerDraggable(this.player);
    this.donebtn.prop("disabled", (!this.xgid.moveFinished() && this.flashflg) );
  }

  swapChequerDraggable(player, init = false) {
    this.chequerall.removeClass("draggable");
    if (init) { return; }
    const plyr = BgUtil.cvtTurnGm2Bd(player);
    for (let i = 0; i < this.ckrnum; i++) {
      const pt = this.board.chequer[plyr][i].point;
      if (pt == this.param2 || pt == this.param3) { continue; }
      this.board.chequer[plyr][i].dom.addClass("draggable");
    }
  }

  flashOnMovablePoint(startpt) {
    if (!this.flashflg) { return; }
    let dest2 = [];
    const destpt = this.xgid.movablePoint(this.dragStartPt, this.flashflg);
    if (this.player) { dest2 = destpt; }
    else {
      for (const p of destpt) {
        const pt = (p == 0) ? 0 : this.param1 - p;
        dest2.push(pt);
      }
    }
    this.board.flashOnMovablePoint(dest2, BgUtil.cvtTurnGm2Bd(this.player));
  }

  flashOffMovablePoint() {
    this.board.flashOffMovablePoint();
  }

  pointClickAction(event) {
    const id = event.currentTarget.id;
    const pt = parseInt(id.substring(2));
    const chker = this.board.getChequerOnDragging(pt, BgUtil.cvtTurnGm2Bd(this.player));

    if (chker) { //chker may be undefined
      const chkerdom = chker.dom;
      const ui = {position: { //dragStopAction()に渡すオブジェクトを作る
                   left: parseInt(chkerdom[0].style.left),
                   top:  parseInt(chkerdom[0].style.top)
                 }};
      this.dragObject = $(chker.id);
      this.dragStartPt = this.board.getDragEndPoint(ui.position, BgUtil.cvtTurnGm2Bd(this.player));;
      this.dragStopAction(event, ui);
    }
  }

}
