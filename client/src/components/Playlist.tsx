import "./Spinner.css";

interface PlaylistOptions
{
    name : string,
    art : string,
    selected : boolean,
    onClick : React.MouseEventHandler<HTMLDivElement>,
    timestamp : string,
    isGhost : boolean | undefined
}

const ProgressRing = () =>
{
    return (
        <div className="lds-dual-ring"></div>
    )
}

const Playlist : React.FC<PlaylistOptions> = ({ name, art, selected, timestamp, onClick, isGhost }) =>
{
    return (
        <div
            onClick={onClick}
            data-selected={selected}
            data-ghost={isGhost}
            className="flex w-full h-16 mb-2 p-2 rounded-sm flex-shrink-0 relative items-center hover:bg-white/5 data-[selected=true]:bg-purple-500/10 cursor-pointer data-[ghost=true]:opacity-50 data-[ghost=true]:bg-black/50 data-[ghost=true]:cursor-default"
        >
            <div className="flex h-12 w-12 rounded-sm overflow-hidden relative">
                <img src={art} alt="album" className="w-full h-full absolute" />
            </div>
            <div className="flex flex-col ml-3 overflow-hidden">
                <span className="text-white/80 font-semibold text-sm whitespace-nowrap">{name}</span>
                <span className="text-white/50 text-xs">{timestamp}</span>
            </div>
            { isGhost && <ProgressRing /> }
        </div>
    )
}

export default Playlist