# YYFrameWork
基于 CocosCreator 的一个小型游戏框架  
引擎版本： v2.4.3  

## 介绍
1. 本框架适用于小型单场景游戏。
2. 封装了基本的需求模块  
   2.1. 包含音频管理模块、场景管理模块、事件模块、UI适配模块、网络模块等  
   2.2. 其中网络模块只是封装了基本的http和websocket，需要根据需求自己进行上层的封装  
   2.3. 以上模块采用挂载在 window 上，作为全局变量使用，除此之外项目中禁止随意增加 window 属性，避免污染全局变量  
3. 扩展了 button 组件  
    3.1. 添加按钮音效，直接拖拽即可  
    3.2. 添加图片模式下子节点跟随移动功能，移动距离用 childOffest 变量控制  
    3.3. 添加按钮连续点击的屏蔽功能，屏蔽时长用  blockTime 变量控制  
    3.4. 添加长按事件，长按事件使用 longPressTime 控制，需要先调用 addLongPressEvent 添加长按回调事件  
4. **脚本生成器** 功能简介:  
    4.1. 通过解析场景和预制文件，自动给预制和场景生成同名组件脚本，脚本自动写入部分函数、属性、以及其他相关代码  
    4.2. 脚本自动绑定到场景或预制上，属性界面的属性自动绑定对应节点  
    4.3. 特性:    
        - 4.3.1. 如果已经有同名的脚本则不会生成，检查脚本里面的属性，补足新的属性，删除没有对应节点的属性  
        - 4.3.2. 分别统计生成的脚本，修改的脚本，错误的命名节点， 在控制台输出相关属性  
        - 4.3.3. 同名属性检查，有同名属性会报错，并且不会生成或者修改ts脚本   
        - 4.3.4. 脚本自动添加到预制和场景，属性自动绑定，减少手动拖的步骤  
        - 4.3.5. btn组件自动添加回调函数，如果已有相同的回调函数则不再添加  

## TODO 
- 脚本生成器，运行之后自动刷新creator场景中显示的属性信息
- 增加excel解析工具