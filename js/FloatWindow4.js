//FloatWindow4.js
//疑似ウィンドウ表示クラス
//参考： http://webnonotes.com/javascript-2/fake-window/
//上記で提供されている機能に対して、
// ・モーダル機能を削除
// ・最大化・最小化ボタンを追加
// ・ES6 の構文に修正
// ・コードリファクタリング
// ・クラス化
// 2021.8.2 hinacoppy
// 2023.1.21 脱jQuery
// 2023.6.6  draggableに移行
// 2023.6.9  touchイベントにも対応
"use strict";

class FloatWindow {
  constructor(userOption) {
    const option = this.setOption(userOption);
    this.setDomNames(option);
    this.setFloatWindowStyle(option);
    this.setButtonEvent();
    this.setDragEvent(this.hover);
  }

  setOption(userOption) {
    const defaultOption = {
            hoverid:  "#dmy",
            headid:   "#dmy",
            bodyid:   "#dmy",
            maxbtn:   "#dmy",
            minbtn:   "#dmy",
            closebtn: "#dmy",
            left:     null,
            top:      null,
            width:    "auto",
            height:   "auto",
            initshow: false,};
    const option = Object.assign({}, defaultOption, userOption);
    return option;
  }

  setDomNames(option) {
    this.hover    = document.querySelector(option.hoverid);
    this.head     = document.querySelector(option.headid);
    this.body     = document.querySelector(option.bodyid);
    this.closebtn = document.querySelector(option.closebtn);
    this.maxbtn   = document.querySelector(option.maxbtn);
    this.minbtn   = document.querySelector(option.minbtn);
  }

  setFloatWindowStyle(option) {
    this.hover.style.width = option.width;
    this.hover.style.height = option.height;

    const pos_left = option.left ? parseInt(option.left) : (window.innerWidth / 2) - (this.hover.clientWidth / 2); //画面中央
    const pos_top = option.top ? parseInt(option.top) : (window.innerHeight / 2) - (this.hover.clientHeight / 2);
    this.hover.style.left = pos_left + "px";
    this.hover.style.top = pos_top + "px";

    this.max_height = this.hover.clientHeight + "px";
    this.min_height = this.head.clientHeight + "px";
    this.hover.style.display = option.initshow ? "block" : "none"; //すべてを計算した後に表示/非表示にする
  }

  setDragEvent(container) {
    let mouseX, mouseY; //どこをつかんで移動を開始したかを保持
    let toucheX, toucheY;

    container.addEventListener("dragstart", (evt) => {
      mouseX = container.offsetLeft - evt.pageX;
      mouseY = container.offsetTop  - evt.pageY;
      container.style.opacity = 0.5;
    });

    container.addEventListener("drag", (evt) => {
      if (evt.x === 0 && evt.y === 0) { return; }
      container.style.left = (evt.pageX + mouseX) + "px";
      container.style.top  = (evt.pageY + mouseY) + "px";
    });

    container.addEventListener("dragend", (evt) => {
      evt.preventDefault(); //以降のイベントを無視する
      container.style.opacity = 1;
    });

    container.addEventListener("touchgstart", (evt) => {
      toucheX = container.offsetLeft - evt.touches[0].pageX;
      toucheY = container.offsetTop  - evt.touches[0].pageY;
      container.style.opacity = 0.5;
    });

    container.addEventListener("touchmove", (evt) => {
      if (evt.x === 0 && evt.y === 0) { return; }
      container.style.left = (evt.touches[0].pageX + toucheX) + "px";
      container.style.top  = (evt.touches[0].pageY + toucheY) + "px";
    });

    container.addEventListener("touchend", (evt) => {
      evt.preventDefault();
      container.style.opacity = 1;
    });
  }

  setButtonEvent() {
    if (this.closebtn) this.closebtn.addEventListener("click", () => { this.hide(); });
    if (this.maxbtn) this.maxbtn.addEventListener("click", () => { this.max(); });
    if (this.minbtn) this.minbtn.addEventListener("click", () => { this.min(); });
  }

  show() {
    this.hover.style.height = this.max_height;
    this.hover.style.display = "block";
    this.body.style.display = "block"; //最小化時にも再表示
  }

  hide() {
    this.hover.style.display = "none";
  }

  min() {
    this.hover.style.height = this.min_height;
    this.body.style.display = "none";
  }

  max() {
    this.hover.style.height = this.max_height;
    this.body.style.display = "block";
  }
}
