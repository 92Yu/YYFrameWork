import { UIType } from "./UIDefine";

export interface UIClass<T extends UIBase> {
    new(): T;
    uiType(): any;
}

const { ccclass, property } = cc._decorator;
@ccclass
export default class UIBase extends cc.Component {

    /** 需要派生类继承并重写 */
    protected _uiType: UIType = UIType.UI_PANEL;
    public get uiType(): UIType { return this._uiType; }


    onLoad() {
        
    }

    start() {

    }
}
