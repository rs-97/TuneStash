export interface TuneStashPlaylist
{
	id : string,
	name : string,
	art : string,
	songs : TuneStashSong[]
}

export interface TuneStashSong
{
	id : string,
	name : string,
	artists : string[],
	art : string,
	album : string,
	duration : number,
	url_id : string
}