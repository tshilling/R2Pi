//############# Requires #############
let Authorized = false;
let socket = io();
let Color_Class = function(r,g,b,a){
  let R=r||0;
  let G=g||0;
  let B=b||0;
  let A=a||0;
  this.GetColorString = function(){
    return 'rgba('+R+','+G+','+B+','+A+')';
  }
  this.clone = function(){
    return new Color_Class(R,G,B,A);
  }
  this.multiply = function(input){
    R*=input;
    G*=input;
    B*=input;
    this.Clip();
    return this;
  }
  this.setAlpha = function(input){
    A=input;
    this.Clip();
    return this;
  }
  this.Clip = function(){
    R=Math.round(Math.min(255,Math.max(R,0)));
    G=Math.round(Math.min(255,Math.max(G,0)));
    B=Math.round(Math.min(255,Math.max(B,0)));
    A=Math.min(1,Math.max(A,0));
    return this;
  }
  this.rgbToHsl = function(r, g, b){
      r /= 255, g /= 255, b /= 255;
      var max = Math.max(r, g, b), min = Math.min(r, g, b);
      var h, s, l = (max + min) / 2;

      if(max == min){
          h = s = 0; // achromatic
      }else{
          var d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch(max){
              case r: h = (g - b) / d + (g < b ? 6 : 0); break;
              case g: h = (b - r) / d + 2; break;
              case b: h = (r - g) / d + 4; break;
          }
          h /= 6;
      }
      return [h, s, l];
  }
  this.hslToRgb = function(h, s, l){
      var r, g, b;

      if(s == 0){
          r = g = b = l; // achromatic
      }else{
          var hue2rgb = function hue2rgb(p, q, t){
              if(t < 0) t += 1;
              if(t > 1) t -= 1;
              if(t < 1/6) return p + (q - p) * 6 * t;
              if(t < 1/2) return q;
              if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
              return p;
          }

          var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          var p = 2 * l - q;
          r = hue2rgb(p, q, h + 1/3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1/3);
      }

      return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }
  this.Shift = function(input){
    let hsl = this.rgbToHsl(R,G,B);
    hsl[0]+=input;
    hsl[0]=hsl[0]%1;
    let rgb = this.hslToRgb(hsl[0],hsl[1],hsl[2]);
    R=rgb[0];
    G=rgb[1];
    B=rgb[2];
    return this;
  }
  this.Clip();
}
//############# Styling ##############
const MARGIN = 15;
const COLOR_PALLET = new Color_Class(19,107,175,1).Shift(0).multiply(1.5);
//############### GUI ################
const DESIGN_WIDTH = 2560;
const DESIGN_HEIGHT = 1440;
const HEADER_HEIGHT = 125;
const FOOTER_HEIGHT = 0;
const BODY_HEIGHT = DESIGN_HEIGHT-HEADER_HEIGHT-FOOTER_HEIGHT;
const LEFT_COLUMN_WIDTH = DESIGN_WIDTH/3;
const RIGHT_COLUMN_WIDTH = DESIGN_WIDTH/3;
const CENTER_COLUMN_WIDTH = DESIGN_WIDTH-LEFT_COLUMN_WIDTH-RIGHT_COLUMN_WIDTH;
let Background = new createjs.Shape();
  Background.graphics.beginLinearGradientFill([COLOR_PALLET.clone().multiply(.5).GetColorString(),COLOR_PALLET.clone().multiply(.3).GetColorString()], [0, 1], 0, 0, 0, DESIGN_HEIGHT);
  Background.graphics.drawRoundRect(0,0,DESIGN_WIDTH,DESIGN_HEIGHT,10);
  Background.graphics.endFill();
