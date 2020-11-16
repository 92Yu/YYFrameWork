let fs = require("fs");
let ProjectPath = Editor.Project.path.replace(/\\/g, "\/");
//名字生成函数
let change = function (sourcesPath, targetFile, findString) {
    let pattern = new RegExp(`${findString}[^;]*;`, "m");
    let files = fs.readdirSync(sourcesPath, "utf-8");
    files = files.filter((file) => {
        return !file.endsWith(".meta");
    });
    for (let i = 0; i < files.length; i++) {
        let one = files[i];
        let name = one.split(".")[0];
        if (i == files.length - 1) {
            findString += `\"${name}\"` + ";";
        } else {
            findString += `\"${name}\"` + " | ";
        }
        if ((i + 1) % 6 == 0) {
            findString += "\n\t";
        }
    }
    //替换
    let content = fs.readFileSync(targetFile, "utf-8");
    content = content.replace(pattern, findString);
    fs.writeFileSync(targetFile, content);
};

//DialogDataType 数据补充
let DialogDataTypeChange = function (targetFile, findString, DialogDataTypeString) {
    let content = fs.readFileSync(targetFile, "utf-8");
    let pattern = new RegExp(`${findString}([^;]*);`, "m");
    let matchArr = content.match(pattern)[1].split(" | ");//JSON.parse(a[0])
    let target = new RegExp(`${DialogDataTypeString}([^;]*);`, "m");
    let newString = DialogDataTypeString;
    for (let one of matchArr) {
        let key = JSON.parse(one);
        newString += `\n \t${key}: ${key + "Data"},`; 
    }
    newString += "\n};";
    content = content.replace(target, newString);
    fs.writeFileSync(targetFile, content);
}

module.exports = {
    load() {
        // 当 package 被正确加载的时候执行
    },

    unload() {
        // 当 package 被正确卸载的时候执行
    },

    messages: {
        creator() {
            //动态生成BgmName
            Editor.log("动态生成BgmName");
            let sourcesPath1 = ProjectPath + "/assets/resources/Audio/Bgm";
            let targetFile1 = ProjectPath + "/assets/script/GModule/GAudio.ts";
            let findString1 = "type BgmName = ";
            change(sourcesPath1, targetFile1, findString1);
            //动态生成EffectName
            Editor.log("动态生成EffectName");
            let sourcesPath2 = ProjectPath + "/assets/resources/Audio/Effect";
            let targetFile2 = ProjectPath + "/assets/script/GModule/GAudio.ts";
            let findString2 = "type EffectName = ";
            change(sourcesPath2, targetFile2, findString2);
            //动态生成DialogName
            Editor.log("动态生成DialogName");
            let sourcesPath3 = ProjectPath + "/assets/resources/Dialog";
            let targetFile3 = ProjectPath + "/assets/script/GModule/GDialog.ts";
            let findString3 = "type DialogName = ";
            change(sourcesPath3, targetFile3, findString3);
            //增加 DialogDataType 对应的数据类型
            let DialogDataTypeString = "type DialogDataType = {";
            DialogDataTypeChange(targetFile3, findString3, DialogDataTypeString);
            //动态生成PoolName
            Editor.log("动态生成PoolName");
            let sourcesPath4 = ProjectPath + "/assets/resources/Pool";
            let targetFile4 = ProjectPath + "/assets/script/GModule/GPool.ts";
            let findString4 = "type PoolName = ";
            change(sourcesPath4, targetFile4, findString4);
        }
    },
};