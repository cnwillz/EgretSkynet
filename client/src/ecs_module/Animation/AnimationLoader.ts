class AnimationLoader extends System {

	public execute()
	{
	}

	public async loadAnimation(component:AnimationComponent):Promise<AnimationComponent>
	{
		if(component.type == AnimationType.DragonBoneAnimation)
		{
			let loadSys = World.shareInstance.getSystem(ResourceLoadSystem)
			let png = loadSys.getURL(PATH.ANIMATION,component.name + '_tex.png');
			let json = loadSys.getURL(PATH.ANIMATION,component.name + '_tex.json');
			let skeJson = loadSys.getURL(PATH.ANIMATION,component.name + '_ske.json');

			let pngData = await loadSys.loadResByURL(png)
			let textrueData = await loadSys.loadResByURL(json)
			let skeData = await loadSys.loadResByURL(skeJson) 
			component.armatureName = "armatureName"
			component.animator = AnimationSystem.GetAnimationDisplayWithData(skeData,textrueData,pngData,component.armatureName)
		
		}
		else if(component.type == AnimationType.ImageSequenceAnimation)
		{
			console.log("load Animation")
			let loadSys = World.shareInstance.getSystem(ResourceLoadSystem)
			let png = loadSys.getURL(PATH.ANIMATION,component.name + '.png');
			let json = loadSys.getURL(PATH.ANIMATION,component.name + '.json');
			let pngData = await loadSys.loadResByURL(png)
			let jsonData = await loadSys.loadResByURL(json)
			let mcFactory = new egret.MovieClipDataFactory(jsonData,pngData);
       	 	component.animator = new egret.MovieClip(mcFactory.generateMovieClipData(component.name));
			// component.animator.scaleX = component.animationScale
			// component.animator.scaleY = component.animationScale
			// return new Promise<AnimationComponent>((resolve,reject)=>{resolve(component)})
		}
		component.animator.scaleX = component.animationScale
		component.animator.scaleY = component.animationScale
		return new Promise<AnimationComponent>((resolve,reject)=>{resolve(component)})
		
	}
}