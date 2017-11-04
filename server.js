var Serial_Port_Helper = require("./serialPortHelper.js");
var MotorControllers = require("./motorControllers.js");
var ServoControllers = require("./servoControllers.js");
String.prototype.hashCode = function() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};
console.log("### Astromech Server Started ###");
let os = require('os');
//let SerialPort = require('serialport'); // when installed as a package
var exec = require('child_process').exec;
function execute(command, callback) {
  var cmd = exec(command, function(error, stdout, stderr) {
    console.log("error: " + error);
    callback(stdout);
  });
}
function reboot() {
  try {
    console.log("Reboot");
    execute('sudo reboot', function(callback) {
    });
  }
  catch (err) {
    console.log(err);
  }
}
function powerOff() {
  try {
    console.log("Power Off");
    execute('sudo poweroff', function(callback) {
    });
  }
  catch (err) {
    console.log(err);
  }
}
//0 Left Arm Door Upper
//1 Left Arm Door Lower
//2 Right Arm Door Upper
//3 Right Arm Door Lower
//4 Data Door Upper
//5 Data Door Lower
//6 Utility Arm Upper
//7 Utility Arm Lower
//let player = require('play-sound')();
let playerClass = function(){
  let Vol = 0;
  let VolPercent = 0;
  this.play = function(path){
    execute('omxplayer --vol '+Vol+" "+path, function(callback) {
    });
  }
  this.setVolume = function(vol){
    VolPercent = Math.min(1,Math.max(vol,0));
    Vol = 868.589 * Math.log(VolPercent);
  }
  this.getVolume =function(){
    return VolPercent;
  }
}

let player = new playerClass();
player.setVolume(.1);
player.play('./public/audio/Words/OTHER/STARTSND.wav');

let ServoOpen =     [1850,913  ,1300  ,1800, 1600,  1100,  700,  700,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0];
let ServoClose =    [504,2400  ,2300  ,500, 500,  2300,  2450,  2225,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0];
let ServoPrevState =[504,2400  ,2300  ,500, 500,  2300,  2350,  2150,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0];
let ServoState =    [504,2400  ,2300  ,500, 500,  2300,  2350,  2150,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0];
let ServoNextState =[504,2400  ,2300  ,500, 500,  2300,  2350,  2150,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0];
let ServoOffCount = [0,0,0,0,0,0,0,0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0];
let BatteryStatus = 100;
let ServoCommanded =[0,0,0,0,0,0,0,0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0];
/*
  var Gpio = require('onoff').Gpio, led = new Gpio(17, 'out'), button = new Gpio(4, 'in', 'both');
  button.watch(function (err, value) {
    if (err) {
      throw err;
    }
    led.writeSync(value);
  });
  process.on('SIGINT', function () {
    led.unexport();
    button.unexport();
  });
  //Flash LED, check that IO is working
  var iv = setInterval(function(){
  	led.writeSync(led.readSync() === 0 ? 1 : 0)
  }, 500);
*/
/*##############################################################################
//################ Setup and configure Serial Port based items #################
//##############################################################################
  Find out name/address of usb by typing:  "ls /dev/serial/by-id"
  Note: Maestro has two ports. One of them is for USB the other is the USB-Serial
*///############################################################################
let domePort = "/dev/serial/by-id/usb-Prolific_Technology_Inc._USB-Serial_Controller-if00-port0";
let bodyServoPort = "/dev/serial/by-id/usb-Pololu_Corporation_Pololu_Mini_Maestro_18-Channel_USB_Servo_Controller_00184925-if00";
let leftFootPort = "/dev/serial/by-id/usb-Pololu_Corporation_Pololu_Simple_High-Power_Motor_Controller_18v25_54FF-6F06-4989-5349-2227-0487-if00";
let rightFootPort = "/dev/serial/by-id/usb-Pololu_Corporation_Pololu_Simple_High-Power_Motor_Controller_18v25_54FF-7406-4989-5349-2252-0587-if00";
let domeMotorController= new Serial_Port_Helper.SerialConnection("Dome Motor Controller",domePort,9600);
let BodyServoController= new Serial_Port_Helper.SerialConnection("Body Servo Controller", bodyServoPort,38400);
let LeftFootController= new Serial_Port_Helper.SerialConnection("Left Foot Controller", leftFootPort,38400);
let RightFootController= new Serial_Port_Helper.SerialConnection("Right Foot Controller", rightFootPort,38400);
BodyServoController.Init();
LeftFootController.Init();
RightFootController.Init();
domeMotorController.Init();//Syren Motor controller has been inconsistent, I have had to resend the 0xAA for auto baud //
  setTimeout(callback = function(){domeMotorController.Init()},500);
  setTimeout(callback = function(){domeMotorController.Init()},1000);
