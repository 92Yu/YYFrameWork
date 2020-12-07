import UIBase, { UIClass } from "../uiFrame/UIBase";
import { UI_TYPE } from "../uiFrame/UIDefine";


/**
 * UI管理类
 * @author MartinYing
 */
let UIMgr = new class {
    private _preNodeLayer: cc.Node = null;
    private _preNodePopup: cc.Node = null;
    private _preNodeTip: cc.Node = null;
    private _preNodeTop: cc.Node = null;

    /** 存储弹出的视图 */
    private _stackCurrentUIViews: { [key: string]: UIBase } = cc.js.createMap();
    /** 所有的视图 */
    private _mapAllUIViews: { [key: string]: UIBase } = cc.js.createMap();
    /** 所有的Layer视图 */
    private _mapAllLayerViews: { [key: string]: UIBase } = cc.js.createMap();
    /** 所有的Popup视图 */
    private _mapAllPopupViews: { [key: string]: UIBase } = cc.js.createMap();
    /** 所有的Tip视图 */
    private _mapAllTipViews: { [key: string]: UIBase } = cc.js.createMap();
    /** 所有的Error视图 */
    private _mapAllErrorViews: { [key: string]: UIBase } = cc.js.createMap();

    constructor() {
        this._mapAllUIViews = cc.js.createMap();
        this._mapAllLayerViews = cc.js.createMap();
        this._mapAllPopupViews = cc.js.createMap();
        this._mapAllTipViews = cc.js.createMap();
        this._mapAllErrorViews = cc.js.createMap();
    }

    public openView<T extends UIBase>(uiClass: UIClass<T>, zOrder?: number, callback?: Function, ...args: any[]) {
        if (this.getView(uiClass)) {
            return;
        }

        cc.resources.load(uiClass.uiPath(), (error, prefab: cc.Prefab) => {
            if (error) {
                console.log(error);
                return;
            }
            let uiNode: cc.Node = cc.instantiate(prefab);
            let ui = uiNode.getComponent(uiClass) as UIBase;
            switch (ui.uiType) {
                case UI_TYPE.UI_LAYER:
                    // cc.director.getScene().getChildByName('Canvas').getChildByName('UIRoot').getChildByName('PreNodeLayer');
                    cc.find('PreNodeLayer').addChild(uiNode);
                    if (this._mapAllLayerViews[uiClass.uiPath()]) {
                        this._mapAllLayerViews[uiClass.uiPath()] = ui;
                    }
                case UI_TYPE.UI_POPUP:
                    // cc.director.getScene().getChildByName('Canvas').getChildByName('UIRoot').getChildByName('PreNodePopup');
                    cc.find('PreNodePopup').addChild(uiNode);
                    if (this._mapAllPopupViews[uiClass.uiPath()]) {
                        this._mapAllPopupViews[uiClass.uiPath()] = ui;
                    }
                case UI_TYPE.UI_TIP:
                    // cc.director.getScene().getChildByName('Canvas').getChildByName('UIRoot').getChildByName('PreNodeTip');
                    cc.find('PreNodeTip').addChild(uiNode);
                    if (this._mapAllTipViews[uiClass.uiPath()]) {
                        this._mapAllTipViews[uiClass.uiPath()] = ui;
                    }
                case UI_TYPE.UI_ERROR:
                    // cc.director.getScene().getChildByName('Canvas').getChildByName('UIRoot').getChildByName('PrenodeErr');
                    cc.find('PrenodeErr').addChild(uiNode);
                    if (this._mapAllErrorViews[uiClass.uiPath()]) {
                        this._mapAllErrorViews[uiClass.uiPath()] = ui;
                    }
            }
            if (zOrder) {
                uiNode.zIndex = zOrder;
            }
            if (this._mapAllUIViews[uiClass.uiPath()]) {
                this._mapAllUIViews[uiClass.uiPath()] = ui;
            }
            if (callback) {
                callback(args);
            }
            uiNode.active = false;
        });
    }

    public closeView<T extends UIBase>(uiClass: UIClass<T>) {
        if (this._mapAllUIViews[uiClass.uiPath()]) {
            this._mapAllUIViews[uiClass.uiPath()].node.removeFromParent(true);
            delete this._mapAllUIViews[uiClass.uiPath()];
        }
        if (this._mapAllLayerViews[uiClass.uiPath()]) {
            delete this._mapAllUIViews[uiClass.uiPath()];
        }
        if (this._mapAllPopupViews[uiClass.uiPath()]) {
            delete this._mapAllUIViews[uiClass.uiPath()];
        }
        if (this._mapAllTipViews[uiClass.uiPath()]) {
            delete this._mapAllUIViews[uiClass.uiPath()];
        }
        if (this._mapAllErrorViews[uiClass.uiPath()]) {
            delete this._mapAllUIViews[uiClass.uiPath()];
        }
    }

    public getView<T extends UIBase>(uiClass: UIClass<T>): UIBase {
        if (this._mapAllUIViews[uiClass.uiPath()]) {
            return this._mapAllUIViews[uiClass.uiPath()];
        }
        return null;
    }

    public showView<T extends UIBase>(uiClass: UIClass<T>, callback?: Function) {
        let ui = this.getView(uiClass);
        if (ui) {
            ui.node.active = true;
            if (callback) {
                callback();
            }
        }
        else {
            this.openView(uiClass, 0, () => {
                callback && callback();
                let ui = this.getView(uiClass);
                ui.node.active = true;
            });
        }
    }

    public closeAllLayer() {
        for (const key in this._mapAllLayerViews) {
            if (Object.prototype.hasOwnProperty.call(this._mapAllLayerViews, key)) {
                const element = this._mapAllLayerViews[key];
                element.node.removeFromParent(true);
                delete this._mapAllLayerViews[key];
            }
        }
    }
    public closeAllPopup() {
        for (const key in this._mapAllPopupViews) {
            if (Object.prototype.hasOwnProperty.call(this._mapAllPopupViews, key)) {
                const element = this._mapAllPopupViews[key];
                element.node.removeFromParent(true);
                delete this._mapAllPopupViews[key];
            }
        }
    }
    public closeAllTip() {
        for (const key in this._mapAllTipViews) {
            if (Object.prototype.hasOwnProperty.call(this._mapAllTipViews, key)) {
                const element = this._mapAllTipViews[key];
                element.node.removeFromParent(true);
                delete this._mapAllTipViews[key];
            }
        }
    }
    public closeAllError() {
        for (const key in this._mapAllErrorViews) {
            if (Object.prototype.hasOwnProperty.call(this._mapAllErrorViews, key)) {
                const element = this._mapAllErrorViews[key];
                element.node.removeFromParent(true);
                delete this._mapAllErrorViews[key];
            }
        }
    }
}();
window['UIMgr'] = UIMgr;