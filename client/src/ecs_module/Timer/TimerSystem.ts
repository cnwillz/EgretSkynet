class TimerSystem extends System implements IUpdateSystem{
	public execute()
	{
		World.shareInstance.createEntity(TimerEntity).addComponent(TimerComponent)
	}

	private getTimerEntity():TimerEntity
	{
		return World.shareInstance.getEntity(TimerEntity)
	}
	public start()
	{
		this.getTimerEntity().getComponent(TimerComponent).pause = false
	}
	public pause()
	{
		this.getTimerEntity().getComponent(TimerComponent).pause = true
	}
	public update(deltaTime:number)
	{
		let tc = this.getTimerEntity().getComponent(TimerComponent)
		if(tc.pause) return
		for(var k in tc.timerList)
		{
			let timerMeta = tc.timerList[k] as TimerMeta
			this.handleTime(timerMeta,deltaTime)
		}
	}
	/**
	 * 注册计时器
	 * @param call 回调函数
	 * @param thisObject 回调接受对象
	 * @param interval 计时时间
	 * @param delay 初次计时回调的延迟时间
	 * @param repeat 重复次数 -1无限重复
	 */
	public schedule(call:Function,thisObject:Object,interval:number,delay:number = 0,repeat:number = -1)
	{
		let tc = this.getTimerEntity().getComponent(TimerComponent)
		if(this.isDuplicate(tc,call,thisObject))
		{
			console.log("Duplicate schedule.")
			return
		}
		let timerMeta = new TimerMeta(call,thisObject,interval,delay,repeat)
		tc.timerList.push(timerMeta)
	}
	/**
	 * 移除计时器
	 * @param call 回调函数
	 * @param thisObject 回调接受对象
	 */
	public removeSchedule(call:Function,thisObject:Object)
	{
		let tc = this.getTimerEntity().getComponent(TimerComponent)
		for(var k in tc.timerList)
		{
			let timerMeta = tc.timerList[k] as TimerMeta
			if(timerMeta.callFunction == call && timerMeta.thisObject == thisObject)
			{
				timerMeta.callFunction = null
				timerMeta.thisObject = null
				tc.timerList.splice(parseInt(k),1)
				break;
			}			
		}
	}
	
	private handleTime(timerMeta:TimerMeta,deltaTime:number)
	{
		timerMeta.currentTime += deltaTime
		if(timerMeta.delay > 0)
		{
			if(timerMeta.currentTime >= timerMeta.delay)
			{
				timerMeta.currentTime = timerMeta.currentTime - timerMeta.delay
				timerMeta.delay = 0
			}
		}
		else
		{
			if(timerMeta.repeat > 0 || timerMeta.repeat == -1)
			{
				if(timerMeta.currentTime >= timerMeta.timeInterval)
				{
					timerMeta.currentTime = timerMeta.currentTime - timerMeta.timeInterval
					timerMeta.callFunction.call(timerMeta.thisObject)
					if(timerMeta.repeat > 0) timerMeta.repeat -= 1
				}
			}
		}
	}
	private isDuplicate(tc:TimerComponent,call:Function,thisObject:Object)
	{
		for(var k in tc.timerList)
		{
			let timerMeta = tc.timerList[k] as TimerMeta
			if(timerMeta.callFunction == call && timerMeta.thisObject == thisObject)
				return true
		}
		return false
	}
}