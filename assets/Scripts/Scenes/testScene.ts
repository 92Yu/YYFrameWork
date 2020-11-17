const { ccclass, property } = cc._decorator;

@ccclass
export default class testScene extends cc.Component {
	@property(cc.Node) private $_node_node1: cc.Node = null;
	@property(cc.Label) private $_label_label1: cc.Label = null;
	@property(cc.Sprite) private $_sprite_sp1: cc.Sprite = null;
	@property(cc.Button) private $_button_btn1: cc.Button = null;
	@property(cc.ScrollView) private $_scrollview_sc1: cc.ScrollView = null;
	@property(cc.ProgressBar) private $_progressBar_pb1: cc.ProgressBar = null;
	@property(cc.EditBox) private $_editbox_eb1: cc.EditBox = null;
	@property(cc.Toggle) private $_toggle_tg1: cc.Toggle = null;
	@property(cc.ToggleContainer) private $_toggleContainer_tgc1: cc.ToggleContainer = null;

    onLoad() {
        
    }

    start() {

    }

    onClose() {

    }

    onDestroy() {

    }

	private onBtnBtn1Clicked() {

	}

}