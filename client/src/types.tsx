export interface SpotifyPlaylist
{
	id : string,
	name : string,
	art : string,
	songs : SpotifySong[]
}

export interface SpotifySong
{
	id : string,
	name : string,
	artists : string[],
	art : string,
	album : string,
	duration : number,
	url_id : string
}