interface ISystem{
    execute():void;    
}
//UI显示
interface IShowSystem{
    onShow():void
}
//帧刷新
interface IUpdateSystem{
    update(deltaTime:number):void
}
//UI处于堆栈顶端
interface IUIActiveSystem{
    onActive():void
}
//UI隐藏
interface IHideSystem{
    onHide():void
}
//添加到舞台
interface IAddToStageSystem{
    addToStage():void
}

//从舞台移除
interface IRemoveToStageSystem{
    removeToStage():void
}
//动画结束
interface OnAnimationEndSystem{
    onAnimationEnd():void
}
class System implements ISystem{
    readonly instanceId:number = IdGenerator.GenerateInstanceId()
    public execute(){}
}

