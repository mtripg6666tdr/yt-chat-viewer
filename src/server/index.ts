require("dotenv").config();
import express from "express";
import { chatObtainManager } from "./chatObtainQueue";
import { responseStaticContent } from "./util";

const app = express();
const queue = new chatObtainManager();

app.get(["/", "/index.html"], (req, res) => {
  res.writeHead(200, "OK", {
    "Content-Type": "text/html; charset=utf-8"
  });
  responseStaticContent(res, "index.html");
});

app.get("/common/app.js", (req, res) => {
  res.writeHead(200, "OK", {
    "Content-Type": "text/javascript; charset=utf-8"
  });
  responseStaticContent(res, "app.js");
});

app.get("/common/app.js.LICENSE.txt", (req, res) => {
  res.writeHead(200, "OK", {
    "Content-Type": "text/plain; charset=utf-8"
  });
  responseStaticContent(res, "app.js.LICENSE.txt");
})

app.get("/api/chat", async (req, res) => {
  const url = req.query["url"] as string;
  res.writeHead(200, "OK", {
    "Content-Type": "application/json; charset=utf-8"
  });
  res.end(JSON.stringify(await queue.get(url)));
});

const server = app.listen(80);

server.on("listening", () => console.log("server started"));