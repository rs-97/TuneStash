const { app, BrowserWindow, ipcMain, remote } = require('electron')
const path = require('node:path')
const fs = require('fs');
const ytdl = require("@distube/ytdl-core");

const downloadAudio = ( url_id, name ) =>
{
    return new Promise((resolve, reject) =>
        {
            const output = path.join(app.getPath("music"), 'tunestash', `${name}.wav`);
            const url = `https://www.youtube.com/watch?v=${url_id}`;
            const stream = ytdl(url,
                {
                    filter: format => format.audioBitrate > 0,
                    quality: "highestaudio"
                }
            );
            const fileStream = fs.createWriteStream(output);

            stream.pipe(fileStream);

            fileStream.on('finish', () =>
                {
                    resolve();
                }
            );

            fileStream.on('error', (error) =>
                {
                    console.error('Error saving file:', error);
                    reject(error);
                }
            );

            stream.on('error', (error) =>
                {
                    console.error('Error downloading song:', error);
                    reject(error);
                }
            );
        }
    );
}

const downloadPlaylistAudio = async ( songs ) =>
{
    // check if song with name {song.id}.wav exists in data/songs already, if it doesn't call download_song.
    const dirPath = path.join(app.getPath("music"), "tunestash");
    await fs.promises.mkdir(dirPath, { recursive: true }); 
    
    for (const song of songs)
    {
        const filePath = path.join(app.getPath("music"), 'tunestash', `${song.id}.wav`);
        
        if (!fs.existsSync(filePath))
        {
            try
            {
                await downloadAudio(song.url_id, song.id);
            }
            catch (error)
            {
                console.error(`Failed to download ${song.id}:`, error);
            }
        }
        else
        {
            console.log(`File already exists for ${song.id}, skipping download.`);
        }
    }
}

const saveConfig = async (SP_ID, SP_SECRET, YT_KEY) =>
{
    try
    {
        const dirPath = app.getPath("userData");
        const filePath = path.join(dirPath, 'config.json');
        await fs.promises.mkdir(dirPath, { recursive: true }); // create data folder if doesn't exist
        const data = JSON.stringify({SP_ID, SP_SECRET, YT_KEY}, null, 2); // Pretty print the JSON
        await fs.promises.writeFile(filePath, data, 'utf-8');
    }
    catch (error)
    {
        console.error("Error saving config:", error);
        throw error;
    }
}

const loadConfig = async () =>
{
    try
    {
        const filePath = path.join(app.getPath("userData"), 'config.json');
        const data = await fs.promises.readFile(filePath, 'utf-8');
        return data;
    }
    catch (error)
    {
        console.error("Error loading config, creating replacement.")
        await saveConfig("", "", "");
        return await loadConfig();
    }
}

const savePlaylistToFS = async (playlist) =>
{
    let playlists = await loadPlaylistsFromFS();
    playlists = JSON.parse(playlists);

    const index = playlists.findIndex(p => p.id === playlist.id);
    if (index !== -1)
    {
        playlists[index] = playlist;
    }
    else
    {
        playlists.push(playlist);
    }

    saveAllPlaylistsToFS("", playlists);
}

const createPlaylist = async (_event, data) =>
{
    const playlist = JSON.parse(data);
    await savePlaylistToFS(playlist);
    await downloadPlaylistAudio(playlist.songs);
}

const saveAllPlaylistsToFS = async (_event, playlists) =>
{
    try
    {
        const dirPath = app.getPath("userData");
        const filePath = path.join(dirPath, 'playlists.json');
        await fs.promises.mkdir(dirPath, { recursive: true }); // create data folder if doesn't exist
        const data = JSON.stringify(playlists, null, 2); // Pretty print the JSON
        await fs.promises.writeFile(filePath, data, 'utf-8');
    }
    catch (error)
    {
        console.error("Error saving playlists:", error);
        throw error;
    }
}

const loadPlaylistsFromFS = async () =>
{
    try
    {
        const filePath = path.join(app.getPath("userData"), 'playlists.json');
        const data = await fs.promises.readFile(filePath, 'utf-8');
        return data;
    }
    catch (error)
    {
        console.log(error);
        console.log('creating playlists');
        saveAllPlaylistsToFS("", []);
        return JSON.stringify([]);
    }
}

// takes in song id and returns base64 wav file
const loadSongDataFromFS = async (_event, songId) =>
{
    try
    {
        const filePath = path.join(app.getPath("music"), 'tunestash', `${songId}.wav`);
        const fileBuffer = await fs.promises.readFile(filePath);
        const base64Data = fileBuffer.toString('base64');
        return base64Data;
    }
    catch (error)
    {
        console.error('Error reading the song file:', error);
        throw new Error('Could not retrieve the song.');
    }
}

const createWindow = () =>
{
    const mainWindow = new BrowserWindow({
        width: 1100,
        height: 785,
        autoHideMenuBar: true,
        // resizable: false,
        // fullscreenable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })
  
    mainWindow.loadFile('./dist/index.html')

    const reload_playlists = async () =>
    {
        try
        {
            const playlistData = await loadPlaylistsFromFS();
            mainWindow.webContents.send("update-playlists", playlistData);
        }
        catch (error)
        {
            console.error(error);
            return;
        }
    }

    const reload_config = async () =>
    {
        try
        {
            const config = await loadConfig();
            mainWindow.webContents.send("update-config", config);
        }
        catch (error)
        {
            console.error(error);
            return;
        }
    }

    mainWindow.webContents.on('did-finish-load', reload_playlists);
    mainWindow.webContents.on('did-finish-load', reload_config);

    // mainWindow.webContents.openDevTools();

    ipcMain.on("save-config", async (_event, data) =>
    {
        const [ SP_ID, SP_SECRET, YT_KEY ] = JSON.parse(data);
        await saveConfig(SP_ID, SP_SECRET, YT_KEY);
        await reload_config();
    });

    ipcMain.on("add-playlist", async (_event, data) =>
    {
        await createPlaylist(_event, data);
        await reload_playlists();
    });

    ipcMain.on("request-playlists", reload_playlists);

    ipcMain.on("request-song", async ( _event, songId ) =>
        {
            try
            {
                const songData = await loadSongDataFromFS(_event, songId)
                mainWindow.webContents.send("update-song", songData);
            }
            catch (error)
            {
                console.error(error);
                return;
            }
        }
    );
}


app.whenReady().then(() =>
    {
        createWindow();
    }
)

app.on('window-all-closed', () =>
    {
        if (process.platform !== 'darwin') app.quit()
    }
)