//############## LAYOUT ##############
let StageCont = new createjs.Container();
  let BlackOut = new createjs.Shape();
  BlackOut.graphics.beginFill("rgba(200,100,100,.5)");
  BlackOut.graphics.drawRect(0,0,DESIGN_WIDTH,DESIGN_HEIGHT);
  BlackOut.graphics.endFill();
  let Battery_Meter = new barGraphClass(1*DESIGN_WIDTH/6,0,DESIGN_WIDTH/6-2,HEADER_HEIGHT-2,12,19,"volt",1);
  let Latency_Meter = new barGraphClass(4*DESIGN_WIDTH/6,0,DESIGN_WIDTH/6-2,HEADER_HEIGHT-2,200,0,"msec",0);
  let Left_Sub_Menu = new leftMenu(0,0,LEFT_COLUMN_WIDTH,BODY_HEIGHT);
    let Button_Power = new buttonClass("SHUTDOWN",0,5*(BODY_HEIGHT-2*MARGIN)/6,(LEFT_COLUMN_WIDTH-(2*MARGIN))/2,(BODY_HEIGHT-2*MARGIN)/6,callD = function(){},callU = function(){
      if(confirm("Are you sure you wish to power off?")==true){
        socket.emit("action",[ID,"poweroff"]);
        console.log("PowerOff");
      }
    },COLOR_PALLET);
    Left_Sub_Menu.Container.addChild(Button_Power.Container);
    let Button_Reboot = new buttonClass("REBOOT",(LEFT_COLUMN_WIDTH-(2*MARGIN))/2,5*(BODY_HEIGHT-2*MARGIN)/6,(LEFT_COLUMN_WIDTH-(2*MARGIN))/2,(BODY_HEIGHT-2*MARGIN)/6,callD = function(){},callU = function(){
      if(confirm("Are you sure you wish to reboot?")==true){
        socket.emit("action",[ID,"reboot"]);
        console.log("Reboot");
      }
    },COLOR_PALLET);
    Left_Sub_Menu.Container.addChild(Button_Reboot.Container);
    let systemText = new createjs.Text("System:","75px Arial","$ff7700");
    systemText.x=2*MARGIN;
    systemText.y=5*(BODY_HEIGHT-2*MARGIN)/6-MARGIN-systemText.getBounds().height;
    Left_Sub_Menu.Container.addChild(systemText);
    let VolumeD = new buttonClass("-",0,3.5*(BODY_HEIGHT-2*MARGIN)/6,(LEFT_COLUMN_WIDTH-(2*MARGIN))/4,(BODY_HEIGHT-2*MARGIN)/6,callD = function(){},callU = function()
    {
      Volume_Meter.setValue(Volume_Meter.getValue()-.1);
      socket.emit("action",[ID,'volume',Volume_Meter.getValue()]);
    },COLOR_PALLET);
    Left_Sub_Menu.Container.addChild(VolumeD.Container);
    let VolumeU = new buttonClass("+",(LEFT_COLUMN_WIDTH-(2*MARGIN))/4,3.5*(BODY_HEIGHT-2*MARGIN)/6,(LEFT_COLUMN_WIDTH-(2*MARGIN))/4,(BODY_HEIGHT-2*MARGIN)/6,callD = function(){},callU = function()
    {
      Volume_Meter.setValue(0.1+Volume_Meter.getValue());
      socket.emit("action",[ID,'volume',Volume_Meter.getValue()]);
    },COLOR_PALLET);
    Left_Sub_Menu.Container.addChild(VolumeU.Container);
    let Volume_Meter = new barGraphClass(2*(LEFT_COLUMN_WIDTH-2*MARGIN)/4,3.5*(BODY_HEIGHT-2*MARGIN)/6,(LEFT_COLUMN_WIDTH-2*MARGIN)/2,(BODY_HEIGHT-2*MARGIN)/6,0,1,null,1);
    Left_Sub_Menu.Container.addChild(Volume_Meter.Container);
    Volume_Meter.setStepped(false);
    Volume_Meter.setGraphed(false);
    let volumeText = new createjs.Text("Volume:","75px Arial","$ff7700");
    volumeText.x=2*MARGIN;
    volumeText.y=3.5*(BODY_HEIGHT-2*MARGIN)/6-MARGIN-systemText.getBounds().height;
    Left_Sub_Menu.Container.addChild(volumeText);

    //Volume_Meter.setValue(.5);
  Left_Sub_Menu.Container.visible = false;
  let Center_Sub_Menu = new leftMenu(0,0,CENTER_COLUMN_WIDTH,BODY_HEIGHT);
    let mytext1 = new createjs.Text("MOTORS",70+"px Arial","$ff7700");
    mytext1.x = MARGIN;
    mytext1.y = MARGIN;
    Center_Sub_Menu.Container.addChild(mytext1);
    let mytextBits = new createjs.Text("(BIT)",50+"px Arial","$ff7700");
    mytextBits.x = (CENTER_COLUMN_WIDTH-2*MARGIN)*.3+(CENTER_COLUMN_WIDTH-2*MARGIN)*.7/2-mytextBits.getBounds().width/2;
    mytextBits.y = MARGIN;
    Center_Sub_Menu.Container.addChild(mytextBits);
    for(let i = 0;i<9;i++){
      let mytext = new createjs.Text(i,50+"px Arial","$ff7700");
      mytext.y = MARGIN+(BODY_HEIGHT-2*MARGIN)/14;
      mytext.x = 30+(CENTER_COLUMN_WIDTH-2*MARGIN)*.3+i*(CENTER_COLUMN_WIDTH-2*MARGIN)*(1-.3)/9.5;
      Center_Sub_Menu.Container.addChild(mytext);
    }
    let LeftLED0 = new LEDClass("L FOOT",0,2*(BODY_HEIGHT-2*MARGIN)/14,(CENTER_COLUMN_WIDTH-2*MARGIN),(BODY_HEIGHT-2*MARGIN)/14,9,COLOR_PALLET.clone().Shift(.75).GetColorString(),COLOR_PALLET.clone().Shift(.75).multiply(.25).setAlpha(1).GetColorString());
    Center_Sub_Menu.Container.addChild(LeftLED0.Container);
    let RightLED0 = new LEDClass("R FOOT",0,3*(BODY_HEIGHT-2*MARGIN)/14,(CENTER_COLUMN_WIDTH-2*MARGIN),(BODY_HEIGHT-2*MARGIN)/14,9,COLOR_PALLET.clone().Shift(.75).GetColorString(),COLOR_PALLET.clone().Shift(.75).multiply(.25).setAlpha(1).GetColorString());
    Center_Sub_Menu.Container.addChild(RightLED0.Container);
    let LeftLED1 = new LEDClass("L SERIAL",0,4*(BODY_HEIGHT-2*MARGIN)/14,(CENTER_COLUMN_WIDTH-2*MARGIN),(BODY_HEIGHT-2*MARGIN)/14,9,COLOR_PALLET.clone().Shift(.75).GetColorString(),COLOR_PALLET.clone().Shift(.75).multiply(.25).setAlpha(1).GetColorString());
    Center_Sub_Menu.Container.addChild(LeftLED1.Container);
    let RightLED1 = new LEDClass("R SERIAL",0,5*(BODY_HEIGHT-2*MARGIN)/14,(CENTER_COLUMN_WIDTH-2*MARGIN),(BODY_HEIGHT-2*MARGIN)/14,9,COLOR_PALLET.clone().Shift(.75).GetColorString(),COLOR_PALLET.clone().Shift(.75).multiply(.25).setAlpha(1).GetColorString());
    Center_Sub_Menu.Container.addChild(RightLED1.Container);
    // Note, Maestro Servo Controller says it returns 16 bits for a status request.  only 8 are used.  9 LEDs shown in control for symetry with other status indicators
    let ServoLED1 = new LEDClass("BODY",0,7*(BODY_HEIGHT-2*MARGIN)/14,(CENTER_COLUMN_WIDTH-2*MARGIN),(BODY_HEIGHT-2*MARGIN)/14,9,COLOR_PALLET.clone().Shift(.75).GetColorString(),COLOR_PALLET.clone().Shift(.75).multiply(.25).setAlpha(1).GetColorString());
    Center_Sub_Menu.Container.addChild(ServoLED1.Container);
    let mytext2 = new createjs.Text("SERVOS",70+"px Arial","$ff7700");
    mytext2.x = MARGIN;
    mytext2.y = 6.1*(BODY_HEIGHT-2*MARGIN)/14;
    Center_Sub_Menu.Container.addChild(mytext2);

    let logText = new createjs.Text("---","75px Arial","$ff7700");
    logText.x=2*MARGIN;
    logText.y=MARGIN;
    Center_Sub_Menu.Container.addChild(logText);
  Center_Sub_Menu.Container.visible = false;
  let Right_Sub_Menu = new leftMenu(0,0,RIGHT_COLUMN_WIDTH,BODY_HEIGHT);
  Right_Sub_Menu.Container.visible = false;
  let Left_Sub_Menu_Button = new buttonClass("SYSTEM",0,0,DESIGN_WIDTH/6,HEADER_HEIGHT,
    callD = function(){
      Left_Sub_Menu.Container.visible = true;
    },
    callU = function(){
      Left_Sub_Menu.Container.visible = false;
    });
    Left_Sub_Menu_Button.setMomentary(false);
  let Center_Sub_Menu_Button = new buttonClass("===",LEFT_COLUMN_WIDTH,0,CENTER_COLUMN_WIDTH,HEADER_HEIGHT,
    callD = function(){
      Center_Sub_Menu.Container.visible = true;
    },
    callU = function(){
      Center_Sub_Menu.Container.visible = false;
    });
    Center_Sub_Menu_Button.setMomentary(false);
  let Right_Sub_Menu_Button = new buttonClass("SECONDARY",5*DESIGN_WIDTH/6,0,DESIGN_WIDTH/6,HEADER_HEIGHT,
    callD = function(){
      Right_Sub_Menu.Container.visible = true;
    },
    callU = function(){
      Right_Sub_Menu.Container.visible = false;
    });
    Right_Sub_Menu_Button.setMomentary(false);
  StageCont.addChild(Background);
  let progressText = new createjs.Text("Interface: 0 % Loaded","100px Arial","$ff7700");
  StageCont.addChild(progressText);
  StageCont.addChild(Battery_Meter.Container);
  StageCont.addChild(Latency_Meter.Container);
  StageCont.addChild(Left_Sub_Menu_Button.Container);
  StageCont.addChild(Center_Sub_Menu_Button.Container);
  StageCont.addChild(Right_Sub_Menu_Button.Container);
  let Left_Column = new createjs.Container();
    Left_Column.setBounds(0,0,LEFT_COLUMN_WIDTH,BODY_HEIGHT);
    Left_Column.y = HEADER_HEIGHT;
    let Left_Joystick;  //Initialize after preload
    let toggle =0;
    let b1 = new buttonClass("B1",0,0,LEFT_COLUMN_WIDTH/2,BODY_HEIGHT/6,callD = function(){},callU = function()
    {
      toggle = 1-toggle;
      if(toggle == 1){
        socket.emit('action',[ID,"SERVO",6,"OPEN"]);
        socket.emit('action',[ID,"SERVO",7,"OPEN"]);
      }else{
        socket.emit('action',[ID,"SERVO",6,"CLOSE"]);
        socket.emit('action',[ID,"SERVO",7,"CLOSE"]);
      }
    },null);
    let b2 = new buttonClass("B2",LEFT_COLUMN_WIDTH/2,0,LEFT_COLUMN_WIDTH/2,BODY_HEIGHT/6,callButton,null);
    let b3 = new buttonClass("B3",0,BODY_HEIGHT/6,LEFT_COLUMN_WIDTH/2,BODY_HEIGHT/6,callButton,null);
    let b4 = new buttonClass("B4",LEFT_COLUMN_WIDTH/2,BODY_HEIGHT/6,LEFT_COLUMN_WIDTH/2,BODY_HEIGHT/6,callButton,null);
    Left_Column.addChild(b1.Container);
    Left_Column.addChild(b2.Container);
    Left_Column.addChild(b3.Container);
    Left_Column.addChild(b4.Container);
    Left_Column.addChild(Left_Sub_Menu.Container);
    StageCont.addChild(Left_Column);
  let CenterCont = new createjs.Container();
    CenterCont.setBounds(0,0,CENTER_COLUMN_WIDTH,BODY_HEIGHT);
    CenterCont.x = LEFT_COLUMN_WIDTH;
    CenterCont.y = HEADER_HEIGHT;
    StageCont.addChild(CenterCont);
    CenterCont.addChild(Center_Sub_Menu.Container);
  let Right_Column = new createjs.Container();
    Right_Column.setBounds(0,0,RIGHT_COLUMN_WIDTH,BODY_HEIGHT);
    Right_Column.x = DESIGN_WIDTH-RIGHT_COLUMN_WIDTH;
    Right_Column.y = HEADER_HEIGHT
    let Right_Slider;  //Initialize after preload
    let b5 = new buttonClass("ALARM",0,0,RIGHT_COLUMN_WIDTH/2,BODY_HEIGHT/6,callD = function(){},callU = function()
    {
      socket.emit("sound",[ID,"Words/ALARM/"]);
    },null);
    let b6 = new buttonClass("SCREAM",RIGHT_COLUMN_WIDTH/2,0,RIGHT_COLUMN_WIDTH/2,BODY_HEIGHT/6,callD = function(){},callU = function()
    {
      socket.emit("sound",[ID,"Words/SCREAM/"]);
    },null);
    let b7 = new buttonClass("PHRASE",0,BODY_HEIGHT/6,RIGHT_COLUMN_WIDTH/2,BODY_HEIGHT/6,callD = function(){},callU = function()
    {
      socket.emit("sound",[ID,"Words/SENT/"]);
    },null);
    let b8 = new buttonClass("WHISTLE",RIGHT_COLUMN_WIDTH/2,BODY_HEIGHT/6,RIGHT_COLUMN_WIDTH/2,BODY_HEIGHT/6,callD = function(){},callU = function()
    {
      socket.emit("sound",[ID,"Words/WHIST/"]);
    },null);
    let b9 = new buttonClass("HUM",0,2*BODY_HEIGHT/6,RIGHT_COLUMN_WIDTH/2,BODY_HEIGHT/6,callD = function(){},callU = function()
    {
      socket.emit("sound",[ID,"Words/HUM/"]);
    },null);
    let b10 = new buttonClass("OOH",RIGHT_COLUMN_WIDTH/2,2*BODY_HEIGHT/6,RIGHT_COLUMN_WIDTH/2,BODY_HEIGHT/6,callD = function(){},callU = function()
    {
      socket.emit("sound",[ID,"Words/OOH/"]);
    },null);
    Right_Column.addChild(b5.Container);
    Right_Column.addChild(b6.Container);
    Right_Column.addChild(b7.Container);
    Right_Column.addChild(b8.Container);
    Right_Column.addChild(b9.Container);
    Right_Column.addChild(b10.Container);
    Right_Column.addChild(Right_Sub_Menu.Container);
    StageCont.addChild(Right_Column);
    StageCont.addChild(BlackOut);
