import { convertTimestampToSeconds } from "./util";
import * as youtubeDisplayer from "./youtubeDisplayer";

export function onUserNameClicked(ev:JQuery.ClickEvent<HTMLElement, undefined, HTMLElement, HTMLElement>){
  const channelid = ev.target.dataset["cid"];
  channelid && window.open(`https://youtube.com/channel/${channelid}`, "_blank");
}

export function onTimestampClicked(ev:JQuery.ClickEvent<HTMLElement, undefined,HTMLElement, HTMLElement>){
  const timestamp = ev.target.textContent;
  if(!timestamp) return;
  const time = convertTimestampToSeconds(timestamp);
  if(time < 0) return;
  youtubeDisplayer.seekYouTubeFrame(time);
}