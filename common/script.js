(function(_this){
  const urlBox = _this.document.getElementById("v_url");
  const sendButton = _this.document.getElementById("v_send");
  const status = _this.document.getElementById("status");
  sendButton.addEventListener("click", () => {
    urlBox.disabled = true;
    sendButton.disabled = true;
    const errorHandler = () => {
      urlBox.disabled = false;
      sendButton.disabled = false;
      status.textContent = "チャットの取得に失敗しました";
    };
    const dataReceivedHandler = (data, id) => {
      const rightColumn = $(".right_column").empty()
      for(let i = 0; i < data.length; i++){
        const {text, author, icons, timestamp} = data[i];
        rightColumn
        .append(
          $("<div></div>")
          .addClass("row")
          .append(
            $("<div></div>")
            .append(
              $("<img>")
              .attr("src", icons[0] ? icons[0].url : "about:blank")
            )
          )
          .append(
            $("<div></div>")
            .append(
              $("<span></span>")
              .text(author)
            )
          )
          .append(
            $("<div></div>")
            .append(
              $("<span></span>")
              .text(timestamp)
            )
          )
          .append(
            $("<div></div>")
            .append(
              $("<span></span>")
              .text(text)
            )
          )
        );
      }

      $("#v_frame").empty().append(
        $("<iframe></iframe>")
        .attr("src", "https://www.youtube.com/embed/" + id)
      );
      urlBox.disabled = false;
      sendButton.disabled = false;
      status.textContent = "";
    };
    const dataReceive = () => {
      fetch(`/api/chat?url=${urlBox.value}`)
      .then((res) => {
        res.json().then((data) => {
          if(data.state === "OK"){
            status.textContent = "処理中...";
            dataReceivedHandler(data.chatItem, data.id);
          }else if(data.state === "preparing"){
            status.textContent = "準備中...\r\n" + data.log.replace(/\r.+\r/s, "");
            setTimeout(dataReceive, 2000);
          }else{
            errorHandler();
          }
        })
        .catch(errorHandler);
      })
      .catch(errorHandler)
    };
    dataReceive();
  });
})(window);