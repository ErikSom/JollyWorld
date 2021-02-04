export class YouTubePlayer{
    static loaded = false;
    static preload(){
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = ()=>{
            YouTubePlayer.loaded = true;
          }
    }
    loadVideo(targetId, videoId){
        if(!YouTubePlayer.loaded) return;
        console.log('load video');

        const self = this;
        this.player = new YT.Player(targetId, {
           height: `${settings.frameSize.y}px`,
           width: `${settings.frameSize.x}px`,
            videoId,
            playerVars: { 'autoplay': 1, 'controls':0, 'iv_load_policy':3, 'modestbranding':1, 'rel':0, 'showinfo':0 },
            events: {
            'onReady': ()=>{self.ready=true, self.player.playVideo()},
            'onStateChange': self.onPlayerStateChange.bind(self)
            }
        });
    }
    stopVideo(){
        this.player.stopVideo();
    }
    // onPlayerReady(){
    //     this.super();
    // }
    onPlayerStateChange(playerStatus){
        // -1 – unstarted
        // 0 – ended
        // 1 – playing
        // 2 – paused
        // 3 – buffering
        // 5 – video cued
        if(playerStatus.data == 0) this.status = Player.playerStates.finished;
        else if(playerStatus.data == 1) this.status = Player.playerStates.playing;
        else if(playerStatus.data == 2) this.status = Player.playerStates.paused;
        else if(playerStatus.data == 3) this.status = Player.playerStates.loading;
        this.status = playerStatus.data;
        this.super();
    }
    playerStatus(){
        return this.status;
    }
    static playButtonHTML = `<svg height="100%" version="1.1" viewBox="0 0 68 48" width="100%"><path class="play" d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#212121" fill-opacity="0.8"></path><path d="M 45,24 27,14 27,34" fill="#fff"></path></svg>`;
    static spinnerHTML = `<button class="loading"><div class="ytp-spinner" data-layer="4"><div class="ytp-spinner-container"><div class="ytp-spinner-rotator"><div class="ytp-spinner-left"><div class="ytp-spinner-circle"></div></div><div class="ytp-spinner-right"><div class="ytp-spinner-circle"></div></div></div></div></div></button>`;
}
