class GameSystem extends System{
	
	public execute()
	{
		let en = World.shareInstance.createEntity(GameEntity)
		var comp = en.addComponent(GameComponent)
		comp.stage = Main.STAGE
		comp.main = Main.mainEntrace;
		comp.gameInitTime = egret.getTimer()
		comp.frameListenner = new egret.Sprite()
		comp.lastFrameEventTime = comp.gameInitTime
		let eventSys = World.shareInstance.getSystem(EventSystem)
		comp.frameListenner.addEventListener(egret.Event.ENTER_FRAME,this.update,this)
	}

	public update()
	{
		let world = World.shareInstance
		
		let en = world.getEntity(GameEntity)
		let comp = en.getComponent(GameComponent)
		let frameTime = egret.getTimer()
		let deltaTime =  (frameTime - comp.lastFrameEventTime) / 1000
		comp.lastFrameEventTime = frameTime
		comp.deltaTime = deltaTime
		for(let i = 0 ; i < world.updateSystems.length;i++)
		{
			let updateSys = world.updateSystems[i]
			updateSys.update(deltaTime)
		}
	
	}
}