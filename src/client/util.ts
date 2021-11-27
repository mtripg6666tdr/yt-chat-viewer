export function convertTimestampToSeconds(timestamp:string){
  if(!timestamp[0]) return 0;
  return timestamp.split(":")
  .reverse()
  .map((a ,i) => Math.abs(Number(a)) * Math.pow(60,i))
  .reduce((a, b) => a + b) * (timestamp[0] === "-" ? -1 : 1);
}

export function roundFloat(num:number, digit:number){
  const k = Math.pow(10, digit);
  return Math.round(num * k) / k;
}