// 代码编辑器窗口
// 编辑功能由 ace Editor 完成,地址: https://github.com/ajaxorg/ace
// 本插件的ace.js文件已做少量改动,升级替换可能会引起问题

const ace = Editor.require('packages://simple-code/ace/ace.js');
const settings_menu = Editor.require('packages://simple-code/ace/ext-settings_menu.js');
const prompt_ex = Editor.require('packages://simple-code/ace/ext-prompt.js');

const tools = Editor.require('packages://simple-code/tools/tools.js');
const fe = Editor.require('packages://simple-code/tools/FileTools.js');
const fs = require('fs');
const path = require("fire-path");
const exec = require('child_process').exec;
const md5 = require('md5');

const prsPath = Editor.Project && Editor.Project.path ? Editor.Project.path : Editor.remote.projectPath;
const MEMO_FILE_PATH = prsPath + path.sep + "temp" + path.sep + "备忘录.md";
const CMD_FILE_PATH = prsPath + path.sep + "temp" + path.sep + "commandLine.js";
const SCORES = { ".fire": 100, ".prefab": 90 };
// .d.ts 通用代码提示文件引入位置
const TS_API_LIB_PATHS = [Editor.url('packages://simple-code/template/api_doc'),prsPath];

let _scripts = [];
let is_hint = false;
let layer = {
	// 下拉框 过滤文件类型 
	SEARCH_BOX_IGNORE: {},//{".png":1,".jpg":1}
	// 忽略文件
	IGNORE_FILE: ["png", "jpg", "zip", "labelatlas", "ttf", "mp3", "mp4", "wav", "ogg", "rar", 'fire', 'prefab'],
	// 打开文件格式对应的类型
	FILE_OPEN_TYPES: { md: "markdown", js: "javascript", ts: "typescript", effect: "yaml", coffee: "coffeescript", lua: "lua", sql: "mysql", php: "php", xml: "xml", html: "html", css: "css", json: "json", manifest: "json", plist: "xml", gitignore: "gitignore", glsl: "glsl",text:"markdown",txt:"markdown",c:"c",cpp:"cpp",h:"cpp" },

	style:
		// ace.editorCss +
		fs.readFileSync(Editor.url("packages://simple-code/monaco-editor/dev/vs/editor/editor.main.css"), "utf-8") +
		`
		#gotoFileBtn{height: 15px;}
		#saveBtn {height: 15px;}
		#resetBtn {height: 15px;}
		#editorA {width: 0%;height: 0%;}
		#editorB {width: 100%;height: 100%;overflow:hidden;}
		#title {line-height: 15px;}
		#layoutTab {}
		
		.openTab {
			border-style: inset;
			padding: 0px 1px 0px 1px;
			border-width: 0px 1px 0px 0px;
			background-color : rgb(212, 212, 212);
			color:#1e1e1e;
			float:left;
			display:block;
		}

		.closeTab {
			border-style: outset;
			padding: 0px 3px 0px 3px;
			border-width: .0px 1px .0px 0px;
			text-align:center ;
			float:left;
			display:block;
		}

		.closeBtn {
			color:#FF0000;
			display:inline;
		}
		.title {
			display:inline;           
            word-break:keep-all;      /* 不换行 */
            white-space:nowrap;       /* 不换行 */
            overflow:hidden;          /* 内容超出宽度时隐藏超出部分的内容 */
            text-overflow:ellipsis;   /* 当对象内文本溢出时显示省略标记(...) ；需与overflow:hidden;一起使用。*/
		}
	`,

	template: `
			<div id="box">
				<div id="editorA"></div>
				<div id="layoutTab" class="layout horizontal justified">
					<div id="tabList" class="layout horizontal">
						<i class="icon-doc-text"></i> <span></span> <span></span>

						<div id="title0" class="closeTab">
							<div class="title"><nobr>无文件<nobr></div>
							<div class="closeBtn"><nobr> x <nobr></div>
						</div>

					</div>
					<div class="layout horizontal">
						<ui-checkbox id="lockChk">锁定编辑</ui-checkbox>
						<ui-checkbox id="cmdMode">命令模式</ui-checkbox>
						<ui-button id="gotoFileBtn" class="blue">定位</ui-button>
						<ui-button id="saveBtn" class="green">保存</ui-button>
						<ui-button id="resetBtn" class="red">重置</ui-button>
					</div>
				</div>
				<div id="editorB"></div>
			</div>
	`,

	$: {
		lockChk: '#lockChk',
		layoutTab: '#layoutTab',
		cmdMode: '#cmdMode',
		saveBtn: '#saveBtn',
		resetBtn: '#resetBtn',
		gotoFileBtn: '#gotoFileBtn',
		editorA: '#editorA',
		editorB: '#editorB',
		title0: '#title0',
		tabList: '#tabList',
		box: '#box',
	},

	initAce() {
		ace.config.set("basePath", Editor.url('packages://simple-code/ace/', 'utf8'));
		var editor = ace.edit(this.$editorA);
		editor.setOptions({
			// 默认:false
			wrap: true, // 换行
			autoScrollEditorIntoView: false, // 自动滚动编辑器视图
			enableLiveAutocompletion: true, // 智能补全
			enableSnippets: true, // 启用代码段
			enableBasicAutocompletion: false, // 启用基本完成 不推荐使用
		});

		// 设置主题
		editor.setTheme("ace/theme/monokai");
		// 设置编辑语言
		editor.getSession().setMode("ace/mode/javascript");
		// 设置快捷键模式
		editor.setKeyboardHandler('ace/keyboard/sublime');
		editor.setReadOnly(false);
		editor.getSession().setTabSize(4);
		editor.setShowPrintMargin(false);
		this.editor = editor;
		(this.$editorA).fontSize = '10px';
	},


	initVsCode(callback) {
		// Editor.require('packages://simple-code/tools/promise.prototype.finally').shim();
		Promise.prototype.finally = function (callback) {
			let P = this.constructor;
			return this.then(
				value => P.resolve(callback()).then(() => value),
				reason => P.resolve(callback()).then(() => { throw reason })
			);
		};

		const vsLoader = Editor.require('packages://simple-code/monaco-editor/dev/vs/loader.js');
		// vs代码路径
		vsLoader.require.config({ 'vs/nls': { availableLanguages: { '*': 'zh-cn' } }, paths: { 'vs': Editor.url('packages://simple-code/monaco-editor/dev/vs', 'utf8') } });
		// 创建vs编辑器
		
		vsLoader.require(['vs/editor/editor.main'], () => 
		{
			this.monaco = Editor.monaco = monaco;
			var editor = monaco.editor.create(this.$editorB, {
				value: ``,
				language: 'javascript',
				mouseWheelZoom: true,			 // 鼠标可以缩放字体大小
				quickSuggestions:true,			 // 使字符串有代码提示
				definitionLinkOpensInPeek:false, // ctrl+点击 跳转是否使用小窗口预览
			});

			window.vs_editor = Editor.monaco.vs_editor = this.vs_editor = editor;

			// monaco.languages.typescript.javascriptDefaults._compilerOptions.allowJs = false;
			// monaco.languages.typescript.javascriptDefaults._compilerOptions.target = monaco.languages.typescript.ScriptTarget.ES5;
			// monaco.languages.typescript.javascriptDefaults.setCompilerOptions(monaco.languages.typescript.javascriptDefaults._compilerOptions);

			monaco.languages.typescript.typescriptDefaults._compilerOptions.experimentalDecorators = true;
			monaco.languages.typescript.typescriptDefaults.setCompilerOptions(monaco.languages.typescript.typescriptDefaults._compilerOptions);
			monaco.editor.setTheme("vs-dark")

			
			callback();
		})
	},

	// 启动事件
	ready() {
		// 读取配置文件
		this.$title0.hidden = true;
		this.initAce();
		this.initVsCode(() => {
			this.initData();
			this.initBindEvent();
			this.initKeybodyCut();
			this.initCustomCompleter();
			this.runExtendFunc("onLoad", this);
			this.initSceneData();
			window._panel = this;
		});
	},

	// 设置vs选项
	setVsOption(cfg,is_init) {
		const map_key = { mode: "language", theme: "theme", fontSize: "fontSize", fixedWidthGutter: "minimap"}
		let vs_cfg = {}
		for (const key in cfg) {
			let v = cfg[key];
			vs_cfg[map_key[key]] = v;
		}
		if (vs_cfg["minimap"] != null) {
			vs_cfg["minimap"] = { enabled: vs_cfg["minimap"] }
		}

		this.vs_editor.updateOptions(vs_cfg);
		if (vs_cfg["language"]) {
			this.monaco.editor.setModelLanguage(this.vs_editor.getModel(), vs_cfg['language']);
		}

		// vim
		if(cfg.useTextareaForIME){
			this.initVimMode();
		}else if(cfg.useTextareaForIME != null){
			this.destoryVim();
		}
	},

	destoryVim(){
		if(!this.vim_mode) {
			return
		}
		this.vim_mode.dispose();
		this.vimStatusBar.remove()
		
		delete Editor.monaco.vim_mode;
		delete this.vimStatusBar;
		delete this.vim_mode;
	},

	// 加载vim
	initVimMode(){
		if(this.vim_mode){
			return;
		}
		const VsVim 	= Editor.require('packages://simple-code/monaco-editor/vim/lib/index.js');
		this.vimStatusBar = document.getElementById('vimStatusBar');
		if(this.vimStatusBar) this.vimStatusBar.remove()

		this.vimStatusBar = document.createElement('div')
		this.vimStatusBar.id = 'vimStatusBar'
		const parent 	= document.getElementsByClassName('group console flex-1  style-scope app-status-bar')[0] || document.getElementsByClassName('content')[0] || this.$box; // 确定插入位置
		parent != this.$box && parent.children[0] ?  parent.insertBefore(this.vimStatusBar,parent.children[0]) : parent.appendChild(this.vimStatusBar);


		const vim_mode = VsVim.initVimMode(this.vs_editor, this.vimStatusBar);
		this.VsVim   	= VsVim;
		window.vim_mode = Editor.monaco.vim_mode = this.vim_mode = vim_mode;
	},



	// 加载数据
	initData() {
		this.is_init_finish = false;
		// tab页面id
		this.edit_id = 0;
		// 编辑的js文件信息
		this.file_info = {};
		// 编辑tab列表
		this.edit_list = [];
		// vs的models
		this.vs_model_list = {};
		// 全局快捷键配置
		this.key_cfg = [];
		// 游戏资源路径缓存
		this.file_list_buffer = [];
		// 当前场景所有子节点信息缓存
		this.currSceneChildrenInfo = [];
		// 编辑代码提示 配置
		this._comp_cfg_map = {};
		this._comp_cfg = [{
			label: "forEach", //显示的名称，‘奖金’
			insertText: "forEach((v,k)=>{})", //插入的值，‘100’
			kind: 0, //提示的图标
			detail: "遍历" //描述，‘我的常量
		}];

		// 读取ace配置
		this.cfg = localStorage.getItem("simple-code-config");
		this.cfg = this.cfg ? JSON.parse(this.cfg) : {fontSize: 10,enabledVim:0}; //ace配置
		this.cfg.mode = null;
		this.custom_cfg = this.cfg.custom_cfg || {};//自定义配置
		this.custom_cfg.is_lock = false;
		this.custom_cfg.file_cfg_list = this.custom_cfg.file_cfg_list || {}
		this.file_cfg = this.custom_cfg.file_cfg_list[md5(prsPath)] = this.custom_cfg.file_cfg_list[md5(prsPath)] || { 'db://xx': { scroll_top: 0, is_show: 0 } };

		localStorage.setItem("newFileType", this.cfg.newFileType || "js");
		// 搜索历史
		this.search_history = localStorage.getItem("simple-code-search_history");
		this.search_history = this.search_history ? JSON.parse(this.search_history) : []

		// this.$lockChk.checked = this.custom_cfg.is_lock;
		this.$cmdMode.checked = this.custom_cfg.is_cmd_mode || false;
		this.editor.setOptions(this.cfg);
		this.editor.setOption("showGutter", true);
		this.setVsOption(this.cfg,true);

	},


	initSceneData() {
		if (!this.file_list_buffer || this.file_list_buffer.length == 0) {
			// 可以读取到文件缓存再初始化
			this.upFileListBuffer();
			return this.setTimeoutToJS(() => this.initSceneData(), 1.5, { count: 0 });
		}

		setTimeout(()=>
		{
			this.oepnDefindFile();
			this.upCurrSceneChildrenInfo();
	
			// 打开历史文件tab列表
			for (const key in this.file_cfg) {
				let info = this.file_cfg[key];
				if (key.indexOf("db://") != -1) {
					let uuid = Editor.remote.assetdb.urlToUuid(key);
					if (!uuid) continue;
					let temp = this.getFileUrlInfoByUuid(uuid);
					let file_info = this.openFile(temp, info.is_show);
					if (file_info) {
						file_info.is_lock = true
						this.setLockEdit(true);
					}
				}
			}
			this.is_init_finish = true;
			this.openActiveFile();
			this.runExtendFunc("initSceneData");
		},2);
	},

	onVsDidChangeContent(e,model) {
		let file_info ;
		if(model == this.file_info.vs_model ){
			file_info = this.file_info 
		}else{
			file_info = this.edit_list[this.getTabIdByModel(model)];
		}
		if (file_info && file_info.uuid) {
			file_info.new_data = this.vs_editor.getValue();
			file_info.is_need_save = file_info.data != file_info.new_data;//撤销到没修改的状态不需要保存了
			this.upTitle(file_info.id);

			if (this.file_info == file_info && file_info.uuid != "outside" && file_info.is_need_save) {
				//修改后 锁定编辑
				this.setLockEdit(true);
			}
		}
		(document.getElementById("tools") || this).transformTool = "move";//因为键盘事件吞噬不了,需要锁定场景操作为移动模式
	},

	// 綁定事件
	initBindEvent() {
		let stopCamds = { "scene:undo": 1, "scene:redo": 1, };

		// 编辑之后
		// this.vs_editor.getModel().onDidChangeContent((e)=> 
		// {  
		// });

		//获得焦点
		this.vs_editor.onDidFocusEditorText((e) => {
			// if (!this.isWindowMode){
			// creator上层按键事件无法吞噬掉, 只能把撤销重置命令截取了
			this._sendToPanel = this._sendToPanel || Editor.Ipc.sendToPanel;
			Editor.Ipc.sendToPanel = (n, r, ...i) => {
				if (!stopCamds[r]) {
					return this._sendToPanel(n, r, ...i);
				}
			}
			(document.getElementById("tools") || this).transformTool = "move";



			// 关闭cocosCreator 默认的tab键盘事件,不然会冲突
			require(Editor.appPath + "/editor-framework/lib/renderer/ui/utils/focus-mgr.js").disabled = true;
		});

		// 失去焦点
		this.vs_editor.onDidBlurEditorText((e) => {
			Editor.Ipc.sendToPanel = this._sendToPanel || Editor.Ipc.sendToPanel;
			require(Editor.appPath + "/editor-framework/lib/renderer/ui/utils/focus-mgr.js").disabled = false;
		});

		// 保存
		this.$saveBtn.addEventListener('confirm', () => {
			if (this.file_info) this.saveFile(true);
		});

		// 重置
		this.$resetBtn.addEventListener('confirm', () => {
			if (this.file_info) {
				let text = this.checkCurrFileChange(this.file_info);
				if (this.file_info.data != this.vs_editor.getValue()) {
					if (text) {
						this.vs_editor.setValue(text);
						this.file_info.is_need_save = false;
						this.file_info.data = text;
						this.upTitle();
					}
				}
				if (!text) {
					this.file_info.uuid = null; // 文件已被删除
					this.file_info.is_need_save = false;
					this.oepnDefindFile();
				}
			}
		});

		// 定位文件
		this.$gotoFileBtn.addEventListener('confirm', () => {
			if (this.file_info) {
				Editor.Ipc.sendToAll('assets:hint', this.file_info.uuid);
			}
		});

		// 锁定编辑
		this.$lockChk.addEventListener('change', () => {
			this.setLockEdit(this.$lockChk.checked ? true : false);
		});

		// 命令模式
		this.$cmdMode.addEventListener('change', () => {
			this.custom_cfg.is_cmd_mode = this.$cmdMode.checked ? true : false;
			this.setCmdMode(this.custom_cfg.is_cmd_mode);
		});

		// 设置面板改变的时候
		this.editor.on("setOption", (e) => {
			this.cfg[e.name] = e.value;
			this.setVsOption({ [e.name]: e.value })
			if (e.name == "newFileType") {
				localStorage.setItem("newFileType", e.value || "js");
			}
		});
		
		// 读取拖入的文件
		this.$editorB.ondragover = function(e){
			e.preventDefault();
		}
		this.$editorB.addEventListener('dragover',(e)=>{
			e.preventDefault();
			e.stopPropagation();
		},false)

		this.$editorB.addEventListener('drop',(e)=>{
			var fileObj = e.dataTransfer.files[0];
			if(this.openOutSideFile(fileObj.path,true))
			{
				e.preventDefault();
			}
		},false)

		// 转跳定义
		// this.monaco.languages.registerDefinitionProvider("javascript", {
		// 	provideDefinition:  (model, position, token)=> {
		// 		// 可以使用 ajax 去取数据，然后 return new Promise(function (resolve, reject) { ... })
		// 		return Promise.resolve([{
		// 			uri: this.monaco.Uri.parse('file://model/fn.js'),
		// 			range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5 },
		// 			targetSelectionRange: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
		// 			originSelectionRange: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
		// 		},{
		// 			uri: this.monaco.Uri.parse('file://model/eff.js'),
		// 			range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5 },
		// 			targetSelectionRange: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
		// 			originSelectionRange: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
		// 		}]);
		// 	}
		// })

		// 鼠标悬停提示
		// this.monaco.languages.registerHoverProvider("javascript", {
		// 	provideHover:  (model, position, token)=> {
		// 		return Promise.resolve([{
		// 			contents: [{ isTrusted: true, value: 'hello world' }],
		// 			range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 }
		// 		}]);
		// 	}
		// })

		// 跳转到实现
		// this.monaco.languages.registerImplementationProvider("javascript",{provideImplementation: function (model,position, token) {
		// 	return Promise.resolve([{
		// 		// contents: [ {isTrusted:true, value: 'hello world' } ],
		// 		range: { startLineNumber:1, startColumn:1, endLineNumber: 1, endColumn: 1 },
		// 		uri: monaco.Uri.parse('file://model/fn.js'),
		// 	}]);
		// }})

		// 编辑器内部链接操作
		// this.monaco.languages.registerLinkProvider("javascript",{provideLinks: function (model, token) {
		// 	return Promise.resolve([{
		// 		links: [{range:null,tooltip:"",url:""}],
		// 	}]);
		// }})

		// 关闭页面提示
		let _this = this
		window.addEventListener("beforeunload", function (e) {
			_this.onDestroy(e);
		}, false);

		// 检测窗口改变大小调整
		this.schFunc = this.setTimeoutToJS(() => {
			if (this.$editorB.scrollWidth != this.old_width || this.$editorB.scrollHeight != this.old_height) {
				this.old_width = this.$editorB.scrollWidth;
				this.old_height = this.$editorB.scrollHeight;
				this.vs_editor.layout();
			}
		}, 1);


	},



	// 快捷键/修复creator ctrl+x 不能使用问题
	initKeybodyCut() {
		let pressedKeys = {};
		let _this = this;
		let ret_type;

		let onApplyEvent = (e, type) => {
			let ret_type = true;
			let count = 0;
			let removeKey;
			for (let n in pressedKeys) count++;
			// let removeList = []	

			_this.key_cfg.forEach((cfg, i) => {
				if (type == cfg.touch_type && cfg.keys.length == count) {
					if (cfg.mode == 2 || _this.vs_editor.hasTextFocus() == cfg.mode) {
						let isHas = true;
						cfg.keys.forEach((key) => {
							if (!pressedKeys[key]) {
								isHas = false;
							}
						});

						if (isHas) {
							if (cfg.callback) {
								removeKey = e.key;
								// Array.prototype.push.apply(removeList,cfg.keys)
								ret_type = ret_type && cfg.callback(e);
							}
						}
					}
				}

			});

			// removeList.forEach((key)=> delete pressedKeys[key]);
			if (removeKey) delete pressedKeys[removeKey];

			return ret_type;
		}

		document.addEventListener("keydown", function (e) {
			// console.log("A",e.key,pressedKeys)
			pressedKeys[e.key] = (pressedKeys[e.key] || 0) + 1;
			ret_type = onApplyEvent(e, 'keydown');
			_this.runExtendFunc("onKeyDown", e);
			return ret_type;
		}, true);

		document.addEventListener("keypress", function (e) {
			ret_type = onApplyEvent(e, 'keypress');
			// _this.runExtendFunc("onKeypRess",e);
			delete pressedKeys[e.key];
			// console.log("B",e.key,pressedKeys)
			return ret_type;
		}, true);

		document.addEventListener("keyup", function (e) {
			// pressedKeys = {};
			pressedKeys = {};
			// console.log("C",e.key,pressedKeys)
			_this.runExtendFunc("onKeyUp", e);
		}, true);

		// 重置key
		document.addEventListener("focus", () => pressedKeys = {});
		
		// 阻挡冒泡creator的快捷键
		this.$box.addEventListener("keydown", function (e) {
			if (_this.vs_editor.hasTextFocus() && (e.key == "w" || e.key == "e" || e.key == "r" || e.key == "t")) e.preventDefault()
			// console.log("key_1")
		}, false);

		// 关闭页面
		this.addKeybodyEvent([[Editor.isWin32 ? "Ctrl" : "Meta", "w"]], (e) => {
			this.closeTab(this.edit_id);
			e.preventDefault();// 吞噬捕获事件
			return false;
		}, 1, "keydown");

		// this.addKeybodyEvent([["Meta","x"]],(e)=>{
		// 	document.execCommand('copy')
		// 	this.editor.onCut();
		// 	e.preventDefault();// 吞噬捕获事件
		// 	return false;
		// },1,"keydown");

		this.addKeybodyEvent([["Ctrl", "s"], ["Meta", "s"]], (e) => {
			this.saveFile(true);
			e.preventDefault();// 吞噬捕获事件
			return false;
		}, 1, "keydown");

		// tab 左移 ∆ == j
		this.addKeybodyEvent([["Meta", "Ctrl", "j"], [Editor.isWin32 ? "Ctrl" : "Meta", "Alt", "ArrowLeft"], ["Alt", "Shift", "Tab"]], (e) => {
			this.tabToLeft(true);
			e.preventDefault();// 吞噬捕获事件
			return false;
		}, 1, "keydown");

		// tab 右移 ¬ == l
		this.addKeybodyEvent([["Meta", "Ctrl", "l"], [Editor.isWin32 ? "Ctrl" : "Meta", "Alt", "ArrowRight"], ["Alt", "Tab"]], (e) => {
			this.tabToRight(true);
			e.preventDefault();// 吞噬捕获事件
			return false;
		}, 1, "keydown");
	},

	// 自定义代码輸入提示
	initCustomCompleter() {
		if (!this.file_list_buffer || this.file_list_buffer.length == 0) {
			// 可以读取到文件缓存再初始化
			return this.setTimeoutToJS(() => this.initCustomCompleter(), 1.5, { count: 0 });
		}

		// 定义的提示功能
		let _this = this;
		let obj   = 
		{provideCompletionItems: function (model, position ,context, token) {
			let suggestions = []
			let text = model.getLineContent(position.lineNumber);
			let is_has_string = text.indexOf('"') != -1 || text.indexOf("'") !=-1;
			
			for (let i = 0; i < _this._comp_cfg.length; i++) {
				const v = _this._comp_cfg[i];
				delete v.range;
				// 只在字符串中提示文件路径
				if(!is_has_string && v.kind == _this.monaco.languages.CompletionItemKind.Folder){
					continue;
				}
				suggestions.push(v)
			}
			return {suggestions};
		},
		// 光标选中当前自动补全item时触发动作，一般情况下无需处理
		// resolveCompletionItem(item, token) {
		// 	return null;
		// }
		}
		//Register the custom completion function into Monaco Editor    
		this.monaco.languages.registerCompletionItemProvider('javascript',obj );
		this.monaco.languages.registerCompletionItemProvider('typescript',obj );
		this.monaco.languages.registerCompletionItemProvider('plaintext',obj );
		
		// 一帧读一个项目代码文件，用于代码提示、函数转跳
		let _asynloadModel = (i,call) => 
		{
			if (!this || !this.file_list_buffer) return;
			let is_load = false;
			let load_count = 0;
			for (; i < this.file_list_buffer.length; i++) 
			{
				let file_info = this.file_list_buffer[i];
				if(file_info.extname == ".js" || file_info.extname == '.ts'){
					is_load = call(file_info) || is_load;
					load_count ++ ;
					if(load_count == 80) break;
				}else{
					call(file_info);
				}
			}
			
			if (is_load) setTimeout(() => _asynloadModel(i + 1,call), 1)
			else call();
		}

		// 异步读取文件
		_asynloadModel(0,(file_info)=> {
			if(file_info) return this.loadCompleterLib(file_info.meta, file_info.extname, true)
			else _asynloadModel(0,(file_info)=>{if(file_info) return this.loadGlobalFunctionCompleter(file_info.meta, file_info.extname, true)})
		});

		// 项目根目录的代码提示文件
		for (var n = 0; n < TS_API_LIB_PATHS.length; n++) 
		{
			let s_path = TS_API_LIB_PATHS[n];
			let list = fe.getFileList(s_path, []);
			for (let i = 0; i < list.length; i++)
			{
				let file_path = list[i];
				file_path = file_path.replace(/\\/g,'/')
				let extname = file_path.substr(file_path.lastIndexOf('.'));
				// creator.d.ts 文件
				if (extname == '.ts') {
					this.loadCompleterLib(file_path, extname, false);
				}
			}
		}
	},

	// 添加自定义代码输入提示, 例子: this.addCustomCompleters(["words","cc.Label"])
	addCustomCompleters(words) {
		words.forEach((v) => {
			this.addCustomCompleter(v);
		});
	},

	// 添加自定义代码提示,例子: this.addCustomCompleter("forEach","forEach((v,k)=>{})","遍历数组")
	addCustomCompleter(word, value, meta, kind, isCover = false) {
		if(word.length <2 || !isNaN(Number(word[0])) ) return;

		// 覆盖信息
		if (isCover && this._comp_cfg_map[word]) {
			let list = this._comp_cfg_map[word];
			list.label = word;
			list.insertText = (value || word);
			list.detail = meta;
			list.kind = kind != null ? kind : this.monaco.languages.CompletionItemKind.Text;
			return list;
		}else{
			if (!this._comp_cfg_map[word] || isCover) {
				this._comp_cfg_map[word] = {
					label: word,
					insertText: (value || word),
					kind: kind != null ? kind : this.monaco.languages.CompletionItemKind.Text,
					insertTextRules: this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
					detail: meta || ''
				};
				this._comp_cfg.push(this._comp_cfg_map[word]);
				return this._comp_cfg_map[word];
			}
		}
	},

	// 读取vs默认文件代码提示功能
	loadCompleterLib(file_path, extname, is_url_type){
		let isJs = extname == ".js";
		let isTs = extname == ".ts";
		let file_name = file_path.substr(file_path.lastIndexOf('/') + 1)
		if(isJs || isTs)
		{
			let fsPath = is_url_type ? Editor.remote.assetdb.urlToFspath(file_path) : file_path;
			let js_text = fs.readFileSync(fsPath).toString();
			let str_uri   = 'file://model/' + file_name;
			if (!fe.isFileExit(fsPath)) return;

			if (isJs || (!is_url_type && isTs) ) 
			{
				// 解析项目生成api提示字符串
				if (is_url_type) {
					js_text = tools.parseJavaScript(js_text, file_name.substr(0, file_name.lastIndexOf('.')));
				}
				if (js_text) {
					this.monaco.languages.typescript.javascriptDefaults.addExtraLib(js_text,'lib://model/' + file_name);
					this.loadVsModel(file_path,extname,is_url_type);
				}
			}

			if (isTs) {
				this.loadVsModel(file_path,extname,is_url_type);
			}else{
				// this.monaco.languages.typescript.typescriptDefaults.addExtraLib(js_text, 'lib://model/' + file_name);
			}
			// 插入模块名字提示
			let word = file_name.substr(0,file_name.lastIndexOf('.'))
			this.addCustomCompleter(word,word,file_name,this.monaco.languages.CompletionItemKind.Reference);
			return true
		}else if(is_url_type){
			// 插入模块文件名提示
			let word = file_path.substr(12,file_path.lastIndexOf('.')-12)
			this.addCustomCompleter(word,word,'',this.monaco.languages.CompletionItemKind.Folder);
		}
	},

	// 项目函数转为全局提示，用于模糊提示；
	loadGlobalFunctionCompleter(file_path,extname,is_url_type){
		let isJs = extname == ".js";
		let isTs = extname == ".ts";
		if(isJs || isTs)
		{
			let fsPath = is_url_type ? Editor.remote.assetdb.urlToFspath(file_path) : file_path;
			let file_name = file_path.substr(file_path.lastIndexOf('/') + 1)
			let model = this.monaco.editor.getModel('file://model/' + file_name);
			let js_text = ""
			if(model) js_text = model.getValue();
			else js_text = fs.readFileSync(fsPath).toString();
			
			// 解析出函数列表
			let name_list = tools.getScriptFuncEntrys(js_text);
			for (let i = 0; i < name_list.length; i++) {
				const word = name_list[i];
				if(word.length>2){
					this.addCustomCompleter(word,word,file_name+'内的函数',this.monaco.languages.CompletionItemKind.Function);
				}
			}
			return true;
		}
	},

	// *.d.ts文件里读取自定义代码輸入提示，提供精准代码提示;
	loadVsModel(file_path, extname, is_url_type,isReadText=true) {
		let file_type = this.FILE_OPEN_TYPES[extname.substr(1).toLowerCase()];
		if(file_type)
		{
			let isJs = extname == ".js";
			let isTs = extname == ".ts";
			let fsPath = is_url_type ? Editor.remote.assetdb.urlToFspath(file_path) : file_path;
			let js_text = isReadText ? fs.readFileSync(fsPath).toString() : "";
			let file_name = file_path.substr(file_path.lastIndexOf('/') + 1)
			let str_uri   = 'file://model/' + file_name;
			if (!fe.isFileExit(fsPath)) return;

			// 生成vs model缓存
			let model = this.vs_model_list[file_name] = this.vs_model_list[file_name] || this.monaco.editor.getModel(str_uri) ;
			if(!model){
				model = this.monaco.editor.createModel('',file_type,this.monaco.Uri.parse(str_uri))
				model.onDidChangeContent((e) => this.onVsDidChangeContent(e,model));
			}
			if(isReadText) model.setValue(js_text);
			return model
		}
		
	},

	setTheme(name) {
		let filePath = Editor.url("packages://simple-code/monaco-editor/custom_thems/") + name + ".json"
		if (fe.isFileExit(filePath)) {
			let data = fs.readFileSync(filePath).toString();
			this.monaco.editor.defineTheme(name, JSON.parse(data));
		}
		this.monaco.monaco.editor.setTheme(name);
	},


	// tab页左移
	tabToLeft() {
		let ls = this.getTabList();
		let id_ind = -1;

		for (var i = ls.length - 1; i >= 0; i--) {
			let obj = ls[i];
			if (obj._id == this.edit_id) {
				id_ind = i;
				id_ind--;
				if (id_ind < 0) id_ind = ls.length - 1
				let to_id = ls[id_ind]._id;
				this.setTabPage(to_id);
				break;
			}
		}
	},

	// tab页右移
	tabToRight() {
		let ls = this.getTabList();
		let id_ind = -1;

		for (var i = 0; i < ls.length; i++) {
			let obj = ls[i];
			if (obj._id == this.edit_id) {
				id_ind = i;
				id_ind++;
				if (id_ind == ls.length) id_ind = 0;
				let to_id = ls[id_ind]._id;
				this.setTabPage(to_id);
				break;
			}
		}
	},

	// 获得下拉条列表目数据
	getItem(value, meta, score, args) {
		let item_cfg = {
			value: value, // 命令
			meta: meta, // 描述
			score: score,//搜索优先级
			args: args, // 自定义数据
			matchMask: 0,
			exactMatch: 1,
		};
		return item_cfg;
	},

	// 锁定编辑
	setLockEdit(is_lock) {
		// 打开文件解除锁定编辑
		this.$lockChk.checked = is_lock;
		this.custom_cfg.is_lock = is_lock;
		if (this.file_info) this.file_info.is_lock = is_lock;
		this.vs_editor.updateOptions({ lineNumbers: this.custom_cfg.is_cmd_mode || this.edit_id != 0 ? "on" : 'off' });
		this.vs_editor.updateOptions({ lineNumbers: this.custom_cfg.is_cmd_mode || this.edit_id != 0 ? "on" : 'off' });

	},

	// 命令模式
	setCmdMode(isCmdMode) {
		this.custom_cfg.is_cmd_mode = isCmdMode ? true : false;
		// this.editor.setOption("showGutter",this.custom_cfg.is_cmd_mode || this.edit_id != 0);
		this.vs_editor.updateOptions({ lineNumbers: this.custom_cfg.is_cmd_mode || this.edit_id != 0 ? "on" : 'off' });
		if (this.edit_id == 0) {
			this.setLockEdit(false);
		}
		this.oepnDefindFile();
		// 获得选中的节点
		this.$cmdMode.checked = this.custom_cfg.is_cmd_mode;
		Editor.Scene.callSceneScript('simple-code', 'cc-engine-animatin-mode', this.custom_cfg.is_cmd_mode, (err, args) => { });
	},

	// 添加快捷键, 例子: this.addKeybodyEvent([ ["Ctrl","x"] ],()=>{})
	addKeybodyEvent(arrKeys, callback, isOnEditorRun, touchType = "keydown") {
		arrKeys.forEach((keys) => {
			keys.forEach((v, i) => {
				keys[i] = v == "Ctrl" ? "Control" : keys[i];
			})
			this.key_cfg.push({ keys, callback, mode: isOnEditorRun, touch_type: touchType });
		})
	},
	/* 
		打开下拉框, 例子: this.openSearchBox("",fileList,(data)=>{console.log(data.item)});
		onAccept:处理完成调
		onCompletionsFunc:修改搜索框时，通过该函数读取显示的实时显示的列表
	*/
	openSearchBox(msg = "", itemList, onAccept, onCompletionsFunc) {
		let _this = this
		// 打开个自定义 下拉 选项 
		this.editor.prompt(msg, {
			// 名字
			name: "searchFile",
			selection: [0, Number.MAX_VALUE],
			maxHistoryCount: 20,

			onAccept: function (data, label) {
				if (data.item && !onCompletionsFunc) this.addToHistory(data.item);
				onAccept(data, label);
			},

			addToHistory: function (item) {
				var history = this.history();
				history.unshift(item);
				delete item.message;
				for (var i = 1; i < history.length; i++) {
					if (history[i]["value"] == item.value) {
						history.splice(i, 1);
						break;
					}
				}
				if (this.maxHistoryCount > 0 && history.length > this.maxHistoryCount) {
					history.splice(history.length - 1, 1);
				}
				_this.search_history = history;
			},

			// 搜索文字蓝色高亮
			getPrefix: function (cmdLine) {
				var currentPos = cmdLine.getCursorPosition();
				var filterValue = cmdLine.getValue();
				return filterValue.substring(0, currentPos.column);
			},

			// 历史使用记录
			history: function () {
				let commands = JSON.parse(JSON.stringify(_this.search_history || []));
				for (let i = commands.length - 1; i >= 0; i--) {

					let isNot = true
					for (let n = 0; n < itemList.length; n++) {
						let now_item = itemList[n];
						if (commands[i].value == now_item.value) {
							isNot = false
							break;
						}
					}

					if (isNot) {
						commands = commands.slice(0, i);
					}
				}
				return commands
			},


			sortCompletions(completions, prefix) {
				if (prefix == "") return completions;
				prefix = prefix.toLowerCase();

				for (let i = 0; i < completions.length; i++) {
					let info = completions[i];
					let text = info.value.toLowerCase();
					let similar_count = 0;
					let start_pos = 999;
					let end_pos = 999;
					let break_tag = false;
					for (let n = 0; n < prefix.length; n++) {
						let char = prefix[n];
						let isFind = false;
						for (let n2 = n; n2 < text.length; n2++) {
							if (char == text[n2]) {
								if (start_pos == 999)
									start_pos = n2
								else if (!break_tag) end_pos = n2
								n = n2;
								similar_count++;
								isFind = true;
								break;
							} else {
								if (end_pos != 999) {
									break_tag = true;
								} else if (!break_tag) {
									start_pos = 999
								}
							}
						}

						if (!isFind) {
							break;
						}
					}
					if (end_pos == 999) start_pos = 999;
					let head_count = end_pos - start_pos;
					info.score = (SCORES[info.extname] || 70) + head_count * 10 + (start_pos != 999 ? start_pos * -10 : 0) + parseInt(similar_count / text.length * 30);
				}

				completions.sort((a, b) => b.score - a.score);
				return completions;
			},

			// 返回下拉列表命令
			getCompletions: onCompletionsFunc || function (cmdLine) {
				function getFilteredCompletions(commands, prefix) {
					var resultCommands = JSON.parse(JSON.stringify(commands));

					var filtered;
					ace.config.loadModule("ace/autocomplete", function (module) {
						filtered = new module.FilteredList(resultCommands);
					});
					return filtered.filterCompletions(resultCommands, prefix);
				}

				function getUniqueCommandList(commands, usedCommands) {
					if (!usedCommands || !usedCommands.length) {
						return commands;
					}
					var excludeCommands = [];
					usedCommands.forEach(function (item) {
						excludeCommands.push(item.value);
					});

					var resultCommands = [];

					commands.forEach(function (item) {
						if (excludeCommands.indexOf(item.value) === -1) {
							resultCommands.push(item);
						}
					});

					return resultCommands;
				}

				var prefix = this.getPrefix(cmdLine);

				var recentlyUsedCommands = getFilteredCompletions(this.history(), prefix);
				var otherCommands = getUniqueCommandList(itemList, recentlyUsedCommands);
				otherCommands = getFilteredCompletions(otherCommands, prefix);

				if (recentlyUsedCommands.length && otherCommands.length) {
					recentlyUsedCommands[0]["message"] = " Recently used";
					otherCommands[0]["message"] = " Other commands";
				}

				var completions = this.sortCompletions(recentlyUsedCommands.concat(otherCommands), prefix);
				return completions.length > 0 ? completions : [{
					value: "找不到命令...",
					error: 1
				}];
			}
		});
	},

	newFileInfo(extname, name, url, uuid) {
		let item_cfg = {
			extname: extname,//格式
			value: name == "" ? url : name,
			meta: url,
			score: 0,//搜索优先级
			// matchMask: i,
			// exactMatch: 0,
			uuid: uuid,
		};
		return item_cfg;
	},

	// 更新游戏项目文件列表缓存
	upFileListBuffer(isCoerce = false) {
		if (!isCoerce && this.file_list_buffer && this.file_list_buffer.length != 0) return;

		Editor.assetdb.deepQuery((err, results) => {
			let fileList = []; // 文件列表
			for (let i = 0; i < results.length; i++) {
				let result = results[i];
				if (result.extname != "" && this.SEARCH_BOX_IGNORE[result.extname] == null) {
					let url = Editor.remote.assetdb.uuidToUrl(result.uuid);//Editor.assetdb.uuidToUrl(result.uuid)
					if (url) {
						let name = url.substr(url.lastIndexOf('/') + 1);
						let item_cfg = this.newFileInfo(result.extname, name, url, result.uuid)
						fileList.push(item_cfg);
					}
				}
			}

			this.file_list_buffer = fileList;
			this.sortFileBuffer()
		});
	},

	// 排序:设置搜索优先级
	sortFileBuffer() {
		let getScore = (extname) => {
			return SCORES[extname] || (this.FILE_OPEN_TYPES[extname] && 80) || (this.SEARCH_BOX_IGNORE[extname] && 1) || 2;
		}
		this.file_list_buffer.sort((a, b) => getScore(b.extname) - getScore(a.extname));
	},


	// 保存修改
	saveFile(isMandatorySaving = false, id = -1) {
		id = id == -1 ? this.edit_id : id;
		let file_info = this.edit_list[id];
		if (file_info && file_info.uuid && (file_info.is_need_save || isMandatorySaving)) {
			let edit_text = id == this.edit_id ? this.vs_editor.getValue() : file_info.new_data;
			if (edit_text == null) {
				Editor.error("保存文件失败:", file_info)
				return;
			}

			if (file_info.uuid == "outside") {
				fs.writeFileSync(file_info.path , edit_text); //外部文件
			} else {
				Editor.assetdb.saveExists(file_info.path, edit_text, function (err, meta) {
					if (err) {
						fs.writeFileSync(Editor.remote.assetdb.urlToFspath(file_info.path), edit_text); //外部文件
						Editor.error("保存js失败:", err);
					}
				});
			}

			file_info.is_need_save = false;
			file_info.data = edit_text;
			file_info.new_data = edit_text;
			this.upTitle(id);
		}
	},

	// 读取文件到编辑器渲染
	readFile(info) {
		let is_lock = info.is_lock;
		this.file_info = info;
		this.edit_id = info.id;
		let text = info.new_data || info.data || "";

		// 初始化载入代码编辑
		this.vs_editor.setModel(info.vs_model);
		if (info.vs_model.getValue() != text) {
			this.vs_editor.setValue(text);
		}

		if (info.scroll_top) {
			this.vs_editor.setScrollTop(info.scroll_top)
		}
		this.monaco.editor.setModelLanguage(this.vs_editor.getModel(), this.FILE_OPEN_TYPES[info.file_type || ""] || "markdown");
		// this.editor.selection.clearSelection();

		this.setLockEdit(is_lock);
		this.upTitle();
	},

	// 设置文件标题
	upTitle(id) {
		id = id != null ? id : this.edit_id;
		if (id == null) return Editor.warn("没有标题id");
		let info = this.edit_list[id] || {};

		let tabBg = this.getTabDiv(id);
		if (tabBg) {
			let title = tabBg.getElementsByClassName("title")[0];
			title.textContent = (info.is_need_save ? info.name + "* " : info.name || "无文件");
		} else {
			Editor.warn(id)
		}
	},

	// 获得新页面可用的页码
	getNewPageInd(isIncludesInitPage = false, isIncludesInitNeedSave = true) {
		for (var i = isIncludesInitPage ? 0 : 1; i < 50; i++) {
			let tabBg = this.getTabDiv(i);
			if (!tabBg || !this.edit_list[i] || (!this.edit_list[i].is_need_save && isIncludesInitNeedSave)) {
				return i;
			}
		}
	},

	getTabDiv(id) {
		if (id == null) return;
		for (var i = 0; i < this.$tabList.children.length; i++) {
			let obj = this.$tabList.children[i]
			if (obj._id == id) {
				return obj;
			}
		}
	},

	getTabList() {
		let list = [];
		for (var i = 0; i < this.$tabList.children.length; i++) {
			let obj = this.$tabList.children[i]
			if (obj._id != null) {
				list.push(obj);
			}
		}
		return list;
	},

	// 获得页面id
	getTabIdByUuid(uuid) {
		for (var i = 0; i < this.edit_list.length; i++) {
			let v = this.edit_list[i];
			if (v && v.uuid == uuid) {
				return i;
			}
		}
	},

	// 获得页面id
	getTabIdByPath(url_path) {
		for (var i = 0; i < this.edit_list.length; i++) {
			let v = this.edit_list[i];
			if (v && v.path == url_path) {
				return i;
			}
		}
	},

	// 获得页面id
	getTabIdByModel(model) {
		for (var i = 0; i < this.edit_list.length; i++) {
			let v = this.edit_list[i];
			if (v && v.model == model) {
				return i;
			}
		}
	},

	// 设置编辑页面信息
	newPageInfo(id, uuid, path, name, file_type, data, is_not_draw = false, is_need_save = false, is_lock = false) {
		let file_info = this.edit_list[id] = this.edit_list[id] || {};
		// if (file_info && file_info.is_need_save)
		// {
		// 	if (id != 0){
		// 		// Editor.info("当前文件存文件有所改动,请保存或重置后再切换文件");
		// 		// return; 
		// 	}else{
		// 		this.saveFile(false,id);
		// 	}
		// }
		path = path.replace(/\\/g,'/');
		file_info.uuid = uuid;
		file_info.path = path;
		file_info.data = data;
		file_info.new_data = data;;
		file_info.name = name;
		file_info.file_type = file_type;
		file_info.is_need_save = is_need_save;
		file_info.is_lock = is_lock;
		file_info.enabled_close = true;
		file_info.scroll_top = this.file_cfg[path] && this.file_cfg[path].scroll_top;
		file_info.id = id;
		if (!file_info.vs_model) 
		{
			let vs_model = this.loadVsModel(path, this.getUriInfo(path).extname , uuid != "outside",false);
			if(!vs_model) {
				delete this.edit_list[id];
				Editor.warn("<代码编辑>读取文件失败:",path);
				return;
			};
			file_info.vs_model = vs_model; // vs tab标签数据
		}

		this.newTabDiv(id)
		this.upTitle(id)
		if (!is_not_draw) this.setTabPage(id, true);

		return file_info
	},

	// 新页面tab
	newTabDiv(id) {
		let tabBg = this.getTabDiv(id);
		if (tabBg) return tabBg;

		tabBg = this.$title0.cloneNode(true);
		tabBg.id = "title" + id;
		tabBg.hidden = false;
		this.$tabList.appendChild(tabBg);

		// 切换标题
		tabBg._id = id;
		tabBg.addEventListener('click', (e) => {
			this.setTabPage(tabBg._id);
			setTimeout(()=> this.vs_editor.focus(),1)
		})

		// 关闭页面
		tabBg.getElementsByClassName("closeBtn")[0].addEventListener('click', () => {
			this.closeTab(tabBg._id);
		});

		return tabBg;
	},


	// 关闭页面tab
	closeTab(id) {

		let tabBg = this.getTabDiv(id);
		let file_info = this.edit_list[id];
		if (tabBg == null || !file_info.enabled_close) return;//Editor.info("不存在页面:"+id);

		if (file_info.is_need_save && !confirm(file_info.path + " 文件被修改是否丢弃修改?")) return;

		// 记录本次打开位置
		let file_name = this.edit_list[id].path
		let file_log = this.file_cfg[file_name] = this.file_cfg[file_name] || {}
		file_log.scroll_top = this.edit_list[id].vs_model == this.vs_editor.getModel() ? this.vs_editor.getScrollTop() : this.edit_list[id].scroll_top;

		// 清除页面
		if(file_info.vs_model) {
			file_info.vs_model.setValue('')
			file_info.vs_model._commandManager.clear();// 清除撤销记录
		}
		delete this.edit_list[id];
		tabBg.parentNode.removeChild(tabBg);

		// 切换到最后存在的页面
		if (id == this.edit_id) {
			for (var i = id - 1; i >= 0; i--) {
				if (this.edit_list[i]) {
					this.setTabPage(i);
					break;
				}
			}
		}
	},

	// 关闭未修改的标签
	closeUnmodifiedTabs() {
		// 高亮选中
		let list = this.getTabList()
		for (let i = 0; i < list.length; i++) {
			let tabBg = list[i]
			let file_info = this.edit_list[tabBg._id];
			if (!file_info.is_need_save && file_info.enabled_close && !file_info.is_lock) this.closeTab(tabBg._id)
		}
	},

	// 切换编辑tab页面
	setTabPage(id, is_new_page = false) {
		if (!this.getTabDiv(id)) return;

		// 高亮选中
		let list = this.getTabList()
		for (var i = 0; i < list.length; i++) {
			let tabBg = list[i];
			tabBg.className = id == tabBg._id ? "openTab" : "closeTab";
		}

		if (this.edit_list[this.edit_id] && !is_new_page) {
			// 记录切换页面前编辑的数据
			this.edit_list[this.edit_id].new_data = this.vs_editor.getValue();
			this.edit_list[this.edit_id].scroll_top = this.vs_editor.getScrollTop()
		}

		this.upTitle(id)
		this.readFile(this.edit_list[id]);
		this.vs_editor.updateOptions({ lineNumbers: this.custom_cfg.is_cmd_mode || this.edit_id != 0 ? "on" : 'off' });
		return this.edit_list[id];
	},

	getFileUrlInfoByUuid(uuid) {
		let url = Editor.remote.assetdb.uuidToUrl(uuid);
		let fs_path = Editor.remote.assetdb.urlToFspath(url);
		if(url == null || fs_path == null) return;

		let name = url.substr(url.lastIndexOf('/') + 1);
		let file_type = name.substr(name.lastIndexOf('.') + 1)
		if (!fe.isFileExit(fs_path) || fs.statSync(fs_path).isDirectory() || this.IGNORE_FILE.indexOf(file_type) != -1) {
			return
		}

		let text = fs.readFileSync(fs_path).toString();
		return { data: text, uuid: uuid, path: url, name: name, file_type: file_type };
	},

	getFileUrlInfoByFsPath(fs_path) 
	{
		let uuid = Editor.remote.assetdb.fspathToUuid(fs_path) || "outside";
		let url = uuid == "outside" ? fs_path.replace(/\\/g,'/') : Editor.remote.assetdb.uuidToUrl(uuid);

		let name = url.substr(url.lastIndexOf('/') + 1);
		let file_type = name.substr(name.lastIndexOf('.') + 1)
		if (!fe.isFileExit(fs_path) || fs.statSync(fs_path).isDirectory() || this.IGNORE_FILE.indexOf(file_type) != -1) {
			return
		}

		let text = fs.readFileSync(fs_path).toString();
		return { data: text, uuid: uuid, path: url, name: name, file_type: file_type };
	},

	// 打开外部文件
	openOutSideFile(filePath, isShow = false) {
		return this.openFile(this.getFileUrlInfoByFsPath(filePath),isShow);
		// this.setLockEdit(is_lock);
	},

	// 打开文件到编辑器
	openFile(info, isShow) {
		if (info == null || !this.FILE_OPEN_TYPES[info.file_type]) {
			return false
		}

		// 初始化载入代码编辑
		let id = info.uuid == "outside" ? this.getTabIdByPath(info.path) : this.getTabIdByUuid(info.uuid);
		if (id == null) {
			let file_info = this.newPageInfo(this.getNewPageInd(false, false), info.uuid, info.path, info.name, info.file_type, info.data, this.file_info.is_lock && !isShow);
			return file_info;
		} else if (!this.file_info.is_lock || isShow) {
			return this.setTabPage(id)
		}
	},


	// 打开node上的文件到编辑器
	openActiveFile(isShow) {
		if(!isShow) this.closeUnmodifiedTabs();
		// 获得当前焦点uuid的信息
		Editor.Scene.callSceneScript('simple-code', 'get-active-uuid', "", (err, event) => {
			if (!event) {
				return
			};

			if(!isShow)
			{
				for (var i = event.uuids.length - 1; i >= 0; i--) {
					let uuid = event.uuids[i]
					if (err || event && this.getTabIdByUuid(uuid)) { // 已经打开同个文件
						event.uuids.splice(i, 1);
						continue;
					}
				}
			}

			let is_load = null;
			for (let i = 0; i < event.uuids.length; i++) {
				const uuid = event.uuids[i];
				const info = this.getFileUrlInfoByUuid(uuid);
				let file_info = this.openFile(info, isShow);
				if (file_info) {
					is_load = file_info;
				}
			}

			// 打开备忘录
			if (is_load == null && !isShow) {
				this.oepnDefindFile();
			}

		}, -1)
	},


	// 打开默认的备忘录、命令行文本
	oepnDefindFile() {

		// 没有备忘录就先复制一个
		let filePath = this.custom_cfg.is_cmd_mode ? CMD_FILE_PATH : MEMO_FILE_PATH;
		if (!fe.isFileExit(filePath)) {
			let template = this.custom_cfg.is_cmd_mode ? "packages://simple-code/template/commandLine.md" : "packages://simple-code/template/readme.md";
			fe.copyFile(Editor.url(template), filePath);
		}

		// 已经打开过了
		if (this.file_info.path == filePath) {
			return;
		}

		// 切换模式前先保存备忘录
		if(this.edit_list[0] && this.edit_list[0].path != filePath) {
			this.saveFile(false,0); 
		}

		let info = this.getFileUrlInfoByFsPath(filePath)
		if(!this.edit_list[0] || this.edit_list[0].name != info.name)
		{
			this.newPageInfo(0, 
				info.uuid,
				info.path,
				info.name,
				info.file_type, 
				info.data, 
				this.file_info.is_lock);

			// x不显示
			this.edit_list[0].enabled_close = false
			this.getTabDiv(0).getElementsByClassName("closeBtn")[0].hidden = true;
		}else{
			this.openOutSideFile(filePath, !this.file_info.is_lock);
		}

		// 清除撤销记录
		this.edit_list[0].vs_model._commandManager.clear();
	},

	checkCurrFileChange(editInfo) {
		// 正在编辑的文件被删
		if (editInfo && editInfo.uuid) {
			let file_path = editInfo.uuid == "outside" ? editInfo.path : unescape(Editor.url(editInfo.path));
			let text = ""
			try {
				text = fs.readFileSync(file_path).toString();
			} catch (e) {
				Editor.info("正在编辑的文件被删除:", file_path)
				return;
			}

			if (text != editInfo.data) {
				if (editInfo.data != editInfo.new_data) 
				{
					if (confirm(editInfo.name + " 文件在外边被修改是否刷新?")) 
					{
						editInfo.data = editInfo.new_data = text;
						editInfo.is_need_save = false;
						editInfo.vs_model.setValue(text); 
					}
					this.upTitle(editInfo.id);
				} else {
					// 编辑器内文件未修改
					editInfo.data = editInfo.new_data = text;
					if (this.edit_id == editInfo.id) {
						editInfo.vs_model.setValue(text); 
					}
				}
			} else {

				this.upTitle(editInfo.id);
			}
			return text;
		}
	},

	// 检查当前文件在外边是否被改变
	checkAllCurrFileChange() {

		// 编辑信息
		this.edit_list.forEach((editInfo) => {
			this.checkCurrFileChange(editInfo)
		})
	},

	// 刷新场景所有的子节点信息缓存
	upCurrSceneChildrenInfo() {
		// 从场景获得代码数据
		Editor.Scene.callSceneScript('simple-code', 'scene-children-info', "", (err, data) => {
			if (!data || data == "") return;

			this.currSceneChildrenInfo = JSON.parse(data);
			this.onCurrSceneChildrenInfo(this.currSceneChildrenInfo);
			this.runExtendFunc("onCurrSceneChildrenInfo", this.currSceneChildrenInfo);
		}, -1)
	},

	onCurrSceneChildrenInfo(currSceneChildrenInfo) { },


	// 调用原生JS的定时器
	setTimeoutToJS(func, time = 1, { count = -1, dt = time } = {}) {

		// 执行多少次
		if (count === 0) {
			let headler = setTimeout(func, time * 1000);
			return () => clearTimeout(headler);
		} else {

			// 小于0就永久执行
			if (count < 0) { count = -1; };//cc.macro.REPEAT_FOREVER

			let headler1, headler2;
			headler1 = setTimeout(() => {

				let i = 0;
				let funcGo = function () {
					i++;
					if (i === count) { clearInterval(headler2); }
					func();
				}

				// 小于0就永久执行
				if (count < 0) { funcGo = function () { func() } }

				headler2 = setInterval(funcGo, time * 1000);
				funcGo();

			}, dt * 1000);


			return () => {
				clearTimeout(headler1);
				clearInterval(headler2);
			}
		}
	},

	// 打开设置菜单
	openMenu() {
		// 打开配置面板
		if (!this.editor.showSettingsMenu) {
			Editor.require('packages://simple-code/ace/ext-settings_menu.js').init();
		}
		this.editor.showSettingsMenu(this.cfg);
	},

	// 页面关闭
	onDestroy() {
		if (this.schFunc) this.schFunc();

		// 保存编辑信息
		let temp_path_map = {}
		this.edit_list.forEach((editInfo, id) => {
			if (editInfo) {
				if (editInfo.uuid && editInfo.is_need_save) {
					let time = new Date().getTime();
					if (editInfo.uuid != "outside" && confirm("窗口即将关闭!" + editInfo.path + " 文件被修改是否保存?")) {
						this.saveFile();
					} else {
						let dff_time = (new Date().getTime()) - time;
						if (dff_time < 10) {
							this.saveFile();
						} else {
							Editor.log("丢弃修改:", editInfo.new_data);
						}
					}
				}
				
				temp_path_map[editInfo.path] = editInfo.is_lock;
				this.file_cfg[editInfo.path] = this.file_cfg[editInfo.path] = {}
				this.file_cfg[editInfo.path].is_open = editInfo.is_lock;
				this.file_cfg[editInfo.path].is_show = editInfo.vs_model == this.vs_editor.getModel() ? 1 : 0;
			}
		});

		for (let key in this.file_cfg) {
			if (!temp_path_map[key]) delete this.file_cfg[key];
		}

		this.edit_list.forEach((id) => {
			this.closeTab(id);
		});
		
		for (let i = 0; i < this.vs_model_list ? this.vs_model_list.length : 0; i++) {
			const model = this.vs_model_list[i];
			model.dispose();
		}


		//  写入配置
		// this.cfg = this.editor.getOptions();
		this.cfg.custom_cfg = this.custom_cfg;
		this.cfg.fontSize = this.vs_editor.getRawOptions().fontSize;
		delete this.cfg.language;
		localStorage.setItem("simple-code-config", JSON.stringify(this.cfg));
		localStorage.setItem("simple-code-search_history", JSON.stringify(this.search_history));

		this.destoryVim();
		this.runExtendFunc("onDestroy");
	},


	initExtend() {
		// 合并事件函数,分发
		let info = Editor.require("packages://simple-code/panel/event-merge").eventvMerge(this.messages, "panel_ex.js");
		_scripts = info.scripts;
		this.messages = info.messages;
	},

	runExtendFunc(funcName, ...args) {
		_scripts.forEach((obj) => {
			if (obj[funcName]) {
				obj[funcName](...args);
			}
		})
	},

	getUriInfo(url) {
		let s_i = url.lastIndexOf('/');
		let name = ""
		if (s_i != -1) name = url.substr(s_i + 1)

		s_i = name.lastIndexOf('.');
		let extname = ""
		if (s_i != -1) {
			extname = name.substr(s_i)
		}
		return { name, extname }
	},

	messages: {

		// 场景保存
		'scene:saved'(event) {
			if(!this.is_init_finish) return;
			this.saveFile();
			this.upCurrSceneChildrenInfo();
		},

		// 场景加载完
		'scene:ready'(event) {
			if(!this.is_init_finish) return;
			// this.upFileListBuffer();
			this.upCurrSceneChildrenInfo();
		},

		// 预制节点加载完
		'scene:enter-prefab-edit-mode'(event) {
			if(!this.is_init_finish) return;
			this.upCurrSceneChildrenInfo();
		},

		// 选择改变
		'selection:activated'(event) {
			if(!this.is_init_finish) return;
			this.openActiveFile();
		},

		// 项目资源文件uuid发生改变
		'asset-db:asset-uuid-changed'(event) {
		},

		// 项目资源文件发生改变
		'asset-db:asset-changed'(event, info) {
			if(!this.is_init_finish) return;

			this.checkAllCurrFileChange();
			let url = Editor.remote.assetdb.uuidToUrl(info.uuid);
			let edit_id = this.getTabIdByPath(url);
			if(edit_id == null || !this.edit_list[edit_id] || !this.edit_list[edit_id].is_need_save)
			{
				// 刷新文件/代码提示,只有未被编辑情况下才刷新
				let urlI = this.getUriInfo(url)
				this.loadCompleterLib(url, urlI.extname, true);
				this.loadGlobalFunctionCompleter(url, urlI.extname, true);
			}
			// this.openActiveFile();
		},

		// 项目资源创建
		'asset-db:assets-created'(event, info) {
			if(!this.is_init_finish) return;
			if (!info && this.file_list_buffer) return;

			info.forEach((v, i) => {
				let urlI = this.getUriInfo(v.url)
				if (urlI.extname != "" && this.SEARCH_BOX_IGNORE[urlI.extname] == null) 
				{
					let item = this.newFileInfo(urlI.extname, urlI.name, v.url, v.uuid)
					this.file_list_buffer.push(item)
					this.loadCompleterLib(item.meta, item.extname, true);
					this.loadGlobalFunctionCompleter(item.meta, item.extname, true);
				}
			})
		},

		// 项目文件被删除
		'asset-db:assets-deleted'(event, info) {
			if(!this.is_init_finish) return;
			if (!info && this.file_list_buffer) return;

			info.forEach((v) => {
				for (let i = 0; i < this.file_list_buffer.length; i++) {
					let item = this.file_list_buffer[i];
					if (item.uuid == v.uuid) {
						this.file_list_buffer.splice(i, 1)
						break;
					}
				}

				let is_remove = false
				// 编辑信息
				this.edit_list.forEach((editInfo) => {
					// 正在编辑的文件被删
					if (editInfo && v.uuid == editInfo.uuid) {
						editInfo.uuid = "outside";
						editInfo.path = unescape(Editor.url(editInfo.path));
						this.checkCurrFileChange(editInfo);
						is_remove = true
					}
				})

			})
		},

		// 项目文件被移动了
		'asset-db:assets-moved'(event, info) {
			if(!this.is_init_finish) return;
			if (!info) return;

			info.forEach((v, i) => {

				// vs编辑信息
				this.edit_list.forEach((editInfo,id) => 
				{
					if (editInfo && editInfo.uuid == v.uuid) {
						let urlI = this.getUriInfo(v.url)
						editInfo.path = v.url;
						editInfo.name = urlI.name;
						if(editInfo.vs_model)
						{
							// 刷新 model 信息，不然函数转跳不正确
							let model = this.loadVsModel(editInfo.path,this.getUriInfo(editInfo.path).extname,true)
							if(model)
							{
								let is_show = this.vs_editor.getModel() == editInfo.vs_model;
								model.setValue(editInfo.vs_model.getValue())
								editInfo.vs_model = model;
								if(is_show){
									this.setTabPage(id);
								}
							}
						}
						this.upTitle(editInfo.id)
					}
				})

				for (let i = 0; i < this.file_list_buffer.length; i++) {
					let item = this.file_list_buffer[i];
					if (item.uuid == v.uuid) {
						let urlI = this.getUriInfo(v.url)
						item.extname = urlI.extname
						item.value = urlI.name
						item.meta = v.url
						break;
					}
				}
			})
		},

		// vs功能:在文件夹打开文件
		'vs-reveal-in-finder'(event) 
		{
			if (this.file_info.uuid == null) return;
			let url =  (this.file_info.uuid == "outside" ? this.file_info.path.replace(new RegExp('/','g'),path.sep) : Editor.remote.assetdb.urlToFspath(this.file_info.path));
			exec(Editor.isWin32 ? 'Explorer /select,"'+url+'"' : "open -R " + url)
		},

		// vs功能:打开网页
		'vs-open-url'(event,url) 
		{
			let uri = this.monaco.Uri.parse(url)
			if (uri.scheme == "file"){
				url = "http://"+uri.path;
			}
			exec(Editor.isWin32 ? "cmd /c start "+url : "open "+url); 
		},

		// vs功能:焦点
		'vs-editor-focus'(event,url) 
		{
			this.vs_editor.focus();
		},

		// vs功能:打开文件、转跳到实现、定义
		'vs-open-file-tab'(event,info) 
		{
			let uuid;
			let url_info ;
			let file_name = info.uri.path ? info.uri.path.substr(1) : info.uri.substr(info.uri.lastIndexOf('/')+1);

			for (let i = 0; i < this.file_list_buffer.length; i++) 
			{
				const _file_info = this.file_list_buffer[i];
				if(_file_info.value == file_name){
					uuid  = _file_info.uuid;
					break;
				}
			}
			if(uuid){
				url_info = this.getFileUrlInfoByUuid(uuid) 
			}else{
				// 项目根目录的代码提示文件
				for (var n = 0; n < TS_API_LIB_PATHS.length; n++) 
				{
					let s_path = TS_API_LIB_PATHS[n];
					let fs_path = path.join(s_path,file_name);
					if(fe.isFileExit(fs_path)){
						url_info = this.getFileUrlInfoByFsPath(fs_path);
					}
				}
			}

			if(url_info){
				let file_info = this.openFile(url_info,true);
				if(file_info && info.selection && this.vs_editor.getModel() == file_info.vs_model) 
				{
					if(uuid == null){
						delete file_info.new_data;
						this.setTabPage(file_info.id);
					}
					//把选中的位置放到中间显示
					this.vs_editor.setSelection(info.selection)
					this.vs_editor.revealRangeInCenter(info.selection)
				};
			}
		},
		
		
		'run-command-code'(event, type) {
			if (this.file_info.uuid == null || !this.custom_cfg.is_cmd_mode) return Editor.log("只能在命令模式执行代码预览");

			let args;
			if (type == "cmd") {
				if (this.edit_id == 0 || this.file_info.uuid == "outside") {
					args = { type, data: this.vs_editor.getValue() };
				} else {
					args = { type, uuid: this.file_info.uuid, data: fs.readFileSync(CMD_FILE_PATH).toString() };// 运行节点的脚本
				}
			} else {
				args = { type: type, data: fs.readFileSync(CMD_FILE_PATH).toString() };
			}

			if (type != "cmd") {
				if (is_hint || confirm("模拟运行环境模式:即将切换到测试场景进行模拟运行,请确定当前场景已经保存.该功能于测试中,运行过程中报错可能会导致编辑器崩溃！是否执行?")) {
					is_hint = true;
					Editor.Scene.callSceneScript('simple-code', 'run-command-code', args);
				}
			} else {
				if (args.uuid) {
					if (this.file_info.is_need_save) return Editor.info("请保存修改后再执行命令");
					if (is_hint || confirm("1.该脚本将通过绑定的Node执行代码，执行后可能会删改场景内容，请注意保存场景！\n2.执行的入口函数为‘onLoad’、‘start’、’update‘。\n3.首次使用建议在命令行文件‘commandLine.js’里配置你的代码运行环境,每次执行代码文件前都会先执行命令文件里代码;\n4.请保存代码后再执行;\n是否执行?")) {
						is_hint = true;
						Editor.Scene.callSceneScript('simple-code', 'run-command-code', args);
					}
				} else {
					Editor.Scene.callSceneScript('simple-code', 'run-command-code', args);
				}
			}
		},

		// 快捷键打开当前选中文件/节点进入编辑
		'custom-cmd'(event, info) {
			if(!this.is_init_finish) return;

			if (info.cmd == "openFile") {
				this.openActiveFile(true);
			} else if (info.cmd == "setting") {
				this.openMenu();
			}
		}
	}
};

layer.initExtend();
Editor.Panel.extend(layer);