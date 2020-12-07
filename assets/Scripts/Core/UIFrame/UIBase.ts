import { UI_TYPE } from "./UIDefine";


export interface UIClass<T extends UIBase> {
    new(): T;
    uiType(): UI_TYPE;
    uiPath(): string;
}

const { ccclass, property } = cc._decorator;
@ccclass
export default class UIBase extends cc.Component {

    /** 需要派生类继承并重写 */
    protected _path: string = '';
    public get uiPath(): string { return this._path; }

    /** 需要派生类继承并重写 */
    protected _uiType: UI_TYPE = UI_TYPE.UI_LAYER;
    public get uiType(): UI_TYPE { return this._uiType; }

    onLoad() {

    }

    start() {

    }
}
