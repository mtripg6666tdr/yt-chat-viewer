import $ from "jquery";
import { videoFrameHolder } from ".";

const YTPlayerInstance = [] as YT.Player[];

let iframeAPIReady = false;

export function setIframeAPIReady(ready:true){
  iframeAPIReady = true;
}

export function displayYouTubeFrame(targetId:string, videoId:string){
  if(!iframeAPIReady) return;
  $(videoFrameHolder).empty();
  if(YTPlayerInstance[0]){
    YTPlayerInstance[0].destroy();
  }
  YTPlayerInstance[0] = new YT.Player(targetId, { videoId , events: {
    onReady: (ev) => {
      ev.target.playVideo();
      setTimeout(() => ev.target.pauseVideo(), 500);
    }
  }});
}

export function seekYouTubeFrame(seconds:number){
  if(!YTPlayerInstance[0]) return;
  YTPlayerInstance[0].seekTo(seconds, true);
}