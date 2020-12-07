import ButtonEx from "../scripts/compEx/ButtonEx";

const { ccclass, property } = cc._decorator;

@ccclass
export default class TestScene extends cc.Component {

    @property(ButtonEx) private btnTest: ButtonEx = null;

    start() {
        this.btnTest.addLongPressEvent(() => {
            console.log(`longtouch Start`);
        }, () => {
            console.log(`longtouch End`);
        }, this);

        let map: { [key: string]: number } = cc.js.createMap(true);
        map['str'] = 1;
        map['str2'] = 2;
        map['str3'] = 3;
        console.log(map)
        for (const key in map) {
            if (Object.prototype.hasOwnProperty.call(map, key)) {
                const element = map[key];
                console.log(`${key}`);
                console.log(`${map[key]}`);
                delete map[key];
                console.log(map);
            }
        }
    }

    // update (dt) {}
}
