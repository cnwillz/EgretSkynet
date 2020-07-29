abstract class UISystem extends System implements IAddToStageSystem,IRemoveToStageSystem,IShowSystem,IHideSystem,OnAnimationEndSystem {
	
	public readonly instanceId = IdGenerator.GenerateInstanceId()
	public abstract execute();
	public abstract onShow();
	public abstract onHide();
	public abstract onActive();
	public abstract onUILoaded();
	public abstract onAnimationEnd();
	public addToStage(){
		let sys = World.shareInstance.createSystem(UIManageSystem)
		let ui = sys.FindUIComponentWithSysId(this.instanceId)
		if(ui.needMask && ui.mask == null)
		{
			ui.maskBg = new egret.Sprite();
			ui.maskBg.touchEnabled = true;
			ui.maskBg.graphics.beginFill(1,ui.maskAlpha);
			ui.maskBg.graphics.drawRect(0, 0, StageSystem.stageWidth, StageSystem.stageHeight);
			ui.maskBg.graphics.endFill();
			ui.parent.addChildAt(ui.maskBg,ui.parent.getChildIndex(ui))
			if(ui.clickMaskToHide)
			{
				ui.maskBg.addEventListener(egret.TouchEvent.TOUCH_TAP, this.maskClickHandler, this);
			}
		}
		sys.activeTopUI();
		this.moveToCenter(ui)
		this.onShow();
		this.doOpenAnimaton(ui,this.animationCallBack);
	}

	public removeToStage(){
		let sys = World.shareInstance.createSystem(UIManageSystem)
		let ui = sys.FindUIComponentWithSysId(this.instanceId)
		if(ui.maskBg)
		{
			UIManageSystem.removeDisplay(ui.maskBg)
			ui.mask = null
		}
		this.onHide()
	}
	public moveToCenter(ui:UIComponent)
	{
		if(ui.centerFlag)
		{
			ui.anchorOffsetX = ui.width/2
			ui.anchorOffsetY = ui.height/2
			ui.x = StageSystem.stageWidth/2
			ui.y = StageSystem.stageHeight/2
		}
	}
	private animationCallBack(ui)
	{
		ui.alpha = 1
		ui.scaleX = 1
		ui.scaleY = 1
		this.onAnimationEnd()
	}
	private maskClickHandler()
	{
		console.log("mask touched")
		let sys = World.shareInstance.createSystem(UIManageSystem)
		let ui = sys.FindUIComponentWithSysId(this.instanceId)
		sys.closeUI_(ui)
	}
	private doOpenAnimaton(ui:UIComponent,callBack:Function)
	{
		if(ui.animation == PopUpAnimation.Scale)
		{
			ui.scaleX = 0.8
			ui.scaleY = 0.8
			ui.alpha = 0.5
			egret.Tween.get(ui).to({alpha:1},100)			
			egret.Tween.get(ui).to({scaleX:1,scaleY:1},150)
			.call(callBack,this,[ui])
		}
		else if(ui.animation == PopUpAnimation.MoveUp)
		{
			//TODO:增加移入动画
			this.animationCallBack(ui)
		}
		else
		{
			this.animationCallBack(ui)
		}
	}
	//TODO:
	private doCloseAnimaton(ui,callBack:Function)
	{
		
	}
}