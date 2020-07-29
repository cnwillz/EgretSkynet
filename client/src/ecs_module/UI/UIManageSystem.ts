class UIManageSystem extends System{
	
	public execute()
	{
		let uiEn = World.shareInstance.createEntity(UIEntity)
		let gameEn = World.shareInstance.getEntity(GameEntity)
		let main = gameEn.getComponent(GameComponent).main
		
		/**********隐藏层************/
		uiEn.layerBottom = new eui.UILayer
		main.addChild(uiEn.layerBottom)

		/**********Panel UI 使用层 begin*********** */
		uiEn.layerMiddle = new eui.UILayer
		main.addChild(uiEn.layerMiddle)

		/*************Panel UI 使用层 end******** */

		/**********提示类UI层************/
		uiEn.layerTips = new eui.UILayer
		uiEn.layerTips.touchEnabled = false
		main.addChild(uiEn.layerTips)

		uiEn.layerTop = new eui.UILayer
		uiEn.layerTop.touchEnabled = false
		main.addChild(uiEn.layerTop)
	}

	public regist<T extends UIComponent,S extends UISystem>(uicpnt:new()=>T,uisys:new()=>S):Object
	{
		let uiEn = World.shareInstance.getEntity(UIEntity)
		let name = ClassSystem.getClassName(uicpnt)
		if(uiEn.compAndSysMap[name])
		{
			console.warn( name +" [UIComponent] has already registed.")
			return uiEn.compAndSysMap[name]
		}
		else
		{
			let uiComponent = new uicpnt()
			let sys = World.shareInstance.createSystem(uisys)
			let dic = {ui:uiComponent,system:sys}
			uiEn.compAndSysMap[name] = dic
			sys.execute()
			return dic
		}
	}


	/**
	 * 异步打开UI面板
	 */
	public async openUI<T extends UIComponent>(uicpnt:new()=>T,layerType?:UILayerType):Promise<T>
	{
		let uiEn = World.shareInstance.getEntity(UIEntity)
		let name = ClassSystem.getClassName(uicpnt)
		let uiDic = uiEn.compAndSysMap[name]
		if(uiDic == null)
		{
			console.error("UI:"+name +" does not regist.")
			return null
		}
		var uiComponent:UIComponent = uiDic.ui
		if(this.didUIOpen(uicpnt))
		{
			console.error("UI:"+ name + " has opened do not open it again.")
			return 
		}
		let uiSystem:UISystem = uiDic.system
		let uiLoadSys = World.shareInstance.getSystem(ResourceLoadSystem)
		if(!uiComponent.resourceLoaded)
		{
			if(uiComponent.resourceGroup)
				await uiLoadSys.loadGroup(uiComponent.resourceGroup);
			uiSystem.onUILoaded()
			uiComponent.resourceLoaded = true
		}
		uiComponent.addEventListener(egret.Event.ADDED_TO_STAGE,uiSystem.addToStage,uiSystem)
		uiComponent.addEventListener(egret.Event.REMOVED_FROM_STAGE,uiSystem.removeToStage,uiSystem)
		uiEn.uiStack.push(uiComponent)
		let targetLayer = this.findALayer(layerType)
		targetLayer.addChild(uiComponent)
		return new Promise<T>((resolve,reject)=>{resolve(uiComponent as T)})
	}
	/**
	 * 关闭UI面板 
	 * @param uicpnt UIComponent类名 
	 * @param destroy 是否销毁，目前暂不支持传入此参数
	 */
	public closeUI<T extends UIComponent>(uicpnt:new()=>T,destory?:boolean)
	{
		let uiEn = World.shareInstance.getEntity(UIEntity)			
		let popedUI = uiEn.uiStack.pop()
		if(ClassSystem.getInstanceClassName(popedUI) == ClassSystem.getClassName(uicpnt))
		{
			UIManageSystem.removeDisplay(popedUI)
			this.activeTopUI()
		}
		else
		{
			console.error("You should close ui which is on the top first.");
			uiEn.uiStack.push(popedUI)
		}
	}
	/**
	 * 关闭UI面板
	 * @param uicpnt UIComponent实例
	 */
	public closeUI_<T extends UIComponent>(uicpnt:T)
	{
		let uiEn = World.shareInstance.getEntity(UIEntity)
		let popedUI = uiEn.uiStack.pop()
		if(ClassSystem.getInstanceClassName(popedUI) == ClassSystem.getInstanceClassName(uicpnt))
		{
			UIManageSystem.removeDisplay(popedUI)
			this.activeTopUI()
		}
		else
		{
			console.error("You should close ui which is on the top first.");
			uiEn.uiStack.push(popedUI)
		}
	}

	public didUIOpen<T extends UIComponent>(uicpnt:new()=>T):boolean
	{
		let isOpen = false
		let uiEn = World.shareInstance.getEntity(UIEntity)
		for(var k in uiEn.uiStack)
		{
			let uicomp = uiEn.uiStack[k]
			if(ClassSystem.getInstanceClassName(uicomp) == ClassSystem.getClassName(uicpnt))
				isOpen = true
		}
		return isOpen
	}
	public didUIOnActive<T extends UIComponent>(uicpnt:new()=>T):boolean
	{
		return false
	}
	public isTop<T extends UIComponent>(uicpntInstance:T):boolean
	{
		let uiEn = World.shareInstance.getEntity(UIEntity)
		if(uiEn.uiStack.length >= 1)
		{
			let lastIndex = uiEn.uiStack.length -1
			let uiComponent = uiEn.uiStack[lastIndex]
			return ClassSystem.getInstanceClassName(uiComponent) == ClassSystem.getInstanceClassName(uicpntInstance)
		}
		return true
	}
	/**
	 * 根据系统的instanceId查找与之对应的UIComponent
	 */
	public FindUIComponentWithSysId(instanceId:number):UIComponent
	{
		let uiEn = World.shareInstance.getEntity(UIEntity)

		for(var k in uiEn.compAndSysMap)
		{
			let pair = uiEn.compAndSysMap[k]
			let sys:UISystem = pair.system
			if(sys.instanceId == instanceId)
			{
				return pair.ui
			}
		}
		return null
	}
	public activeTopUI()
	{
		let uipair = this.findTopPair()
		if(uipair != null)
		{
			let sys:UISystem = uipair.system
			sys.onActive()
		}
	}
	private findTopPair():any
	{
		let uiEn = World.shareInstance.getEntity(UIEntity)
		let len = uiEn.uiStack.length
		if(len >= 1)
		{
			let uiComp = uiEn.uiStack[len - 1]
			return uiEn.compAndSysMap[ClassSystem.getInstanceClassName(uiComp)]
		}
		return null

	}

	private findALayer(layerType:UILayerType):eui.UILayer
	{
		let uiEn = World.shareInstance.getEntity(UIEntity)
		let targetLayer:eui.UILayer = uiEn.layerMiddle
		if(layerType != null)
		{
			switch(layerType)
			{
				case UILayerType.UIBottom:
					targetLayer = uiEn.layerBottom
					break;
				case UILayerType.UIMid:
					targetLayer = uiEn.layerMiddle
					break;
				case UILayerType.UITips:
					targetLayer = uiEn.layerTips
					break;
				case UILayerType.UITop:
					targetLayer = uiEn.layerTop
					break;
			}
		}
		return targetLayer
	}
	public static removeDisplay(dis:egret.DisplayObject,parent:egret.DisplayObjectContainer=null):void
	{
		if(!dis) return;
		if(!parent){
			parent = dis.parent;
		}
		if(!parent) return;
		parent.removeChild(dis);
	}
}