import { ISocket, ISocketDelegate, SocketBase, SocketState } from "./SocketBase";

/**
 * 实现socket各个回调接口
 * @author MartinYing
 * @description 内部的 TODO 按需处理相应的事件
 */
export class SocketDelegate implements ISocketDelegate {
    private _socket: ISocket;

    isSocketOpened() {
        return (this._socket && this._socket.getState() == SocketState.OPEN);
    }

    isSocketClosed() {
        return this._socket == null;
    }

    connect(url: string) {
        console.log('socket connect socket = ' + url);
        this._socket = new SocketBase(url, this);
        this._socket.connect();
    }

    closeConnect() {
        if (this._socket) {
            this._socket.close();
        }
    }

    onSocketOpen() {
        console.log('socket open');
        // TODO 按需处理相应的事件
    }

    onSocketError(errMsg) {
        errMsg && console.error('socket error, msg = ' + errMsg);
        // 具体网络错误或失败的原因很多种很复杂，这里只是简单处理为，失败了就继续connect
        // TODO 按需处理相应的事件
        this.connect('');
    }

    onSocketClosed(msg: string) {
        console.log('socket close, reason = ' + msg);
        if (this._socket) {
            this._socket.close();
        }
        this._socket = null;
        // TODO 按需处理相应的事件
    }

    onSocketMessage(data: string | ArrayBuffer) {
        if (this.isSocketClosed()) {
            console.error('onSocketMessage call but socket had closed')
            return;
        }
        let msg;
        if (typeof (data) === 'string') {
            msg = data;
        }

        // TODO 按需处理相应的事件
    }

    send(msg) {
        if (typeof (msg) === 'string') {
            this._socket.send(msg);
        }
    }
}