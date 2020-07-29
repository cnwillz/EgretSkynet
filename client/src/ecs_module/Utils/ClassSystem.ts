class ClassSystem {
	public static getInstanceClassName<T extends Object>(instance:T):string
	{
		return instance["__proto__"]["__class__"]
	}

	public static getClassName<T extends Object>(cl:new()=>T):string
	{
		return cl.prototype["__class__"]
	}
}