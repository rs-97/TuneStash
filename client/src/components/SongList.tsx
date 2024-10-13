import { useState } from "react";
import { TuneStashSong } from "../types";
import PlayIconWhite from "../assets/play_white.svg";

interface SongOptions
{
    index : number,
    art : string,
    name : string,
    artist : string,
    album : string,
    length : number,
    selected : boolean,
    onClick : React.MouseEventHandler<HTMLTableRowElement>
}

interface SongListOptions
{
    visible : boolean,
    songs : TuneStashSong[],
    songId : string | undefined,
    setSongId : React.Dispatch<React.SetStateAction<string | undefined>>
}

function format_seconds_to_timestamp(total_seconds: number)
{
    const minutes = Math.floor(total_seconds / 60);
    const seconds = total_seconds % 60;
    const seconds_formatted = seconds < 10 ? `0${seconds}` : seconds;
    return `${minutes}:${seconds_formatted}`;
}

const Song : React.FC<SongOptions> = ({ index, name, art, artist, album, length, selected, onClick }) =>
{
    const [hover, setHover] = useState(false);
    const length_formatted : string = format_seconds_to_timestamp(length);
    let logo : number | Element = index;

    if (hover)
    {
        logo = (
            <div className="w-full h-full justify-center items-center flex">
                {/* <div className="w-5 h-5 flex bg-zinc-400 rounded-full justify-center items-center"> */}
                    <img src={PlayIconWhite} alt="play" className="w-2.5 h-2.5" />
                {/* </div> */}
            </div>
        );
    }
    
    return (
        <tr
            className="text-white text-sm hover:bg-white/5 cursor-pointer"
            onMouseEnter={()=>{setHover(true)}}
            onMouseLeave={()=>{setHover(false)}}
            onClick={onClick}
        >
            <th className="w-[2.5rem] data-[selected=true]:text-purple-500" data-selected={selected}>{logo}</th>
            <td className="flex py-2 pl-1 w-[20rem] pointer-events-none">
                <div className="flex h-10 aspect-square rounded-md overflow-hidden relative">
                    <img src={art} alt="art" className="absolute w-full h-full object-cover" />
                </div>
                <div className="flex flex-col ml-3 pointer-events-none">
                    <span className="font-semibold data-[selected=true]:text-purple-500" data-selected={selected}>{name}</span>
                    <span className="text-xs">{artist}</span>
                </div>
            </td>
            <td className=" w-[17rem] font-semibold pointer-events-none">{album}</td>
            <td className=" w-[3rem] text-center pointer-events-none">{length_formatted}</td>
        </tr>
    )
}

const SongList : React.FC<SongListOptions> = ({ visible, songs, songId, setSongId }) =>
{
    if (!visible)
    {
        return (<></>)
    }

    const songs_objs = songs.map((song, i) =>
    {
        const artist = song.artists.join(", ");
        return (
            <Song
                index={i + 1}
                name={song.name}
                artist={artist}
                album={song.album}
                length={Math.floor(song.duration / 1000)}
                art={song.art}
                selected={songId == song.id}
                onClick={()=>{
                    setSongId(song.id)
                }}
            />
        )
    });

    return (
        <div className="flex-auto h-0 px-3.5 overflow-y-scroll no-scrollbar">
            <table role="flex w-full grid w-full max-h-full">
                {songs_objs}
            </table>
        </div>
    )
}

export default SongList;