import { useState, useEffect } from "react";
import { TuneStashPlaylist, TuneStashSong } from "./types.tsx";

import "./App.css";
import Overview from "./components/Overview.tsx";
import Playlists from "./components/Playlists.tsx";
import Playbar from "./components/Playbar.tsx";
import InputField from "./components/InputField.tsx";

let SP_CLIENT_ID : string = "";
let SP_CLIENT_SECRET : string = "";
let YT_API_KEY = "";

const MAIN_AUDIO = new Audio();

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

const getTuneStashPlaylist = async (playlistId : string) : Promise<TuneStashPlaylist | undefined> =>
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
		let playlist : TuneStashPlaylist;
		playlist = {
			id: data["id"],
			name: data["name"],
			art: data["images"][0]["url"],
			added: Date.now(),
			songs: []
		};
		
		// songs
		let songs : TuneStashSong[] = [];
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
	if (link.startsWith("https://www.youtube.com/") || link.startsWith("https://music.youtube.com/"))
	{
		const parsedUrl = new URL(link);
		const list = parsedUrl.searchParams.get('list');
		if (list && list != "")
		{
			return ["youtube", list];
		}
	}
	return [];
}

const getSpotifyURLSFromYoutube = async (songs : TuneStashSong[]) : Promise< TuneStashSong[]> =>
{
	function create_query( song : TuneStashSong )
	{
		return `${song.name} by ${ song.artists.join(", ") }`;
	}

	async function fetch_song_id(song : TuneStashSong)
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

const getYoutubePlaylistVideos = async (playlistId : string) : Promise<TuneStashPlaylist | undefined> =>
{
	// fetch playlist information
	const fetch_playlist_info = async () =>
	{
		try
		{
			const api_url = "https://www.googleapis.com/youtube/v3/playlists";
			const response = await fetch(
				`${api_url}?part=snippet&id=${encodeURIComponent(playlistId)}&safeSearch=none&key=${YT_API_KEY}`
			)

			if (!response.ok)
			{
				throw new Error("Unable to fetch yt playlist info");
			}

			const data = await response.json();
			return data.items[0]?.snippet.title;
		}
		catch (error)
		{
			console.error(error)
			return;
		}
	}

	const playlist_title = await fetch_playlist_info();
	
	// fetch playlist videos
	const extract_video_data = (data) =>
	{
		let result = [];
		for (let i = 0; i < data.length; i++)
		{
			result.push({
				artist : data[i].snippet.videoOwnerChannelTitle,
				name : data[i].snippet.title,
				art : data[i].snippet.thumbnails.default.url,
				url_id : data[i].snippet.resourceId.videoId,
			});
		}
		return result;
	}

	const fetch_playlist_videos = async ( videos : string[] = [], pageToken : string = "" ) =>
	{
		try
		{
			const api_url = "https://www.googleapis.com/youtube/v3/playlistItems";
			const response = await fetch(
				`${api_url}?part=snippet&playlistId=${encodeURIComponent(playlistId)}&maxResults=50&safeSearch=none&key=${YT_API_KEY}` + ( pageToken != "" ? `&pageToken=${pageToken}` : "" )
			)

			if (!response.ok)
			{
				throw new Error("Unable to fetch yt playlist info");
			}

			const data = await response.json();
			videos = [...videos, ...extract_video_data(data.items)]

			if (data.nextPageToken)
			{
				return await fetch_playlist_videos(videos, data.nextPageToken);
			}

			return videos;
		}
		catch (error)
		{
			console.error(error)
			return;
		}
	}

	const videos = await fetch_playlist_videos();
	if (videos == undefined || videos[0] == undefined)
	{
		return;
	}

	let playlist : TuneStashPlaylist = {
		id : playlistId,
		name : playlist_title,
		art : videos[0].art,
		added: Date.now(),
		songs : []
	}

	let songs : TuneStashSong[] = [];
	for (let i = 0; i < videos.length; i++)
	{
		songs[i] = {
			id : videos[i].url_id,
			name : videos[i].name,
			artists: [ videos[i].artist ],
			art: videos[i].art,
			album: playlist_title,
			duration: 0,
			url_id : videos[i].url_id
		}
	}

	playlist.songs = songs;
	return playlist;
}

const checkApiTokens = async () : Promise<boolean> =>
{
	// spotify API
	try
	{
		const access_token = await getSpotifyAccessToken();
	}
	catch (error)
	{
		// error with sp api
		return false;
	}

	// youtube api
	try
	{
		const api_url = "https://www.googleapis.com/youtube/v3/search";
		const response = await fetch(
			`${api_url}?part=snippet&q=cat&type=video&safeSearch=none&key=${YT_API_KEY}`
		);

		if (!response.ok)
		{
			// error with yt api;
			return false;
		}
	}
	catch (error)
	{
		// error with yt api
		return false;
	}

	return true;
}

function App()
{
	const [apiStatus, setApiStatus] = useState<boolean>(false);
	const [apiKeys, setApiKeys] = useState<string[]>(["","",""]);
	const [dialogActive, setDialogActive] = useState<boolean>(false);
	const [settingsActive, setSettingsActive] = useState<boolean>(false);
	const [playlistId, setPlaylistId] = useState<string>();
	const [playlists, setPlaylists] = useState<TuneStashPlaylist[]>([]);
	const [playlist, setPlaylist] = useState<TuneStashPlaylist>();
	const [songId, setSongId] = useState<string>();
	const [song, setSong] = useState<TuneStashSong>();
	const [songPlaylist, setSongPlaylist] = useState<TuneStashPlaylist>();
	const [shuffle, setShuffle] = useState<boolean>(false);
	const [isNext, setIsNext] = useState<boolean>(false);
	const [ghostPlaylist, setGhostPlaylist] = useState<TuneStashPlaylist>();

	useEffect(() =>
	{
		window.electronAPI.onUpdatePlaylists((data : string) =>
		{
			setPlaylists(JSON.parse(data));
			setGhostPlaylist(undefined);
		});
	
		window.electronAPI.onUpdateSong((data : string) =>
		{
			MAIN_AUDIO.pause();
			MAIN_AUDIO.src = `data:audio/wav;base64,${data}`;
			MAIN_AUDIO.play();
		});

		window.electronAPI.onUpdateConfig(async (data : string) =>
		{
			console.log("onUpdateConfig", data);
			const config = JSON.parse(data)
			SP_CLIENT_ID = config["SP_ID"];
			SP_CLIENT_SECRET = config["SP_SECRET"];
			YT_API_KEY = config["YT_KEY"];
			setApiKeys([ SP_CLIENT_ID, SP_CLIENT_SECRET, YT_API_KEY ]);

			const valid = await checkApiTokens();
			setApiStatus(valid);
		})
	}, []);

	const shuffle_playlist = () =>
	{
		if (songPlaylist == undefined || song == undefined)
		{
			return;
		}

		const newPl = JSON.parse(JSON.stringify(songPlaylist));

		const cur_song = newPl.songs.find(x => x.id === song.id);
		const otr_songs = newPl.songs.filter(x => x.id !== song.id);

		for (let i = otr_songs.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[otr_songs[i], otr_songs[j]] = [otr_songs[j], otr_songs[i]]; // Swap
		}

		newPl.songs = [cur_song, ...otr_songs];
		setSongPlaylist(newPl);
	}

	useEffect(() =>
	{
		let pl = isNext ? songPlaylist : playlists.find(x => x.id == playlistId);
		if (pl == undefined)
		{ return; }

		let newSong = pl.songs.find(x => x.id == songId);
		if (newSong == undefined)
		{
			return;
		}

		setSong(newSong);
		setSongPlaylist(pl);
		setIsNext(false);

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

	useEffect(() =>
	{
		if (songPlaylist == undefined)
		{
			return;
		}

		if (!shuffle)
		{
			const orig_pl = playlists.find(x => x.id == songPlaylist.id);
			if (orig_pl)
			{
				setSongPlaylist(orig_pl);
			}
			return;
		}
		shuffle_playlist();
	}, [shuffle])

	async function add_playlist(result: string[])
	{
		const link = result[0];
		const playlist_data = getPlaylistDataFromLink(link)
		if (playlist_data[0] == null)
		{
			return;
		}

		setDialogActive(false);
		if (playlist_data[0] == "spotify")
		{
			const sp_playlist : TuneStashPlaylist | undefined = await getTuneStashPlaylist(playlist_data[1])
			if (sp_playlist == undefined) { return; }
			sp_playlist.songs = await getSpotifyURLSFromYoutube(sp_playlist.songs);
			// set ghost
			setGhostPlaylist(sp_playlist);
			window.electronAPI.addPlaylist(JSON.stringify(sp_playlist));
		}
		else if (playlist_data[0] == "youtube")
		{
			const yt_playlist : TuneStashPlaylist | undefined = await getYoutubePlaylistVideos(playlist_data[1]);
			if (yt_playlist == undefined) { return; }
			// set ghost
			setGhostPlaylist(yt_playlist);
			window.electronAPI.addPlaylist(JSON.stringify(yt_playlist));
		}
	}

	async function update_api_keys(result : string[])
	{
		window.electronAPI.saveConfig(JSON.stringify(result));
		setSettingsActive(false);
	}

	return (
		<div className="flex flex-col relative w-screen h-screen overflow-hidden bg-zinc-950">
			<div className="flex flex-1">

				<Playlists
					playlists={playlists}
					playlistId={playlistId}
					ghostPlaylist={ghostPlaylist}
					setPlaylistId={setPlaylistId}
					callback={()=>{setDialogActive(true)}}
					setSettingsActive={setSettingsActive}
					apiStatus={apiStatus}
				/>

				<Overview
					playlist={playlist}
					songId={songId}
					setSongId={setSongId}
					shuffle={shuffle}
					setShuffle={setShuffle}
				/>
			</div>

			<Playbar
				visible={song != undefined}
				song={song}
				songPlaylist={songPlaylist}
				setSongId={setSongId}
				audio={MAIN_AUDIO}
				setIsNext={setIsNext}
				shuffle={shuffle}
				setShuffle={setShuffle}
			/>

			<InputField
				active={dialogActive}
				setActive={setDialogActive}
				onSubmit={add_playlist}
				submitLabel="Add"
				fields={["playlist link"]}
			/>

			<InputField
				active={settingsActive}
				setActive={setSettingsActive}
				onSubmit={update_api_keys}
				submitLabel="Save"
				fields={["Spotify Client ID", "Spotify Client Secret", "Youtube API Key"]}
				defaults={apiKeys}
			/>

		</div>
	);
}

export default App;