let canvas;     //Will be linked to the canvas in our index.html page via myMain()
let stage;      //Main parent container for drawing objects
let joystickBg, joystickBg2, joystickNub, r2f, sliderBg, sliderNub;  //Image Objects
let totalLoaded = 0;
let manifest = [
  {src:"public/images/joystickBg.png", id:"joystickBg"},
  {src:"public/images/sliderBg.png", id:"sliderBg"},
  {src:"public/images/sliderNub.png", id:"sliderNub"},
  {src:"public/images/joystickBg2.png", id:"joystickBg2"},
  {src:"public/images/joystickNub.png", id:"joystickNub"},
  {src:"public/images/R2Front.png", id:"r2Front"}
];
let preload = new createjs.LoadQueue(); 
function mymain(){
  canvas = document.getElementById("mainCanvas");
  if (canvas.requestFullscreen) {
    canvas.requestFullscreen();
  } else if (canvas.webkitRequestFullscreen) {
    canvas.webkitRequestFullscreen();
  } else if (canvas.mozRequestFullScreen) {
    canvas.mozRequestFullScreen();
  } else if (canvas.msRequestFullscreen) {
    canvas.msRequestFullscreen();
  }
  stage = new createjs.Stage(canvas);
  createjs.Touch.enable(stage);
     
  preload.on("fileload", handleFileLoad);
  preload.on("progress", handleFileProgress);
  preload.on("complete", loadComplete);
  preload.on("error", loadError);
  preload.loadManifest(manifest);
  createjs.Ticker.addEventListener("tick", tick);
}
//######### PRELOAD ##########
let preloader;
function handleFileLoad(event) {
  //console.log("A file has loaded of type: " + event.item.type);
  if(event.item.id == "sliderBg"){
    sliderBg = new createjs.Bitmap(event.result);
  }
  if(event.item.id == "sliderNub"){
    sliderNub = new createjs.Bitmap(event.result);
  }
  if(event.item.id == "joystickBg"){
    joystickBg = new createjs.Bitmap(event.result);
  }
  if(event.item.id == "joystickBg2"){
    joystickBg2 = new createjs.Bitmap(event.result);
  }
  if(event.item.id == "joystickNub"){
    joystickNub = new createjs.Bitmap(event.result);
  }
  if(event.item.id == "r2Front"){
    r2f= new createjs.Bitmap(event.result);
  }
}
function loadError(evt) {
  console.log("Error!",evt.text);
}
function handleFileProgress(event) {
  progressText.text = "Interface:" +(preload.progress*100|0) + " % Loaded";
  stage.update();
}
function loadComplete(event) {
  console.log("Finished Loading Assets");
  addTitleView();
  progressText.visible = false;
}
function callButton(){
  console.log("button");
}
function addTitleView(){

  //###### Center #########
  scaleToFit(CenterCont,r2f,MARGIN);
  CenterCont.addChildAt(r2f,0);

  let O1 = new buttonClass("O1",150,375,115,400,callD = function(){
    socket.emit('action',[ID,"SERVO",2,"OPEN"]);
    socket.emit('action',[ID,"SERVO",3,"OPEN"]);
  },callU = function()
  {
    socket.emit('action',[ID,"SERVO",2,"CLOSE"]);
    socket.emit('action',[ID,"SERVO",3,"CLOSE"]);
  },null);
  O1.setMomentary(false);
  O1.setOverlay(true);
  CenterCont.addChild(O1.Container);
  let O2 = new buttonClass("O2",560,375,115,400,callD = function(){
    socket.emit('action',[ID,"SERVO",0,"OPEN"]);
    socket.emit('action',[ID,"SERVO",1,"OPEN"]);
  },callU = function()
  {
    socket.emit('action',[ID,"SERVO",0,"CLOSE"]);
    socket.emit('action',[ID,"SERVO",1,"CLOSE"]);
  },null);
  O2.setMomentary(false);
  O2.setOverlay(true);
  CenterCont.addChild(O2.Container);
  let O3 = new buttonClass("O2",235,375,355,100,callD = function(){
    socket.emit('action',[ID,"SERVO",6,"OPEN"]);
  },callU = function()
  {
    socket.emit('action',[ID,"SERVO",6,"CLOSE"]);
  },null);
  O3.setMomentary(false);
  O3.setOverlay(true);
  CenterCont.addChild(O3.Container);
  let O4 = new buttonClass("O2",235,445,355,100,callD = function(){
    socket.emit('action',[ID,"SERVO",7,"OPEN"]);
  },callU = function()
  {
    socket.emit('action',[ID,"SERVO",7,"CLOSE"]);
  },null);
  O4.setMomentary(false);
  O4.setOverlay(true);
  CenterCont.addChild(O4.Container);
  let O5 = new buttonClass("O2",450,515,140,260,callD = function(){
    socket.emit('action',[ID,"SERVO",4,"OPEN"]);
    socket.emit('action',[ID,"SERVO",5,"OPEN"]);
  },callU = function()
  {
    socket.emit('action',[ID,"SERVO",4,"CLOSE"]);
    socket.emit('action',[ID,"SERVO",5,"CLOSE"]);
  },null);
  O5.setMomentary(false);
  O5.setOverlay(true);
  CenterCont.addChild(O5.Container);
  //#######################
  //#######################
  //######## Left ########
  Left_Joystick = new joyStickClass();
  Left_Joystick.Container.x=0;
  Left_Joystick.Container.y = Left_Column.getBounds().height-LEFT_COLUMN_WIDTH;
  Left_Joystick.Container.setBounds(0,0,Left_Column.getBounds().width,Left_Column.getBounds().width);
  Left_Column.addChildAt(Left_Joystick.Container,3);

  //#######################
  //####### Right #########
  //Right_Column.regX=0;
  Right_Slider = new sliderClass(0,3*BODY_HEIGHT/6,Right_Column.getBounds().width,Right_Column.getBounds().height*.333);
  Right_Column.addChildAt(Right_Slider.Container,3);

  stage.addChild(StageCont);
  resizeView();
  stage.update();
  setInterval(controlTick,100);
}
function leftMenu(_x,_y,_width,_height){
  this.Container = new createjs.Container();
  //#######################
  this.Container.x = _x+MARGIN;
  this.Container.y = _y+MARGIN;
  this.Container.setBounds(0,0,_width-MARGIN*2,_height-MARGIN*2);
  let Leftbg = new createjs.Shape();
  Leftbg.graphics.beginLinearGradientFill([COLOR_PALLET.clone().Shift(.333).multiply(.5).GetColorString(),COLOR_PALLET.clone().Shift(.333).multiply(.3).GetColorString()], [0, 1], 0, 0, 0, DESIGN_HEIGHT);
  Leftbg.graphics.setStrokeStyle(8,"round").beginStroke("rgba(0,0,0,1)");
  Leftbg.graphics.drawRoundRect(0,0,_width-MARGIN*2,_height-MARGIN*2,10);
  Leftbg.graphics.endFill();
  Leftbg.graphics.endStroke();
  this.Container.addChild(Leftbg);
}
function centerIn(_Container,_Image){
  _Image.x=_Container.getBounds().width/2*_Container.scaleX-_Image.getBounds().width/2*_Image.scaleX;
  _Image.y=_Container.getBounds().height/2*_Container.scaleY-_Image.getBounds().height/2*_Image.scaleY;
}
function scaleToFit(_Container, _Image,_MARGIN){
  let sx = (_Container.getBounds().width)/(_Image.getBounds().width+_MARGIN);
  let sy = (_Container.getBounds().height)/(_Image.getBounds().height+_MARGIN);
  let scale = Math.min(sx,sy);
  _Image.scaleX = scale;
  _Image.scaleY = scale;
  return scale;
}
function resizeView(){
  StageCont.scaleX = stage.canvas.width/DESIGN_WIDTH;
  StageCont.scaleY = stage.canvas.height/DESIGN_HEIGHT;
}
function LEDClass(_text,x,y,_width,_height, count, _onColor, _offColor){
  let offColor = _offColor||"rgba(0,0,0,.4)";
  let onColor = _onColor||"rgba(0,255,0,1)";
  this.Container = new createjs.Container();
  this.Container.x = x+MARGIN;
  this.Container.y = y+MARGIN;
  let width = _width-2*MARGIN;
  let height = _height-2*MARGIN;
  let rect = new createjs.Shape();
  let mytext = new createjs.Text(_text,50+"px Arial","$ff7700");
  mytext.y=height/2-mytext.getBounds().height/2;
  this.Container.addChild(rect);
  this.Container.addChild(mytext);
  let value = this.value = 0;
  let widthR = 0.3;
  let render = function(){
    rect.graphics.clear();
    rect.graphics.setStrokeStyle(10,"round").beginStroke("rgba(0,0,0,1)");
    for(let i = 0;i<count;i++){
      if((value&(1<<i))!=0){
        rect.graphics.beginFill(onColor);
      }
      else {
        rect.graphics.beginFill(offColor);
      }
      rect.graphics.drawRoundRect(widthR*width+((1-widthR)*width*i/count),0,(1-widthR)*width/count,height,10);
      rect.graphics.endFill();
    }
    rect.graphics.endStroke();
  }
  this.setValue = function(_value){
    value = _value;
    render();
  }
  render();
}
function barGraphClass(x,y, _width, _height, Min, Max, units, _decimals){
  let decimals = _decimals||1;
  let width = _width-MARGIN*2;
  let height = _height-MARGIN*2;
  let vHistory = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  let min = Min;
  let max = Max;
  let inverse = false;
  let graphed = true;
  let stepped = true;
  let graphW = .65;
  if(units==null){
    graphW=1;
  }
  if(Min>Max){
    //max = Min;
    //min = Max;
    inverse = true;
  }
  this.Container = new createjs.Container();
  let rect = new createjs.Shape();
  this.Container.addChild(rect);
  this.Container.setBounds(0,0,width,height);
  this.Container.x = x+MARGIN;
  this.Container.y = y+MARGIN;
  let value = 10;
  let rawValue = 24.1;
  let steps = 10;
  let mytext;
  let myunits;
  if(units!=null){
    mytext = new createjs.Text(rawValue,"60px Arial","rgba(255,255,255,1)");
    myunits = new createjs.Text(units,"40px Arial","rgba(255,255,255,1)");
    mytext.x=width-mytext.getBounds().width;
    mytext.y=0;
    myunits.x=width-myunits.getBounds().width;
    myunits.y=height-myunits.getBounds().height;
    this.Container.addChild(mytext);
    this.Container.addChild(myunits);
  }
  render();
  this.setGraphed=function(input){
    graphed = input;
    render();
  }
  this.setStepped=function(input){
    stepped = input;
    render();
  }
  this.getValue = function(){
    return rawValue;
  }
  this.setValue = function(newValue){
    rawValue = Math.min(Math.max(min, max),Math.max(newValue,Math.min(min,max)));
    if(units!=null){
      mytext.text = parseFloat(rawValue).toFixed(decimals);
      mytext.x=width-mytext.getBounds().width;
    }
    let vH = (rawValue-min)/(max-min)*(height-10);
    vHistory.unshift(Math.min(height-10,Math.max(0,vH)));
    if(vHistory.length>20){
       vHistory.pop();
    }
    render();
    stage.update();
  }
  function render(){
    rect.graphics.clear();
    value = 100*(rawValue-min)/(max-min);
    if(units!=null){
      if(value<25){
        mytext.color="rgba(200,50,50,1)";
      }else if(value<60){
        mytext.color="rgba(200,200,50,1)";
      }
      else {
        mytext.color="rgba(50,200,50,1)";
      }
    }
    for(let i = 1; i<100;i+=100/steps)
    {
      if( i>value){
        break;
      }
      if(stepped==true){
        if(i<25){
          rect.graphics.beginFill("rgba(200,50,50,1)");
        }
        else if(i<60){
          rect.graphics.beginFill("rgba(200,200,50,1)");
        }
        else {
          rect.graphics.beginFill("rgba(50,200,50,1)");
        }
      }else{
          rect.graphics.beginFill(COLOR_PALLET.clone().Shift(.75).GetColorString());
      }
      rect.graphics.drawRect((width*graphW/100)*i+2.5,5,(width*graphW)/(steps)-5,height-10);
      //rect.graphics.drawRect(0,0,width,height);
      rect.graphics.endFill();
    }
    rect.graphics.beginFill("rgba(0,0,0,.25)");
    rect.graphics.drawRoundRect(0,0,(width*graphW),height,10);
    rect.graphics.endFill();
    rect.graphics.setStrokeStyle(8,"round").beginStroke("rgba(255,255,255,.9)");
    if(graphed==true){
      rect.graphics.moveTo((width*graphW)-5,height-5-vHistory[0]);
      for(let i =0;i<19;i++){
        rect.graphics.lineTo((width*graphW)-5-((i+1)/19)*((width*graphW)-10),height-5-vHistory[i+1]);
        //rect.graphics.lineTo(((i+1)/10)*width/2,vHistory[i+1]);
      }
    }
    rect.graphics.endStroke();
    rect.graphics.setStrokeStyle(8,"round").beginStroke("rgba(0,0,0,1)");
    rect.graphics.drawRoundRect(0,0,(width*graphW),height,10);
    rect.graphics.endFill();
  }
}
function buttonClass(text, x, y, _width, _height, callDown, callUp,_color){
  this.name = text;
  let overlay = this.overlay = false;
  let color = _color||COLOR_PALLET;
  this.Container = new createjs.Container();
  this.Container.x = x+MARGIN;
  this.Container.y = y+MARGIN;
  let width = _width-MARGIN*2;
  let height = _height-MARGIN*2;
  this.Container.setBounds(0,0,width,height);
  let momentary = true;
  let toggle = 0;
  let enabled = true;
  let pressed = false;
  let rect = new createjs.Shape();
  let Font_Size = 100;
  let mytext = new createjs.Text(text,Font_Size+"px Arial","$ff7700");
  //Autosize a bit to make sure longer labels fit within width;
  //for(let i=Font_Size;i>10;i*=.9){
    if(mytext.getBounds().width> width - MARGIN*2){
      //mytext.font = i+"px Arial";
      mytext.scaleX = (width - MARGIN*2)/mytext.getBounds().width;
    }
    if(mytext.getBounds().height> height - MARGIN*2){
      //mytext.font = i+"px Arial";
      mytext.scaleY = (height - MARGIN*2)/mytext.getBounds().height;
    }
  mytext.x=width/2-(mytext.scaleX * mytext.getBounds().width/2);
  mytext.y=height/2-(mytext.scaleY * mytext.getBounds().height/2);
  this.Container.addChild(rect);
  this.Container.addChild(mytext);
  this.setEnable = function(value){
    enabled = value;
    render();
  }
  this.setOverlay = function(value){
    overlay = value;
    render();
  }
  this.setMomentary = function(value){
    momentary = value;
    render();
  }
  function render(){
    if(overlay == true){
      mytext.visible = false;
    }
    else{
      mytext.visible = true;
    }
    if(enabled==true){
      if(pressed == false){
        drawUp();
      }
      else{
        drawDown();
      }
    }else{
      drawDisabled();
    }
  }
  this.Container.addEventListener("mousedown", function(evt){
    if(enabled==true){
      if(momentary==true){
        pressed = true;
        if(callDown){
        callDown();}
      }
      else {
        toggle = 1-toggle;
        if(toggle==1){
          pressed = true;
          if(callDown){
          callDown();}
        }else{
          pressed = false;
          if(callUp){
            callUp();
          }
        }
      }
    }
    render();
  });
  this.Container.addEventListener("pressup", function(evt){
    if(enabled==true){
      if(momentary==true){
        pressed = false;
        if(callUp){
          callUp();
        }
      }
    }
    render();
  });
  function drawDisabled(){
    drawUp();
    rect.graphics.beginFill("rgba(0,0,0,.7)");
    rect.graphics.drawRoundRect(0,0,width,height,10);
    rect.graphics.endFill();
  }
  function drawUp(){
      //rect.graphics.beginFill("rgba(68,115,196,255)");
      if(overlay==true){
        rect.graphics.clear();
        rect.graphics.beginFill("rgba(0,0,0,.01)"); //Has to have something drawn to detect mouse click
        rect.graphics.drawRect(0,0,width,height);
        rect.graphics.endFill();
      }
      else{
        rect.graphics.beginLinearGradientFill([color.GetColorString(),color.clone().multiply(.6).GetColorString()], [0, 1], 0, 0, 0, height);
        rect.graphics.setStrokeStyle(8,"round").beginStroke("rgba(0,0,0,1)");
        rect.graphics.drawRoundRect(0,0,width,height,10);
        rect.graphics.endFill();
        rect.graphics.endStroke();
    }
  }
  function drawDown(){
      if(overlay==true){
        rect.graphics.clear();
        rect.graphics.beginFill(COLOR_PALLET.clone().Shift(.666).multiply(.5).setAlpha(.6).GetColorString());
        rect.graphics.drawRect(0,0,width,height);
        rect.graphics.endFill();
      }
      else
      {
        drawUp();
        if(momentary==true){
          rect.graphics.beginLinearGradientFill([color.GetColorString(),color.clone().multiply(.6).GetColorString()], [1, 0], 0, 0, 0, height);

        }else{
          rect.graphics.beginLinearGradientFill([color.clone().Shift(.333).GetColorString(),color.clone().multiply(.6).Shift(.333).GetColorString()], [1, 0], 0, 0, 0, height);
        }
        rect.graphics.setStrokeStyle(8,"round").beginStroke("rgba(0,0,0,1)");
        rect.graphics.drawRoundRect(0,0,width,height,10);
        rect.graphics.endFill();
        rect.graphics.endStroke();
        rect.graphics.beginFill("rgba(0,0,0,.4)");
        rect.graphics.drawRoundRect(0,0,width,height,10);
        rect.graphics.endFill();
    }
  }
  //stage.addChild(this.button);
  //stage.update();
  render();
}
var update = true;
function sliderClass(_x,_y,_width, _height){
  this.Container = new createjs.Container();
  this.Container.x = _x;
  this.Container.y = _y;
  let x_value = 0;
  this.getOutput = function(){
    return x_value;
  }
  sliderBg.x = _width/2;
  sliderBg.y = _height/2;
  sliderBg.scaleX = 0.8*(RIGHT_COLUMN_WIDTH-MARGIN) / sliderBg.image.width;
  sliderBg.scaleY = sliderBg.scaleX;
  sliderBg.regX = sliderBg.image.width/2;
  sliderBg.regY = sliderBg.image.height/2;
  sliderNub.scaleX = sliderBg.scaleX;
  sliderNub.scaleY = sliderBg.scaleY;
  sliderNub.regX = sliderNub.image.width/2;
  sliderNub.regY = sliderNub.image.height/2;
  sliderNub.x = sliderBg.x;
  sliderNub.y = sliderBg.y;
  this.Container.addChild(sliderBg);
  this.Container.addChild(sliderNub);

  let downX=0;
  this.getOutput = function(){
    return [x_value];
  }
  sliderNub.on("mousedown",function(evt){
    downX = evt.stageX/ StageCont.scaleX;
    x_value = 0;
  });
  sliderNub.on("pressmove",function(evt){
    let currentX = evt.stageX/ StageCont.scaleX - downX;
    let offsetX = currentX;
    offsetX = Math.min(sliderBg.image.width/2*sliderBg.scaleX,Math.max(-sliderBg.image.width/2*sliderBg.scaleX,offsetX));
    sliderNub.x = offsetX  + _width/2;
    x_value = Math.round(offsetX*200/(sliderBg.image.width*sliderBg.scaleX)); //Scale to -100 to 100
    update = true;
  });
  sliderNub.on("pressup",function(evt){
    sliderNub.x = _width/2;
    update = true;
    x_value = 0;
  });
}
function joyStickClass(){
  this.Container = new createjs.Container();
  let x_value = 0;
  let y_value = 0;
  let pos_x = 0;
  let pos_y = 0;
  let majorDia = 200;
  let minorDia = 150;
  joystickBg.x = LEFT_COLUMN_WIDTH/2;
  joystickBg.y = LEFT_COLUMN_WIDTH/2;
  joystickBg.regX = joystickBg.image.width/2;
  joystickBg.regY = joystickBg.image.height/2;
  joystickBg2.x = LEFT_COLUMN_WIDTH/2;
  joystickBg2.y = LEFT_COLUMN_WIDTH/2;
  joystickBg2.regX=joystickBg2.image.width/2;
  joystickBg2.regY=joystickBg2.image.height/2;
  joystickNub.x = LEFT_COLUMN_WIDTH/2 - joystickNub.image.width/2;
  joystickNub.y = LEFT_COLUMN_WIDTH/2 - joystickNub.image.height/2;
  this.Container.addChild(joystickBg);
  this.Container.addChild(joystickBg2);
  this.Container.addChild(joystickNub);
  createjs.Ticker.setFPS(20);
  createjs.Tween.get(joystickBg,{loop: true})
  .to({rotation:180},1500,createjs.Ease.getPowInOut(2))
  .to({rotation:90},1500,createjs.Ease.getPowInOut(2))
  .to({rotation:-180},2000,createjs.Ease.getPowInOut(2))
  .to({rotation:270},3000,createjs.Ease.getPowInOut(2))
  .to({rotation:180},1500,createjs.Ease.getPowInOut(2))
  .to({rotation:0},1000,createjs.Ease.getPowInOut(2));
  createjs.Tween.get(joystickBg2,{loop: true})
  .to({rotation:-180},1000,createjs.Ease.getPowInOut(4))
  .to({rotation:190},2000,createjs.Ease.getPowInOut(2))
  .to({rotation:-20},1000,createjs.Ease.getPowInOut(4))
  .to({rotation:-270},2000,createjs.Ease.getPowInOut(2))
  .to({rotation:45},3000,createjs.Ease.getPowInOut(4))
  .to({rotation:-45},1500,createjs.Ease.getPowInOut(4))
  .to({rotation:0},1000,createjs.Ease.getPowInOut(2));
  let downX = 0;
  let downY = 0;
  this.getOutput = function(){
    return [x_value, y_value];
  }
  joystickNub.on("mousedown",function(evt){
    downX = evt.stageX/ StageCont.scaleX;
    downY = evt.stageY/ StageCont.scaleY;
    x_value = 0;
    y_value = 0;
  });
  joystickNub.on("pressmove",function(evt){
    let currentX = evt.stageX/ StageCont.scaleX - downX;
    let currentY =  evt.stageY/ StageCont.scaleY - downY;
    let angle = Math.atan2(currentY,currentX);
    let radius = Math.sqrt(currentX*currentX+currentY*currentY);
    if(radius>LEFT_COLUMN_WIDTH/2-100)
    radius = LEFT_COLUMN_WIDTH/2-100;
    let offsetX = radius*Math.cos(angle);
    let offsetY = radius*Math.sin(angle);

    joystickNub.x = offsetX + joystickNub.image.width/2;
    joystickNub.y = offsetY + joystickNub.image.height/2;

    x_value = Math.round(offsetX*100/(LEFT_COLUMN_WIDTH/2-100)); //Scale to -100 to 100
    y_value = Math.round(offsetY*100/(LEFT_COLUMN_WIDTH/2-100)); //Scale to -100 to 100
    update = true;
  });
  joystickNub.on("pressup",function(evt){
    joystickNub.x = LEFT_COLUMN_WIDTH/2 - joystickNub.image.width/2;
    joystickNub.y = LEFT_COLUMN_WIDTH/2 - joystickNub.image.height/2;
    update = true;
    x_value = 0;
    y_value = 0;
  });
}
function tick(event) {
  update = true;
  if (update) {
    update = false; // only update once
    stage.update(event);
  }
}
let d = new Date();
let lastTime = d.getTime();
let controlTickDivide = 0;
let LastAlive = 0;
function controlTick(){ //currently 10 hz update rate

    socket.emit("action",[ID,"foot",Left_Joystick.getOutput()[0],Left_Joystick.getOutput()[1]]);
    socket.emit("action",[ID,"dome",Right_Slider.getOutput()]);

  //Send Keep Alive
  if(controlTickDivide%3==0)  {

    d = new Date();
    let delta = d.getTime();
    if((delta-LastAlive)> 1000){
        BlackOut.visible = true;
      }
      else{
        BlackOut.visible = false;
      }
      lastTime = d.getTime();
      socket.emit("alive",[ID,lastTime]);
  }
  //socket.emit("action",["servo",1]);
  controlTickDivide++;
  if(controlTickDivide>12){
    controlTickDivide=0;
  }
}

