interface PlaylistOptions
{
    name : string,
    art : string,
    onClick : React.MouseEventHandler<HTMLDivElement>
}

const Playlist : React.FC<PlaylistOptions> = ({ name, art, onClick }) =>
{
    return (
        <div onClick={onClick} className="flex w-full h-16 mb-2 p-2 rounded-sm items-center hover:bg-white/5 cursor-pointer">
            <div className="flex h-12 w-12 rounded-sm overflow-hidden relative">
                <img src={art} alt="album" className="w-full h-full absolute" />
            </div>
            <div className="flex flex-col ml-3">
                <span className="text-white/80 font-semibold text-sm">{name}</span>
                <span className="text-white/50 text-xs">-</span>
            </div>
        </div>
    )
}

export default Playlist