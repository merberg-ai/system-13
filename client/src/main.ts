import { System13App } from "./app/app.js";
const app=new System13App();void app.start().catch((error)=>{console.error(error);const output=document.querySelector<HTMLDivElement>("#terminal-output");if(output)output.textContent=`SYSTEM 13 FATAL ERROR\n\n${error instanceof Error?error.message:String(error)}`;});
