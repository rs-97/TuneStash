import "./SongBar.css";

import IconPlay from "../assets/play.svg";
import IconPause from "../assets/pause.svg";
import IconForward from "../assets/forward.svg";
import IconBack from "../assets/back.svg";

import { TuneStashPlaylist, TuneStashSong } from "../types.tsx";
import { useEffect, useState } from "react";

interface ActionProps
{
    filled : boolean,
    icon : string,
    onClick : React.MouseEventHandler<HTMLDivElement>
}

interface SongBarOptions
{
    setSongIndex : Function,
    audio : HTMLAudioElement,
    songPlaylist : TuneStashPlaylist | undefined,
    setSongId : Function,
    song : TuneStashSong | undefined,
}

function format_seconds_to_timestamp(total_seconds: number)
{
    const minutes = Math.floor(total_seconds / 60);
    const seconds = Math.floor(total_seconds % 60);
    const seconds_formatted = seconds < 10 ? `0${seconds}` : seconds;
    return `${minutes}:${seconds_formatted}`;
}

const Action : React.FC<ActionProps> = ({ filled, icon, onClick }) =>
{
    return (
        <div onClick={onClick} className="flex h-[2rem] aspect-square bg-white data-[filled=false]:bg-transparent mx-2 justify-center items-center p-2.5 rounded-full cursor-pointer opacity-75 hover:opacity-100" data-filled={filled}>
            <img src={icon} alt="icon" />
        </div>
    )
}

const Time = ({ value }) =>
{
    return (
        <div className="flex h-full w-8 justify-center items-center">
            <span className="text-sm text-white/80 font-semibold">{format_seconds_to_timestamp(value)}</span>
        </div>
    )
}

const SongBar : React.FC<SongBarOptions> = ({ audio, song, songPlaylist, setSongId }) =>
{
    const [time, setTime] = useState(audio.currentTime);
    const [icon, setIcon] = useState(IconPause);
    const [paused, setPaused] = useState(audio.paused);

    const togglePause = () =>
    {
        setPaused(!audio.paused)
        if (audio.paused)
        {
            audio.play();
        }
        else
        {
            audio.pause();
        }
    }

    const previous = () =>
    {
        if (songPlaylist == undefined || song == undefined)
        {
            return;
        }

        const index = songPlaylist.songs.findIndex(x => x.id == song.id);
        if (index == 0)
        {
            return;
        }

        const newSong = songPlaylist.songs[index - 1];
        if (newSong == undefined)
        {
            return;
        }

        setSongId(newSong.id);
    }

    const next = () => 
    {
        if (songPlaylist == undefined || song == undefined)
            {
                return;
            }
    
            const index = songPlaylist.songs.findIndex(x => x.id == song.id);
            if (index >= songPlaylist.songs.length - 1)
            {
                return;
            }
    
            const newSong = songPlaylist.songs[index + 1];
            if (newSong == undefined)
            {
                return;
            }
    
            setSongId(newSong.id);
    }

    useEffect(() =>
    {
        const interval = setInterval(() =>
        {
            if (!audio.paused)
            {
                setTime(audio.currentTime);
            }
        }, 500);

        return () => { clearInterval(interval); };
    }, [audio]);

    useEffect(() =>
    {
        setIcon(paused ? IconPlay : IconPause);
    }, [paused]);

    return (
        <div className="flex flex-col h-full w-[25rem]">
            <div className="flex w-full h-2/3 justify-center items-end">
                <Action filled={false} icon={IconBack} onClick={previous} />
                <Action filled={true} onClick={togglePause} icon={icon} />
                <Action filled={false} icon={IconForward} onClick={next} />
            </div>
            <div className="flex w-full h-1/3">
                <Time value={time} />
                <input
                    type="range"
                    min="0"
                    value={time}
                    max={audio.duration}
                    className="flex-1 mx-1"
                    onChange={(e) => {
                        audio.currentTime = Number(e.target.value);
                        setTime(Number(e.target.value));
                    }}
                />
                <Time value={audio.duration} />
            </div>
        </div>
    )
}

export default SongBar;