////////////////////////////////////////////////////////////////////////////////
//######################### Motor Controller Class #############################
let DomeController = new MotorControllers.Controller(MotorControllers.Type.Syren,domeMotorController);
let LeftController = new MotorControllers.Controller(MotorControllers.Type.Maestro,LeftFootController);
let RightController = new MotorControllers.Controller(MotorControllers.Type.Maestro,RightFootController);
let BodySController = new ServoControllers.Controller(ServoControllers.Type.Maestro,BodyServoController);
//##############################################################################
//##################### Handle Maestro Servo Controllers #######################
//##############################################################################
/*
function servoSetTarget(servo, usec){
  BodySController.setTarget(servo,usec);
  return;
  if(BodyServoController){
    let value;
    if(Array.isArray(usec)){
      value = usec.slice(0); //clone array
    }else{
      value = [usec];
    }
    for(let i = 0; i< value.length;i++){
      if(value[i]!=0){
        value[i]= Math.max(500, Math.min(2500, value[i]))*4;// Clip output
      }
      //Maestro takes time in qtr usec, so multiply by 4
    }
      //usec = Math.max(500, Math.min(2500, usec)); // Clip output
      //let value = usec * 4 //Maestro takes time in qtr usec, so multiply by 4
      let arr;
      if(value.length == 1){
        arr = new Uint8Array(4+1);
        arr[0]=(0x84);//0x84
        arr[1]=(servo);
        arr[2]=(value[0] & 0x7F);
        arr[3]=((value[0]>>7) & 0x7F);
      }
      else {
        arr = new Uint8Array(3+value.length*2+1);
        arr[0]=(0x9F);//0x84
        arr[1]=(value.length);
        arr[2]=(servo);
        for(let i = 0;i<value.length;i++){
          arr[(i*2)+3]=(value[i] & 0x7F);
          arr[(i*2)+4]=((value[i]>>7) & 0x7F);
        }
      }

      arr[arr.length-1]=getCRC(arr);
      if(BodyServoController.serialPort)
      {
        try{
          BodyServoController.serialPort.write(arr, function(err, results){
          //BodyServoController.serialPort.drain();
          });
        }catch(err){
          console.log("error: "+err);
        }
      }
      else {
        console.log("Attempt made to move servo, not connected");
      }
    }

  };
    function servoErrors(){
      arr = new Uint8Array(1);
      arr[0]=(0xA1);//0x84
      if(BodyServoController.serialPort)
      {
        try{
          BodyServoController.serialPort.write(arr, function(err, results){
          //BodyServoController.serialPort.drain();
          });
        }catch(err){
          //if(err)
            console.log("error: "+err);
        }
      }
      else {
        console.log("Servo Error, not connected");
      }
}
/*
function getCRC(arr){
  let crcPoly=new Uint8Array(1)
  crcPoly[0]=0x91;
  let crc = 0;
  for(let i =0;i<arr.length-1;i++){
    crc = crc ^ arr[i];
    for(let j=0;j<8;j++){
      if((crc & 1)==1){
        crc = crc ^ crcPoly[0];
      }
        crc>>>=1;
    }
  }
  return crc;
}
function maestroCommand(command, channel, value){
    arr = new Uint8Array(5);
    arr[0]=(command);//0x84
    arr[1]=(channel);
    arr[2]=(value & 0x7F);
    arr[3]=((value>>7) & 0x7F);
    arr[arr.length-1]=getCRC(arr);
    if(BodyServoController.serialPort)
    {
      try{
        BodyServoController.serialPort.write(arr, function(err, results){
        });
      }catch(err){
        console.log("error: "+err);
      }
    }
    else {
      console.log("Maestro not connected");
    }
}
*/
/*
function serverStart(){
  pollServoStart();
}
function pollServoStart(){
  let ServoSpeed = 150;
  let ServoAccel = 25;
  if(!BodyServoController){
    setTimeout(pollServoStart,1000);
    return;
  }
  if(BodyServoController.serialPort){
    for(let i = 0; i < 18;i++){
      BodySController.maestroCommand(0x87,i,ServoSpeed);  //Set Speed of Servos
      BodySController.maestroCommand(0x89,i,ServoAccel);  //Set Accel of Servos
    }
    for(let i = 0; i < 18;i++){
      BodySController.maestroCommand(0x87,i,ServoSpeed);  //Set Speed of Servos
      BodySController.maestroCommand(0x89,i,ServoAccel);  //Set Accel of Servos
    }
    console.log("ServoSpeed Set");
  }
  else {
    setTimeout(pollServoStart,100);
  }
}
*/
//##############################################################################
//########################### Animation and Timing #############################
//##############################################################################
let domeValue = 0;
let lastDomeValue = 0;
function AnimationInterval(){
  DomeController.setSpeed(domeValue);
  BodySController.setTarget(0,ServoCommanded.slice(0,18));
  return;
}
setInterval(AnimationInterval,100); //Initiate animation Interval for Constant Updating of low time resolution stuff
//##############################################################################
//######################## Configure and Run Server ############################
//##############################################################################

