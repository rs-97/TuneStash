
import { TuneStashPlaylist, TuneStashSong } from "../types.tsx";

import SongDisplay from "./SongDisplay.tsx";
import SongBar from "./SongBar.tsx";
import SongOptions from "./SongOptions.tsx";

interface PlaybarOptions
{
    visible : boolean,
    song : TuneStashSong | undefined,
    songPlaylist : TuneStashPlaylist | undefined,
    setSongId : Function,
    audio : HTMLAudioElement
}

const Playbar : React.FC<PlaybarOptions> = ({ visible, song, audio, songPlaylist, setSongId }) =>
{
    if (!visible || song == undefined)
    {
        return (<></>)
    }

    return (
        <div className="flex w-full h-[5rem] p-3 justify-between">
            <SongDisplay name={song.name} artist={song.artists.join(", ")} art={song.art} />
            <SongBar audio={audio} songPlaylist={songPlaylist} song={song} setSongId={setSongId}  />
            <SongOptions audio={audio} />
        </div>
    )
}

export default Playbar;