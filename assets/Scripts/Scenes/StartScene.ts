import PopupBase from "../../../assets/Scripts/Core/PopupBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class StartScene extends cc.Component {
	@property(cc.Label) private $_Label_big: cc.Label = null;
	@property(cc.Button) private $_btn_save: cc.Button = null;

    onLoad() {
        
    }

    start() {

    }

    onClose() {

    }

    onDestroy() {
        super.onDestroy();

    }

	private onBtnSaveClicked() {

	}

}