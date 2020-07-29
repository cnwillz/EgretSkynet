class EventSystem extends System {
	
	public execute()
	{
		let entity = World.shareInstance.createEntity(EventEntity)
		entity.addComponent(EventDispatcherComponent)
	}
	private getEventEntity():EventEntity
	{
		return World.shareInstance.getEntity(EventEntity)
	}
	public addEventListener(type:string,listener:Function,target:ISystem,useCapture?: boolean, priority?: number)
	{
		let entity = this.getEventEntity()
		let eventDispatcher = entity.getComponent(EventDispatcherComponent)
		eventDispatcher.addEventListener(type,listener,target,useCapture,priority)
	}

	public removeEventListener(type:string,listener:Function,target:ISystem,useCapture?: boolean)
	{
		let entity = this.getEventEntity()
		let eventDispatcher = entity.getComponent(EventDispatcherComponent)
		eventDispatcher.removeEventListener(type,listener,target,useCapture)
	}

	public dispatchEvent(type:string,param:{} = null)
	{
		var event = egret.Event.create(EventMetaComponent,type,false,false)
		event.data = param
		let entity = this.getEventEntity()
		let eventDispatcher = entity.getComponent(EventDispatcherComponent)
		eventDispatcher.dispatchEvent(event)
		egret.Event.release(event)
	}
}