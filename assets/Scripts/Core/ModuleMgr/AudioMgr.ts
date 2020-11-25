/**
 * 音频控制类
 */
let AudioMgr = new class {

    private static _music: Map<cc.AudioClip, number> = new Map();

    private static _effect: Map<number, cc.AudioClip> = new Map();

    /** 主音量 */
    private static _masterVolume: number = 1.0;
    public static get masterVolume(): number { return this._masterVolume; }

    /** 音乐音量 */
    private static _musicVolume: number = 1.0;
    public static get musicVolume(): number { return this._musicVolume; }

    /** 音效音量 */
    private static _effectVolume: number = 1.0;
    public static get effectVolume(): number { return this._effectVolume; }

    /**
     * 设置主音量
     * @param value 音量值（0.0 ~ 1.0）
     */
    public static setMasterVolume(value: number): void {
        if (value < 0.0) value = 0.0;
        else if (value > 1.0) value = 1.0;

        this._masterVolume = value;
        this.setMusicVolume(this._musicVolume);
        this.setEffectVolume(this._effectVolume);
    }

    /**
     * 设置音量（音乐与音效）
     * @param value 音量值（0.0 ~ 1.0）
     */
    public static setVolume(value: number): void {
        this.setMusicVolume(value);
        this.setEffectVolume(value);
    }

    /**
     * 设置音乐音量
     * @param value 音量值（0.0 ~ 1.0）
     */
    public static setMusicVolume(value: number): void {
        if (value < 0.0) value = 0.0;
        else if (value > 1.0) value = 1.0;

        this._musicVolume = value;
        let realVolume = this._masterVolume * value;
        this._music.forEach((id, clip) => cc.audioEngine.setVolume(id, realVolume));
    }

    /**
     * 设置音效音量
     * @param value 音量值（0.0 ~ 1.0）
     */
    public static setEffectVolume(value: number): void {
        if (value < 0.0) value = 0.0;
        else if (value > 1.0) value = 1.0;

        this._effectVolume = value;
        let realVolume = this._masterVolume * value;
        this._effect.forEach((clip, id) => cc.audioEngine.setVolume(id, realVolume));
    }

    /**
     * 播放音乐
     *      默认循环播放
     * @static
     * @param {cc.AudioClip} clip 音频
     * @param {boolean} [bLoop=true]
     * @memberof AudioManager
     */
    public static playMusic(clip: cc.AudioClip, bLoop: boolean = true): void {
        if (this._music.has(clip)) this.stopMusic(clip);
        let id = cc.audioEngine.play(clip, bLoop, this._masterVolume * this._musicVolume);
        this._music.set(clip, id);
    }

    /**
     * 停止音乐
     * @param clip 音频
     */
    public static stopMusic(clip: cc.AudioClip): void {
        if (!this._music.has(clip)) return;
        cc.audioEngine.stop(this._music.get(clip));
        this._music.delete(clip);
    }

    /**
     * 停止所有音乐
     */
    public static stopAllMusic(): void {
        this._music.forEach((id, clip) => this.stopMusic(clip));
    }

    /**
     * 暂停音乐
     * @param clip 音频
     */
    public static pauseMusic(clip: cc.AudioClip): void {
        if (!this._music.has(clip)) return;
        cc.audioEngine.pause(this._music.get(clip));
    }

    /**
     * 暂停所有音乐
     */
    public static pauseAllMusic(): void {
        this._music.forEach((id, clip) => this.pauseMusic(clip));
    }

    /**
     * 恢复音乐
     * @param clip 音频
     */
    public static resumeMusic(clip: cc.AudioClip): void {
        if (!this._music.has(clip)) return;
        cc.audioEngine.resume(this._music.get(clip));
    }

    /**
     * 恢复所有音乐
     */
    public static resumeAllMusic(): void {
        this._music.forEach((id, clip) => this.resumeMusic(clip));
    }

    /**
     * 播放特效音频
     * @param clip 音频
     * @param bLoop 循环
     */
    public static playEffect(clip: cc.AudioClip, bLoop: boolean): void {
        let id = cc.audioEngine.play(clip, bLoop, this._masterVolume * this._effectVolume);
        this._effect.set(id, clip);
        if (!bLoop) cc.audioEngine.setFinishCallback(id, () => this._effect.delete(id));
    }

    /**
     * 停止特效音频
     * @param clip 音频
     */
    public static stopEffect(clip: cc.AudioClip): void {
        this._effect.forEach((_clip, id) => {
            if (_clip === clip) {
                cc.audioEngine.stop(id);
                this._effect.delete(id);
            }
        });
    }

    /**
     * 停止所有特效音频
     */
    public static stopAllEffect(): void {
        this._effect.forEach((clip, id) => {
            cc.audioEngine.stop(id);
            this._effect.delete(id);
        });
    }

    /**
     * 暂停特效音频
     * @param clip 音频
     */
    public static pauseEffect(clip: cc.AudioClip): void {
        this._effect.forEach((_clip, id) => _clip === clip && cc.audioEngine.pause(id));
    }

    /**
     * 暂停所有特效音频
     */
    public static pauseAllEffect(): void {
        this._effect.forEach((clip, id) => cc.audioEngine.pause(id));
    }

    /**
     * 恢复特效音频
     * @param clip 音频
     */
    public static resumeEffect(clip: cc.AudioClip): void {
        this._effect.forEach((_clip, id) => _clip === clip && cc.audioEngine.resume(id));
    }

    /**
     * 恢复所有特效音频
     */
    public static resumeAllEffect(): void {
        this._effect.forEach((clip, id) => cc.audioEngine.resume(id));
    }

    /**
     * 停止所有音频
     */
    public static stopAll(): void {
        this.stopAllMusic();
        this.stopAllEffect();
    }

    /**
     * 暂停所有音频
     */
    public static pauseAll(): void {
        this.pauseAllMusic();
        this.pauseAllEffect();
    }

    /**
     * 恢复所有音频
     */
    public static resumeAll(): void {
        this.resumeAllMusic();
        this.resumeAllEffect();
    }

    /**
     * 静音
     */
    public static mute(): void {
        this.setMasterVolume(0.0);
    }
}
window['AudioMgr'] = AudioMgr;