
/**
 * 序列帧动画
 */
class AnimationSystem extends System {
	public execute()
	{
		World.shareInstance.createEntity(AnimationEntity).addComponent(AnimationListenerComponent)
		let poolsys = World.shareInstance.getSystem(PoolSystem)		
		poolsys.createPool(AnimationComponent)
	}
	private getEntity():AnimationEntity
	{
		return World.shareInstance.getEntity(AnimationEntity)
	}
	/**
	 * 创建动画
	 * @param name 动画文件名称
	 * @param type 动画类型
	 * @param scale 缩放默认为1
	 * @param loop 是否循环
	 */
	public async createAnimation(name:string,type:AnimationType,scale = 1,loop = false):Promise<AnimationComponent>
	{
		let ac = World.shareInstance.getSystem(PoolSystem).spawn(AnimationComponent)
		if(ac.name != name) this.clearAnimation(ac)
		ac.type = type
		ac.name = name
		ac.loop = loop
		ac.animationScale = scale
		let animationLoadSys = new AnimationLoader()
		await animationLoadSys.loadAnimation(ac)
		this.getEntity().addComponent_(ac,true)
		return new Promise<AnimationComponent>((resolve,reject)=>{resolve(ac)})
	}
	public addAnimationCompleteListener(comp:AnimationComponent,func:Function,thisObject:System,params:any[] = null)
	{
		let alc = this.getEntity().getComponent(AnimationListenerComponent)
		let array = alc[comp.instanceId.toString()]
		if(array == null){
			array = []
			alc[comp.instanceId.toString()] = array
		}
		let hasSame = false
		for(let k in array)
		{
			let couple = array[k]
			if(couple.thisObject.instanceId == thisObject.instanceId && couple.func == func)
			{
				hasSame = true
				break;
			}
		}
		if(!hasSame)
		{
			let couple = {func:func,thisObject:thisObject,params:params}
			array.push(couple)
		}
		else
		{
			console.warn("function for "+ ClassSystem.getInstanceClassName(thisObject) + " has registed.")
		}
	}
	public removeAnimationCompleteListener(comp:AnimationComponent,thisObject:System,func:Function)
	{
		let alc = this.getEntity().getComponent(AnimationListenerComponent)
		let array:any[] = alc[comp.instanceId.toString()]
		if(array)
		{
			for (var k in array)
			{
				let couple = array[k]
				if(couple.thisObject.instanceId = thisObject.instanceId && couple.func == func)
				{
					array.splice(parseInt(k),1)
					break;
				}
			}
		}
	}
	public removeAllListeners(comp:AnimationComponent)
	{
		let alc = this.getEntity().getComponent(AnimationListenerComponent)
		let array:any[] = alc[comp.instanceId.toString()]
		if(array)
		{
			delete alc[comp.instanceId.toString()]
		}
	}
	/**
	 * 播放动画
	 * @param anim AnimationComponent
	 * @param action 动画名字
	 * @param playTimes 播放次数默认为1 ，播放次数只有在AnimationComponent.loop=false时有效
	 */
	public play(anim:AnimationComponent,action:string,playTimes = 1)
	{
		if(anim.type == AnimationType.DragonBoneAnimation)
		{
			let animator = anim.animator as dragonBones.EgretArmatureDisplay
			animator.animation.play(action,anim.loop?0:playTimes)
		}
		else if(anim.type == AnimationType.ImageSequenceAnimation)
		{
			let animator = anim.animator as egret.MovieClip
			animator.gotoAndPlay(action,anim.loop?-1:playTimes)
			if(anim.autoRemove)
				animator.addEventListener(egret.MovieClipEvent.COMPLETE,this.anyAnimationComplete,this)
		}
	}
	/**
	 * 暂停播放
	 * @param anim AnimationComponent
	 */
	public pause(anim:AnimationComponent)
	{
		if(anim.type == AnimationType.DragonBoneAnimation)
		{
			let animator = anim.animator as dragonBones.EgretArmatureDisplay
			animator.animation.stop()
		}
		else if(anim.type == AnimationType.ImageSequenceAnimation)
		{
			let animator = anim.animator as egret.MovieClip
			animator.stop()
		}
	}
	/**
	 * 清空动画数据
	 * @param anim AnimationComponent
	 */
	public clearAnimation(anim:AnimationComponent)
	{
		if(anim.animator) UIManageSystem.removeDisplay(anim.animator)
		anim.name = ""
		anim.animator = null
		anim.autoRemove = false
		anim.loop = false
		anim.defaultName = ""
	}	

	private anyAnimationComplete(evt:egret.MovieClipEvent)
	{
		console.log("animation complete")
		this.dispatchCompleteEvents(evt)
		evt.target.removeEventListener(egret.MovieClipEvent.COMPLETE,this.anyAnimationComplete,this);
		UIManageSystem.removeDisplay(evt.target)
	}
	
	private dispatchCompleteEvents(evt)
	{
		let alc = this.getEntity().getComponent(AnimationListenerComponent)
		//TODO:dispatch event to listeners
		let component = this.findMatchAC(evt.target)
		if(component)
		{
			let listeners = alc[component.instanceId.toString()]
			if(listeners)
			{
				for(var k in listeners)
				{
					let couple = listeners[k]
					let func = couple.func as Function
					func.apply(couple.thisObject,couple.params)
				}
			}
		}
	}
	private findMatchAC(target)
	{
		let entity = this.getEntity()
		let compts = entity.getComponents(AnimationComponent,true)
		for(var k in compts)
		{
			let comp = compts[k] as AnimationComponent
			if(comp.animator == target)
				return comp
		}
	}
	

	public static GetAnimationDisplay(name:string):dragonBones.EgretArmatureDisplay{

        var dragonbonesData = RES.getRes(name +"_ske_json" );
        var textureData = RES.getRes( name + "_tex_json" );
        var texture = RES.getRes(name + "_tex_png" );
        var dragonbonesFactory:dragonBones.EgretFactory = new dragonBones.EgretFactory();
        dragonbonesFactory.addDragonBonesData(dragonbonesFactory.parseDragonBonesData(dragonbonesData));
        dragonbonesFactory.addTextureAtlasData(dragonbonesFactory.parseTextureAtlasData(textureData,texture));  
        var armatureDisplay = dragonbonesFactory.buildArmatureDisplay("armatureName"); 
        return armatureDisplay;
    }
    public static GetAnimationDisplayWithData(dragonBonesData:any,textureData:any,texture:any,armatureName:string = "armatureName"):dragonBones.EgretArmatureDisplay
    {
        var dragonbonesFactory:dragonBones.EgretFactory = new dragonBones.EgretFactory();
        dragonbonesFactory.addDragonBonesData(dragonbonesFactory.parseDragonBonesData(dragonBonesData));
        dragonbonesFactory.addTextureAtlasData(dragonbonesFactory.parseTextureAtlasData(textureData,texture));  
        var armatureDisplay = dragonbonesFactory.buildArmatureDisplay(armatureName); 
        return armatureDisplay;
    }
}