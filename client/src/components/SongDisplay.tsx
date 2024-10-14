import "./Scroll.css";

import { useEffect, useRef, useState } from "react";

interface SongDisplayOptions
{
    art : string,
    name : string,
    artist : string
}

const SongDisplay : React.FC<SongDisplayOptions> = ({ art, name, artist }) =>
{
    const [isOverflowing, setIsOverflowing] = useState(false);
    const nameRef = useRef<HTMLSpanElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (nameRef.current && containerRef.current) {
            const { scrollWidth } = nameRef.current;
            const { clientWidth } = containerRef.current;

            // Check if the scroll width of the text is greater than the container's width
            setIsOverflowing(scrollWidth > clientWidth);
        }
    }, [name]);

    return (
        <div className="flex h-full w-[20rem] items-center">
            <div className="flex h-full aspect-square overflow-hidden relative rounded-sm flex-shrink-0">
                <img src={art} alt="album-art" className="absolute w-full h-full object-cover" />
            </div>
            <div className="flex flex-col ml-5 text-white font-semibold text-sm overflow-x-hidden">
                <div ref={containerRef} className="song-name-container">
                    <span
                        ref={nameRef}
                        className={`scroll ${isOverflowing ? 'scrolling' : ''}`}
                    >
                        {name}
                    </span>
                </div>
                <span className="font-normal text-xs text-white/70">{artist}</span>
            </div>
        </div>
    )
}

export default SongDisplay;