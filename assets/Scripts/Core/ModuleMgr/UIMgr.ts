import UIBase, { UIClass } from "../UIFrame/UIBase";
import { UIType } from "../UIFrame/UIDefine";

/**
 * UI管理类
 */
let UIMgr = new class {
    private uiList: UIBase[] = [];
    private uiRoot: cc.Node = null;

    constructor() {
    }

    private getUIType<T extends UIBase>(uiClass: UIClass<T>) {
        switch (uiClass.uiType) {
            case UIType.UI_PANEL:

                break;
            case UIType.UI_POPUP:

                break;
            case UIType.UI_TIP:

                break;
            case UIType.UI_ERROR:

                break;
        }
    }
}
window['UIMgr'] = UIMgr;