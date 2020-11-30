/**
 * @export
 * @class ButtonEx
 * @extends {cc.Button}
 * 
 * @author MartinYing
 * @description 扩展button组件，添加一下4个功能
 *  1. 添加按钮音效，直接拖拽即可
 *  2. 添加图片模式下子节点跟随移动功能，移动距离用 childOffest 变量控制
 *  3. 添加按钮连续点击的屏蔽功能，屏蔽时长用  blockTime 变量控制
 *  4. 添加长按事件，长按事件使用 longPressTime 控制，需要先调用 addLongPressEvent 添加长按回调事件
 */

const { ccclass, property, inspector, executeInEditMode, menu, help } = cc._decorator;

@ccclass
@menu('i18n:MAIN_MENU.component.ui/ButtonEx')
@executeInEditMode
@help('i18n:COMPONENT.help_url.button')
@inspector('packages://button_ex/inspector.js')
export default class ButtonEx extends cc.Button {
    @property({
        type: cc.AudioClip,
        displayName: 'Audio',
        tooltip: CC_DEV && '按钮触发时播放的音效',
    })
    private audioClip: cc.AudioClip = null;

    /** 只在图片模式下生效 */
    @property({ tooltip: CC_DEV && '按下时子节点位移，只在图片模式下生效' })
    private childOffest: cc.Vec3 = cc.v3(0, -3);

    @property({ tooltip: CC_DEV && '屏蔽连续点击' })
    private blockContinuous = true;
    @property({ tooltip: CC_DEV && '屏蔽时间，单位:秒' })
    private blockTime = 1;

    @property({ tooltip: CC_DEV && '开启长按事件' })
    private openLongPress = false;
    @property({ tooltip: CC_DEV && '长按时间，单位:秒' })
    private longPressTime = 1;

    /** 是否被屏蔽联系点击;  false时可以正常点击 */
    private bBloclContinuous: boolean = false;
    /** 连续点击计时 */
    private blockTimer = null;
    /** 长按标记 */
    private longPressingFlag = false;
    /** 长按计时 */
    private longPressTimer = null;

    /** 
     * 这里注意注册和移除监听事件不要放到 onLoad 和 onDestory 里,
     * 会导致现已经不显示的按钮, 拦截触摸事件, 导致层级低的按钮, 交互出现异常
     */
    onEnable() {
        this.bBloclContinuous = false;

        if (this['_pressed']) {
            this.subOffset();
        }
        this['_pressed'] = false;

        super.onEnable();
    }

    onDisable() {
        if (this.blockTimer) {
            clearTimeout(this.blockTimer);
            this.blockTimer = null;
        }

        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        super.onDisable();
    }

    _onTouchBegan(event) {
        if (!this.interactable || !this.enabledInHierarchy) return;

        if (this.blockTimer) {
            console.log(`连续点击 ==>> 被屏蔽`);
            return;
        }
        // console.log(`正常点击`);

        /** 开启长按 */
        if (this.openLongPress && !this.longPressingFlag) {
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer)
                this.longPressTimer = null;
            };

            this.longPressTimer = setTimeout(() => {
                // 还在触摸中 触发事件
                if (this["_pressed"]) {
                    console.log(`触发长按开始`);
                    this.node.emit('LongPressStart', this);
                    this.longPressingFlag = true;
                }
            }, this.longPressTime * 1000);
        }

        /** 处理位移 */
        this.addOffset();

        this["_pressed"] = true;
        this["_updateState"]();
        event.stopPropagation();
    }

    /** 处理超出按钮区域时的情况 */
    // private onTouchMove(event) {
    //     if (!this.interactable || !this.enabledInHierarchy) { return; }
    //     this.btnRect = this.node.getBoundingBox();
    //     let pressed = true;
    //     const nodeVec = this.node.parent.convertToNodeSpaceAR(event.getLocation());
    //     if (!this.btnRect.contains(nodeVec)) {
    //         pressed = false;
    //     }
    //     if (this.btnPressed && !pressed) {
    //         this.subOffset();
    //     }
    //     if (!this.btnPressed && pressed) {
    //         this.addOffset();
    //     }
    //     this.btnPressed = pressed;
    // }

    _onTouchEnded(event) {
        if (!this.interactable || !this.enabledInHierarchy) { return; }

        if (this['_pressed']) {
            this.subOffset();

            if (this.longPressingFlag) {
                console.log(`触发长按结束`);
                this.node.emit('LongPressEnd', this);
                this.longPressingFlag = false;
                this.longPressTimer = null;
            } else if (!this.bBloclContinuous) {
                this.bBloclContinuous = this.blockContinuous ? true : false;
                cc.Component.EventHandler.emitEvents(this.clickEvents, event);
                this.node.emit('click', event);

                this.audioClip && AudioMgr.playEffect(this.audioClip, false);

                if (this.blockContinuous) {
                    this.blockTimer = setTimeout(() => {
                        this.bBloclContinuous = false;
                        this.blockTimer = null;
                    }, this.blockTime * 1000);
                }
            }
        }
        this['_pressed'] = false;
        this["_updateState"]();
    }

    _onTouchCancel() {
        if (!this.interactable || !this.enabledInHierarchy) { return; }
        /** 处理位移 */
        if (this['_pressed']) {
            this.subOffset();
        }

        if (this.blockTimer) {
            clearTimeout(this.blockTimer);
            this.blockTimer = null;
            this.bBloclContinuous = false;
        }

        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
            this.longPressingFlag = false;
        }

        this["_pressed"] = false;
        this["_updateState"]();
    }

    private addOffset() {
        if (this.transition !== cc.Button.Transition.SPRITE) {
            return;
        }
        if (this.childOffest.equals(cc.Vec3.ZERO)) {
            return;
        }
        for (const child of this.node.children) {
            child.position = child.position.add(this.childOffest);
        }
    }

    private subOffset() {
        if (this.transition !== cc.Button.Transition.SPRITE) {
            return;
        }
        if (this.childOffest.equals(cc.Vec3.ZERO)) {
            return;
        }
        for (const child of this.node.children) {
            child.position = child.position.sub(this.childOffest);
        }
    }

    /** 添加一个长按事件 */
    addLongPressEvent(startFunc: Function, endFunc: Function, target: Object) {
        this.node.off('LongPressStart');
        this.node.off('LongPressEnd');
        this.node.on('LongPressStart', startFunc, target);
        this.node.on('LongPressEnd', endFunc, target);
    }
}