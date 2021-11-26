import express from "express";
import * as fs from "fs";
import * as path from "path";
import { chatObtainManager } from "./chatObtainQueue";

const app = express();
const queue = new chatObtainManager();

app.get(["/", "/index.html"], (req, res) => {
  res.writeHead(200, "OK", {
    "Content-Type": "text/html; charset=utf-8"
  });
  fs.createReadStream(path.join(__dirname, "../common/index.html"), {encoding: "utf-8"})
    .pipe(res);
});

app.get("/common/main.js", (req, res) => {
  res.writeHead(200, "OK", {
    "Content-Type": "text/javascript; charset=utf-8"
  });
  fs.createReadStream(path.join(__dirname, "../common/script.js"), {encoding: "utf-8"})
    .pipe(res);
});

app.get("/api/chat", (req, res) => {
  const url = req.query["url"] as string;
  res.writeHead(200, "OK", {
    "Content-Type": "application/json; charset=utf-8"
  });
  res.end(JSON.stringify(queue.get(url)));
});

const server = app.listen(80);