const http = require("http");
const url = require('url');
const fs = require('fs');
const path = require('path');
const port = process.argv[2] || 8880;
var io = require('socket.io')(http);
var server = http.createServer(function (request, response) {
  const mimeType = {
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.eot': 'appliaction/vnd.ms-fontobject',
    '.ttf': 'aplication/font-sfnt'
  };
    let extname = path.extname(request.url);
    let filePath = '.'+request.url;
    let contentType = 'text/html'
    if (filePath=="./"){
      filePath = "./index.html";
    }
    else {
      contentType = mimeType[extname];
    }
    fs.readFile(filePath, function(error, content) {
        if (error) {
            if(error.code == 'ENOENT'){
                fs.readFile('./404.html', function(error, content) {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                });
            }
            else {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                response.end();
            }
        }
        else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });
});
server.listen(port);
//##############################################################################
//################################ Socket IO ###################################
//##############################################################################
var listener = io.listen(server,{'reconnection delay': 100, // defaults to 500
    'reconnection limit': 100, // defaults to Infinity
    'max reconnection attempts': Infinity // defaults to 10
  });
let ConnectionCount = 0;
let IDs = [];
let aID = 1;
io.on('connection', function(socket){
  ConnectionCount++;
  console.log("User Connected");
  console.log("Connections: "+ConnectionCount);
    let d = new Date();
    let tID = ('id'+d.getTime()).hashCode();
    socket.emit('id',[tID]);
    console.log("accepted Sent");
    if(ConnectionCount==1){
      aID = tID;
    }
  socket.on('disconnect',function(){
    console.log("User Disconnected");
    ConnectionCount--;
  });
  socket.on('alive',function(msg){
    if(msg[0]!=aID){return;}
    //LeftStatus[0]=9;
    //console.log(LeftController.Status);
    socket.emit('alive',[msg[1],player.getVolume(),LeftController.Status,RightController.Status,BodySController.getStatus()]);
    //socket.emit('alive',[msg[1],player.getVolume(),LeftStatus,RightStatus]);
  });
  socket.on('sound',function(msg){
    if(msg[0]!=aID){return;}
    var p = "./public/audio/"+msg[1];
    console.log("SoundRequested: ");
    let files =fs.readdirSync(p, function (err) {
      if (err) {
          throw err;
      }
    });
    let R = Math.round(Math.random()*(files.length-1));
    console.log('./public/audio/'+msg[1]+files[R]);
    player.play('./public/audio/'+msg[1]+files[R],(err)=>{
      if(err) console.log(err);
    });
  });
  socket.on('action', function(msg){
    if(msg[0]!=aID){return;}
    if(msg[1]=="volume"){
      console.log("volume");
      player.setVolume(msg[2]);
    }
    if(msg[1]=="poweroff"){powerOff();}
    if(msg[1]=="reboot"){reboot();}
    if(msg[1]=="SERVO"){
      if(msg[2]>=0 && msg[2]<ServoCommanded.length){
        if(msg[3]=="OPEN"){ServoCommanded[msg[2]]=ServoOpen[msg[2]];}
        else if(msg[3]=="CLOSE"){ServoCommanded[msg[2]]=ServoClose[msg[2]];}
      }
    }
    if(msg[1]=="foot"){
      joy_x = Math.max(-1, Math.min(1, msg[2]/100));// Clip output
      joy_y = Math.max(-1, Math.min(1, msg[3]/100));// Clip output
      radius = Math.sqrt(joy_x*joy_x+joy_y*joy_y);
      if(radius < .1) {
        LeftController.setSpeed(0);
        RightController.setSpeed(0);
      }
      else
      {
        angle = Math.atan2(joy_y,joy_x);    //get angle of joystick
        angle += 3.14159/4.0;               //rotate by 45deg
        spd_Left = radius*Math.cos(angle);
        spd_Right = radius*Math.sin(angle);
        LeftController.setSpeed(spd_Left);
        RightController.setSpeed(spd_Right);
      }
    }
    if(msg[1]=="dome"){
      domeValue = msg[2]/100;
    }
  });
});
