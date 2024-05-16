// KifuInputTool_class.js
"use strict";

class KifuInputTool {
  constructor(gametype = "normal") {
    const gameparam = BgUtil.getGametypeParam(gametype);
    this.ckrnum = gameparam[1]; //chequer num
    this.param0 = gameparam[0]; //my inner point = point num of one area
    this.param1 = this.param0 * 4 + 1; //array param of XGID position
    this.param2 = this.param0 * 4 + 2; //boff1
    this.param3 = this.param0 * 4 + 3; //boff2
    this.dicemx = gameparam[2]; //dice pip max

    this.xgid = new Xgid(null);
    this.board = new BgBoard("#board", false);
    this.board.showBoard2(this.xgid);
    this.kifuobj = new BgKifu();
    this.player = true; //true=player1, false=player2
    this.animDelay = 500; //cube, dice
    this.animDelay2 = 200; //checker

    this.setDomNames();
    this.makeDicelist();
    this.setEventHandler();
    this.setDraggableEvent();
    this.hideAllPanel();
    this.panelWindow.min(); // 最小化状態で表示
    this.panelNavWindow.max(); // 最大化状態で表示
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
    this.dancebtn    = $("#dancebtn");
    this.resignokbtn = $("#resignokbtn");
    this.resignclbtn = $("#resignclbtn");
    this.gameendbtn  = $("#gameendbtn");
    this.newmatchbtn = $("#newmatchbtn");
    this.rewindbtn   = $("#rewindbtn");
    this.fliphorizbtn= $("#fliphorizbtn");
    this.downloadbtn = $("#downloadbtn");
    this.diceAsBtn   = $("#dice10,#dice11,#dice20,#dice21");
    this.allowillegal= $("#allowillegal");
    this.pointTriangle = $(".point");

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
    this.matchlen1  = $("#matchlen1");
    this.matchlen2  = $("#matchlen2");
    this.actiondisp = $("#actiondisp");
    this.openingroll= $("#openingroll");

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
    this.pickdicetable = $("#pickdicetable");

    //モーダルウィンドウを準備
    this.panelWindow = new FloatWindow({
      hoverid:  "#panelholder",
      headid:   "#panelHeader",
      bodyid:   "#panelBody",
      maxbtn:   "#maxBtn",
      minbtn:   "#minBtn",
      closebtn: "#closeBtn",
      width:    "auto",
      height:   "35px",
      initshow: true,
    });

    this.panelNavWindow = new FloatWindow({
      hoverid:  "#panelNavHolder",
      headid:   "#panelNavHeader",
      bodyid:   "#panelNavBody",
      maxbtn:   "#maxNavBtn",
      minbtn:   "#minNavBtn",
      closebtn: "#closeNavBtn",
      width:    "auto",
      height:   "auto",
      top:      30,
      left:     window.innerWidth * 0.5,
      initshow: true,
    });
  }

