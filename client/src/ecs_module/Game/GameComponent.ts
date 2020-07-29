class GameComponent extends Component{
	
	/**
	 * 上一帧系统时间
	 */
	public lastFrameEventTime:number;
	/**
	 * 游戏初始化时间
	 */
	public gameInitTime:number;
	/**
	 * 每帧间隔时间
	 */
	public deltaTime:number

	/**
	 * egret舞台
	 */
	public stage:egret.Stage
	
	/**
	 * 入口
	 */
	public main:Main

	public frameListenner:egret.Sprite;

}