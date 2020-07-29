enum SoundType
{
	MUSIC,
	SOUND_EFFECT,
}

class SoundComponent extends Component{
	public name:string = ""
	public sound:egret.Sound
	public soundChanel:egret.SoundChannel
	public type:SoundType 
	public constructor(name:string,sound:egret.Sound,type = SoundType.SOUND_EFFECT)
	{
		super()
		this.name = name
		this.sound = sound
		this.type = type
	}
}