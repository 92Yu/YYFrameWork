/**
 * HTTP基类
 * @author MartinYing
 */
let HttpBase = {
    /**
     * GET方式请求数据
     *
     * @param {string} url          服务器连接地址
     * @param {Function} callback   成功回调
     * @param {*} [data]            请求的数据，可选
     */
    Get(url: string, callback: Function, data?: any) {
        let xhr = cc.loader.getXMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4 && (xhr.status >= 200 && xhr.status < 300)) {
                let respone = xhr.responseText;
                let res = JSON.parse(respone);
                if (callback) {
                    callback(res);
                }
            }
        };
        //参数加入
        if (data) {
            url += "?";
            for (let key in data) {
                url += `${key}=${data[key]}&`;
            }
        }
        xhr.open("GET", url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Accept', '*');
        xhr.timeout = 5000;
        xhr.send();
    },
    
    /**
     * POST方式提交信息
     *
     * @param {string} url          服务器连接地址
     * @param {*} data              要上传的数据
     * @param {Function} cbSuccess  成功回调
     * @param {Function} [cbFail]   失败回调
     */
    Post(url: string, data: any, cbSuccess: Function, cbFail?: Function) {
        let xhr = cc.loader.getXMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && (xhr.status >= 200 && xhr.status < 300)) {
                let respone = xhr.responseText;
                if (cbSuccess) {
                    try {
                        let res = JSON.parse(respone);
                        cbSuccess(res);
                    } catch (e) {
                        console.error("返回的不是json", respone, e);
                    }
                }
            } else {
                if (cbFail) {
                    cbFail();
                } else {
                    //console.error("通讯失败", url, data);
                }
            }
        };
        xhr.open("POST", url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Accept', '*');
        xhr.timeout = 5000;
        xhr.ontimeout = function () {
            xhr.abort();
            console.error("请求超时了");
        };

        xhr.onerror = function () {
            console.log("状态错误:", xhr.status);
        }
        data = JSON.stringify(data);
        xhr.send(data);
    }
};
window["HttpBase"] = HttpBase;