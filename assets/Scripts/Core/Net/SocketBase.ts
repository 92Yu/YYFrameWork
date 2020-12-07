/**
 * websocket基类
 *
 * @export
 * @class SocketBase
 * @implements {ISocket}
 * @author MartinYing
 */


export enum SocketState {
    CONNECTING = 1,
    OPEN,
    CLOSING,
    CLOSED
};

export interface ISocket {
    connect();
    send(data: string | ArrayBuffer);
    close();
    getState();
}

export interface ISocketDelegate {
    onSocketOpen();
    onSocketMessage(data: string | ArrayBuffer);
    onSocketError(errMsg);
    onSocketClosed(msg: string);
}

export class SocketBase implements ISocket {
    private _url: string;
    private _delegate: ISocketDelegate;
    private _webSocket: WebSocket;

    constructor(url: string, delegate: ISocketDelegate) {
        this._url = url;
        this._delegate = delegate;
    }

    connect() {
        let ws = this._webSocket = new WebSocket(this._url);
        ws.binaryType = 'arraybuffer';  // 默认为blob，这里按需处理
        ws.onopen = (event) => {
            this._delegate.onSocketOpen();
        };
        ws.onmessage = (event) => {
            this._delegate.onSocketMessage(event.data);
        };
        ws.onerror = (event) => {
            this._delegate.onSocketError(null);
        };
        ws.onclose = (event) => {
            this._delegate.onSocketClosed(event.reason);
        }
    }

    /**
     * 
     * @param data {string | ArrayBuffer}
     */
    send(data: string | ArrayBuffer) {
        this._webSocket.send(data);
    }

    close() {
        if (!this._webSocket) {
            return;
        }
        try {
            this._webSocket.close();
        } catch (err) {
            console.error('error while closing webSocket ', err.toString());
        }
        this._webSocket = null;
    }

    getState() {
        if (this._webSocket) {
            switch (this._webSocket.readyState) {
                case WebSocket.OPEN:
                    return SocketState.OPEN;
                case WebSocket.CONNECTING:
                    return SocketState.CONNECTING;
                case WebSocket.CLOSING:
                    return SocketState.CLOSING;
                case WebSocket.CLOSED:
                    return SocketState.CLOSED;
            }
        }
        return SocketState.CLOSED;
    }
};