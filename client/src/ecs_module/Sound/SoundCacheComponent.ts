/**
 * 声音播放缓存组件
 */
class SoundCacheComponent extends Component {
    public lastBGMPosition = 0;
    // public lastBGMName = "";
    public lastBGM:SoundComponent
    public BGMName = "";
    public soundPool = {};
    public isMusicSoundOpen = true;
    public isEffectSoundOpen = true;
}