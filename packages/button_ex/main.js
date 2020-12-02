'use strict';

module.exports = {
  load() {
    // execute when package loaded
  },

  unload() {
    // execute when package unloaded
  },

  // register your ipc messages here
  messages: {
    'say-hello'() {
      Editor.log('Hello ButtonEx!: 扩展 button 组件，添加以下4个功能\n*  1. 添加按钮音效，直接拖拽即可\n*  2. 添加图片模式下子节点跟随移动功能，移动距离用 childOffest 变量控制\n*  3. 添加按钮连续点击的屏蔽功能，屏蔽时长用  blockTime 变量控制\n*  4. 添加长按事件，长按事件使用 longPressTime 控制，需要先调用 addLongPressEvent 添加长按回调事件');
    }
  },
};