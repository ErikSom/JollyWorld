import {
    Settings
} from "../Settings";

let player;
let lastAuthorSpan;
let lastSubscribeButton;
let lastSpinnerEl;

export class YouTubePlayer {
    static loaded = false;
    static status = -1;
    static currentId = null;
    static scrollTimeout = null;
    static playerStates = {
        loading:-1,
        ready:0,
        loading:1,
        playing:2,
        paused:3,
        finished:4
    }
    static preload(){
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = ()=>{
            YouTubePlayer.loaded = true;
          }
    }
    static loadVideo(targetId, videoId, authorSpan, subcribeButton, spinner){
        if(!YouTubePlayer.loaded) return;
        if(player) YouTubePlayer.stopVideo();

        YouTubePlayer.currentId = videoId;

        player = new YT.Player(targetId, {
        //    height: `${288}px`,
           width: `100%`,
            videoId,
            playerVars: { 'controls':1, 'iv_load_policy':3, 'modestbranding':1, 'rel':0, 'showinfo':1,'origin':window.location.origin  },
            events: {
            'onReady': ()=>{
                YouTubePlayer.status = YouTubePlayer.playerStates.ready;

                spinner.style.display = 'none';

                const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${Settings.YTAPIKEY}`;
                fetch(url)
                .then(response => response.json())
                .then(data => {
                    if(YouTubePlayer.currentId === videoId){
                        const item = data.items[0];
                        if(item && item.snippet){
                            const author = item.snippet.channelTitle;
                            authorSpan.innerText = `Subscribe to ${author}`;
                            const channelID = item.snippet.channelId;
                            subcribeButton.setAttribute('yt-channel', channelID);

                            lastAuthorSpan = authorSpan;
                            lastSubscribeButton = subcribeButton;
                            lastSpinnerEl = spinner;
                        }
                    }
                })

            },
            'onStateChange': YouTubePlayer.onPlayerStateChange,
            }
        });
    }
    static scrollToTop(){
        if(YouTubePlayer.scrollTimeout) clearTimeout(YouTubePlayer.scrollTimeout);
        YouTubePlayer.scrollTimeout = setTimeout(()=>{
            if(lastSpinnerEl){
                const scrollElement = lastSpinnerEl.parentNode?.parentNode?.parentNode?.parentNode?.parentNode?.parentNode;
                if(scrollElement && scrollElement.scrollTo){
                    scrollElement.scrollTo({
                        top: 0,
                        left: 0,
                        behavior: 'smooth'
                    });
                }
            }

        }, 500);
    }
    static stopVideo(){
        if(player) player.destroy();
        player = null;
        YouTubePlayer.currentId = null;
        if(lastAuthorSpan) lastAuthorSpan.innerText = '';
        if(lastSubscribeButton) lastSubscribeButton.removeAttribute('yt-channel');
        if(lastSpinnerEl) lastSpinnerEl.style.display = 'block';
    }
    // onPlayerReady(){
    //     this.super();
    // }
    static onPlayerStateChange(playerStatus){
        // -1 – unstarted
        // 0 – ended
        // 1 – playing
        // 2 – paused
        // 3 – buffering
        // 5 – video cued
        YouTubePlayer.status = YouTubePlayer.playerStates.loading;
        if(playerStatus.data == 0) status = YouTubePlayer.playerStates.finished;
        else if(playerStatus.data == 1) status = YouTubePlayer.playerStates.playing;
        else if(playerStatus.data == 2) status = YouTubePlayer.playerStates.paused;
        else if(playerStatus.data == 3) status = YouTubePlayer.playerStates.loading;


        YouTubePlayer.scrollToTop();

        
    }
    static playerStatus(){
        return status;
    }
    static playButtonHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="100%" version="1.1" viewBox="0 0 68 48" width="100%"><path class="play" d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#212121" fill-opacity="0.8"></path><path d="M 45,24 27,14 27,34" fill="#fff"></path></svg>`;
    static spinnerHTML = `<div class="ytp-spinner-container"><div class="ytp-spinner-rotator"><div class="ytp-spinner-left"><div class="ytp-spinner-circle"></div></div><div class="ytp-spinner-right"><div class="ytp-spinner-circle"></div></div></div></div>`;
    static subscribeButtonHTML= `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 712.5 191.5"><path d="M692.5 191.5H20c-11 0-20-9-20-20V20C0 9 9 0 20 0h672.5c11 0 20 9 20 20v151.5c0 11-9 20-20 20z" fill="#fff"/><path d="M175.7 49.2h-102c-6.6 0-12 5.4-12 12v69c0 6.6 5.4 12 12 12h102c6.6 0 12-5.4 12-12v-69c0-6.5-5.4-12-12-12zm-66 70.8V71.5l42.1 24.3-42.1 24.2z" fill="#e62118"/><path d="M249.9 105.5l8.2-.7c.4 3.3 1.3 6 2.7 8.1 1.4 2.1 3.6 3.8 6.6 5.1 3 1.3 6.4 2 10.1 2 3.3 0 6.3-.5 8.8-1.5 2.5-1 4.4-2.3 5.7-4.1 1.2-1.7 1.9-3.6 1.9-5.6 0-2.1-.6-3.9-1.8-5.4-1.2-1.5-3.2-2.8-5.9-3.9-1.8-.7-5.7-1.8-11.7-3.2-6-1.5-10.3-2.8-12.7-4.1-3.1-1.6-5.5-3.7-7-6.1-1.5-2.4-2.3-5.2-2.3-8.2 0-3.3.9-6.4 2.8-9.3 1.9-2.9 4.6-5.1 8.3-6.6 3.6-1.5 7.6-2.2 12.1-2.2 4.9 0 9.2.8 12.9 2.4s6.6 3.9 8.6 6.9c2 3.1 3.1 6.5 3.2 10.4l-8.4.6c-.4-4.2-2-7.3-4.6-9.4-2.6-2.1-6.4-3.2-11.5-3.2-5.3 0-9.1 1-11.5 2.9-2.4 1.9-3.6 4.3-3.6 7 0 2.4.9 4.3 2.6 5.8 1.7 1.5 6.1 3.1 13.1 4.7 7.1 1.6 11.9 3 14.6 4.2 3.8 1.8 6.7 4 8.5 6.7 1.8 2.7 2.7 5.8 2.7 9.4 0 3.5-1 6.8-3 9.9-2 3.1-4.9 5.5-8.6 7.2-3.8 1.7-8 2.6-12.7 2.6-6 0-10.9-.9-15-2.6-4-1.7-7.2-4.3-9.5-7.8-2.3-3.6-3.5-7.6-3.6-12zM344.4 126.7v-7c-3.7 5.4-8.8 8.1-15.1 8.1-2.8 0-5.4-.5-7.9-1.6-2.4-1.1-4.2-2.4-5.4-4.1-1.2-1.6-2-3.6-2.5-6-.3-1.6-.5-4.1-.5-7.5V79h8.1v26.4c0 4.2.2 7.1.5 8.5.5 2.1 1.6 3.8 3.2 5 1.6 1.2 3.7 1.8 6.1 1.8 2.4 0 4.7-.6 6.8-1.9 2.1-1.2 3.6-2.9 4.5-5.1s1.3-5.2 1.3-9.3V79h8.1v47.7h-7.2zM371.7 126.7h-7.5V60.8h8.1v23.5c3.4-4.3 7.8-6.4 13.1-6.4 2.9 0 5.7.6 8.3 1.8 2.6 1.2 4.8 2.8 6.5 5 1.7 2.1 3 4.7 4 7.7s1.4 6.3 1.4 9.7c0 8.2-2 14.5-6.1 18.9-4 4.5-8.9 6.7-14.5 6.7s-10-2.3-13.2-7v6zm-.1-24.2c0 5.7.8 9.8 2.3 12.4 2.5 4.2 6 6.2 10.3 6.2 3.5 0 6.6-1.5 9.2-4.6 2.6-3.1 3.9-7.6 3.9-13.7 0-6.2-1.2-10.8-3.7-13.8s-5.5-4.4-9-4.4-6.6 1.5-9.2 4.6c-2.5 3-3.8 7.5-3.8 13.3zM412.2 112.4l8-1.3c.4 3.2 1.7 5.7 3.7 7.4 2 1.7 4.9 2.6 8.6 2.6 3.7 0 6.5-.8 8.3-2.3 1.8-1.5 2.7-3.3 2.7-5.3 0-1.8-.8-3.3-2.4-4.3-1.1-.7-3.9-1.6-8.3-2.7-5.9-1.5-10-2.8-12.3-3.9-2.3-1.1-4-2.6-5.2-4.5-1.2-1.9-1.8-4.1-1.8-6.4 0-2.1.5-4.1 1.5-5.9s2.3-3.3 4-4.5c1.3-.9 3-1.7 5.1-2.4 2.2-.6 4.5-1 7-1 3.7 0 7 .5 9.9 1.6s4.9 2.5 6.3 4.4 2.3 4.3 2.8 7.4l-7.9 1.1c-.4-2.5-1.4-4.4-3.1-5.7-1.7-1.4-4.2-2.1-7.3-2.1-3.7 0-6.4.6-7.9 1.8-1.6 1.2-2.4 2.7-2.4 4.3 0 1 .3 2 1 2.8.7.9 1.7 1.6 3.1 2.2.8.3 3.2 1 7.1 2.1 5.7 1.5 9.7 2.8 12 3.7 2.3 1 4 2.4 5.3 4.2 1.3 1.9 1.9 4.2 1.9 6.9s-.8 5.2-2.4 7.6c-1.6 2.4-3.8 4.2-6.8 5.5-3 1.3-6.3 2-10.1 2-6.2 0-10.9-1.3-14.2-3.9-3.3-2.5-5.3-6.3-6.2-11.4zM492.5 109.2l7.9 1c-.9 5.5-3.1 9.8-6.7 12.9-3.6 3.1-8 4.6-13.2 4.6-6.5 0-11.8-2.1-15.7-6.4-4-4.3-5.9-10.4-5.9-18.3 0-5.1.9-9.7 2.6-13.5 1.7-3.9 4.3-6.8 7.8-8.7 3.5-1.9 7.3-2.9 11.4-2.9 5.2 0 9.4 1.3 12.7 3.9 3.3 2.6 5.4 6.3 6.3 11.2l-7.9 1.2c-.7-3.2-2.1-5.6-4-7.2-1.9-1.6-4.2-2.4-6.9-2.4-4.1 0-7.4 1.5-9.9 4.4s-3.8 7.5-3.8 13.8c0 6.4 1.2 11.1 3.7 14 2.5 2.9 5.7 4.4 9.6 4.4 3.2 0 5.8-1 7.9-2.9 2.2-2.1 3.5-5.1 4.1-9.1zM507.2 126.7V79h7.3v7.2c1.9-3.4 3.6-5.6 5.1-6.7 1.6-1.1 3.3-1.6 5.2-1.6 2.7 0 5.5.9 8.3 2.6l-2.8 7.5c-2-1.2-4-1.8-5.9-1.8-1.8 0-3.4.5-4.8 1.6s-2.4 2.5-3 4.4c-.9 2.9-1.3 6-1.3 9.4v25h-8.1zM538 70.1v-9.3h8.1v9.3H538zm0 56.6V79h8.1v47.7H538zM565.8 126.7h-7.5V60.8h8.1v23.5c3.4-4.3 7.8-6.4 13.1-6.4 2.9 0 5.7.6 8.3 1.8 2.6 1.2 4.8 2.8 6.5 5 1.7 2.1 3 4.7 4 7.7s1.4 6.3 1.4 9.7c0 8.2-2 14.5-6.1 18.9-4 4.5-8.9 6.7-14.5 6.7s-10-2.3-13.2-7v6zm-.1-24.2c0 5.7.8 9.8 2.3 12.4 2.5 4.2 6 6.2 10.3 6.2 3.5 0 6.6-1.5 9.2-4.6 2.6-3.1 3.9-7.6 3.9-13.7 0-6.2-1.2-10.8-3.7-13.8s-5.5-4.4-9-4.4-6.6 1.5-9.2 4.6c-2.5 3-3.8 7.5-3.8 13.3zM642.1 111.3l8.3 1c-1.3 4.9-3.8 8.7-7.3 11.4s-8.1 4-13.6 4c-7 0-12.5-2.1-16.6-6.4-4.1-4.3-6.1-10.3-6.1-18.1 0-8 2.1-14.2 6.2-18.7 4.1-4.4 9.5-6.6 16.1-6.6 6.4 0 11.6 2.2 15.6 6.5s6.1 10.4 6.1 18.3v2.2h-35.6c.3 5.2 1.8 9.2 4.4 12 2.7 2.8 6 4.2 10 4.2 3 0 5.5-.8 7.6-2.3 2.1-1.6 3.7-4.1 4.9-7.5zm-26.5-13.1h26.6c-.4-4-1.4-7-3.1-9-2.6-3.1-5.9-4.7-10-4.7-3.7 0-6.8 1.2-9.4 3.7-2.4 2.6-3.8 5.9-4.1 10z"/></svg>`;
}
