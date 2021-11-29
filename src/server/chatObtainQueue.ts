import { AuthorPhotoThumbnail, FluffyRun, LiveChatItem } from "./apiChatJson";
import { SHA1 } from "crypto-js";
import * as fs from "fs";
import { ChildProcess, spawn } from "child_process";
import ytdl from "ytdl-core";

export type chatItem = {
  text:FluffyRun[],
  author:string,
  mod:boolean,
  icons:AuthorPhotoThumbnail[],
  timestamp:string,
  channelId:string,
  paid?:string,
};
export type chatStatus = chatOKStatus|chatNotFoundStatus|chatPreparingStatus|chatErrorStatus;
export type chatOKStatus = {
  state:"OK";
  chatItem?: chatItem[];
  id?: string;
}
export type chatNotFoundStatus = {
  state:"notfound";
}
export type chatErrorStatus = {
  state:"error";
  message:string;
}
export type chatPreparingStatus = {
  state:"preparing";
  log:string;
}

export class chatObtainManager {
  private procs: {
    [id: string]: {
      proc: ChildProcess,
      log: string,
      error: boolean,
    }
  } = {};

  check(url:string):chatStatus{
    const id = SHA1(url).toString();
    const filePath = `./cache/${id}.live_chat.json`;
    if(fs.existsSync(filePath)){
      return {
        state:"OK"
      };
    }else if(this.procs[id]){
      if(!this.procs[id].error){
        return {
          state: "preparing",
          log: this.procs[id].log,
        };
      }else{
        return {
          state: "error",
          message: "チャット情報の取得時に問題が発生しました"
        };
      }
    }else{
      return {
        state: "notfound"
      };
    }
  }

  async get(url:string):Promise<chatStatus>{
    if(!ytdl.validateURL(url)){
      return {
        state: "error",
        message: "有効なURLではありません"
      }
    }
    const id = SHA1("https://www.youtube.com/watch?v=" + ytdl.getVideoID(url)).toString();
    const filePath = `./cache/${id}.live_chat.json`;
    if(fs.existsSync(filePath)){
      if(this.procs[id]){
        delete this.procs[id];
      }
      const rawData = fs.readFileSync(filePath, {encoding: "utf-8"});
      let chatData = null as LiveChatItem[];
      try{
        chatData = JSON.parse(rawData);
      }
      catch{
        try {
          chatData = JSON.parse("[" + rawData.trim().split("\n").join(",") + "]");
        }
        catch{
          return {
            state: "error",
            message: "チャット情報の解析に失敗しました"
          };
        }
      }
      const chatItem = [] as chatItem[];
      for(let i = 0; i < chatData.length; i++){
        if(
          chatData[i].replayChatItemAction.actions[0].addChatItemAction
        ){
          const item = chatData[i].replayChatItemAction.actions[0].addChatItemAction.item;
          if(item.liveChatTextMessageRenderer){
            const renderer = item.liveChatTextMessageRenderer;
            chatItem.push({
              text: renderer.message.runs,
              author: renderer.authorName && renderer.authorName.simpleText,
              icons: renderer.authorPhoto.thumbnails,
              timestamp: renderer.timestampText.simpleText,
              channelId: renderer.authorExternalChannelId,
              mod: Boolean(renderer.authorBadges && renderer.authorBadges.findIndex(badge => badge.liveChatAuthorBadgeRenderer.tooltip === "Moderator") >= 0),
            });
          }else if(item.liveChatPaidMessageRenderer){
            const renderer = item.liveChatPaidMessageRenderer;
            chatItem.push({
              text: renderer.message ? renderer.message.runs : [],
              author: renderer.authorName && renderer.authorName.simpleText,
              icons: renderer.authorPhoto.thumbnails,
              timestamp: renderer.timestampText.simpleText,
              channelId: renderer.authorExternalChannelId,
              paid: renderer.purchaseAmountText.simpleText,
              mod: false,
            });
          }else if(item.liveChatPaidStickerRenderer){
            const renderer = item.liveChatPaidStickerRenderer;
            chatItem.push({
              text: [{
                text: `スタンプを送信しました: ${renderer.sticker.accessibility.accessibilityData.label}`
              }],
              author: renderer.authorName && renderer.authorName.simpleText,
              icons: renderer.authorPhoto.thumbnails,
              timestamp: renderer.timestampText.simpleText,
              channelId: renderer.authorExternalChannelId,
              paid: renderer.purchaseAmountText.simpleText,
              mod: false,
            });
          }
        }
      }
      return {
        state:"OK",
        chatItem,
        id: ytdl.getURLVideoID(url)
      };
    }else if(this.procs[id]){
      if(!this.procs[id].error){
        return {
          state: "preparing",
          log: this.procs[id].log,
        };
      }else{
        delete this.procs[id];
        return {
          state: "error",
          message: "チャット情報取得時に問題が発生しました"
        };
      }
    }else{
      let basic = null as ytdl.videoInfo;
      try{
        basic = await ytdl.getBasicInfo(url);
      }
      catch{
        return {
          state: "error",
          message: "データを取得できません"
        }
      }
      if(!basic.videoDetails.liveBroadcastDetails){
        return {
          state: "error",
          message: "ライブ配信/プレミア公開の動画ではありません"
        }
      }else if(basic.videoDetails.liveBroadcastDetails.isLiveNow){
        return {
          state: "error",
          message: "ライブ配信/プレミア公開は現在進行中です"
        }
        // @ts-ignore
      }else if(!basic.videoDetails.liveBroadcastDetails.endTimestamp){
        return {
          state: "error",
          message: "ライブ配信/プレミア公開は開始されていません"
        }
      }
      const maxCacheSize = Number(process.env["CACHE_SIZE"]);
      if(!isNaN(maxCacheSize) && maxCacheSize > 0 && fs.existsSync("./cache")){
        const cached = fs.readdirSync("./cache", {withFileTypes: true})
          .filter(d => d.isFile())
          .map(d => ({
            name: d.name,
            stat: fs.statSync("./cache/" + d.name)
          }));
        const totalSize = cached[0] ? cached.map(d => d.stat.size).reduce((a, b) => a + b) : 0;
        if(totalSize > 1024 /* KB */ * 1024 /* MB */ * maxCacheSize){
          cached.sort((a, b) => b.stat.ctimeMs - a.stat.ctimeMs);
          do{
            if(cached.length === 0) break;
            fs.unlinkSync("./cache/" + cached.shift().name);
          }while(cached.length > 0 && 
            cached.map(d => d.stat.size).reduce((a, b) => a + b) >= 1024 * 1024 * maxCacheSize);
        }
      }
      const proc = spawn("./yt-dlp", [
        "--skip-download",
        "--write-subs",
        "--sub-langs", "live_chat",
        "--output", "./cache/" + id.toString(),
        url
      ], {
        stdio: ["ignore", "pipe", process.stderr]
      });
      proc
        .on("error", (err) => {
          this.procs[id].error = true;
        })
        .on("exit", () => {
          if(!fs.existsSync(filePath)){
            this.procs[id].error = true;
          }
        })
      proc.stdout.on("data", (chunk) => {
        const chunkStr = chunk.toString() as string;
        if(this.procs[id] && !chunkStr.includes("Destination") && !chunkStr.includes("live_chat.json")){
          this.procs[id].log = (this.procs[id].log + chunkStr).replace(/\r.+\r/sg, "\r");
        }
      })
      this.procs[id] = {
        proc, 
        log: "",
        error: false
      };
      return {
        state: "preparing",
        log: ""
      };
    }
  }
}