let SerialPort = require('serialport'); // when installed as a package
let Port;

function SerialConnection(name, addr, baud){
  this.name = name;
  this.Connected = false;
  let Port = this.serialPort = new SerialPort(addr,{baudRate: baud},function(err){
    if(err){
      return console.log("Port: "+name+"\t"+err.message);
    }
    else{
        console.log("Port: "+name + "\tSpeed: "+this.baudRate);
    }
  });
  writeData = this.writeData = function(data){
    arr = new Uint8Array(data.length);
    for(let i = 0;i<data.length;i++){
      arr[i]=data[i];
    }
    if(Port)
    {
      try{
        Port.write(arr, function(err, results){
        });
        return arr;
      }catch(err){
        console.log(name+" error: "+err);
      }
    }
    else {
      console.log(name+" not connected");
    }
  }
  this.Init = function(){
    writeData([0xAA]);
  }
}
exports.SerialConnection = SerialConnection;
