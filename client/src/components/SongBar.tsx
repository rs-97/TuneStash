import "./SongBar.css";

import IconPlay from "../assets/play.svg";
import IconPause from "../assets/pause.svg";
import IconForward from "../assets/forward.svg";
import IconBack from "../assets/back.svg";


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
    audio : HTMLAudioElement
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

const SongBar : React.FC<SongBarOptions> = ({ audio }) =>
{
    const [time, setTime] = useState(audio.currentTime);
    const [icon, setIcon] = useState(IconPlay);
    const [paused, setPaused] = useState(audio.paused);

    const togglePause = () =>
    {
        if (audio.paused)
        {
            audio.play();
            setPaused(false);
        }
        else
        {
            audio.pause();
            setPaused(true);
        }
    }

    useEffect(() =>
    {
        console.log("hello world")
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
                <Action filled={false} icon={IconBack} />
                <Action filled={true} onClick={togglePause} icon={icon} />
                <Action filled={false} icon={IconForward} />
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