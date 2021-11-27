import { displayChat } from "./chatDisplayer";
import * as youtubeDisplayer from "./youtubeDisplayer";
import type { chatStatus } from "../server/chatObtainQueue";

export const urlBox = document.getElementById("v_url") as HTMLInputElement;
export const sendButton = document.getElementById("v_send") as HTMLButtonElement;
export const status = document.getElementById("status") as HTMLPreElement;
export const chatInfoHolder = document.getElementById("chat_info") as HTMLParagraphElement;
export const rightColumn = document.getElementsByClassName("right_column")[0] as HTMLDivElement;
export const videoFrameHolder = document.getElementById("v_frame") as HTMLDivElement;

(function(_this){
  const tag = document.createElement('script');

  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  window.onYouTubeIframeAPIReady = function(){
    youtubeDisplayer.setIframeAPIReady(true);
  };

  sendButton.addEventListener("click", () => {
    urlBox.disabled = true;
    sendButton.disabled = true;
    const errorHandler = () => {
      urlBox.disabled = false;
      sendButton.disabled = false;
      status.textContent = "チャットの取得に失敗しました";
    };
    const dataReceive = () => {
      fetch(`/api/chat?url=${urlBox.value}`)
      .then((res) => {
        res.json().then(((data) => {
          if(data.state === "OK"){
            status.textContent = "処理中...";
            setTimeout(() => displayChat(data.chatItem, data.id), 300);
          }else if(data.state === "preparing"){
            status.textContent = "準備中...\r\n" + data.log;
            setTimeout(dataReceive, 2000);
          }else{
            errorHandler();
          }
        }) as ((data:chatStatus)=>void))
        .catch(errorHandler);
      })
      .catch(errorHandler)
    };
    dataReceive();
    status.textContent = "チャット情報を取得中...";
  });
})(window);