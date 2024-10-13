const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
    saveConfig: (config) => ipcRenderer.send("save-config", config),
    loadConfig: () => ipcRenderer.invoke("load-config"),
    savePlaylist: (data) => ipcRenderer.send("save-playlist", data),
    loadPlaylists: (id) => ipcRenderer.invoke("load-playlists", id),
    requestSong: (id) => ipcRenderer.invoke("request-song", id)
});