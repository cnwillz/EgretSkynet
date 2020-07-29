class PoolSystem extends System {
	
	public execute()
	{
		World.shareInstance.createEntity(PoolEntity).addComponent(PoolComponent)
	}
	private getEntity():PoolEntity
	{
		return World.shareInstance.getEntity(PoolEntity)
	}
	public createPool<T>(type:new()=>T,count:number = 20):Array<T>
	{
		let comp = this.getEntity().getComponent(PoolComponent)
		let array = comp.pool[ClassSystem.getClassName(type)] as Array<T>
		if(array == null)
		{
			array = new Array<T>()
			for(let i = 0; i < count;i++)
			{
				array.push(new type())
			}
			comp.pool[ClassSystem.getClassName(type)] = array
		}
		return array
	}

	public spawn<T>(type:new()=>T):T
	{
		let comp = this.getEntity().getComponent(PoolComponent)
		let name = ClassSystem.getClassName(type)
		let array = comp.pool[name] 
		if(!array) array = this.createPool<T>(type)
		let objAny = (array.length > 0) ? array.pop():new type()
		return objAny
	}
	public despawn<T>(t:T)
	{
		let comp = this.getEntity().getComponent(PoolComponent)
		let name = ClassSystem.getInstanceClassName(t)
		let array = comp.pool[name]
		if(array && array.indexOf(t) == -1)
        {   
            array.push(t)
        }
		else
		{
			console.warn("despawn failed,object is allready in pool.")
		}
	}
}