  setEventHandler() {
    //Button Click Event
    this.undobtn.       on("click", (e) => { e.preventDefault(); this.undoAction(); });
    this.donebtn.       on("click", (e) => { e.preventDefault(); this.doneAction(); });
    this.resignbtn.     on("click", (e) => { e.preventDefault(); this.resignAction(); });
    this.doublebtn.     on("click", (e) => { e.preventDefault(); this.doubleAction(); });
    this.takebtn.       on("click", (e) => { e.preventDefault(); this.takeAction(); });
    this.dropbtn.       on("click", (e) => { e.preventDefault(); this.dropAction(); });
    this.dancebtn.      on("click", (e) => { e.preventDefault(); this.danceAction(); });
    this.gameendbtn.    on("click", (e) => { e.preventDefault(); this.gameendAction(); });
    this.diceAsBtn.     on("click", (e) => { e.preventDefault(); this.doneAction(); });
    this.diceAsBtn.     on("contextmenu",  (e) => { e.preventDefault(); this.undoAction(); });
    this.newmatchbtn.   on("click", (e) => { e.preventDefault(); this.newGameAction(); });
    this.rewindbtn.     on("click", (e) => { e.preventDefault(); this.rewindAction(); });
    this.fliphorizbtn.  on("click", (e) => { e.preventDefault(); this.flipHorizOrientationAction(); });
    this.downloadbtn.   on("click", (e) => { e.preventDefault(); this.kifuobj.downloadKifuAction(); });
    this.matchlen.      on("change", (e) => { e.preventDefault(); this.changeMatchLengthAction(); });
    this.allowillegal.  on("change", (e) => { e.preventDefault(); this.strictflg = !this.allowillegal.prop("checked"); });
    this.pickdice.      on("click", (e) => { e.preventDefault(); this.pickDiceAction(e.currentTarget.id.slice(-2)); });
    this.pointTriangle. on("mouseup", (e) => { e.preventDefault(); this.pointClickAction(e); });
    this.resignokbtn.   on("click", (e) => { e.preventDefault(); this.resignOkAction(); });
    this.resignclbtn.   on("click", (e) => { e.preventDefault(); this.resignCancelAction(); });
    this.forcedbtn.     on("click", (e) => { e.preventDefault(); this.forcedMoveAction(); });
    $(window).          on("resize", (e) => { e.preventDefault(); this.board.redraw(true); });
    $(document).        on("keydown", (e) => { this.keyInputAction(e.key); });
    $(document).        on("contextmenu", (e) => { e.preventDefault(); });
  }

  initGameOption() {
    this.strictflg = !this.allowillegal.prop("checked");
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
    this.unsetChequerDraggable();
    this.openingrollflag = true;
    this.hideAllPanel();
    this.showRollDoublePanel(true, this.openingrollflag);
    if (!newmatch) { this.showActionStr(null, "<br><br>"); }
    this.showActionStr(null, "Opening roll");
  }

  async rollAction(openroll = false) {
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
    this.showDoneUndoPanel();
    this.kifuobj.pushKifuXgid(this.xgid.xgidstr);　//棋譜を記録するのはアニメーションの前
    this.clearXgidPosition();
    this.pushXgidPosition(this.xgid.xgidstr);
    await this.board.animateDice(this.animDelay);
    this.setChequerDraggable(this.player); //ドラッグできるようにするのはアニメーションの後
  }

  undoAction() {
    //ムーブ前のボードを再表示
    if (this.undoStack.length == 0) { return; }
    const xgidstr = this.popXgidPosition();
    this.xgid = new Xgid(xgidstr);
    this.xgid.usabledice = true;
    this.makeDiceList(this.xgid.dice);
    this.donebtn.prop("disabled", (!this.xgid.moveFinished() && this.strictflg) );
    this.forcedflg = this.xgid.isForcedMove();
    this.forcedbtn.toggle(this.forcedflg).prop("disabled", this.xgid.moveFinished());
    this.pushXgidPosition(this.xgid.xgidstr);
    this.board.showBoard2(this.xgid);
    this.setChequerDraggable(this.player);
  }

  doneAction() {
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
    this.unsetChequerDraggable();
    this.hideAllPanel();
    this.showRollDoublePanel(this.player);
    this.allowillegal.prop("checked", false);
    this.strictflg = true;
  }

