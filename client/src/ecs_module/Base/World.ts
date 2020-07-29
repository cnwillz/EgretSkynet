class World {
	private constructor() {
	}
	private  static readonly _instance:World = new World()
	public static get shareInstance()
	{
		return this._instance
	}	

	private entityArray:Array<IComponent> = new Array<IComponent>()
	/**
	 * 所有实体
	 */
	public entities:Object = {}
	/**
	 * 所有系统
	 */
	public systems:Object = {}
	
	/**
	 * 统一调度update的系统
	 */
	public updateSystems:IUpdateSystem[] = []


	/**过滤具有某些组件的实体
	 * @param components 类数组 eg. [A,B,C] A,B,C为继承自Component的类名
	 * @return 实体数组
	 */
	public entityFilter<T extends IComponent>(components:(new ()=>T)[]):any[]
	{
		var compNames = []
		var entities = []
		for (let i = 0 ; i < components.length;i++)
		{
			let comp = components[i]
			let str = ClassSystem.getClassName(comp)
			compNames.push(str)
		}
		for(var k in this.entityArray)
		{
			let containAllComponents = true
			let en:Entity = this.entityArray[k] as Entity
			for(let i = 0 ; i < compNames.length; i ++)
			{
				let componentName = compNames[i]
				let comp = en.getComponentByName(componentName)
				containAllComponents = !(comp == null)
			}
			if(containAllComponents)
				entities.push(en)
		}
		return entities
	}
	public getEntity<T>(entity:(new ()=>T)):T
	{
		return this.entities[ClassSystem.getClassName(entity)]
	}
	/**
	 * 创建实体
	 * @param entity 实体类名
	 * @param multiple 是否为多个实体，多个实体的话会保存进数组，取实体的时候必须用entityFilter函数
	 */
	public createEntity<T extends IComponent>(entity:new()=>T,multiple:boolean = false):T
	{
		let e = new entity()
		if(!multiple)
		{
			this.entities[ClassSystem.getInstanceClassName(e)] = e	
		}
		this.entityArray.push(e)
		return e
	}
	
	/**
	 * 创建系统
	 */
	public createSystem<T extends ISystem>(sys:new()=>T):T
	{	
		let sysName = ClassSystem.getClassName(sys)
		let system = this.systems[sysName]
		if(system == null)
		{
			system = new sys()
			this.systems[sysName] = system
			let types = sys.prototype["__types__"]
			for(var k in types)
			{
				let systemType = types[k]
				if(systemType == "IUpdateSystem")
					this.updateSystems.push(system)
			}
		}
		return system
	}
	/**
	 * 获取System
	 */
	public getSystem<T extends ISystem>(sys:new()=>T):T
	{
		return this.systems[ClassSystem.getClassName(sys)]
	}
}
