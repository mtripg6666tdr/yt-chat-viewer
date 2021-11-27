import $ from "jquery";
import { sendButton, urlBox, status, chatInfoHolder, rightColumn as _rightColumn, videoFrameHolder } from ".";
import * as chatActions from "./chatActions";
import type { chatItem } from "../server/chatObtainQueue";
import { convertTimestampToSeconds, roundFloat } from "./util";
import { displayYouTubeFrame } from "./youtubeDisplayer";

const newDivElement = "<div></div>";
const newImgElement = "<img>";
const newSpanElement = "<span></span>";
export function displayChat(data:chatItem[], id:string){
  const rightColumn = $(_rightColumn).empty();
  rightColumn.css("visibility", "false");
  for(let i = 0; i < data.length; i++){
    const {
      text, 
      author, 
      icons, 
      timestamp,
      channelId,
      paid,
    } = data[i];
    const chatContent = $(newDivElement);
    if(paid) {
      chatContent
      .addClass("c_paid")
      .append(
        $(newSpanElement)
        .text("[" + paid + "]")
      );
    }
    for(let j = 0; j < text.length; j++){
      if(text[j].text){
        chatContent.append(
          $(newSpanElement)
          .text(text[j].text)
        )
      }else if(text[j].emoji){
        chatContent.append(
          $(newImgElement)
          .attr("src", text[j].emoji.image.thumbnails[0].url)
          .addClass("c_emoji")
        )
      }
    }
    rightColumn
    .append(
      $(newDivElement)
      .addClass("row")
      .append(
        $(newDivElement)
        .append(
          $(newImgElement)
          .attr("src", icons[0] ? icons[0].url : "about:blank")
        )
      )
      .append(
        $(newDivElement)
        .append(
          $(newSpanElement)
          .text(author)
          .attr("data-cid", channelId)
          .on("click", chatActions.onUserNameClicked)
        )
      )
      .append(
        $(newDivElement)
        .append(
          $(newSpanElement)
          .text(timestamp)
          .on("click", chatActions.onTimestampClicked)
        )
      )
      .append(
        chatContent
      )
    );
    status.textContent = `処理中...(${i + 1}件/${data.length}件)`;
  }
  rightColumn.css("visibility", "true");

  displayYouTubeFrame(videoFrameHolder.id, id);

  status.textContent = "統計を計算中...";

  // チャットの時間的長さ
  const duration = (convertTimestampToSeconds(data[data.length - 1].timestamp) - convertTimestampToSeconds(data[0].timestamp))/60;
  // ユーザー
  const users = new Set(data.map(item => item.channelId));
  // メッセージの長さの配列
  const lengthList = 
    data
      .map(item => item.text.filter(fl2 => fl2.text).map(fl2 => fl2.text).join(""))
      .filter(_text => _text && _text != "")
      .map(_text => _text.length);
  // 平均文字数
  const aveLength = lengthList.reduce((a, b) => a + b) / lengthList.length;
  // ユーザーごとのチャット数の算出
  const userMessageCount = {} as {[key:string]:number};
  data.forEach(item => userMessageCount[item.author] = (userMessageCount[item.author] || 0) + 1);
  const messageCounts = Object.values(userMessageCount)
  const max = messageCounts.reduce((a, b) => a > b ? a : b);
  const min = messageCounts.reduce((a, b) => a > b ? b : a);
  // スパチャ数計算
  let scCount = 0;
  data.forEach(item => scCount += item.paid ? 1 : 0);

  // 諸統計を表示
  chatInfoHolder.textContent = 
  `チャット総数:${data.length}件・チャット速度:${roundFloat(data.length / duration, 2)}件/分・参加ユーザー数:${users.size}人・平均文字数:${roundFloat(aveLength, 2)}文字・一ユーザー当たり最大数:${max}件・一ユーザー当たり最小数:${min}・スパチャ数:${scCount}件`
  ;

  urlBox.disabled = false;
  sendButton.disabled = false;

  status.textContent = "";
}