const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } = require("electron");
const path = require("path");
const { WebSocketServer } = require("ws");
const { ArduinoCLIWrapper } = require("../modules/arduinoCLIWrapper.js");
const cp = require("child_process");
var fs = require("fs");

if (typeof process.argv[1] !== "undefined" && process.argv[1] == "--squirrel-firstrun") {
  // fs.appendFile('C:\\Projects\\Robium\\robiumconnecter\\log1.txt', process.argv[1], function (err) {
  //   if (err) throw err;
  //   console.log('Saved!');
  // });

  let browserWindowIcon = "";
  if (process.argv.includes("debug")) {
    browserWindowIcon = nativeImage.createFromPath(path.join(process.cwd(), "icons/png", "32x32.png"));
  } else {
    browserWindowIcon = nativeImage.createFromPath(path.join(process.cwd(), "resources/app/icons/png", "32x32.png"));
  }

  app.whenReady().then(() => {
    const arduinoInstallationWin = new BrowserWindow({
      show: false,
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        // preload: path.join(__dirname, 'preload.js'),
      },
      icon: browserWindowIcon,
    });

    arduinoInstallationWin.setMenuBarVisibility(false);
    arduinoInstallationWin.loadFile(path.join(__dirname, "arduinoInstall.html"));

    arduinoInstallationWin.once("ready-to-show", () => {
      arduinoInstallationWin.show();
      ArduinoCLIWrapper.initArduino(arduinoInstallationWin);
    });

    arduinoInstallationWin.on("closed", () => {
      app.quit();
    });

    ipcMain.on("relaunch", (event, args) => {
      // console.log(__dirname);
      //C:\Users\paula\AppData\Local\RobiumConnecter\app-1.0.1\resources\app\src
      //C:\Users\paula\AppData\Local\RobiumConnecter\app-1.0.1\RobiumConnecter.exe
  
  //     fs.appendFile('C:\\Projects\\Robium\\robiumconnecter\\log1.txt', path.join(__dirname, '..', '..', '..', 'RobiumConnecter.exe'), function (err) {
  //   if (err) throw err;
  //   console.log('Saved!');
  // });

  // cp.spawn(path.join(__dirname, '..', '..', '..', 'RobiumConnecter.exe'), [], {
  //   detached: true,
  // });

      app.quit();
      
    });

  });
} else {
  // Handle creating/removing shortcuts on Windows when installing/uninstalling.
  if (require("electron-squirrel-startup")) {
    app.quit();
  }

  let mainWindow = null;
  const createWindow = () => {
    let browserWindowIcon = "";
    if (process.argv.includes("debug")) {
      browserWindowIcon = nativeImage.createFromPath(path.join(process.cwd(), "icons/png", "32x32.png"));
    } else {
      browserWindowIcon = nativeImage.createFromPath(path.join(process.cwd(), "resources/app/icons/png", "32x32.png"));
    }

    // Create the browser window.
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        // preload: path.join(__dirname, 'preload.js'),
      },
      icon: browserWindowIcon,
    });

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, "index.html"));

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    mainWindow.on("closed", () => {
      mainWindow = null;
    });

    mainWindow.setMenuBarVisibility(false);

    ArduinoCLIWrapper.win = mainWindow;
    // ArduinoCLIWrapper.findRobium();
    ArduinoCLIWrapper.startMonitor();
  };

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // app.on('ready', createWindow);

  let tray;

  app.whenReady().then(() => {
    let icon = "";
    let iconMenuOrange = "";
    console.log(process.argv.includes("debug"));

    if (process.argv.includes("debug")) {
      icon = nativeImage.createFromPath(path.join(process.cwd(), "icons/win", "icon.ico"));
      iconMenuOrange = nativeImage.createFromPath(path.join(process.cwd(), "icons/png", "24x24.png"));
    } else {
      icon = nativeImage.createFromPath(path.join(process.cwd(), "resources/app/icons/win", "icon.ico"));
      iconMenuOrange = nativeImage.createFromPath(path.join(process.cwd(), "resources/app/icons/png", "24x24.png"));
    }

    tray = new Tray(icon);
    if (process.platform === "win32") {
      tray.on("click", () => {
        if (mainWindow != null) {
          mainWindow.focus();
          return;
        }
        createWindow();
      });
    }

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Robium",
        click() {
          if (mainWindow != null) {
            mainWindow.focus();
            return;
          }
          createWindow();
        },
        icon: iconMenuOrange,
      },
      {
        label: "Item2",
        type: "separator",
      },
      {
        label: "Quit Robium ",
        click() {
          // if(win != null ){
          //   win.webContents.send("quit", "");
          // }
          app.quit();
        },
        role: "quit",
      },
    ]);

    tray.setContextMenu(contextMenu);
    tray.setToolTip("Robium Connecter");
    tray.setTitle("Robium Connecter");
  });

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on("window-all-closed", () => {
    // if (process.platform !== 'darwin') {
    //   app.quit();
    // }
    ArduinoCLIWrapper.stopMonitor();
    ArduinoCLIWrapper.disconnectFromCOM();
    ArduinoCLIWrapper.win = null;
  });

  app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  const notify = {
    sendNotify: (msg)=>{
      sendNotifyToSocket(JSON.stringify(msg), NOTIFY_GENERAL);
    },
    sendUploadError: (msg)=>{
      sendNotifyToSocket(JSON.stringify(msg), NOTIFY_UPLOAD_ERROR);
    },
    sendUploadDone: (msg)=>{
      sendNotifyToSocket(JSON.stringify(msg), NOTIFY_UPLOAD_END);
    },
  }
  // In this file you can include the rest of your app's specific main process
  // code. You can also put them in separate files and import them here.
  const wss = new WebSocketServer({ port: 8080 });
  let wsConnection = null;
  wss.on("connection", function connection(ws) {
    wsConnection = ws;
    ws.on("error", console.error);

    ws.on("message", function message(data) {
      // console.log("received: %s", data);
      try {
        var dataJSON = JSON.parse(data);
        if (dataJSON.action == "upload") {
          // if (mainWindow != null) {
          //   ArduinoCLIWrapper.stopMonitor();
          //   ArduinoCLIWrapper.disconnectFromCOM();
          // }
          if(ArduinoCLIWrapper.isArduinoUsesPort){
            sendNotifyToSocket("The hardware's operations are already running. Check the RobiumConnecter");
            return;
          } else {
            sendNotifyToSocket("", NOTIFY_UPLOAD_START);
            ArduinoCLIWrapper.upload(dataJSON.name, dataJSON.srcCode, notify);
          }
        }
        if(dataJSON.action =="getDeviceProp"){
          let d = {
            devCOM: ArduinoCLIWrapper.uploadPortName,
            devType: ArduinoCLIWrapper.devType
          }

          if(d.devCOM == ""){
            d.devCOM = ArduinoCLIWrapper.comName;
          }
          
          sendNotifyToSocket(JSON.stringify(d), NOTIFY_DEVPROP);
        }
      } catch (e) {
        console.log("e ", e);
      }
      // ws.send("something***");
    });
    // ArduinoCLIWrapper.getBoardsList();
  });

  const wssScratch = new WebSocketServer({ port: 8081 });
  let wsConnectionScratch = null;
  wssScratch.on("connection", function connection(ws) {
    wsConnectionScratch = ws;
    ws.on("error", console.error);
    ws.on("message", function message(data) {
      try {
        ArduinoCLIWrapper.write(data);
        if (wsToDevice != null) {
          wsToDevice.send(data.toString());
          console.log("send to wsToDevice");
        }
        console.log("From Scratch %s", data);
      } catch (e) {
        console.log("e ", e);
      }
    });
  });

  const wssToDevice = new WebSocketServer({ port: 8082 });
  let wsToDevice = null;
  wssToDevice.on("connection", function connection(ws) {
    wsToDevice = ws;
    ws.on("error", console.error);
    ws.on("message", function message(data) {
      try {
        console.log("From Device %s", data);
        if (wsConnection != null) {
          wsConnection.send(data.toString());
        }
        if (wsConnectionScratch != null) {
          wsConnectionScratch.send(data.toString());
        }
      } catch (e) {
        console.log("e ", e);
      }
    });
  });

  async function run() {
    let boards = await ArduinoCLIWrapper.getBoardsList();
    console.log(boards);
    let boardsStr = "";
    for (let i = 0; i < boards.length; i++) {
      boardsStr += JSON.stringify(boards[i]);
    }
    try {
      if (mainWindow != undefined && mainWindow != null) {
        mainWindow.webContents.send("dataToTerminal", boardsStr);
      }
    } catch (e) {
      console.log(e);
    }
  }

  run();

  ipcMain.on("quit", (event, args) => {
    ArduinoCLIWrapper.stopMonitor();
    ArduinoCLIWrapper.disconnectFromCOM();
    app.quit();
  });

  ipcMain.on("close", (event, args) => {
    // ArduinoCLIWrapper.stopMonitor();
    mainWindow.close();
  });

  ipcMain.on("setSerialBaudRate", (event, args) => {
    // ArduinoCLIWrapper.stopMonitor();
    ArduinoCLIWrapper.setSerialBaudRate(args.serialBaudRate);
  });

  ipcMain.on("sendStringToSocket", (event, args) => {
    // console.log("sendStringToSocket ", args);
    if (wsConnection != null) {
      // let package = {
      //   type: "string",
      //   value: args,
      // };
      //wsConnection.send(args);
    }
    if (wsConnectionScratch != null) {
      let package = {
        type: "string",
        name: "serial",
        value: args,
      };
      // console.log("wsConnectionScratch.send(package)");
      wsConnectionScratch.send(JSON.stringify(package));
    }
  });

  function sendNotifyToSocket(args){
    let package = {
      type: "notify",
      name: "RobiumConnectionStatus",
      value: args,
    };
    if (wsConnection != null) {
      wsConnection.send(JSON.stringify(package));
    }
    if (wsConnectionScratch != null) {
      wsConnectionScratch.send(JSON.stringify(package));
    }
  };

  const NOTIFY_DEVPROP = "deviceProps";
  const NOTIFY_UPLOAD_START = "uploadStart";
  const NOTIFY_UPLOAD_ERROR = "uploadError";
  const NOTIFY_UPLOAD_END = "uploadEnd";
  const NOTIFY_GENERAL = "general";

  function sendNotifyToSocket(args, type){
    let package = {
      type: "notify",
      name: type,
      value: args,
    };
    if (wsConnection != null) {
      wsConnection.send(JSON.stringify(package));
    }
    if (wsConnectionScratch != null) {
      wsConnectionScratch.send(JSON.stringify(package));
    }
  };
  
  ipcMain.on("sendNotifyToSocket", (event, args) => {
    // console.log("sendStringToSocket ", args);
    sendNotifyToSocket(args);
  });

  ipcMain.on("writeToSerial", (event, args) => {
    ArduinoCLIWrapper.write(args);
  });

  ipcMain.on("setDeviceByUser", (e,a) => {
    ArduinoCLIWrapper.disconnectFromCOM(()=>{
      ArduinoCLIWrapper.setComName(a);
      ArduinoCLIWrapper.connectToCOM();
    });
    
  });

  ipcMain.on("setDeviceTypeByUser", (e,a) => {
    ArduinoCLIWrapper.setDevType(a);
    // ArduinoCLIWrapper.connectToCOM();
    console.log("setDeviceTypeByUser", a);
  });

  ipcMain.on("getComList", () => {
    ArduinoCLIWrapper.comNameList("");
    console.log("getComList");
  });
}

