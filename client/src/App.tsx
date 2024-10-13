import { useState, useEffect } from "react";
import { SpotifyPlaylist, SpotifySong } from "./types.tsx";

import "./App.css";
import Overview from "./components/Overview.tsx";
import Playlists from "./components/Playlists.tsx";
import Playbar from "./components/Playbar.tsx";
import InputField from "./components/InputField.tsx";


let SP_CLIENT_ID : string = "";
let SP_CLIENT_SECRET : string = "";
let YT_API_KEY = "";

const MAIN_AUDIO = new Audio();

const loadBaseConfig = async () =>
{
	const config_data = await window.electronAPI.loadConfig();
	const config = JSON.parse(config_data)
	SP_CLIENT_ID = config["SP_ID"];
	SP_CLIENT_SECRET = config["SP_SECRET"];
	YT_API_KEY = config["YT_KEY"];
}

const getSpotifyAccessToken = async () : Promise<string | undefined> =>
{
	const api_url : string = "https://accounts.spotify.com/api/token";	
	const body = new URLSearchParams(
		{
			"grant_type": "client_credentials",
			"client_id": SP_CLIENT_ID,
			"client_secret": SP_CLIENT_SECRET
		}
	).toString();

	try
	{
		const response = await fetch(api_url,
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
		return undefined;
	}
}

const getSpotifyPlaylist = async (playlistId : string) : Promise<SpotifyPlaylist | undefined> =>
{
	const access_token = await getSpotifyAccessToken();
	if (access_token == undefined)
	{
		return undefined;
	}

	const api_url = `https://api.spotify.com/v1/playlists/${playlistId}`;

	try
	{
		const response = await fetch(api_url,
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
				duration: track["duration_ms"],
				url_id : ""
			}
		}

		playlist.songs = songs;
		return playlist;
	}
	catch (error)
	{
		console.error("Failed to fetch playlist:", error);
		return undefined;
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
			const api_url = "https://www.googleapis.com/youtube/v3/search";
			const response = await fetch(
				`${api_url}?part=snippet&q=${encodeURIComponent(create_query(song))}&type=video&safeSearch=none&key=${YT_API_KEY}`
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

function App()
{
	const [dialogActive, setDialogActive] = useState<boolean>(false);
	const [playlistId, setPlaylistId] = useState<string>();
	const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
	const [playlist, setPlaylist] = useState<SpotifyPlaylist>();
	const [songId, setSongId] = useState<string>();
	const [song, setSong] = useState<SpotifySong>();

	window.electronAPI.onUpdatePlaylists((data : string) =>
	{
		setPlaylists(JSON.parse(data));
	});

	window.electronAPI.onUpdateSong((data : string) =>
	{
		MAIN_AUDIO.pause();
		MAIN_AUDIO.src = `data:audio/wav;base64,${data}`;
		MAIN_AUDIO.play();
	});

	useEffect(() =>
	{
		const pl = playlists.find(x => x.id == playlistId);
		if (pl == undefined)
		{
			return;
		}

		const song = pl.songs.find(x => x.id == songId);
		setSong(song);
		window.electronAPI.requestSong( songId );
	}, [songId]);

	useEffect(() =>
	{
		if (playlistId == undefined)
		{
			return;
		}

		const pl = playlists.find(x => x.id == playlistId);
		setPlaylist(pl);
	}, [playlistId]);

	useEffect(() => {
		window.electronAPI.requestPlaylists();
	}, []);

	async function add_playlist(link: string)
	{
		const playlist_data = getPlaylistDataFromLink(link)
		if (playlist_data[0] == null)
		{
			return;
		}

		setDialogActive(false);

		const sp_playlist : SpotifyPlaylist | undefined = await getSpotifyPlaylist(playlist_data[1])
		if (sp_playlist == undefined)
		{
			return;
		}

		sp_playlist.songs = await getSpotifySongURLSFromYoutube(sp_playlist.songs);
		window.electronAPI.addPlaylist(JSON.stringify(sp_playlist));
	}

	return (
		<div className="flex flex-col relative w-screen h-screen overflow-hidden bg-zinc-950">
			<div className="flex flex-1">

				<Playlists
					playlists={playlists}
					setPlaylistId={setPlaylistId}
					callback={()=>{setDialogActive(true)}}
				/>

				<Overview
					playlist={playlist}
					setSongId={setSongId}
				/>
			</div>


			<Playbar
				visible={song != undefined}
				song={song}
				audio={MAIN_AUDIO}
			/>

			<InputField
				active={dialogActive}
				setActive={setDialogActive}
				onSubmit={add_playlist}
			/>
		</div>
	);
}

window.onload = loadBaseConfig
export default App;