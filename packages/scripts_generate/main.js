// 通过解析场景和预制文件，自动给预制和场景生成同名组件脚本，脚本自动写入部分函数、属性、以及其他相关代码
// 脚本自动绑定到场景或预制上，属性界面的属性自动绑定对应节点，
// 某些节点，button组件自动添加，回调函数自动绑定等

// 符合以下命名规则的节点会被写入脚本作为属性
// $_type_name
// 以 % 开头的节点，type是要绑定的属性的类型，name表示节点的名字
// - 组件类型               对应字符以及缩写
// - Node               : Node/node
// - Label              : Label/label
// - Button             : Button/button/btn
// - Sprite             : Sprite/sprite/sp
// - ScrollView         : ScrollView/scrollview/sc
// - EditBox            : EditBox/editbox/eb
// - Toggle             : Toggle/toggle/tg
// - ToggleContainer    : ToggleContainer/togglecontainer/tgc
// - ProgressBar        : ProgressBar/progressbar/pb
// - Layout             : Layout/layout
// - Widget             : Widget/widget

// 1.如果已经有同名的脚本则不会生成，检查脚本里面的属性，补足新的属性，删除没有对应节点的属性
// 2.分别统计生成的脚本，修改的脚本，错误的命名节点， 在控制台输出相关属性
// 3.脚本类型名，数据类型名自动替换，包括setData里面的数据类型名 
// 4.同名属性检查，有同名属性会报错，并且不会生成或者修改ts脚本 
// 5.脚本自动添加到预制和场景，属性自动绑定，减少手动拖的步骤 
// 6.检查ts脚本的属性，节点树上没有对应名字的节点的话就删除这个属性声明

let fs = require('fs');

/**工程目录 */
let ProjectPath = Editor.Project.path.replace(/\\/g, '\/');

/**
 * 有效的查找的目标文件夹及其生成的ts脚本存放文件夹映射表，
 * 不在此表配置下的文件夹下面的预制和场景将不会生成对应脚本 
 */
let m_validTargetOut = {
    //弹窗预制文件夹
    [ProjectPath + '/assets/Resources/Popup']: ProjectPath + '/assets/Scripts/Popup',
    //场景文件夹
    [ProjectPath + '/assets/Scenes']: ProjectPath + '/assets/Scripts/Scenes',
};

//有效组件类型和对应的字符以及缩写
let m_validType = {
    Node: ['Node', 'node'],
    Sprite: ['Sprite', 'sprite', 'sp'],
    Label: ['Label', 'label'],
    Button: ['Button', 'button', 'btn', 'bt'],
    ScrollView: ['ScrollView', 'scrollView', 'sc'],
    EditBox: ['EditBox', 'editbox', 'eb'],
    Toggle: ['Toggle', 'toggle', 'tg'],
    ToggleContainer: ['ToggleContainer', 'togglecontainer', 'tgc'],
    ProgressBar: ['ProgressBar', 'progressbar', 'pb'],
    Layout: ['layout', 'Layout'],
    Widget: ['widget', 'Widget']
};

//所有ts脚本文件
let m_mapAllTsScripts = new Map();
//生成的脚本
let m_generateInfo = []; //{name: string, path: string}  脚本名字，路径
//修改的脚本
let m_modifyInfo = []; // {name: string, path: string, addProperty: string[]} 脚本名字，路径，添加的属性
//错误的节点或场景文件 出错的文件不会生成脚本，也不会修改已有的文件
let m_errorInfo = []; // {name: string, path: string, m_errorInfo: string} 脚本名字，路径，错误信息

/**
 * 获取按钮对应的回调函数名称
 *
 * @param {*} cData button 节点名称
 */
function getBtnHandlerName(cData) {
    let tmp = cData;
    let handlerName = 'onBtn' + tmp[0].toUpperCase() + tmp.slice(1, tmp.length) + 'Clicked';
    return handlerName;
}

/**
 * 插入函数
 *
 * @param {*} soure     目标字符串
 * @param {*} start     插入起始位置
 * @param {*} newStr    插入字符串
 * @returns
 */
function insertStr(soure, start, newStr) {
    return soure.slice(0, start) + newStr + soure.slice(start);
}

/**
 * 查找 指定目录 下面的所有js文件 
 *   相当于更新预制/场景配置
 *
 * @param {*} path          查找目录
 * @param {*} fileName      查找文件名
 * @param {*} prefabPath    预制/场景路径
 */
