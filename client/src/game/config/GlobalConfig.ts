class GlobalConfig extends GameGlobalConfigDef {

    public static DecompressZip() {
		var t = egret.getTimer();
		let zip : JSZip = new JSZip(RES.getRes("config_pack"))
		let list = zip.file(/json/i);
		let jsonData = {}
		for (let i = 0, len = list.length; i < len; ++i) {
			let obj = JSON.parse(list[i].asText())
			for (let key in obj) {
				jsonData[key] = obj[key]
			}
		}
		GlobalConfig.setIns(jsonData);
		RES.destroyRes("config_pack");
		console.log("配置解析完成 耗时: " + (egret.getTimer() - t) + " ms");
    }

    private static _instance: any;

	public static ins(): GlobalConfig {
        return this._instance;
    }

    public static setIns  (value) {
        if (!GlobalConfig._instance) {
            this._instance = value;
        }
        else {
            throw new Error("配置文件应该只设置一次");
        }
    };
}