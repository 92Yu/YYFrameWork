export enum UI_TYPE {
    /** 常驻节点 */
    UI_LAYER,
    /** 弹窗  （可以手动关闭，也可以自动关闭） */
    UI_POPUP,
    /** tip提示 （一闪而过那种） */
    UI_TIP,
    /** 错误弹窗 （顶级，一旦出现，阻塞游戏，常驻最上层） */
    UI_ERROR
}