function scanJsScripts(path, fileName, prefabPath) {
    // Editor.warn(`func scanJsScripts ... `)
    // Editor.log(` path ... ${path}`)
    // Editor.log(` fileName ... ${fileName}`)
    // Editor.log(` prefabPath ... ${prefabPath}`)

    fs.stat(path, (err, stats) => {
        if (err) {
            Editor.error(err.message || err);
        } else {
            if (stats.isFile()) {//文件
                if (path.endsWith(".js")) {
                    //脚本属性绑定
                    //读文件查找脚本id
                    let contentTs = fs.readFileSync(path, "utf-8");
                    let result = contentTs.match(new RegExp(`cc\\._RF\\.push\\(module, \\'([^,]*)\\', \\'${fileName}\\'`));
                    //检查脚本，然后写入数据
                    let prefabContent = fs.readFileSync(prefabPath, "utf-8");
                    let prefabJson = JSON.parse(prefabContent);

                    //脚本属性绑定
                    if (prefabPath.endsWith(".prefab")) {//预制
                        //脚本还没绑定到预制上
                        if (prefabContent.indexOf(result[1]) == -1) {
                            prefabJson.push(prefabJson[prefabJson.length - 1]);
                            prefabJson[prefabJson.length - 2] = {
                                "__type__": result[1],
                                "_name": fileName + ".ts",
                                "_objFlags": 0,
                                "node": {
                                    "__id__": 1
                                },
                                "_enabled": true,
                                "_id": ""
                            };
                        }
                        //遍历json，绑定属性和节点信息
                        for (let i = 0; i < prefabJson.length; i++) {
                            let info = prefabJson[i];
                            if (info._name) {
                                //脚本还没绑定到预制上
                                if (prefabContent.indexOf(result[1]) == -1) {
                                    if (info._name == fileName) {
                                        info._components.push({
                                            "__id__": prefabJson.length - 2
                                        });
                                        info._prefab.__id__++;
                                    }
                                }
                                if (info._name.startsWith("$_") || info._name.startsWith("data")) {
                                    //判断是否为node类型
                                    let isNode = false;
                                    let para = info._name.split("_");
                                    let type = para[2];
                                    if (m_validType.Node.indexOf(type) > -1) {//有显示声明类型
                                        isNode = true;
                                    } else if (info._components.length == 0) {//隐式，但是没有组件
                                        isNode = true;
                                    }
                                    let index = i;
                                    if (!isNode) {
                                        //指定为第一个组件的id
                                        index = info._components[0].__id__;
                                    }
                                    prefabJson[prefabJson.length - 2][info._name] = {
                                        "__id__": index
                                    }
                                }
                            }

                        }
                    } else if (prefabPath.endsWith(".fire")) {//场景
                        //脚本还没绑定到场景上
                        if (prefabContent.indexOf(result[1]) == -1) {
                            prefabJson.push(
                                {
                                    "__type__": result[1],
                                    "_name": fileName + ".ts",
                                    "_objFlags": 0,
                                    "node": {
                                        "__id__": 2
                                    },
                                    "_enabled": true,
                                    "_id": ""
                                }
                            );
                            prefabJson[2]._components.push({ "__id__": prefabJson.length - 1 });
                        }
                        //遍历json，绑定属性和节点信息
                        for (let i = 0; i < prefabJson.length; i++) {
                            let info = prefabJson[i];
                            if (info._name) {
                                if (info._name.startsWith("$_")) {
                                    //判断是否为node类型
                                    let isNode = false;
                                    let para = info._name.split("_");
                                    if (m_validType.Node.indexOf(para[1]) != -1) {
                                        isNode = true;
                                    }
                                    let index = i;
                                    if (!isNode) {
                                        index = i + 1;
                                    }
                                    // 绑定
                                    if (m_validType.Button.indexOf(para[1]) != -1) {
                                        // button 需要找到 _components 第一个 __id__
                                        prefabJson[prefabJson.length - 1][info._name] = {
                                            "__id__": info._components[0].__id__
                                        }
                                    } else {
                                        prefabJson[prefabJson.length - 1][info._name] = {
                                            "__id__": index
                                        }
                                    }
                                }
                            }
                        }
                    }
                    //（stringify 第三个参数用于表示格式化换行时空几格）
                    fs.writeFileSync(prefabPath, JSON.stringify(prefabJson, null, 2));

                    //绑定btn组件事件
                    for (let i = prefabJson.length - 1; i >= 0; i--) {
                        let one = prefabJson[i];
                        let _name = one._name;
                        if (_name) {
                            let para = _name.split("_");
                            if (m_validType.Button.indexOf(para[1]) != -1) {
                                // 此时 one 对应的是名为 $_btn_xxx 的 node，并非 button
                                let btnId = one._components[0].__id__;
                                let clickEventCount = prefabJson[btnId].clickEvents.length;
                                let handlerName = getBtnHandlerName(para[2]);
                                // Editor.log(`btnId = ${btnId}`)
                                // Editor.log(`clickEventCount = ${clickEventCount}`)

                                // 判断是否已相同的点击回调事件
                                if (clickEventCount) {
                                    let hasSameEvent = false;
                                    for (let kk = 0; kk < clickEventCount; kk++) {
                                        let oldEvent = prefabJson[btnId + kk + 1];
                                        if (oldEvent._componentId == result[1] && oldEvent.handler == handlerName) {
                                            hasSameEvent = true;
                                            break;
                                        }
                                    }
                                    if (hasSameEvent) {
                                        Editor.log(`${_name} 已有相同的点击回调事件，不再重复添加`)
                                        continue;
                                    }
                                }

                                // 下面会给btn增加一个点击事件，故，预先修改涉及到的id
                                for (let single of prefabJson) {
                                    for (let key of Object.keys(single)) {
                                        let value = single[key];
                                        if (value) {
                                            if (Array.isArray(value)) {
                                                for (let id of value) {
                                                    if (typeof id == "object") {
                                                        if (typeof id.__id__ != "undefined" && id.__id__ > btnId) {

                                                            // Editor.log(`value is array`);
                                                            // Editor.log(`single : ${single}`);
                                                            // Editor.log(single)
                                                            // Editor.log(`key : ${key}`);
                                                            // Editor.log(key)
                                                            // Editor.log(`value : ${value}`);
                                                            // Editor.log(value)
                                                            // Editor.log(`id : ${id}`);
                                                            // Editor.log(id)
                                                            // Editor.log(`id.__id__ : ${id.__id__}`);

                                                            id.__id__ += 1;
                                                        }
                                                    }
                                                }
                                            } else if (typeof value == "object") {
                                                if (typeof value.__id__ != "undefined" && value.__id__ > btnId) {
                                                    // Editor.log(`value is object`);
                                                    // Editor.log(`single : ${single}`);
                                                    // Editor.log(`key : ${key}`);
                                                    // Editor.log(`value : ${value}`);
                                                    // Editor.log(`id : ${id}`);
                                                    // Editor.log(`id.__id__ : ${id.__id__}`);

                                                    value.__id__ += 1;
                                                }
                                            }
                                        }
                                    }
                                }

                                // 获取btn所在的json及其之前的内容
                                let btnAndBeforeJson = [...prefabJson.slice(0, btnId + 1 + clickEventCount)];
                                // Editor.error(btnAndBeforeJson);
                                // Editor.error('--------');

                                // 添加对应的 clickEvent 
                                Editor.error(btnAndBeforeJson[btnAndBeforeJson.length - 1 - clickEventCount].clickEvents);
                                btnAndBeforeJson[btnAndBeforeJson.length - 1 - clickEventCount].clickEvents.push({ "__id__": btnId + 1 + clickEventCount });
                                Editor.log(`===========`)
                                Editor.error(btnAndBeforeJson[btnAndBeforeJson.length - 1 - clickEventCount].clickEvents);

                                // Editor.error('111111');
                                let nodeIndex = 0;
                                if (prefabPath.endsWith(".prefab")) {//预制
                                    nodeIndex = 1;
                                } else if (prefabPath.endsWith(".fire")) {//场景
                                    nodeIndex = 2;
                                }

                                // Editor.error('2222222');
                                // 绑定点击事件  默认不传递自定义参数 命名为 onBtnXxxxClicked
                                btnAndBeforeJson.push({
                                    "__type__": "cc.ClickEvent",
                                    "target": {
                                        "__id__": nodeIndex
                                    },
                                    "component": "",
                                    "_componentId": result[1],
                                    "handler": handlerName,
                                    "customEventData": ""
                                });

                                // Editor.error('3333333');
                                // Editor.error(btnAndBeforeJson)

                                // 处理 prefabJson 内部的id变化
                                let afterJson = [...prefabJson.slice(btnId + 1 + clickEventCount)];
                                // Editor.error('444444444')
                                // Editor.error(afterJson)

                                prefabJson = btnAndBeforeJson.concat(afterJson);
                                // Editor.error(prefabJson)
                                //写入原来的文件
                                fs.writeFileSync(prefabPath, JSON.stringify(prefabJson, null, 2));
                            }
                        }
                    }
                }
            } else {//文件夹
                fs.readdir(path, (err, content) => {
                    if (err) {
                        Editor.error(err.message || err);
                    } else {
                        for (let one of content) {
                            scanJsScripts(`${path}/${one}`, fileName, prefabPath);
                        }
                    }
                });
            }
        }
    })
}

