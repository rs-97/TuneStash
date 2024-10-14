import SongList from "./SongList.tsx";

import { TuneStashPlaylist } from "../types.tsx";

interface OverviewHeaderOptions
{
    visible : boolean,
    name : string,
    art : string,
    count : number,
    timestamp : string
}

interface OverviewOptions
{
    playlist : TuneStashPlaylist | undefined,
    songId : string | undefined,
    setSongId : React.Dispatch<React.SetStateAction<string | undefined>>
}

const OverviewHeader : React.FC<OverviewHeaderOptions> = ({ visible, name, count, art, timestamp }) =>
{
    // TODO = Date, Time

    if (!visible)
    {
        return (<></>)
    }

    return (
        <div className="flex w-full h-[6rem] p-4 items-center bg-gradient-to-bl from-purple-400/10 via-purple-600/5 flex-shrink-0">
            <div className="flex h-full aspect-square overflow-hidden relative rounded-sm">
                <img src={art} alt="album-art" className="absolute w-full h-full object-cover" />
            </div>
            <div className="flex flex-col ml-4">
                <span className="text-white/90 font-bold text-xl">{name}</span>
                <span className="text-white/50 text-xs mt-1">{timestamp} • {count} Songs</span>
            </div>
        </div>
    )
}


const Overview : React.FC<OverviewOptions> = ({ playlist, songId, setSongId }) =>
{
    const timestamp = ( ts : number ) =>
    {
        const date = new Date(ts);
        return date.toLocaleDateString();
    }

    if (playlist == undefined)
    {
        return (
            <div className="flex flex-1 h-full justify-center items-center">
                <span className="font-bold text-white/80 text-xl">Select or Add a playlist</span>
            </div>
        )
    }

    return (
        <div className="flex flex-1 h-full p-2 pl-1 pb-0">
            <div className="flex flex-1 bg-zinc-900/50 rounded-md relative">
                <div className="flex absolute left-0 top-0 w-full h-full"></div>
                <div className="flex flex-col w-full z-10 flex-grow-0">
                    <OverviewHeader
                        visible={playlist.name != null}
                        name={playlist.name}
                        art={playlist.art}
                        count={playlist.songs != null ? playlist.songs.length : 0}
                        timestamp={timestamp(playlist.added)}
                    />
                    <SongList
                        visible={playlist.name != null}
                        songs={playlist.songs}
                        songId={songId}
                        setSongId={setSongId}
                    />
                </div>
            </div>
        </div>
    )
}

export default Overview;