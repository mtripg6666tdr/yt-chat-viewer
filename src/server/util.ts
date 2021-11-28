import { Response } from "express-serve-static-core";
import * as fs from "fs";
import * as path from "path";

export function responseStaticContent(res:Response<any, Record<string, any>, number>, fileName:string){
  fs.createReadStream(path.join(__dirname, "../common/", fileName)).pipe(res);
}