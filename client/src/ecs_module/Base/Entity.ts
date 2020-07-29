class Entity implements IComponent{
	readonly instanceId:number = IdGenerator.GenerateInstanceId()
	
	private Entity(){}
	public components:Object = {}
	public componentList = new Array<IComponent>()

	public addComponent<T extends IComponent>(component:new ()=>T,multiple:boolean = false):T
	{
		let cp = new component()
		let type = ClassSystem.getInstanceClassName(cp)
		let c = this.components[type]
		if(c == null)
		{
			this.components[type] = cp
		}
		if(multiple) this.componentList.push(cp)
		return this.components[type]
	}

	public addComponent_<T extends IComponent>(component:T,multiple:boolean = false):T
	{
		let type = ClassSystem.getInstanceClassName(component)
		let c = this.components[type]
		if(multiple) this.componentList.push(component)
		if(c == null)
		{
			this.components[type] = component
			return component
		}
		return c
	}

	public removeComponent<T extends IComponent>(component:T)
	{
		let index = this.componentList.indexOf(component) 
		if(index != -1)
		{
			this.componentList.splice(index,1)
		}
		let type = ClassSystem.getInstanceClassName(component)
		if(this.components[type])
		{
			delete this.components[type]
		}
		else
		{
			console.warn("Entity:"+ ClassSystem.getInstanceClassName(this) + " does not contain "+ type + " .")
		}
	}

	public getComponent_<T extends IComponent>(t:T):T
	{
		let type = ClassSystem.getInstanceClassName(t)
		let c = this.components[type]
		if(c == null)
		{
			console.warn("Entity:"+ ClassSystem.getInstanceClassName(this) + " does not contain "+ type + " .")
		}
		return c 
	}
	public getComponentByName<T extends IComponent>(name:string):T
	{
		let c = this.components[name]
		if(c == null)
		{
			console.warn("Entity:"+ ClassSystem.getInstanceClassName(this) + " does not contain "+ name + " .")
		}
		return c 
	}
	public getComponent<T extends IComponent>(cl:new()=>T):T
	{
		let name = ClassSystem.getClassName(cl)
		let c = this.components[name]
		if(c == null)
		{
			console.warn("Entity:"+ ClassSystem.getInstanceClassName(this) + " does not contain "+ name + " .")
		}
		return c
	}
	public getComponents<T extends IComponent>(cl:new()=>T,multiple = false):any[]
	{
		let array = []
		if(multiple)
		{
			for(var k in this.componentList)
			{
				let c = this.componentList[k]
				if(ClassSystem.getClassName(cl) == ClassSystem.getInstanceClassName(c))
					array.push(c)
			}
		}
		else
		{
			for (var k in this.components)
			{
				let c = this.components[k]
				if(ClassSystem.getClassName(cl) == ClassSystem.getInstanceClassName(c))
					array.push(c)
			}
		}
		return array
	}
}	