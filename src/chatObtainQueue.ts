import { AuthorPhotoThumbnail, LiveChatItem } from "./chatJson";
import { SHA1 } from "crypto-js";
import * as fs from "fs";
import { ChildProcess, spawn } from "child_process";
import ytdl from "ytdl-core";

export type chatItem = {
  text:string,
  author:string,
  icons:AuthorPhotoThumbnail[],
  timestamp:string,
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
          state: "error"
        };
      }
    }else{
      return {
        state: "notfound"
      };
    }
  }

  get(url:string):chatStatus{
    const id = SHA1(url).toString();
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
            state: "error"
          };
        }
      }
      const chatItem = [] as chatItem[];
      for(let i = 0; i < chatData.length; i++){
        if(
          chatData[i].replayChatItemAction.actions[0].addChatItemAction &&
          chatData[i].replayChatItemAction.actions[0].addChatItemAction.item.liveChatTextMessageRenderer
        ){
          const renderer = chatData[i].replayChatItemAction.actions[0].addChatItemAction.item.liveChatTextMessageRenderer;
          chatItem.push({
            text: renderer.message.runs[0].text,
            author: renderer.authorName.simpleText,
            icons: renderer.authorPhoto.thumbnails,
            timestamp: renderer.timestampText.simpleText
          });
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
        return {
          state: "error"
        };
      }
    }else{
      if(!ytdl.validateURL(url)){
        return {
          state: "error"
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
        if(this.procs[id]){
          this.procs[id].log += chunk;
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