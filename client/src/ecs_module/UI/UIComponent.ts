
/**
 * 窗口弹出动画
 */
enum PopUpAnimation{
	Scale, //缩放弹出
	MoveUp,//从下面移动弹出
	None, //直接弹出
}
abstract class UIComponent extends eui.Component implements IComponent {
	readonly instanceId:number = IdGenerator.GenerateInstanceId()
	public maskAlpha = 0.7
	public maskBg:egret.Sprite;
	public abstract needMask:boolean
	public centerFlag:boolean  = true
	public clickMaskToHide:boolean = true
	public animation: PopUpAnimation = PopUpAnimation.Scale
	public resourceGroup:string 
	public resourceLoaded = false
}