/**
 * 处理ts脚本
 *
 * @param {*} json      预制或场景的json信息
 * @param {*} tsContent 要处理的ts代码内容(新建脚本时使用)
 * @param {*} isNewTs   是否是新的ts脚本
 * @param {*} prefabPath      预制/场景文件的路径
 * @param {*} fileName  ts文件名字
 * @param {*} out       脚本存放位置
 */
function handleTs(json, tsContent, isNewTs, prefabPath, fileName, out) {
    // Editor.warn(`func handleTs ... `);
    // Editor.log(` json ... ${json}`);
    // Editor.log(` tsContent ... ${tsContent}`);
    // Editor.log(` isNewTs ... ${isNewTs}`);
    // Editor.log(` prefabPath ... ${prefabPath}`);
    // Editor.log(` fileName ... ${fileName}`);
    // Editor.log(` out ... ${out}`);
    //生成的脚本信息
    let _generateInfo = null;
    //修改脚本信息
    let _modifyInfo = { name: fileName, path: prefabPath, addProperty: [] };
    //错误信息
    let _errorInfo = null;
    //节点名有效性判断
    let _bValidType = true;
    //记录已经声明的属性，防止声明多个同类型且同名属性
    let _alreadyPro = [];

    let arr = tsContent.match(/@property[^;]*;/mg);
    if (arr) {
        for (let one of arr) {
            let propertyName = one.match(/\$_[^:]*/);
            let hasProperty = false;
            for (let o of json) {
                if (o._name == propertyName) {
                    hasProperty = true;
                    break;
                }
            }
            if (!hasProperty) {
                tsContent = tsContent.replace("\n\t" + one, "");
            }
        }
    }
    for (let i = json.length - 1; i >= 0; i--) {
        let one = json[i];
        let _name = one._name;
        if (_name) {
            /**
             * 参数分析
             *  0 : $ 表示属性 
             *  1 : 属性类型，节点或者组件，默认为第一个组件
             *  2 : 名称
             */
            let para = _name.split("_");
            //1.属性，属性写入脚本，并自动绑定界面对应元素
            if (para[0] == "$") {
                //同类型同名属性处理
                if (_alreadyPro.indexOf(_name) != -1) {
                    _bValidType = false;
                    _errorInfo = { name: fileName, path: prefabPath, m_errorInfo: `有多个同名的属性，属性名：${_name}` };
                    m_errorInfo.push(_errorInfo);
                    break;
                }
                _alreadyPro.push(_name);

                //必须显式的声明类型
                if (para[1]) {
                    let canFind = false;
                    for (let key of Object.keys(m_validType)) {
                        let value = m_validType[key];
                        if (value.indexOf(para[1]) != -1) {
                            canFind = true;
                            if (tsContent.indexOf(_name) == -1) {
                                let matchArr = tsContent.match(/extends[^{]*/);
                                let pos = matchArr[0].length + matchArr.index + 1;
                                let property = `\n\t@property(cc.${key}) private ${_name}: cc.${key} = null;`;
                                tsContent = insertStr(tsContent, pos, property);

                                // 按钮需要自动创建回调函数
                                if (key == 'Button') {
                                    let handlerName = getBtnHandlerName(para[2]);
                                    if (tsContent.indexOf(handlerName) == -1) {
                                        let id = tsContent.lastIndexOf("}");
                                        let cbFunc = `\n\tprivate ${handlerName}() {\n\n\t}\n`;
                                        tsContent = insertStr(tsContent, id - 1, cbFunc);
                                    }
                                }

                                // 非新建脚本，记录属性，统一处理
                                if (!isNewTs) {
                                    _modifyInfo.addProperty.push(_name);
                                }
                            }
                            break;
                        }
                    }
                    if (!canFind) {
                        _bValidType = false;
                        _errorInfo = { name: fileName, path: prefabPath, m_errorInfo: `类型错误 ：${_name}` };
                        m_errorInfo.push(_errorInfo);
                        break;
                    }
                }
            }
        }
    }
    if (_bValidType) {
        // 写入脚本文件
        if (!fs.existsSync(out)) {
            fs.mkdirSync(out);
        }
        fs.writeFileSync(`${out}/${fileName}.ts`, tsContent);

        if (isNewTs) {
            _generateInfo = { name: fileName, path: out };
            m_generateInfo.push(_generateInfo);
        } else {
            if (_modifyInfo.addProperty.length > 0) {
                m_modifyInfo.push(_modifyInfo);
            }
        }
    }

    //更新import文件夹下面的js文件
    // Editor.log(`handleTs 1111`)
    Editor.assetdb.refresh('db://assets', function (err, results) {
        // Editor.log(`handleTs 2222`)
        scanJsScripts(ProjectPath + "/library/imports", fileName, prefabPath);
    });
}

/**
 * 根据预制或者场景文件生成对应的ts脚本
 *  已经有脚本，只检查修改，否则新建脚本
 *
 * @param {*} path      要生成的脚本的prefab/scene位置
 * @param {*} fileName  要生成的脚本名称
 * @param {*} outPath   要生成的脚本位置
 */
function generateTsScript(filePath, fileName, outPath) {
    // Editor.warn(`func generateTsScript ... `);
    // Editor.log(` path: ${filePath}`);
    // Editor.log(` fileName: ${fileName}`);
    // Editor.log(` outPath: ${outPath}`);
    let json = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    // 同步加载ts模板脚本文件
    let templateTs = fs.readFileSync(`${ProjectPath}/packages/scripts_generate/lib/template.ts`, "utf-8");
    templateTs = templateTs.replace(/template/g, fileName);

    // Editor.warn(`m_mapAllTsScripts:`);
    // Editor.warn(m_mapAllTsScripts);
    // 处理对应脚本
    let tsPath = m_mapAllTsScripts.get(fileName);
    // Editor.error(tsPath);
    handleTs(json, templateTs, (tsPath ? false : true), filePath, fileName, outPath);
}

/**
 * 遍历要查找的路径，找出当前路径下全部.prefab预制和.fire场景资源
 *
 * @param {*} path      要查找的路径
 * @param {*} outPath   路径下每个prefab或者scene对应的脚本输出目录
 */
function loadAllPrefabScene(path, outPath) {
    // Editor.warn(`func loadAllPrefabScene ... `);
    let tmp = fs.statSync(path);
    if (tmp.isFile()) {
        if (path.endsWith(".prefab") || path.endsWith(".fire")) {
            let arrPath = path.split("/");
            let fileName = arrPath[arrPath.length - 1].split(".")[0];

            generateTsScript(path, fileName, outPath);
        }
    } else {
        let pathArr = fs.readdirSync(path);
        for (let one of pathArr) {
            loadAllPrefabScene(`${path}/${one}`, out);
        }
    }
}

/**
 * 遍历assets目录下所有的ts文件
 *
 * @param {string} [path=ProjectPath + '/assets']
 */
function loadAllScripts(path = ProjectPath + '/assets') {
    // Editor.warn(`func loadAllScripts ... `);
    // Editor.log(`path : ${path}`)
    let tmp = fs.statSync(path);
    if (tmp.isFile()) {
        //只保存ts文件
        if (path.endsWith(".ts")) {
            m_mapAllTsScripts.set(path.match(/[^/]*.ts$/)[0].slice(0, -3), path);
        }
    } else {
        let pathArr = fs.readdirSync(path);
        for (let one of pathArr) {
            loadAllScripts(`${path}/${one}`);
        }
    }
}

module.exports = {
    messages: {
        buildCur() {
            Editor.log(`buildCur`);
            // 获取当前assets面板中选中资源的uuid
            let arrSelectAssets = Editor.Selection.curSelection('asset')[0];
            // 转换uuid到实际路径
            let selectPath = Editor.assetdb.uuidToFspath(arrSelectAssets).replace(/\\/g, '\/');
            let bValid = false;
            let generateScriptPath = '';
            for (let key of Object.keys(m_validTargetOut)) {
                let value = m_validTargetOut[key];
                if (selectPath.startsWith(key)) {
                    bValid = true;
                    generateScriptPath = value;
                    break;
                }
            }
            if (bValid) {
                Editor.log('code generate begin ... ');

                errorLogs = [];
                generateLogs = [];
                modifyLogs = [];

                // 加载所有的ts脚本
                loadAllScripts();

                // 加载设定好的路径里面的所有预制和场景文件
                loadAllPrefabScene(selectPath, generateScriptPath);

                if (errorLogs.length > 0) {
                    Editor.error('error :', errorLogs);
                }
                if (generateLogs.length > 0) {
                    Editor.log('generate scripts :', generateLogs);
                }
                if (modifyLogs.length > 0) {
                    Editor.warn('update scripts :', modifyLogs);
                }

                // 更新 assets 数据
                Editor.warn('update assets data ... ');
                Editor.assetdb.refresh('db://assets', function (err, results) {
                    Editor.warn('code generate end ... ');
                });

            } else {
                Editor.warn(`uuid: ${arrSelectAssets}`);
                Editor.warn(`fiel path: ${selectPath}`);
                Editor.error('cur select file is invalid');
            }
        }
    },
};