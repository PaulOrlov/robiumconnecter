const cp = require("child_process");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

let port;
let parser;

const ArduinoCLIWrapper = {
  name: "hey",
  win: null,
  comName: "",
  referenceName: "ROBIUM",
  isLimitedByReferenceName: false,
  baudRate: 9600,
  isCOMMonitorRunning: false,
  uploadPortName:'',
  isArduinoUsesPort: false,
  ports:[],
  devType:"",

  getBoardsList: function () {
    //Should it be here?
    //let _this = this;
    //
    let boards = [];
    let _resolve = null;
    let myPromise = new Promise(function (resolve) {
      _resolve = resolve;
    });

    try {
      //server = cp.spawn("C:\\Projects\\Robium\\arduino-cli_0.32.2_Windows_64bit\\arduino-cli.exe", ["board", "list"], {
      server = cp.spawn(this.getArduinoPath(), ["board", "list"], {
        detached: false,
      });

      server.stdout.on("data", (data) => {
        let respond = {};
        if (data.toString() == "No boards found.") {
          respond = {
            boards: [],
          };
        } else {
          const boardsIO = data.toString().split("\n");
          let boardID = 0;
          for (let i = 1; i < boardsIO.length; i++) {
            if (boardsIO[i] != "") {
              boards.push({
                boardID: boardID,
                boardTitle: boardsIO[i],
              });
              boardID++;
            }
          }

          respond = {
            boards: boards,
          };
        }

        _resolve(respond);

        //   console.log(wsConnection);
        //   if (wsConnection != null) {
        //     wsConnection.send(JSON.stringify(respond));
        //   } else {
        //     console.log(JSON.stringify(respond));
        //   }
      });

      server.stderr.on("data", (data) => {
        console.error(data.toString());
        try {
          if (_this.win != undefined && _this.win != null) {
            _this.win.webContents.send("dataToTerminal", data.toString());
          }
        } catch (e) {
          console.log(e);
        }
      });

      server.on("exit", (code) => {
        console.log("Server exited with code " + code.toString());
      });
    } catch (e) {
      error = e.toString();
      console.log("Server runs error: " + e);
    }
    return myPromise;
  },
  getArduinoPath: function () {
    let arduinoPath = path.join(path.dirname(__dirname), "projects", "arduino-cli.exe");
    if (process.argv.includes("debug")) {
      arduinoPath = path.join(path.dirname(__dirname), "projects", "arduino-cli.exe");
    }

    // console.log("arduinoPath", arduinoPath);
    // fs.appendFile('C:\\Projects\\Robium\\robiumconnecter\\log1.txt', "\n arduinoPath: " + arduinoPath, function (err) {
    //   if (err) throw err;
    //   console.log('Saved!');
    // });

    return arduinoPath;
  },
  getProjectsPath: function () {
    let projectsPath = path.join(path.dirname(__dirname), "projects");
    if (process.argv.includes("debug")) {
      projectsPath = path.join(path.dirname(__dirname), "projects");
    }

    // console.log("projectsPath", projectsPath);
    // fs.appendFile('C:\\Projects\\Robium\\robiumconnecter\\log1.txt', "\n projectsPath: " + projectsPath, function (err) {
    //   if (err) throw err;
    //   console.log('Saved!');
    // });

    return projectsPath;
  },
  initArduino: function (arduinoInstallWindow) {
    let isError = false;
    let arduinoSettings = path.join(this.getProjectsPath(), "arduino-cli.json");
    //$ arduino-cli config init
    // Config file written: /home/lucidmachine/.arduino15/arduino-cli.yaml

    // arduino-cli config init --dest-file arduinoSettings

//----------------
    // let myPromise = new Promise(function (resolve) {
    //   _resolve = resolve;
    // });

    try {
      let connandLine = "This action is running: " + this.getArduinoPath() + " config init --dest-file " + arduinoSettings;

      if (arduinoInstallWindow != undefined && arduinoInstallWindow != null) {
        arduinoInstallWindow.webContents.send("dataMsg", connandLine);
      }

      //server = cp.spawn("C:\\Projects\\Robium\\arduino-cli_0.32.2_Windows_64bit\\arduino-cli.exe", ["board", "list"], {
      server = cp.spawn(this.getArduinoPath(), ["config", "init", "--dest-file", arduinoSettings], {
        detached: false,
      });

      server.stdout.on("data", (data) => {
        if (arduinoInstallWindow != undefined && arduinoInstallWindow != null) {
          arduinoInstallWindow.webContents.send("dataMsg", data.toString());
        }
      });

      server.stderr.on("data", (data) => {
        console.error(data.toString());
        isError = true;
        try {
          if (arduinoInstallWindow != undefined && arduinoInstallWindow != null) {
            arduinoInstallWindow.webContents.send("errorMsg", data.toString());
          }
        } catch (e) {
          console.log(e);
        }
      });

      server.on("exit", (code) => {
        // console.log("Server exited with code " + code.toString());
        connandLine = "This action is ready: " + this.getArduinoPath() + " config init --dest-file " + arduinoSettings;
        connandLine = connandLine + " , with code: " + code.toString();
        try {
          if (arduinoInstallWindow != undefined && arduinoInstallWindow != null) {
            arduinoInstallWindow.webContents.send("exitMsg", connandLine);
          }
        } catch (e) {
          console.log(e);
        }

        if(isError == false && code.toString() == '0'){
          try {
            const doc = yaml.load(fs.readFileSync(arduinoSettings, "utf8"));
            doc.board_manager.additional_urls.push("http://arduino.esp8266.com/stable/package_esp8266com_index.json");
            doc.board_manager.additional_urls.push("https://dl.espressif.com/dl/package_esp32_index.json");
            fs.writeFileSync(arduinoSettings, JSON.stringify(doc,null,4), function (err) {
              if (err) {
                if (arduinoInstallWindow != undefined && arduinoInstallWindow != null) {
                  arduinoInstallWindow.webContents.send("errorMsg", err.toString());
                }
                isError = true;
              } 
            });
            
            if(!isError){
              //-----
              connandLine = "This action is running: " + this.getArduinoPath() + " core update-index --config-file " + arduinoSettings;
              if (arduinoInstallWindow != undefined && arduinoInstallWindow != null) {
                arduinoInstallWindow.webContents.send("dataMsg", connandLine);
              }
        
              server = cp.spawn(this.getArduinoPath(), ["core", "update-index", "--config-file", arduinoSettings], {
                detached: false,
              });
        
              server.stdout.on("data", (data) => {
                if (arduinoInstallWindow != undefined && arduinoInstallWindow != null) {
                  arduinoInstallWindow.webContents.send("dataMsg", data.toString());
                }
              });
        
              server.stderr.on("data", (data) => {
                console.error(data.toString());
                isError = true;
                try {
                  if (arduinoInstallWindow != undefined && arduinoInstallWindow != null) {
                    arduinoInstallWindow.webContents.send("errorMsg", data.toString());
                  }
                } catch (e) {
                  console.log(e);
                }
              });

              server.on("exit", (code) => {
                // console.log("Server exited with code " + code.toString());
                connandLine = "This action is ready: " + this.getArduinoPath() + " core update-index --config-file " + arduinoSettings;
                connandLine = connandLine + " , with code: " + code.toString();
                try {
                  if (arduinoInstallWindow != undefined && arduinoInstallWindow != null) {
                    arduinoInstallWindow.webContents.send("exitMsg", connandLine);
                  }
                } catch (e) {
                  console.log(e);
                }
        
                if(isError == false && code.toString() == '0'){
                  connandLine = "This action is running: " + this.getArduinoPath() + " core install arduino:avr --config-file " + arduinoSettings;
                  if (arduinoInstallWindow != undefined && arduinoInstallWindow != null) {
                    arduinoInstallWindow.webContents.send("dataMsg", connandLine);
                  }
        
                  server = cp.spawn(this.getArduinoPath(), ["core", "install", "arduino:avr", "--config-file", arduinoSettings], {
                    detached: false,
                  });
        
                  server.stdout.on("data", (data) => {
                    if (arduinoInstallWindow != undefined && arduinoInstallWindow != null) {
                      arduinoInstallWindow.webContents.send("dataMsg", data.toString());
                    }
                  });
        
                  server.stderr.on("data", (data) => {
                    console.error(data.toString());
                    isError = true;
                    try {
                      if (arduinoInstallWindow != undefined && arduinoInstallWindow != null) {
                        arduinoInstallWindow.webContents.send("errorMsg", data.toString());
                      }
                    } catch (e) {
                      console.log(e);
                    }
                  });

                  server.on("exit", (code) => {
                    connandLine = "This action is running: " + this.getArduinoPath() + " core install arduino:avr --config-file " + arduinoSettings;
                    connandLine = connandLine + " , with code: " + code.toString();

                    try {
                      if (arduinoInstallWindow != undefined && arduinoInstallWindow != null) {
                        arduinoInstallWindow.webContents.send("exitMsg", connandLine);
                      }
                    } catch (e) {
                      console.log(e);
                    }

                    if(isError == false && code.toString() == '0'){
                      connandLine = "This action is running: " + this.getArduinoPath() + " core install esp8266:esp8266 --config-file " + arduinoSettings;
                      if (arduinoInstallWindow != undefined && arduinoInstallWindow != null) {
                        arduinoInstallWindow.webContents.send("dataMsg", connandLine);
                      }
            
                      server = cp.spawn(this.getArduinoPath(), ["core", "install", "esp8266:esp8266", "--config-file", arduinoSettings], {
                        detached: false,
                      });
            
                      server.stdout.on("data", (data) => {
                        if (arduinoInstallWindow != undefined && arduinoInstallWindow != null) {
                          arduinoInstallWindow.webContents.send("dataMsg", data.toString());
                        }
                      });
            
                      server.stderr.on("data", (data) => {
                        console.error(data.toString());
                        isError = true;
                        try {
                          if (arduinoInstallWindow != undefined && arduinoInstallWindow != null) {
                            arduinoInstallWindow.webContents.send("errorMsg", data.toString());
                          }
                        } catch (e) {
                          console.log(e);
                        }
                      });
    
                      server.on("exit", (code) => {
                      // console.log("Server exited with code " + code.toString());
                        connandLine = "This action is ready: " + this.getArduinoPath() + " core install esp8266:esp8266 --config-file " + arduinoSettings;
                        connandLine = connandLine + " , with code: " + code.toString();
                        try {
                          if (arduinoInstallWindow != undefined && arduinoInstallWindow != null) {
                            arduinoInstallWindow.webContents.send("exitMsg", connandLine);
                          }
                        } catch (e) {
                          console.log(e);
                        }
            
                        if(isError == false && code.toString() == '0'){
                        /***** */
                          connandLine = "This action is running: " + this.getArduinoPath() + " lib install FastLED --config-file " + arduinoSettings;
                          if (arduinoInstallWindow != undefined && arduinoInstallWindow != null) {
                            arduinoInstallWindow.webContents.send("dataMsg", connandLine);
                          }
    
                          server = cp.spawn(this.getArduinoPath(), ["lib", "install", "FastLED", "--config-file", arduinoSettings], {
                            detached: false,
                          });
    
                          server.stdout.on("data", (data) => {
                            if (arduinoInstallWindow != undefined && arduinoInstallWindow != null) {
                              arduinoInstallWindow.webContents.send("dataMsg", data.toString());
                            }
                          });
    
                          server.stderr.on("data", (data) => {
                            console.error(data.toString());
                            isError = true;
                            try {
                              if (arduinoInstallWindow != undefined && arduinoInstallWindow != null) {
                                arduinoInstallWindow.webContents.send("errorMsg", data.toString());
                              }
                            } catch (e) {
                              console.log(e);
                            }
                          });
    
                          server.on("exit", (code) => {
                            connandLine = "This action is ready: " + this.getArduinoPath() + " lib install FastLED --config-file " + arduinoSettings;
                            connandLine = connandLine + " , with code: " + code.toString();
                            try {
                              if (arduinoInstallWindow != undefined && arduinoInstallWindow != null) {
                                arduinoInstallWindow.webContents.send("exitMsg", connandLine);
                              }
                            } catch (e) {
                              console.log(e);
                            }
    
                            if(isError == false && code.toString() == '0'){
                              if (arduinoInstallWindow != undefined && arduinoInstallWindow != null) {
                                arduinoInstallWindow.webContents.send("doneMsg", "All done.");
                              }
                            }
                          });
                          /***** */
                        }
                      });
                    }
                  })
                }                
              });
            }

  // fs.appendFile('C:\\Projects\\Robium\\robiumconnecter\\log1.txt', JSON.stringify(doc,null,4), function (err) {
  //   if (err) throw err;
  //   console.log('Saved!');
  // });


      //     board_manager:
      // additional_urls:
      //   - http://arduino.esp8266.com/stable/package_esp8266com_index.json

            // console.log(doc);
          } catch (e) {
            console.log(e);
          }
        }

      });
    } catch (e) {
      error = e.toString();
      console.log("Server runs error: " + e);
      if (arduinoInstallWindow != undefined && arduinoInstallWindow != null) {
        arduinoInstallWindow.webContents.send("errorMsg", error);
      }
    }
// return myPromise;

//----------------
/*
    try {
      const doc = yaml.load(fs.readFileSync(arduinoSettings, "utf8"));

      //     board_manager:
      // additional_urls:
      //   - http://arduino.esp8266.com/stable/package_esp8266com_index.json

      console.log(doc);
    } catch (e) {
      console.log(e);
    }

    try {
      if (arduinoInstallWindow != undefined && arduinoInstallWindow != null) {
        arduinoInstallWindow.webContents.send("dataToTerminal", data.toString());
      }
    } catch (e) {
      console.log(e);
    }
*/
  },
  makeSrcFile: function (name, srcCode, notify) {
    let _this = this;
    console.log("MakeSrcFile called");
    this.isArduinoUsesPort = true;
    _this.win.webContents.send("isArduinoUsesPort", _this.isArduinoUsesPort);
    //sPath = fp.dirname(__dirname) + "\\projects\\" + name + "\\" + name + ".ino";
    let sPath = path.join(this.getProjectsPath(), name, name + ".ino");
    try {
      if (_this.win != undefined && _this.win != null) {
        _this.win.webContents.send("dataToTerminal", sPath);
      }
    } catch (e) {
      console.log(e);
    }

    //console.log("FilePath ", sPath);
    fs.writeFile(sPath, srcCode, (err) => {
      if (err) {
        console.error(err);
      }
      // file written successfully
      //console.log("file written successfully ", sPath);
      //console.log("cwd ", fp.dirname(__dirname) + "\\projects");
      //console.log("path ", name + "\\" + name + ".ino");
      try {
        if (_this.win != undefined && _this.win != null) {
          _this.win.webContents.send("dataToTerminal", "file written successfully");
        }
      } catch (e) {
        console.log(e);
      }
      console.log("fs.writeFile");
      _this.uploadPortName = _this.comName;
      _this.disconnectFromCOM();
      _this.stopMonitor();

      try {
        if (_this.win != undefined && _this.win != null) {
          _this.win.webContents.send("dataToTerminal", "Serial should be Stopped at port " + _this.uploadPortName);
          notify.sendNotify("Prepear the port for uploading");
        }
      } catch (e) {
        console.log(e);
      }

      let arduinoCLI;
      
      if(_this.devType == "ESP8266" || _this.isLimitedByReferenceName){
        console.log("ESP8266 name +.ino", name + "\\" + name + ".ino");
        arduinoCLI = cp.spawn(this.getArduinoPath(), ["compile", "--fqbn", "esp8266:esp8266:nodemcuv2", name + "\\" + name + ".ino"], {
          detached: false,
          cwd: _this.getProjectsPath(),
        });
      } else if(_this.devType == "ArduinoUNO"){
        console.log("ArduinoUNO name +.ino", name + "\\" + name + ".ino");
        arduinoCLI = cp.spawn(this.getArduinoPath(), ["compile", "--fqbn", "arduino:avr:uno", name + "\\" + name + ".ino"], {
          detached: false,
          cwd: _this.getProjectsPath(),
        });
      } else if(_this.devType == "ArduinoNANO"){

        // For Arduino Nano with old bootloader, you can use the arduino:avr:nano:cpu=atmega328 fqbn, and for Arduino Nano with new bootloader, you can use the arduino:avr:nano:cpu=atmega328old fqbn.

        arduinoCLI = cp.spawn(this.getArduinoPath(), ["compile", "--fqbn", "arduino:avr:nano:cpu=atmega328", name + "\\" + name + ".ino"], {
          detached: false,
          cwd: _this.getProjectsPath(),
        });
      }
      
      arduinoCLI.stdout.on("data", (data) => {
        console.log("STR OUT ", data.toString());
        try {
          if (_this.win != undefined && _this.win != null) {
            _this.win.webContents.send("dataToTerminal", data.toString());
            notify.sendNotify(data.toString());
          }
        } catch (e) {
          console.log(e);
        }
      });

      arduinoCLI.stderr.on("data", (data) => {
        console.error(data.toString());
        _this.isArduinoUsesPort = false;
        _this.win.webContents.send("isArduinoUsesPort", _this.isArduinoUsesPort);
        try {
          if (_this.win != undefined && _this.win != null) {
            _this.win.webContents.send("dataToTerminal", data.toString());
            notify.sendUploadError(data.toString());
          }
        } catch (e) {
          console.log(e);
        }
      });

      arduinoCLI.on("exit", (code) => {
        if (code == 0) {
          try {
            if (_this.win != undefined && _this.win != null) {
              _this.win.webContents.send("dataToTerminal", "Upload starting.");
            }
          } catch (e) {
            console.log(e);
          } 

          let arduinoCLIUpload;
      
          if(_this.devType == "ESP8266" || _this.isLimitedByReferenceName){
            arduinoCLIUpload = cp.spawn(this.getArduinoPath(), ["upload", "-p", _this.uploadPortName, "--fqbn", "esp8266:esp8266:nodemcuv2", name + "\\" + name + ".ino"], {
              detached: true,
              cwd: _this.getProjectsPath(),
            });
  
          } else if(_this.devType == "ArduinoUNO"){
            arduinoCLIUpload = cp.spawn(this.getArduinoPath(), ["upload", "-p", _this.uploadPortName, "--fqbn", "arduino:avr:uno", name + "\\" + name + ".ino"], {
              detached: true,
              cwd: _this.getProjectsPath(),
            });
  
          } else if(_this.devType == "ArduinoNANO"){
            arduinoCLIUpload = cp.spawn(this.getArduinoPath(), ["upload", "-p", _this.uploadPortName, "--fqbn", "arduino:avr:nano", name + "\\" + name + ".ino"], {
              detached: true,
              cwd: _this.getProjectsPath(),
            });
          }
          
          arduinoCLIUpload.stdout.on("data", (data) => {
            console.log("STR OUT ", data.toString());
            try {
              if (_this.win != undefined && _this.win != null) {
                _this.win.webContents.send("dataToTerminal", data.toString());
                notify.sendNotify(data.toString());
              }
            } catch (e) {
              console.log(e);
            }
          });

          arduinoCLIUpload.stderr.on("data", (data) => {
            console.error(data.toString());
            _this.isArduinoUsesPort = false;
            _this.win.webContents.send("isArduinoUsesPort", _this.isArduinoUsesPort);
            try {
              if (_this.win != undefined && _this.win != null) {
                _this.win.webContents.send("dataToTerminal", data.toString());
                notify.sendUploadError(data.toString());
              }
            } catch (e) {
              console.log(e);
            }
          });

          arduinoCLIUpload.on("exit", (code) => {
            if (code == 0) {
              console.log("androidCLI Upload exit " + code.toString());
              notify.sendUploadDone("androidCLI Upload exit " + code.toString());
            }
            _this.isArduinoUsesPort = false;
            _this.win.webContents.send("isArduinoUsesPort", _this.isArduinoUsesPort);
            _this.ports = [];
            _this.startMonitor(); //check
          });
        } else {
          _this.isArduinoUsesPort = false;
          _this.win.webContents.send("isArduinoUsesPort", _this.isArduinoUsesPort);
          _this.ports = [];
          _this.startMonitor(); //check
        }
        console.log("androidCLI Compile exit " + code.toString());
      });
    });
  },
  upload: function (name, srcCode, notify) {

    if(this.isArduinoUsesPort){
      notify.sendUploadError('The port is in use');
      return;
    }

    let _this = this;
    let sPath = this.getProjectsPath();
    let exists = fs.existsSync(sPath);
    console.log("Upload called ");

    if (!exists) {
      fs.mkdir(sPath, (err) => {
        if (err) {
          try {
            if (_this.win != undefined && _this.win != null) {
              _this.win.webContents.send("dataToTerminal", err);
            }
          } catch (e) {
            console.log(e);
          }
          notify.sendUploadError("Can't make dir");
          return console.error(err);
        }
        fs.mkdir(path.join(sPath, name), (err) => {
          if (err) {
            try {
              if (_this.win != undefined && _this.win != null) {
                _this.win.webContents.send("dataToTerminal", err);
              }
            } catch (e) {
              console.log(e);
            }
            notify.sendUploadError("Can't make dir");
            return console.error(err);
          }
          try {
            if (_this.win != undefined && _this.win != null) {
              notify.sendNotify("Directory created successfully! ");
              _this.win.webContents.send("dataToTerminal", "Directory created successfully! ");
            }
          } catch (e) {
            console.log(e);
          }
          // console.log('Directory created successfully! ');
          this.makeSrcFile(name, srcCode);
          return;
        });
      });
    }
    let existsName = fs.existsSync(path.join(sPath, name));
    if (!existsName) {
      fs.mkdir(path.join(sPath, name), (err) => {
        if (err) {
          try {
            if (_this.win != undefined && _this.win != null) {
              _this.win.webContents.send("dataToTerminal", err);
            }
          } catch (e) {
            console.log(e);
          }
          return console.error(err);
        }
        try {
          if (_this.win != undefined && _this.win != null) {
            notify.sendNotify("Directory created successfully! ");
            _this.win.webContents.send("dataToTerminal", "Directory created successfully! ");
          }
        } catch (e) {
          console.log(e);
        }
        //console.log('Directory created successfully! ');
        this.makeSrcFile(name, srcCode);
        return;
      });
    } else {
      fs.rmdir(path.join(sPath, name), { recursive: true, force: true }, (err) => {
        if (err) {
          return console.error(err);
        }
        fs.mkdir(path.join(sPath, name), (err) => {
          if (err) {
            return console.error(err);
          }
          try {
            if (_this.win != undefined && _this.win != null) {
              _this.win.webContents.send("dataToTerminal", "Directory created successfully! ");
            }
          } catch (e) {
            console.log(e);
          }
          // console.log('Directory created successfully! ');
          notify.sendNotify("Work on source file ");
          this.makeSrcFile(name, srcCode, notify);
          return;
        });
      });
    }
  },
  setComName: function (name) {

    let envelope = {
      comName: name,
      msg: "",
      preloader: false
    }

    if(!this.isLimitedByReferenceName){
      envelope.ports = this.ports;
    }

    if(name == '' && !this.isArduinoUsesPort){
      envelope.msg = "Searching for the device ...";
      envelope.preloader = true;
    } else if (this.isArduinoUsesPort){
      envelope.msg = "Device is connected. The hardware's operations are running...";
      envelope.preloader = true;
    } else {
      envelope.msg = "Device is connected on port: " + name;
    }

    this.comName = name;
    if (this.win != undefined && this.win != null) {
      try{
        this.win.webContents.send("comName", JSON.stringify(envelope));
      } catch (e){
        console.log(e);
      }
    }
  },
  comNameList: function (name) {
    let _this = this;
    let envelope = {
      ports:_this.ports,
      comName: name,
      msg: "",
      preloader: false
    }

    if(name == '' && !this.isArduinoUsesPort && _this.ports.length > 0){
      envelope.msg = "Select the device";
      envelope.preloader = false;
    }

    if(_this.ports.length == 0){
      envelope.msg = "Connect the device";
      envelope.preloader = true;
    }
    _this.win.webContents.send("comNameList", JSON.stringify(envelope));
    console.log(envelope);
  },
  setDevType: function (devTypeName){
    this.devType = devTypeName;
  },
  startMonitor: async function () {
    let _this = this;
    console.log("startMonitor called");
    // if(this.isArduinoUsesPort){
    //   console.log("startMonitor called -> returned, this.isArduinoUsesPort: ", this.isArduinoUsesPort);
    //   return;
    // }
    if (_this.comName == "") {
      _this.setComName("");
    }
    _this.isCOMMonitorRunning = true;
    let intervalCOMMonitor = setInterval(function () {
      if (!_this.isCOMMonitorRunning) {
        clearInterval(intervalCOMMonitor);
        return;
      }

      if(_this.isArduinoUsesPort){
        return;
      }

      if (_this.comName == "") {
        SerialPort.list().then((ports, err) => {
          if (err) {
            console.log("error", err.message);
            return;
          } else {
            // console.log("error", err.message)
          }
          
          if(_this.isLimitedByReferenceName){
            for (let tmpPort of ports) {
              //console.log("device", tmpPort);
              if (tmpPort.serialNumber == _this.referenceName) {
                _this.setComName(tmpPort.path);
                _this.connectToCOM();
              }
            }  
          } else {
            let isNewDeviceConnected = true;
            for (let tmpPort of ports) {
              for (let oldPort of _this.ports) {
                if(tmpPort.path == oldPort.path){
                  isNewDeviceConnected = false;
                  break;
                }
              }
              if(isNewDeviceConnected){
                break;
              }
            }
            if( (isNewDeviceConnected && ports.length > 0) || (_this.ports.length != ports.length) ){
              _this.ports.length = 0;
              for(let tmpPort of ports){
                _this.ports.push(tmpPort);
              }
              _this.comNameList("");
            }
          }
        });
      } else {
        if(!_this.isLimitedByReferenceName){
          SerialPort.list().then((ports, err) => {
            if (err) {
              console.log("error", err.message);
              return;
            } else {
              // console.log("error", err.message)
            }
          
            let isNewDeviceConnected = true;
            for (let tmpPort of ports) {
              for (let oldPort of _this.ports) {
                if(tmpPort.path == oldPort.path){
                  isNewDeviceConnected = false;
                  break;
                }
              }
              if(isNewDeviceConnected){
                break;
              }
            }
            if( (isNewDeviceConnected && ports.length > 0) || (_this.ports.length != ports.length) ){
              _this.ports.length = 0;
              for(let tmpPort of ports){
                _this.ports.push(tmpPort);
              }
              _this.comNameList("");
            }
          });
        }
      }
      // console.log("COM ports checked");
    }, 1000);

    // win.webContents.send("startMonitor", {});
  },
  stopMonitor: function () {
    console.log("stopMonitor called ");
    this.isCOMMonitorRunning = false;
  },
  connectToCOM: function () {
    let _this = this;
    console.log("connectToCOM called");
    if ((port == null || port == undefined) && _this.comName != "") {
      port = new SerialPort({
        path: _this.comName,
        baudRate: _this.baudRate,
        autoOpen: false,
      });
      port.open(function (err) {
        //console.log('opening port err : ', err.message)
        if (err) {
          setTimeout(function () {
            //_this.stopMonitor();
            //_this.startMonitor();
            _this.disconnectFromCOM();
            _this.connectToCOM();
          }, 500);

          try {
            if (_this.win != undefined && _this.win != null) {
              _this.win.webContents.send("dataToTerminal", err.message);
            }
          } catch (e) {
            console.log("My Error ", e);
          }
          return;
        }
      });

      port.on("error", function (err) {
        console.log("Error: ", err.message);
      });

      port.on("close", function () {
        console.log("Port closed. port.path: " + port.path);
        _this.disconnectFromCOM();
        _this.stopMonitor();
        _this.startMonitor();
      });

      parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));
      parser.on("data", function (data) {
        console.log("here 6");
        try {
          if (_this.win != undefined && _this.win != null) {
            _this.win.webContents.send("dataOn", data);
          }
        } catch (e) {
          console.log("My Error 2", e);
        }
      });
    } else {
      console.error("Error. In connectToCOM call. comName: ", _this.comName);
    }
  },
  disconnectFromCOM: function (callback) {
    console.log("disconnectFromCOM called", port, this.comName);
    if (port != null && port != undefined) {
      if (port.isOpen) {
        port.close(()=>{
          if(typeof callback !== "undefined"){
            callback();
          }
        });
      } else {
        console.log(" disconnectFromCOM " + this.comName);
        port = null;
        parser = null;
        this.setComName("");
        
        if(typeof callback !== "undefined"){
          callback();
        }
      }
    } else {
      if(typeof callback !== "undefined"){
        callback();
      }
    }
  },
  write: function (arg) {
    if (port != null && port != undefined) {
      console.log("Write: ", arg.toString());
      port.write(arg.toString() + "\n");
    }
  },
  setSerialBaudRate: function (serialBaudRate) {
    console.log("setSerialBaudRate: ", serialBaudRate);
    this.baudRate = Number(serialBaudRate);
    this.disconnectFromCOM();
    this.stopMonitor();
    this.startMonitor();
  },
  // findRobium: async function() {
  //   let _this = this;
  //     SerialPort.list().then((ports, err) => {
  //       if(err) {
  //         console.log("error", err.message)
  //         // document.getElementById('error').textContent = err.message
  //         return
  //       } else {
  //         // console.log("error", err.message)
  //         // document.getElementById('error').textContent = ''
  //       }
  //       // _this.win.webContents.send("forLog", data.toString());
  //       //console.log('ports', ports);
  //       for(let tmpPort of ports){
  //         if(tmpPort.serialNumber == _this.referenceName){
  //           _this.comName = tmpPort.path;
  //           console.log('ports', "Found the device");
  //         }
  //       }

  //       // if (ports.length === 0) {
  //       //   document.getElementById('error').textContent = 'No ports discovered'
  //       // }

  //     // tableHTML = tableify(ports)
  //     //   document.getElementById('ports').innerHTML = tableHTML
  //     })
  // }

  //     function listPorts() {
  //       listSerialPorts();
  //       setTimeout(listPorts, 2000);
  //     }

  // // Set a timeout that will check for new serialPorts every 2 seconds.
  // // This timeout reschedules itself.
  //     setTimeout(listPorts, 2000);
  //     listSerialPorts()
};

exports.ArduinoCLIWrapper = ArduinoCLIWrapper;
