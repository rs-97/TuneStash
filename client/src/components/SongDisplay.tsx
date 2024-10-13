interface SongDisplayOptions
{
    art : string,
    name : string,
    artist : string
}

const SongDisplay : React.FC<SongDisplayOptions> = ({ art, name, artist }) =>
{
    return (
        <div className="flex h-full min-w-[20rem] items-center">
            <div className="flex h-full aspect-square overflow-hidden relative rounded-sm">
                <img src={art} alt="album-art" className="absolute w-full h-full object-cover" />
            </div>
            <div className="flex flex-col ml-5 text-white font-semibold text-sm">
                <span>{name}</span>
                <span className="font-normal text-xs text-white/70">{artist}</span>
            </div>
        </div>
    )
}

export default SongDisplay;