//////////////////////////////////////////////////
///////////// SOCKET IO FUNCTIONS ////////////////
//////////////////////////////////////////////////
let ID = 0;
socket.on('id', function(msg){
  ID = msg[0];});
let latencyAverage=0;
let latencyC = 0;
let Alive_Clear = 0;
socket.on('alive', function(msg){
  //console.log(msg);
  Alive_Clear = 1;
  d = new Date();
  LastAlive = d.getTime();
  let deltaT = LastAlive-msg[0];// lastTime;
  latencyAverage+=deltaT;
  latencyC++;
  if(latencyC>=5){
    let v = latencyAverage/latencyC;
    console.log("Delta T:"+v);
    Latency_Meter.setValue(v);
    latencyAverage=0;
    latencyC=0;
  }
  //MSG: ID   Volume    LeftStatus  RightStatus
  //                    Error       Error
  //                    Serial Err  Serial Err
  //                    Voltage     Voltage
  //                    Temp        Temp
  let MotorError = ["Safe Start Violation","Serial Error","Command Timeout","Limit/Kill Switch","Low VIN","High VIN","Over Temp","Motor Driver Error","ERR Line High","-","-","-","-","-","-",","];
  let SerialError = ["-","Frame","Noise","RX Overrun","Format","CRC","-","-","-","-","-","-","-","-","-","-","-"];
  Volume_Meter.setValue(msg[1]);
  Battery_Meter.setValue(msg[2][2]);
  logText.text = "";
  //if(msg[2][0]!=0){
  //logText.text+="Left: \r";
    for(let i = 0;i<16;i++){
        if(((msg[2][0])&(1<<i))!=0){
          //logText.text+=MotorError[i];
          //logText.text+=" \t";
        }
        if(((msg[2][1])&(1<<i))!=0){
          //logText.text+=SerialError[i];
          //logText.text+=" \t";
        }
    }
    //logText.text+=" \r";
    //logText.text+="Right: \r";
    LeftLED0.setValue(msg[2][0]);
    RightLED0.setValue(msg[3][0]);
    LeftLED1.setValue(msg[2][1]);
    RightLED1.setValue(msg[3][1]);
    ServoLED1.setValue(msg[4]);
      for(let i = 0;i<16;i++){
          if(((msg[3][0])&(1<<i))!=0){
            //logText.text+=MotorError[i];
          //  logText.text+=" \t";
          }
          if(((msg[3][1])&(1<<i))!=0){
          //  logText.text+=SerialError[i];
          //  logText.text+=" \t";
          }
      }
  //}

});
