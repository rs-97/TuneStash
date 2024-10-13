const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')
const fs = require('fs');
const ytdl = require("@distube/ytdl-core");

const constructConfig = () =>
{
    return {
        SP_ID : "",
        SP_SECRET : "",
        YT_KEY : ""
    }
}

const constructPlaylists = () =>
{
    return [];
}

const download_audio = ( url_id, name ) =>
{
    return new Promise((resolve, reject) => {
        const output = `data/songs/${name}.wav`;
        const url = `https://www.youtube.com/watch?v=${url_id}`;
        const stream = ytdl(url, {
            filter: format => format.audioBitrate > 0,
            quality: "highestaudio"
        });
        const fileStream = fs.createWriteStream(output);

        stream.pipe(fileStream);

        fileStream.on('finish', () =>
        {
            console.log('Download completed for:', name);
            resolve();
        });

        fileStream.on('error', (error) =>
        {
            console.error('Error saving file:', error);
            reject(error);
        });

        stream.on('error', (error) =>
        {
            console.error('Error downloading song:', error);
            reject(error);
        });
    });
}

const download_playlist_songs = async ( songs ) =>
{
    // check if song with name {song.id}.wav exists in data/songs already, if it doesn't call download_song.
    for (const song of songs)
    {
        const fileName = `${song.id}.wav`;
        const filePath = `data/songs/${fileName}`;
        
        if (!fs.existsSync(filePath))
        {
            try
            {
                await download_audio(song.url_id, song.id);
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

// load application config, api keys, playlists etc 
const save_config = async (event, config) =>
{
    try
    {
        const dirPath = path.join(__dirname, 'data');
        const filePath = path.join(dirPath, 'config.json');
        await fs.promises.mkdir(dirPath, { recursive: true }); // create data folder if doesn't exist
        const data = JSON.stringify(config, null, 2); // Pretty print the JSON
        await fs.promises.writeFile(filePath, data, 'utf-8');
    }
    catch (error)
    {
        console.error("Error saving config:", error);
        throw error;
    }
}

// load above
const load_config = async () =>
{
    try
    {
        const filePath = path.join(__dirname, 'data', 'config.json');
        const data = await fs.promises.readFile(filePath, 'utf-8');
        return data;
    }
    catch (error)
    {
        console.log(error);
        console.log('creating config');
        const config = constructConfig();
        save_config("", config);
        return JSON.stringify(config);
    }
}

const save_playlist_json = async (playlist) =>
{
    let playlists = await load_playlists();
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

    save_playlists("", playlists);
}

const save_playlist = async (event, data) =>
{
    const playlist = JSON.parse(data);
    await save_playlist_json(playlist);
    await download_playlist_songs(playlist.songs);
    console.log("playlisted downloaded")
}

const save_playlists = async (event, playlists) =>
{
    try
    {
        const dirPath = path.join(__dirname, 'data');
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

const load_playlists = async () =>
{
    try
    {
        const filePath = path.join(__dirname, 'data', 'playlists.json');
        const data = await fs.promises.readFile(filePath, 'utf-8');
        return data;
    }
    catch (error)
    {
        console.log(error);
        console.log('creating playlists');
        const playlists = constructPlaylists();
        save_playlists("", playlists);
        return JSON.stringify(playlists);
    }
}

// takes in song id and returns base64 wav file
const request_song = async (event, songId) =>
{
    try
    {
        const filePath = path.join(__dirname, 'data', 'songs', `${songId}.wav`);
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
    const win = new BrowserWindow({
        width: 1000,
        height: 685,
        autoHideMenuBar: true,
        resizable: false,
        fullscreenable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })
  
    win.loadFile('./dist/index.html')

    // win.webContents.openDevTools();

    ipcMain.on("save-config", save_config);
    ipcMain.handle("load-config", load_config);
    ipcMain.on("save-playlist", save_playlist);
    ipcMain.handle("load-playlists", load_playlists);
    ipcMain.handle("request-song", request_song);
}

app.whenReady().then(() =>
{
    createWindow()
})

app.on('window-all-closed', () =>
{
    if (process.platform !== 'darwin') app.quit()
})