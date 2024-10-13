import { useState, useEffect } from "react";

import "./App.css";
import Overview from "./components/Overview.tsx";
import Playlists from "./components/Playlists.tsx";
import Playbar from "./components/Playbar.tsx";
import InputField from "./components/InputField.tsx";

import { SpotifyPlaylist, SpotifySong } from "./types.tsx";

// let SP_CLIENT_ID : string = "";
// let SP_CLIENT_SECRET : string = "";
// let YT_API_KEY = "";

const SP_CLIENT_ID : string = "c9c34bead9694ed3bcb8bb82124a01a2";
const SP_CLIENT_SECRET : string = "3563a07cc8834b90ba0d18ad284f8124";
const YT_API_KEY = "AIzaSyBO-xor3lixZS4OZMPRSmtTbkt7__PLEi4";

const SONG_AUDIO = new Audio();

const loadBaseConfig = async () =>
{
	// const config_data = await window.electronAPI.loadConfig();
	// const config = JSON.parse(config_data)
	// SP_CLIENT_ID = config["SP_ID"];
	// SP_CLIENT_SECRET = config["SP_SECRET"];
	// YT_API_KEY = config["YT_KEY"];
}

window.onload = async () =>
{
	loadBaseConfig();
}

const getSpotifyAccessToken = async () : Promise<string> =>
{
	const apiUrl : string = "https://accounts.spotify.com/api/token";	
	const body = new URLSearchParams({
        "grant_type": "client_credentials",
        "client_id": SP_CLIENT_ID,
        "client_secret": SP_CLIENT_SECRET
	}).toString();

	try
	{
		const response = await fetch(apiUrl,
			{
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: body
			}
		);

		if (!response.ok)
		{
			throw new Error(`Error: ${response.status}`);
		}

		const data = await response.json();
		return data.access_token;
	}
	catch (error)
	{
		console.error("Failed to fetch access token:", error);
		return null;
	}
}

const getSpotifyPlaylist = async (playlistId : string) : Promise<SpotifyPlaylist> =>
{
	const access_token = await getSpotifyAccessToken();
	const apiUrl = `https://api.spotify.com/v1/playlists/${playlistId}`;

	try
	{
		const response = await fetch(apiUrl,
			{
				method: "GET",
				headers: { "Authorization" : `Bearer ${access_token}` }
			}
		);

		if (!response.ok)
		{
			throw new Error(`Error: ${response.status}`);
		}

		const data = await response.json();

		function get_artists(artists : any[])
		{
			let result : string[] = [];
			for (let i = 0; i < artists.length; i++)
			{
				result[i] = artists[i]["name"]
			}
			return result;
		}

		// playlist
		let playlist : SpotifyPlaylist;
		playlist = {
			id: data["id"],
			name: data["name"],
			art: data["images"][0]["url"],
			songs: []
		};
		
		// songs
		let songs : SpotifySong[] = [];
		for (let i = 0; i < data["tracks"]["items"].length; i++)
		{
			let track = data["tracks"]["items"][i]["track"];
			let art = track["album"]["images"][2] || track["album"]["images"][0];
			songs[i] = {
				id: track["id"],
				name: track["name"],
				artists: get_artists(track["artists"]),
				art: art["url"],
				album: track["album"]["name"],
				duration: track["duration_ms"]
			}
		}

		playlist.songs = songs;
		return playlist;
	}
	catch (error)
	{
		console.error("Failed to fetch playlist:", error);
		return null;
	}
}

const getPlaylistDataFromLink = (link : string) : string[] =>
{
	if (link.startsWith("https://open.spotify.com"))
	{
		const match = link.match(/playlist\/([a-zA-Z0-9]+)/);
		if (match && match[1])
		{
			return ["spotify", match[1]];
		}
	}
	return [];
}

const getSpotifySongURLSFromYoutube = async (songs : SpotifySong[]) : Promise< SpotifySong[]> =>
{
	function create_query( song : SpotifySong )
	{
		return `${song.name} by ${ song.artists.join(", ") }`;
	}

	async function fetch_song_id(song : SpotifySong)
	{
		try
		{
			const apiUrl = "https://www.googleapis.com/youtube/v3/search";
			const response = await fetch(
				`${apiUrl}?part=snippet&q=${encodeURIComponent(create_query(song))}&type=video&safeSearch=none&key=${YT_API_KEY}`
			);
	
			if (!response.ok)
			{
				throw new Error("Network response was not ok");
			}
	
			const data = await response.json();
			const items = data.items;
	
			if (items.length == 0)
			{
				return null;
			}
	
			return items[0]["id"]["videoId"];
		}
		catch (error)
		{
			console.error("Error fetching YouTube video", error);
			return null;
		}
	}

	for (let i = 0; i < songs.length; i++)
	{
		const url = await fetch_song_id(songs[i]);
		songs[i].url_id = url;
	}

	return songs;
}

const playSongFromId = async (songId : string) =>
{
	const songData = await window.electronAPI.requestSong(songId);
	SONG_AUDIO.pause();
	SONG_AUDIO.src = `data:audio/wav;base64,${songData}`;
	SONG_AUDIO.play();
}

// const audio = new Audio();

function App() {
	const [inputActive, setInputActive] = useState(false);
	const [playlistIndex, setPlaylistIndex] = useState(-1);
	const [songIndex, setSongIndex] = useState(-1);
	const [playlists, setPlaylists] = useState([]);
	const [currentSong, setCurrentSong] = useState({});

	async function load_playlists()
	{
		const playlist_data = await window.electronAPI.loadPlaylists();
		setPlaylists(JSON.parse(playlist_data));
	}

	useEffect(() =>
	{
		load_playlists();
	}, []);

	useEffect(() =>
	{
		setSongIndex(-1);
	}, [playlistIndex]);

	useEffect(() =>
	{
		if (playlistIndex == -1 || songIndex == -1)
		{
			return;
		}

		try
		{
			const song = playlists[playlistIndex].songs[songIndex];
			setCurrentSong(song);
			playSongFromId(song.id);
		}
		catch (error)
		{
			console.error(error)
			return;
		}
	}, [songIndex]);

  	function open_add_playlist()
	{
		setInputActive(true);
	}

	async function add_playlist(link: string)
	{
		const playlist_data = getPlaylistDataFromLink(link)
		if (playlist_data[0] == null)
		{
			return;
		}

		setInputActive(false);

		const sp_playlist : SpotifyPlaylist = await getSpotifyPlaylist(playlist_data[1])
		sp_playlist.songs = await getSpotifySongURLSFromYoutube(sp_playlist.songs);
		window.electronAPI.savePlaylist(JSON.stringify(sp_playlist));
	}

	function on_playlist_link_update(link : string)
	{

	}

	return (
		<div className="flex flex-col relative w-screen h-screen overflow-hidden bg-zinc-950">
			<div className="flex flex-1">
				<Playlists playlists={playlists} setPlaylist={setPlaylistIndex} callback={open_add_playlist} />
				<Overview playlists={playlists} playlistIndex={playlistIndex} setSong={setSongIndex} />
			</div>
			<Playbar
				visible={songIndex != -1}
				song={currentSong}
				audio={SONG_AUDIO}
				setSongIndex={setSongIndex}
			/>

			<InputField
				active={inputActive}
				setActive={setInputActive}
				onSubmit={add_playlist}
				onUpdate={on_playlist_link_update}
			/>
		</div>
	);
}

export default App;