import $ from "jquery";
import { sendButton, urlBox, status, chatInfoHolder, rightColumn as _rightColumn, videoFrameHolder } from ".";
import * as chatActions from "./chatActions";
import type { chatItem } from "../server/chatObtainQueue";
import { convertTimestampToSeconds, roundFloat } from "./util";
import { displayYouTubeFrame } from "./youtubeDisplayer";

const newDivElement = "<div></div>";
const newImgElement = "<img>";
const newSpanElement = "<span></span>";
const modIcon = "<svg viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'><g><path d='M9.64589146,7.05569719 C9.83346524,6.562372 9.93617022,6.02722257 9.93617022,5.46808511 C9.93617022,3.00042984 7.93574038,1 5.46808511,1 C4.90894765,1 4.37379823,1.10270499 3.88047304,1.29027875 L6.95744681,4.36725249 L4.36725255,6.95744681 L1.29027875,3.88047305 C1.10270498,4.37379824 1,4.90894766 1,5.46808511 C1,7.93574038 3.00042984,9.93617022 5.46808511,9.93617022 C6.02722256,9.93617022 6.56237198,9.83346524 7.05569716,9.64589147 L12.4098057,15 L15,12.4098057 L9.64589146,7.05569719 Z'></path></g></svg>";
export function displayChat(data:chatItem[], id:string){
  const rightColumn = $(_rightColumn).empty();
  rightColumn.css("visibility", "hidden");
  const chatElems = [] as JQuery<HTMLElement>[];
  for(let i = 0; i < data.length; i++){
    const {
      text, 
      author, 
      icons, 
      timestamp,
      channelId,
      paid,
      mod,
    } = data[i];
    const chatContent = $(newDivElement);
    // スパチャ系の処理
    if(paid) {
      chatContent
      .addClass("c_paid")
      .append(
        $(newSpanElement)
        .text("[" + paid + "]")
      );
    }
    // モデレーターの処理
    const channelNameElems = [
      $(newSpanElement)
      .text(author)
      .attr("data-cid", channelId)
      .on("click", chatActions.onUserNameClicked)
    ];
    if(mod){
      channelNameElems.push(
        $(modIcon)
      );
      channelNameElems.forEach(el => el.addClass("c_mod"));
    }
    // メッセージ内容の処理
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
    // DOM生成
    chatElems.push(
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
          ...channelNameElems
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
  status.textContent = "処理中...";
  rightColumn.append(...chatElems);
  rightColumn.css("visibility", "visible");

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
  const min = messageCounts.reduce((a, b) => a < b ? a : b);
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