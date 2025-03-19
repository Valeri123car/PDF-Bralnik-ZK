const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  saveFile: (data) => ipcRenderer.send("save-file", data),
  onFileSaved: (callback) => ipcRenderer.on("file-saved", callback),
});
