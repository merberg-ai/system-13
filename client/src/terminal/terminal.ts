export class TerminalUI {
  private readonly terminal: HTMLElement; private readonly output: HTMLDivElement; private readonly promptNode: HTMLSpanElement; private readonly input: HTMLInputElement; private submitHandler:((value:string)=>void|Promise<void>)|null=null; private commandHistory:string[]=[]; private historyIndex=0;
  constructor(){this.terminal=this.requireElement<HTMLElement>("#terminal");this.output=this.requireElement<HTMLDivElement>("#terminal-output");this.promptNode=this.requireElement<HTMLSpanElement>("#terminal-prompt");this.input=this.requireElement<HTMLInputElement>("#terminal-input");this.terminal.addEventListener("click",()=>this.input.focus());this.input.addEventListener("keydown",e=>this.handleKey(e));}
  private requireElement<T extends Element>(selector:string):T{const element=document.querySelector<T>(selector);if(!element)throw new Error(`terminal element missing: ${selector}`);return element;}
  onSubmit(handler:(value:string)=>void|Promise<void>):void{this.submitHandler=handler;}
  setPrompt(prompt:string,masked=false):void{this.promptNode.textContent=prompt;this.input.classList.toggle("masked",masked);this.input.setAttribute("aria-label",masked?"Password":"Terminal input");this.focus();}
  write(line=""):void{const node=document.createElement("div");node.className="terminal-line";node.textContent=line||"\u00a0";this.output.append(node);this.scrollBottom();}
  writeLines(lines:string[]):void{for(const line of lines)this.write(line);}
  echo(prompt:string,value:string,masked:boolean):void{this.write(masked?prompt:`${prompt}${value}`);}
  clear():void{this.output.replaceChildren();}
  focus():void{this.input.focus({preventScroll:true});}
  async pause(milliseconds:number):Promise<void>{await new Promise<void>(resolve=>window.setTimeout(resolve,milliseconds));}
  private scrollBottom():void{this.terminal.scrollTop=this.terminal.scrollHeight;}
  private handleKey(event:KeyboardEvent):void{if(event.key==="Enter"){event.preventDefault();const value=this.input.value,masked=this.input.classList.contains("masked");if(!masked&&value.trim()){this.commandHistory.push(value);if(this.commandHistory.length>100)this.commandHistory.shift();}this.historyIndex=this.commandHistory.length;this.input.value="";void this.submitHandler?.(value);return;}if(event.key==="ArrowUp"&&!this.input.classList.contains("masked")){event.preventDefault();if(this.historyIndex>0)this.historyIndex-=1;this.input.value=this.commandHistory[this.historyIndex]??"";queueMicrotask(()=>this.input.setSelectionRange(this.input.value.length,this.input.value.length));return;}if(event.key==="ArrowDown"&&!this.input.classList.contains("masked")){event.preventDefault();if(this.historyIndex<this.commandHistory.length)this.historyIndex+=1;this.input.value=this.commandHistory[this.historyIndex]??"";}}
}