  async doubleAction() {
    if (!this.canDouble(this.player)) { return; }
    this.showActionStr(this.player, "Doubles => " + Math.pow(2, this.xgid.cube + 1));
    this.swapTurn();
    this.xgid.dbloffer = true;
    this.board.showBoard2(this.xgid); //double offer
    this.hideAllPanel();
    this.showTakeDropPanel();
    this.kifuobj.pushKifuXgid(this.xgid.xgidstr); //棋譜を記録するのはアニメーションの前
    this.swapXgTurn(); //XGのturnを変えるのは棋譜用XGID出力後
    this.setButtonEnabled(this.takebtn, false); //アニメーションしているときはTakeボタンは押せない
    await this.board.animateCube(this.animDelay); //キューブを揺すのはshowBoard()の後
    this.setButtonEnabled(this.takebtn, true);
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

  danceAction() {
    this.xgid.dice = "66";
    this.clearXgidPosition();
    this.pushXgidPosition(this.xgid.xgidstr);
    this.kifuobj.pushKifuXgid(this.xgid.xgidstr);
    this.doneAction();
  }

  gameendAction() {
    this.hideAllPanel();
    this.showScoreInfo();
    this.kifuobj.pushKifuXgid(""); //空行
    if (!this.matchwinflg) { this.beginNewGame(false); } //まだ続けられるなら
  }

  bearoffAllAction() {
    this.showActionStr(this.player, this.peepXgidPosition(), this.xgid.xgidstr);
    this.calcScore(this.player); // this.player is winner
    this.kifuobj.pushKifuXgid(this.xgid.xgidstr);
    this.hideAllPanel();
    this.showGameEndPanel(this.player);
    this.gameFinished = true;
  }

  newGameAction() {
    if (this.kifuobj.isDirty()) {
      if (!confirm("Really New Match?")) { return; }
    }
    this.initGameOption();
    this.kifuobj.clearKifuXgid();
    this.actiondisp.html("");
    this.beginNewGame(true);
  }

  rewindAction() {
    const last0xgid = this.kifuobj.peepKifuXgid(0);
    const last1xgid = this.kifuobj.peepKifuXgid(1);
    if (!last0xgid || !last1xgid) { return; } //rewindで戻せるのは空行で区切られたゲーム境界まで
                                //known bug:オープニングロールの出目は巻き戻せない
    const getDice   = ((xgidstr) => { const s = xgidstr.split(":"); return s[4]; }); //utility function
    const getPlayer = ((xgidstr) => { const s = xgidstr.split(":"); return (s[3] == 1); });

    const dice = getDice(last1xgid);
    if (dice == "00") { //rewind cube action
      //二つ前の履歴がtakeアクションだったときは、三つ前のダブルオファーのxgidを取り出す
      const dummy1 = this.kifuobj.popKifuXgid(); //ignore (dice=xx)
      const dummy2 = this.kifuobj.popKifuXgid(); //ignore (dice=00)
      const doubleofferxgid = this.kifuobj.popKifuXgid(); //double offer xgid (dice=D)
      this.player = getPlayer(doubleofferxgid);
      this.showActionStr(this.player, "Rewind Cube Action");
      this.xgid = new Xgid(doubleofferxgid);
      this.doubleAction();
    } else { //rewind checker action
      let lastxgid = this.kifuobj.popKifuXgid();
      if (this.xgid.moveFinished()) {
        this.kifuobj.pushKifuXgid(lastxgid);
        //Doneボタンが押せる状態になっているときは単純なundoActionとして動かすため、pop/pushして履歴を残す
      } else {
        lastxgid = last1xgid;
        //doubleAction()でpushされるダブルオファーの履歴(dice=D)をスキップするため、一つ前のxgidを使う
        //上記でpopしたlastxgidは捨てる
      }
      this.player = getPlayer(lastxgid);
      this.showActionStr(this.player, "Rewind " + getDice(lastxgid));
      this.clearXgidPosition();
      this.pushXgidPosition(lastxgid); //rollActionした状態にしてundoActionに渡す
      this.hideAllPanel();
      this.showDoneUndoPanel();
      this.undoAction();
    }
  }

  flipHorizOrientationAction() {
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
      } else if (this.forcedflg && key == "f") { //フォーストのときは f を受け付ける
        this.forcedMoveAction();
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

  changeMatchLengthAction() {
    this.matchLength = this.matchlen.val();
    const matchlenstr = this.matchLength == 0 ? "$" : this.matchLength;
    this.matchlen1.text(matchlenstr);
    this.matchlen2.text(matchlenstr);
    this.xgid.matchsc = this.matchLength;
  }

  showPipInfo() {
    this.pip1.text(this.xgid.get_pip(+1));
    this.pip2.text(this.xgid.get_pip(-1));
  }

  showScoreInfo() {
    const cfplayer = this.xgid.getCrawfordPlayer();
    const sc1 = this.xgid.sc_me + ((cfplayer == +1) ? "*" : "");
    const sc2 = this.xgid.sc_yu + ((cfplayer == -1) ? "*" : "");
    this.score1.text(sc1);
    this.score2.text(sc2);
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

  showTakeDropPanel() {
    this.showElement(this.takedrop);
    this.panelshowing = "takedrop";
  }

  showRollDoublePanel(player, openroll = false) {
    this.doublebtn.toggle(!openroll).prop("disabled", !this.canDouble(player) );
    this.resignbtn.toggle(!openroll);
    this.openingroll.toggle(openroll);

    const closeout = this.isCloseout(player);
    this.pickdicetable.toggle(!closeout); //ダイス一覧かpassボタンのどちらかを表示
    this.dancebtn.toggle(closeout);

    const col1 = openroll ? "blue"  : (player ? "blue" : "white");
    const col2 = openroll ? "white" : (player ? "blue" : "white");
    const col1bg = (col1 == "blue") ? "white" : "black";
    const col2bg = (col2 == "blue") ? "white" : "black";
    $(".turn1").css("stroke", col1bg).css("fill", col1);
    $(".turn2").css("stroke", col2bg).css("fill", col2);
    this.showElement(this.rolldouble);
    this.keyBuffer = "";
    this.panelshowing = "rolldouble";
  }

  showDoneUndoPanel() {
    this.donebtn.prop("disabled", (!this.xgid.moveFinished() && this.strictflg) );
    this.forcedflg = this.xgid.isForcedMove(); //rewindAction()時にも呼ばれるため、rollAction()ではなくここで確認
    this.forcedbtn.toggle(this.forcedflg).prop("disabled", this.xgid.moveFinished());
    this.showElement(this.doneundo);
    this.panelshowing = "doneundo";
  }

  makeGameEndPanel(player) {
    const playername = player ? this.player1.val() : this.player2.val();
    const mes1 = playername + " WIN" + ((this.matchwinflg) ? "<br>and the MATCH" : "");
    const mes1dash = "You WIN" + ((this.matchwinflg) ? " and the MATCH" : "");
    this.showActionStr(player, mes1dash);
    this.gameend.children(".mes1").html(mes1);

    const winlevel = ["", "SINGLE", "GAMMON", "BACK GAMMON"];
    const res = winlevel[this.gamescore[1]];
    const mes2 = "Get " + this.gamescore[0] * this.gamescore[1] + "pt (" + res + ")";
    this.showActionStr(player, mes2);
    this.gameend.children(".mes2").text(mes2);

    const matchlengthinfo = this.matchLength == 0 ? "unlimited game" : this.matchLength + "pt";
    const mes3 = this.score[1] + " - " + this.score[2] + " (" + matchlengthinfo + ")";
    this.showActionStr(player, mes3);
    this.gameend.children(".mes3").html(mes3);
  }

  showGameEndPanel(player) {
    this.makeGameEndPanel(player);
    const btnmsg = this.matchwinflg ? "<i class='fas fa-check-circle'></i> Ok"
                                    : "<i class='fas fa-arrow-alt-circle-right'></i> Next";
    this.gameendbtn.html(btnmsg);
    this.showElement(this.gameend);
  }

  showResignPanel() {
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
  }

  pushXgidPosition(xgidstr) {
   this.undoStack.push(xgidstr);
  }

  popXgidPosition() {
    return this.undoStack.pop();
  }

  peepXgidPosition() {
    return this.undoStack[this.undoStack.length - 1];
  }

  clearXgidPosition() {
   this.undoStack = [];
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

  setDraggableEvent() {
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
      if (!dragobj.classList.contains("draggable")) {
        //相手チェッカーのときはそこにポイントオンする(できるときは)
        const position = { //オブジェクトの位置
              left: dragobj.offsetLeft,
              top:  dragobj.offsetTop
            };
        //オブジェクト(チェッカー)の位置からポイント番号を得る
        const point = this.board.getDragEndPoint(position, 1); //下側プレイヤーから見たポイント番号
        this.makeBlockPointAction(point); //そこにブロックポイントを作る
        return;
      }

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

      const position = { //dragStartAction()に渡すオブジェクトを作る
              left: dragobj.offsetLeft,
              top:  dragobj.offsetTop
            };
      this.dragStartAction(origevt, position);
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

      const position = { //dragStopAction()に渡すオブジェクトを作る
              left: dragobj.offsetLeft,
              top:  dragobj.offsetTop
            };
      this.dragStopAction(position);
    });

    //dragできるオブジェクトにdragstartイベントを設定
    for(const elm of this.chequerall) {
      elm.addEventListener("mousedown",  evfn_dragstart, false);
      elm.addEventListener("touchstart", evfn_dragstart, false);
    }
  }

  dragStartAction(event, position) {
    this.mouseRbtnFlg = (event.button != 0); //主ボタン(左)のときだけfalse
    this.dragObject = $(event.currentTarget); //dragStopAction()で使うがここで取り出しておかなければならない
    const id = event.currentTarget.id;
    this.dragStartPt = this.board.getDragStartPoint(id, BgUtil.cvtTurnGm2Bd(this.player));
    this.dragStartPos = position;
    this.flashOnMovablePoint(this.dragStartPt);
  }

  checkDragEndPt(xg, dragstartpt, dragendpt) {
    let endpt = dragendpt;
    let ok = false;

    if (dragstartpt == dragendpt) {
      //同じ位置にドロップ(＝クリック)したときは、ダイスの目を使ったマスに動かす
      if (this.mouseRbtnFlg) { this.dicelist.reverse(); }　//右クリックのときは小さい目から使う
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
      if (this.mouseRbtnFlg) { this.dicelist.reverse(); } //元に戻す
    } else {
      if (this.strictflg) {
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
      for (let i = 0; i < this.dicelist.length; i++) {
        if (this.dicelist[i] == (dragstartpt - endpt)) {
          this.dicelist.splice(i, 1);
          break;
        }
      }
    }
    return [endpt, ok];
  }

  dragStopAction(position) {
    this.flashOffMovablePoint();
    const dragendpt = this.board.getDragEndPoint(position, BgUtil.cvtTurnGm2Bd(this.player));

    let ok;
    [this.dragEndPt, ok] = this.checkDragEndPt(this.xgid, this.dragStartPt, dragendpt);
    const hit = this.xgid.isHitted(this.dragEndPt);

    if (ok) {
      if (hit) {
        const movestr = this.dragEndPt + "/" + this.param1;
        this.xgid = this.xgid.moveChequer2(movestr);
      }
      const movestr = this.dragStartPt + "/" + this.dragEndPt;
      this.xgid = this.xgid.moveChequer2(movestr);
      this.board.showBoard2(this.xgid);
    } else {
      this.dragObject.animate(this.dragStartPos, this.animDelay2);
    }
    this.setChequerDraggable(this.player);
    this.donebtn.prop("disabled", (!this.xgid.moveFinished() && this.strictflg) );
  }

  unsetChequerDraggable() {
    this.chequerall.removeClass("draggable");
  }

  setChequerDraggable(player) {
    this.unsetChequerDraggable();
    const plyr = BgUtil.cvtTurnGm2Bd(player);
    for (let i = 0; i < this.ckrnum; i++) {
      const pt = this.board.chequer[plyr][i].point;
      if (pt == this.param2 || pt == this.param3) { continue; }
      this.board.chequer[plyr][i].dom.addClass("draggable");
    }
  }

  flashOnMovablePoint(startpt) {
    if (!this.strictflg) { return; }
    let dest2 = [];
    const destpt = this.xgid.movablePoint(this.dragStartPt, this.strictflg);
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
    this.mouseRbtnFlg = (event.button != 0);
    const id = event.currentTarget.id;
    const pt = parseInt(id.substring(2));
    const chker = this.board.getChequerOnDragging(pt, BgUtil.cvtTurnGm2Bd(this.player));

    if (chker) { //そのポイントにチェッカーがあればそれを動かす
      this.moveCheckerAction(chker);
    } else { //そのポイントにチェッカーがなければ
      this.makeBlockPointAction(pt); //そこに向かって動かせる2枚を使ってブロックポイントを作る
    }
  }

  moveCheckerAction(checker) {
    const checkerdom = checker.dom;
    const position = { //dragStopAction()に渡すオブジェクトを作る
            left: parseInt(checkerdom[0].style.left),
            top:  parseInt(checkerdom[0].style.top)
          };
    this.dragObject = $(checker.id);
    this.dragStartPt = this.board.getDragEndPoint(position, BgUtil.cvtTurnGm2Bd(this.player));
    this.dragStopAction(position);
  }

  makeBlockPointAction(pointto) {
    if (this.dicelist.length < 2) {
      return; //使えるダイスが２個以上なければ何もしない
    }

    this.mouseRbtnFlg = false; //このルーチンではダイスの大きい目から使う(右クリックを無視する)
    const pointfr1 = this.player ? (pointto + this.dicelist[0]) : (pointto - this.dicelist[0]);
    const pointfr2 = this.player ? (pointto + this.dicelist[1]) : (pointto - this.dicelist[1]);

    const ptno1  = this.xgid.get_ptno (pointfr1);
    const ptcol1 = this.xgid.get_ptcol(pointfr1);
    const ptno2  = this.xgid.get_ptno (pointfr2);
    const ptcol2 = this.xgid.get_ptcol(pointfr2);
    const ptno3  = this.xgid.get_ptno (pointto);
    const ptcol3 = this.xgid.get_ptcol(pointto);
    const chkrnum = this.dicelist[0] == this.dicelist[1] ? 2 : 1; //ゾロ目のときは元ポイントに2個以上なければならない
    const ismovablefr = (ptno1 >= chkrnum && ptcol1 == BgUtil.cvtTurnGm2Xg(this.player) &&
                         ptno2 >= chkrnum && ptcol2 == BgUtil.cvtTurnGm2Xg(this.player)); //動かせるチェッカーがあるかどうか
    const ismovableto = (ptno3 == 0 || (ptno3 == 1 && ptcol3 == BgUtil.cvtTurnGm2Xg(!this.player))); //空かブロットかどうか

    if (!(ismovablefr && ismovableto)) {
      return; //動かせるチェッカーが２つない、または、動かし先が空あるいはブロットでなければ何もしない
    }

    //１つ目のチェッカーを動かす
    const chker1 = this.board.getChequerOnDragging(pointfr1, BgUtil.cvtTurnGm2Bd(this.player));
    this.moveCheckerAction(chker1);

    //２つ目のチェッカーを動かす
    const chker2 = this.board.getChequerOnDragging(pointfr2, BgUtil.cvtTurnGm2Bd(this.player));
    this.moveCheckerAction(chker2);
  }

  makeDicelist() {
    let dicelist = "";

    for (let i = 1; i <= 6; i++) {
      dicelist += "<tr>\n"
      for (let j = 1; j <= 6; j++) {
        const id = "pickdice" + i + "" + j;
        const cls1 = (i >= j) ? "turn1 " : "turn2 ";
        const cls2 = (i >  j) ? "turn1 " : "turn2 ";
        const dice1 = this.board.svgDice[i].replace('class="', 'class="' + cls1);
        const dice2 = this.board.svgDice[j].replace('class="', 'class="' + cls2);

        dicelist += "<td id='" + id + "' class='pickdice'>\n";
        dicelist += dice1;
        dicelist += dice2;
        dicelist += "</td>\n";
      }
      dicelist += "</tr>\n"
    }

    this.pickdicetable.html(dicelist);
    this.pickdice = $(".pickdice"); //ここで定義しないと有効にならない
  }

}
