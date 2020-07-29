class SoundSystem extends System {
	
	public execute()
	{
		World.shareInstance.createEntity(SoundEntity).addComponent(SoundCacheComponent)
	}

	private getSoundCache():SoundCacheComponent
	{
		return World.shareInstance.getEntity(SoundEntity).getComponent(SoundCacheComponent)
	}

	private async loadSoundResource(name,type:SoundType = SoundType.SOUND_EFFECT):Promise<any>
	{
		let resName = name.replace(".","_")
		let soundcomp:SoundComponent
		if(RES.hasRes(resName))
		{
			return RES.getRes(resName)
		}
		else
		{
			let resourceSys = World.shareInstance.getSystem(ResourceLoadSystem)
			return await resourceSys.loadResByURL(resourceSys.getURL(PATH.SOUND,name))
		}
	}
	/**
	 * 播放音效
	 */
	public async playSoundEffect(name:string,loopCount = 1)
	{
		egret.assert(name != null && name != "","Sound name can't be null or empty.")
		let soundCache = this.getSoundCache()
		if(soundCache.isEffectSoundOpen)
		{
			let soundcomp:SoundComponent = soundCache.soundPool[name]
			if(soundcomp == null)
			{
				let sound = await this.loadSoundResource(name,SoundType.SOUND_EFFECT)
				soundcomp = new SoundComponent(name,sound,SoundType.SOUND_EFFECT)
				soundCache.soundPool[name] = soundcomp
			}
			soundcomp.soundChanel = soundcomp.sound.play(0,loopCount)
		}
	}

	public async playMusic(name:string)
	{
		egret.assert((name != null) && ( name != ""),"Sound name can't be null or empty.")
		let soundCache = this.getSoundCache()
		let resName = name.replace(".","_")
		let poolOBj:SoundComponent = soundCache.soundPool[name]
		if(soundCache.lastBGM == null || soundCache.lastBGM != poolOBj)
		{
			if(!poolOBj)
			{
				let sound = await this.loadSoundResource(name,SoundType.MUSIC)
				poolOBj = new SoundComponent(name,sound,SoundType.MUSIC)
				console.log(poolOBj)
				soundCache.soundPool[name] = poolOBj
			}
			if(soundCache.lastBGM)
				soundCache.lastBGM.soundChanel.stop()
			soundCache.lastBGM = poolOBj
		}

		if(poolOBj.soundChanel)
			poolOBj.soundChanel.stop()
		if(soundCache.isMusicSoundOpen)
			poolOBj.soundChanel = poolOBj.sound.play(0)
	
	}
	public resumeBGM()
	{
		let soundCache = this.getSoundCache()
		this.playMusic(soundCache.lastBGM.name)
	}

	public playSoundEffectWithConfig()
	{

	}
	public playMusicWithConfig()
	{

	}
	public setMusicOn(isOn:boolean)
	{
		let soundCache = this.getSoundCache()
		soundCache.isMusicSoundOpen = isOn
		if(isOn)
		{
			if(soundCache.lastBGM)
				soundCache.lastBGM.sound.play(soundCache.lastBGMPosition)
		}
		else
		{
			if(soundCache.lastBGM)
			{
				soundCache.lastBGMPosition = soundCache.lastBGM.soundChanel.position
				soundCache.lastBGM.soundChanel.stop()
			}
		}
	}
	public setSoundOn(isOn:boolean)
	{
		let soundCache = this.getSoundCache()
		soundCache.isEffectSoundOpen = isOn
		if(isOn) return
		for(let k in soundCache.soundPool)
		{
			let sc:SoundComponent = soundCache.soundPool[k]
			if(sc.sound == null || sc.type != SoundType.SOUND_EFFECT) continue
			sc.soundChanel.stop()
		}
	}	
}