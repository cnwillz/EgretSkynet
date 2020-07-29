class StageSystem extends System {
	public static STAGE_RESIZE:string = "STAGE_RESIZE"
	
	/**
	 * @description 获取舞台宽度
	 */
	public static get stageWidth() {
		return Main.STAGE.stageWidth;
	}
	/**
	 * @description 获取舞台高度
	 */
	public static get stageHeight(): number {
		return Main.STAGE.stageHeight;
	}

	public static scaleMode:egret.StageScaleMode
	
	public execute()
	{
		var scaleMode = StageSystem.getStageScale();
		Main.STAGE.scaleMode = scaleMode;

		Main.STAGE.addEventListener(egret.Event.RESIZE, this.stageSizeChangeHandler, this);
		Main.STAGE.addEventListener(egret.Event.ACTIVATE, this.activateHandler, this);
		Main.STAGE.addEventListener(egret.Event.DEACTIVATE, this.deactivateHandler, this);
	}

	private activateHandler(event:egret.Event):void
	{
		// SoundManager.getInstance().reStartMusic();
	}

	private deactivateHandler(event:egret.Event):void
	{
		// SoundManager.getInstance().stopMusic();
	}

	private stageClickHandler(event:egret.TouchEvent):void
	{
		// Tnotice.ins.setNoticeLoc(event.stageX, event.stageY);
	}

	public stageSizeChangeHandler(): void {
		egret.setTimeout(() => {
			var scaleMode = StageSystem.getStageScale();
			StageSystem.scaleMode = scaleMode
			Main.STAGE.scaleMode = scaleMode;
			let evtSys = World.shareInstance.getSystem(EventSystem)
			evtSys.dispatchEvent(StageSystem.STAGE_RESIZE)
			console.log("Resize stage,sacleMode:"+scaleMode + " height:"+window.innerHeight + " width:" + window.innerWidth)

		}, this, 500);
	}

	/**
	 * 获得舞台的适配模式
	 * 
	 */
	public static getStageScale(): string {
		let scaleMode = "";
		let w: number = window.innerHeight / window.innerWidth;
		let minSizeProb = 1.7;
		let maxSizeProb = 1.8;
		if (w < 1.5) {
			scaleMode = egret.StageScaleMode.FIXED_HEIGHT;
		} else if (w > minSizeProb && w < maxSizeProb) {
			scaleMode = egret.StageScaleMode.FIXED_WIDTH;
		} else{
			scaleMode = egret.StageScaleMode.FIXED_HEIGHT;
		}
		return scaleMode;
	}
}