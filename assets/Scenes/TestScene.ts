import ButtonEx from "../scripts/extension/ButtonEx";

const { ccclass, property } = cc._decorator;

@ccclass
export default class TestScene extends cc.Component {

    @property(ButtonEx) private btnTest: ButtonEx = null;

    start() {
        this.btnTest.addLongClick(() => {
            console.log(`longtouch Start`);
        }, () => {
            console.log(`longtouch End`);
        }, this);
    }

    // update (dt) {}
}
