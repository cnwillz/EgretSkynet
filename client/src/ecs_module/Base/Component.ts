interface IComponent{
	readonly instanceId:number 
}

class Component implements IComponent {
	readonly instanceId:number = IdGenerator.GenerateInstanceId()
	public constructor(){
	}
}
