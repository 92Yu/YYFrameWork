import UIBase, { UIClass } from "../uiFrame/UIBase";
import { UIType } from "../uiFrame/UIDefine";


/**
 * UI管理类
 */
let UIMgr = new class {
    private _preNodePanel: cc.Node = null;
    private _preNodePopup: cc.Node = null;
    private _preNodeTip: cc.Node = null;
    private _preNodeError: cc.Node = null;

    /** 存储弹出的窗体 */
    private _staCurrentUIForms: Array<UIBase> = [];
    /** 所有的窗体 */
    private _mapAllUIForms: { [key: string]: UIBase } = cc.js.createMap();
    /** 正在显示的窗体(不包括弹窗) */
    private _mapCurrentShowUIForms: { [key: string]: UIBase } = cc.js.createMap();
    /** 独立窗体 独立于其他窗体, 不受其他窗体的影响 */
    private _mapIndependentForms: { [key: string]: UIBase } = cc.js.createMap();
    /** 正在加载的form */
    private _mapLoadingForm: { [key: string]: boolean } = cc.js.createMap();

    private uiList: UIBase[] = [];
    private uiRoot: cc.Node = null;

    constructor() {

    }

    private getUITypeNode(type: UIType) {
        switch (type) {
            case UIType.UI_PANEL:
                return cc.find('PreNodePanel');
            case UIType.UI_POPUP:
                return cc.find('PreNodePopup');
            case UIType.UI_TIP:
                return cc.find('PreNodeTip');
            case UIType.UI_ERROR:
                return cc.find('PreNodeError');
        }
    }

    /**
     * 加载一个预制窗体到内存中
     *
     */
    public loadForm(formPath: string) {
        if (formPath == "" || formPath == null) {
            return;
        }

        let pre = cc.assetManager.loadAny(formPath);
        // let pre = await ResMgr.inst.loadForm(formPath);
        if (!pre) {
            cc.warn(`${formPath} 资源加载失败, 请确认路径是否正确`);
            return;
        }
        let node: cc.Node = cc.instantiate(pre);
        let baseUI = node.getComponent(UIBase);
        if (baseUI == null) {
            cc.warn(`${formPath} 没有绑定UIBase的Component`);
            return;
        }
        node.active = false;
        let parentNode = this.getUITypeNode(baseUI.uiType);
        parentNode.addChild(node);

        return baseUI;
    }

    /**
     * 添加窗体到其所在分类的节点上
     *
     * @param {*} uiForm
     */
    public addForm(uiForm) {

    }

    /**
     * 删除一个窗体
     *
     */
    public removeForm() {

    }

    public removeAllPanel() {

    }
    public removeAllPopup() {

    }
    public removeAllTip() {

    }
    public removeAllError() {

    }
}
window['UIMgr'] = UIMgr;