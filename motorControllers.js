let motorControllerType = {Syren: 1,Maestro: 2};
let motorController = function(_ControllerType, _Port){
  let pollIndex = this.pollIndex = 0;
  /*###### MAESTRO STATUSES ########
  ID  name    DESC
  0   Error Status
  1   Error Occurred
  2   Serial Error
  3   Limit Status
  23  Input Voltage   16bit mv
  24  Temperature     16bit 0.1C  for T>0
  */
  let Status = this.Status = [1,2,3,4];
  let StatusAddr = [0,2,23,24];
  let Port = this.Port = _Port;
  let ControllerType = this.ControllerType = _ControllerType;
  let CommandedSpeed = 0;
  this.setSpeed = function(_input){
    //Clip _input -1 to 1
    CommandedSpeed = Math.min(1,Math.max(_input,-1));
    if(ControllerType == motorControllerType.Syren){
      let value = CommandedSpeed*127;
      if(value >= 0){
        syren10Command(128,1,Math.max(0, Math.min(127, value)));
      }
      else{
        syren10Command(128,0,Math.max(0, Math.min(127, -value)));
      }
    }
    if(ControllerType == motorControllerType.Maestro){
      let value = Math.max(-3200, Math.min(3200, 3200*CommandedSpeed));
      if(value >= 0){
        maestroCommand(0x85,value); //Move Forward
      }
      else{
        maestroCommand(0x86,-value); //Move Backward
      }
    }
  }
  let sendCommand = this.sendCommand=function(_command, _value){
    if(ControllerType == motorControllerType.Syren){
      syren10Command(128,_command,_value);
    }
    if(ControllerType == motorControllerType.Maestro){
      maestroCommand(_command, _value);
    }
  }
  let maestroCommand = function(command, value){
    if((command == 0x85) || (command == 0x86)){
      arr = new Uint8Array(4);
      arr[0]=command;
      arr[1]=(value & 0x1F);
      arr[2]=(value>>5);
      arr[3]=maestroCRC(arr);
      Port.writeData(arr);
    }else{
      arr = new Uint8Array(3);
      arr[0]=command;
      arr[1]=(value);
      arr[2]=maestroCRC(arr);
      Port.writeData(arr);
    }
  }
  let maestroCRC=this.maestroCRC=function(arr){
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
  let syren10Command = function(address, command, value){
      value = Math.round(value);
      if(address <128 || address > 136)
      {
        console.log("Syren10 Address out of range")
        return;
      }
      if(command == 0){       //Drive Forward
        value = Math.max(0,Math.min(value,127));  //Clamp value from 0 to 127
      }
      else if(command == 1){  //Drive Backward
        value = Math.max(0,Math.min(value,127));  //Clamp value from 0 to 127
      }
      else if(command==2){    //Set Min Voltage; Value = (desired voltage-6)*5
          value = Math.max(0,Math.min(value,120));  //Clamp value from 0 to 127
      }
      else if(command==4){    //Set Max Voltage; Value = (desired voltage*5.12)
          value = Math.max(0,Math.min(value,127));  //Clamp value from 0 to 127
      }
      else{
        console.log("Syren10 Command not recognized")
        return;
      }
      Port.writeData([address,command,value,(address+command+value)&0b01111111]);
      return;
  }
  this.Port.serialPort.on("data",function(msg){
    let value = 0;
    if(ControllerType != motorControllerType.Maestro){return;}
    if(msg[msg.length-1]!=maestroCRC(msg.slice(0,msg.length))){
      return;
    }
    if(pollIndex==0){
      value = (msg[0]+msg[1]*256);
      //console.log("L Error Flag: "+Number(value));
      Status[pollIndex]=value;
      //pollIndex++;
    }
    else if(pollIndex==1){
      value = (msg[0]+msg[1]*256);
      //console.log("L Motor Limit: "+Number(value));
      Status[pollIndex]=value;
    }
    else if(pollIndex==2){
      value = (msg[0]+msg[1]*256)/1000;
      //console.log("Voltage: "+Number(value));
      Status[pollIndex]=value;
    }
    else if(pollIndex==3){
      value = (msg[0]+msg[1]*256)/10;
      //console.log("L Temperature: "+Number(value));
      Status[pollIndex]=value;
    }
    pollIndex++;
    if(pollIndex >= StatusAddr.length){
      pollIndex = 0;
    }
    //Port.serialPort.drain();
  });
  function pollMaestro(){
    sendCommand(0xA1,StatusAddr[pollIndex]);
  }
  if(ControllerType == motorControllerType.Maestro){
    setInterval(pollMaestro,250);
  }
}
exports.Controller=motorController;
exports.Type=motorControllerType;
