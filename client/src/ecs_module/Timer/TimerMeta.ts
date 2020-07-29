class TimerMeta extends Component {
	//倒计时
	public readonly timeInterval:number = 0
	//延迟
	public delay:number = 0
	//重复次数 0： 停止 -1：一直重复 大于0：重复repeat次
	public repeat:number = -1 
	//当前计时
	public currentTime:number = 0
	public currentRepeat:number = 0
	//当前重复次数
	public thisObject:Object
	public callFunction:Function

	public constructor(call:Function,thisObject:Object,interval:number,delay:number,repeat:number)
	{
		super()
		this.timeInterval = interval
		this.delay = delay
		this.repeat = repeat
		this.callFunction = call
		this.thisObject = thisObject
	}
}