// const dir = cp.spawn( 'cmd', [ 'C:\\Projects\\Robium\\arduino-cli_0.32.2_Windows_64bit\\arduino-cli.exe', 'monitor', '-p', 'COM12', '-q' ] );

// dir.stdout.on( 'data', ( data ) => console.log( `stdout: ${ data }` ) );
// dir.stderr.on( 'data', ( data ) => console.log( `stderr: ${ data }` ) );
// dir.on( 'close', ( code ) => console.log( `child process exited with code ${code}` ) );

// console.log("arduinoCLIMonitor runs 0");
// //let arduinoCLIMonitor1 = cp.spawn("C:\\Projects\\Robium\\arduino-cli_0.32.2_Windows_64bit\\arduino-cli.exe", ["upload", "-p", "COM12", "--fqbn", "esp8266:esp8266:nodemcuv2", "sketch_jun14a_copy_20230614194018/sketch_jun14a_copy_20230614194018.ino"], {
//       let arduinoCLIMonitor1 = cp.spawn("C:\\Projects\\Robium\\arduino-cli_0.32.2_Windows_64bit\\arduino-cli.exe", ["monitor", "-p", "COM12", "-v"], {
//         detached: true,
//         cwd: path.dirname("C:\\Projects\\Robium\\arduino-cli_0.32.2_Windows_64bit")
//       });
// //       console.log("arduinoCLIMonitor runs 1");
//       arduinoCLIMonitor1.stdout.on("data", (data) => {
//         console.log("arduinoCLIMonitor run " + data.toString());
//         // e.call(data);
//       });
//       arduinoCLIMonitor1.stderr.on("data", (data) => {
//         // e.call(data);
//         console.log("arduinoCLIMonitor error " + data.toString());
//       });
//       arduinoCLIMonitor1.on("exit", (code) => {
//         console.log("arduinoCLIMonitor exited with code " + code.toString());
//       });

//esp8266:esp8266:nodemcuv2
//compile --fqbn esp8266:esp8266:nodemcuv2 sketch_jun14a_copy_20230614194018.ino
//upload -p COM12 --fqbn esp8266:esp8266:nodemcuv2 sketch_jun14a_copy_20230614194018/sketch_jun14a_copy_20230614194018.ino
//monitor -p COM12 -q

// friendlyName
// :
// "USB-SERIAL CH340 (COM12)"
// locationId
// :
// "Port_#0002.Hub_#0002"
// manufacturer
// :
// "wch.cn"
// path
// :
// "COM12"
// pnpId
// :
// "USB\\VID_1A86&PID_7523\\5&17279B77&0&2"
// productId
// :
// "7523"
// serialNumber
// :
// "5&17279B77&0&2"
// vendorId
// :
// "1A86"
