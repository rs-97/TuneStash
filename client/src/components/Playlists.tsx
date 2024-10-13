import MusicIcon from "../assets/music.svg";
import PlusIcon from "../assets/plus.svg";
import Playlist from "./Playlist.tsx";

import { SpotifyPlaylist } from "../types.tsx";

interface PlaylistsOptions
{
    playlists : SpotifyPlaylist[],
    setPlaylistId : React.Dispatch<React.SetStateAction<string | undefined>>,
    callback : React.MouseEventHandler<HTMLDivElement>
}

interface AddPlaylistOptions
{
    callback : React.MouseEventHandler<HTMLDivElement>
}

const AddPlaylist : React.FC<AddPlaylistOptions> = ({ callback }) =>
{
    return (
        <div onClick={callback} className="flex w-6 h-6 p-1 cursor-pointer justify-center items-center rounded-full opacity-75 hover:opacity-100">
            <img src={PlusIcon} alt="plus" />
        </div>
    )
}

const Title : React.FC<AddPlaylistOptions> = ({ callback }) =>
{
    return (
        <div className="flex w-full h-12 items-center justify-between p-4">
            <div className="flex h-full items-center">
                <img src={MusicIcon} alt="music" className="h-5 mr-4" />
                <span className="font-semibold text-white/80">Playlists</span>
            </div>
            <AddPlaylist callback={callback} />
        </div>
    )
}

const Playlists : React.FC<PlaylistsOptions> = ({ playlists, setPlaylistId, callback }) =>
{
    const playlists_objs = playlists.map((pl, i) =>
    {
        return (
            <Playlist name={pl.name} art={pl.art} onClick={() => { setPlaylistId(pl.id) }} />
        )
    });

    return (
        <div className="flex w-[17rem] h-full p-2 pr-1 pb-0">
            <div className="flex flex-1 flex-col bg-zinc-900/50 rounded-md relative">
                <div className="flex absolute left-0 top-0 w-full h-full bg-gradient-to-bl from-purple-950/5"></div>
                <div className="flex w-full h-full flex-col z-10">
                    <Title callback={callback} />
                    <div className="flex flex-col p-2">
                        {playlists_objs}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Playlists