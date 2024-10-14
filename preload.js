const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
    saveConfig: (config) => ipcRenderer.send("save-config", config),

    addPlaylist: (data) => ipcRenderer.send("add-playlist", data),
    
    requestSong: (id) => ipcRenderer.send("request-song", id),
    requestPlaylists: () => ipcRenderer.send("request-playlists"),
    
    onUpdatePlaylists: (callback) => ipcRenderer.on("update-playlists", (_event, value) => callback(value)),
    onUpdateSong: (callback) => ipcRenderer.on("update-song", (_event, value) => callback(value)),
    onUpdateConfig: (callback) => ipcRenderer.on("update-config", (_event, value) => callback(value)),
});