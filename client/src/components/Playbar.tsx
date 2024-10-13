
import { SpotifySong } from "../types.tsx";

import SongDisplay from "./SongDisplay.tsx";
import SongBar from "./SongBar.tsx";
import SongOptions from "./SongOptions.tsx";

interface PlaybarOptions
{
    visible : boolean,
    song : SpotifySong,
    audio : HTMLAudioElement
}

const Playbar : React.FC<PlaybarOptions> = ({ visible, song, setSongIndex, audio }) =>
{
    if (!visible || song == null || song.name == null)
    {
        return (<></>)
    }

    return (
        <div className="flex w-full h-[5rem] p-3 justify-between">
            <SongDisplay name={song.name} artist={song.artists.join(", ")} art={song.art} />
            <SongBar audio={audio} setSongIndex={setSongIndex} />
            <SongOptions audio={audio} />
        </div>
    )
}

export default Playbar;