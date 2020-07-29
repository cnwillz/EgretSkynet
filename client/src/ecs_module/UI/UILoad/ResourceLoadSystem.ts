class ResourceLoadSystem extends System implements RES.PromiseTaskReporter {
	
	public execute()
	{
		console.log("UIloadSystem executed.")
		let en = World.shareInstance.createEntity(ResourceLoadEntity)
		let comp = en.addComponent(ResourceLoadComponent)
		let prefix = "resource/Assets"
		comp.pathMap[PATH.ANIMATION] = prefix + "/animation/"
		comp.pathMap[PATH.CONFIG] = prefix + "/config/"
		comp.pathMap[PATH.ITEMS] = prefix + "/items/"
		comp.pathMap[PATH.PICTURE] = prefix + "/picture/"
		comp.pathMap[PATH.SOUND] = prefix + "/sound/"
		comp.pathMap[PATH.EFFECT] = prefix + "/effect/"
	}

	public getURL(path:PATH,name:string)
	{
		let comp = World.shareInstance.getEntity(ResourceLoadEntity).getComponent(ResourceLoadComponent)
		return comp.pathMap[path] + name
	}

	public async loadGroup(group)
	{
		if(!RES.isGroupLoaded(group)){
			let loadingView = this.createLoadingView()
			Main.STAGE.addChild(loadingView);
			await RES.loadGroup(group, 0, this);
			let uILoadEntity = World.shareInstance.getEntity(ResourceLoadEntity)
			uILoadEntity.removeComponent(loadingView)
			Main.STAGE.removeChild(loadingView);
        }	
	}
	public isGroupLoaded(group)
	{
		return RES.isGroupLoaded(group)
	}
	public destroyRes(source:string)
    {
        if(source == "main" || source == "preload") return
        if(RES.isGroupLoaded(source))
        {
            RES.destroyRes(source)
        }
    }
	/**
	 * 单独加载资源
	 * @param url 要加载文件的外部路径。
     * @param compFunc 回调函数。示例：compFunc(data,url):void。
     * @param thisObject 回调函数的 this 引用。
     * @param type 文件类型(可选)。请使用 ResourceItem 类中定义的静态常量。若不设置将根据文件扩展名生成。
	 */
	public async loadResByURL(url:string,compFunc?: Function, thisObject?: any, type?: string)
	{
	 	return await RES.getResByUrl(url,compFunc,thisObject,type)
	}

	onProgress(current: number, total: number): void {
		let uILoadEntity = World.shareInstance.getEntity(ResourceLoadEntity)
		let loadingView = uILoadEntity.getComponent(LoadingUI)
		loadingView.textField.text = `Loading ` + "("+ Math.floor(current / total * 100) + " %)..";
    }

	private createLoadingView():any
	{
		let uILoadEntity = World.shareInstance.getEntity(ResourceLoadEntity)
		let loadingView = uILoadEntity.addComponent(LoadingUI)
		if(!loadingView.maskBg)
		{
			loadingView.maskBg = new egret.Sprite();
			loadingView.maskBg.touchEnabled = true;
			loadingView.maskBg.graphics.beginFill(1,0.7);
			loadingView.maskBg.graphics.drawRect(0, 0, StageSystem.stageWidth, StageSystem.stageHeight);
			loadingView.maskBg.graphics.endFill();
			loadingView.addChild(loadingView.maskBg)
		}
		loadingView.textField = new egret.TextField();
		loadingView.addChild(loadingView.textField);
		loadingView.textField.y = StageSystem.stageHeight / 2;
		loadingView.textField.x = StageSystem.stageWidth / 2;
		loadingView.textField.width = 480;
		loadingView.textField.height = 100;
		loadingView.textField.anchorOffsetX = 240
		loadingView.textField.anchorOffsetY = 50
		loadingView.textField.textAlign = "center";
		loadingView.textField.text = `Loading ` + "(0 %)..";
		return loadingView
	}
}