let servoControllerType = {Maestro: 1};
let servoController = function(_ControllerType, _Port){
  let pollResults = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];  //Number of Servos + 1 error reg
  //let lastPosition = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  //let cntPosition = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  let commandedPosition = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  //let sendPosition = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  let pollIndex = this.pollIndex = 0;
  let Port = this.Port = _Port;
  let ControllerType = this.ControllerType = _ControllerType;
  let setTarget = this.setTarget=function(servo, usec){
    if(!Port){return;}
      let value;
      if(Array.isArray(usec)){
        value = usec.slice(0); //clone array
      }else{
        value = [usec];
      }
      for(let i = 0; i< value.length;i++){
        if(value[i]!=0){
          //Maestro takes time in qtr usec, so multiply by 4
          value[i]= Math.max(500, Math.min(2500, value[i]))*4;// Clip output
        }
      }
      let arr;
      if(value.length == 1){
        commandedPosition[servo]=value[0];
      }
      else {
        for(let i = 0;i<value.length;i++){
          commandedPosition[i+servo]=value[i];
        }
      }
  }
  let writeTarget = function(input){
    arr = new Uint8Array(3+commandedPosition.length*2);
    arr[0]=(0x9F);//0x84
    arr[1]=(commandedPosition.length);
    arr[2]=(0);
    for(let i = 0;i<input.length;i++){
      arr[(i*2)+3]=(input[i] & 0x7F);
      arr[(i*2)+4]=((input[i]>>7) & 0x7F);
    }
    txCommand(arr);
  }
  let txCommand = function(input){
    //input is an 8 bit array and cannot use the typical push or concat
    let c = new Uint8Array(input.length + 1);
    c.set(input,0);
    c.set([maestroCRC(input)],input.length);
    if(Port.serialPort)
    {
      try{
        Port.serialPort.write(c, function(err, results){
        });
      }catch(err){
        console.log("error: "+err);
      }
    }
    else {
      console.log("Maestro not connected");
    }
  }
  let maestroCommand = this.maestroCommand = function(command, channel, value){
      arr = new Uint8Array(4);
      arr[0]=(command);//0x84
      arr[1]=(channel);
      arr[2]=(value & 0x7F);
      arr[3]=((value>>7) & 0x7F);
      txCommand(arr);
  }
  function pollServoStart(){
    let ServoSpeed = 200;
    let ServoAccel = 25;
    if(!Port){
      setTimeout(pollServoStart,1000);
      return;
    }
    if(Port.serialPort){
      for(let i = 0; i < 18;i++){
        maestroCommand(0x87,i,ServoSpeed);  //Set Speed of Servos
        maestroCommand(0x89,i,ServoAccel);  //Set Accel of Servos
      }
      for(let i = 0; i < 18;i++){
        maestroCommand(0x87,i,ServoSpeed);  //Set Speed of Servos
        maestroCommand(0x89,i,ServoAccel);  //Set Accel of Servos
      }
      console.log("ServoSpeed Set");
    }
    else {
      setTimeout(pollServoStart,1000);
    }
  }
  let maestroCRC=this.maestroCRC=function(arr){
    let crcPoly=new Uint8Array(1)
    crcPoly[0]=0x91;
    let crc = 0;
    for(let i =0;i<arr.length;i++){
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
  this.Port.serialPort.on("data",function(msg){
    if(ControllerType != servoControllerType.Maestro){return;}
    //if(msg[msg.length-1]!=maestroCRC(msg.slice(0,msg.length))){
    //  return;
    //}
    for(let i = 0; i < msg.length-1;i+=2){
      if(pollIndex!=0){
        let v = (msg[i]+msg[i+1]*256);
        if(v !=0){  //this check is done to allow us to turn off the servo once it reaches the desired position.  if controller polled it would report 0 and we would loose our position
        pollResults[pollIndex] = v;
      }
      }
      else {
        pollResults[0] = (msg[i]+msg[i+1]*256);
      }
      pollIndex++;
      if(pollIndex>=pollResults.length){pollIndex=0;}
    }
    //Port.serialPort.drain();
  });
  this.getStatus = function(){
    return pollResults[0];
  }
  function pollMaestro(){
    if(pollIndex==0){txCommand([0xA1]);}  //Get Errors
    else {
      txCommand([0x90,pollIndex-1]);      //Get current position
    }/*
    for(let i =0;i<commandedPosition.length;i++){
      sendPosition[i]=commandedPosition[i];

      if(commandedPosition[i]==pollResults[i+1]){        //If move has finished
        sendPosition[i] = 0;                                //Turn off Servo
      }
      else {
        sendPosition[i] = lastPosition[i];              //Send last known position
        cntPosition[i]++;
        if(cntPosition[i]>5){
          lastPosition[i] = commandedPosition[i];
          cntPosition[i]=0;
        }
      }
      if(i==4){
        console.log(sendPosition[i]);
      }

    }*/
    writeTarget(commandedPosition);  //Update Servo Commands
  }
  if(ControllerType == servoControllerType.Maestro){
    setInterval(pollMaestro,50);
  }
  setTimeout(pollServoStart,1000);
}
exports.Controller=servoController;
exports.Type=servoControllerType;
