import "./SongBar.css";

import PlayIcon from "../assets/play.svg"
import { useEffect, useState } from "react";

interface ActionProps
{
    filled : boolean,
    children : React.ReactNode
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

const IconPlay = ({ paused }) =>
{
    if (!paused)
    {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                <path d="M48 64C21.5 64 0 85.5 0 112L0 400c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48L48 64zm192 0c-26.5 0-48 21.5-48 48l0 288c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48l-32 0z"/>
            </svg>
        )
    }
    else
    {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                <path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80L0 432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"/>
            </svg>
        )
    }
}

const IconFoward = () =>
{
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
            <path fill="white" d="M52.5 440.6c-9.5 7.9-22.8 9.7-34.1 4.4S0 428.4 0 416L0 96C0 83.6 7.2 72.3 18.4 67s24.5-3.6 34.1 4.4l192 160L256 241l0-145c0-17.7 14.3-32 32-32s32 14.3 32 32l0 320c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-145-11.5 9.6-192 160z"/>
        </svg>
    )
}

const IconBack = () =>
{
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
            <path fill="white" d="M267.5 440.6c9.5 7.9 22.8 9.7 34.1 4.4s18.4-16.6 18.4-29l0-320c0-12.4-7.2-23.7-18.4-29s-24.5-3.6-34.1 4.4l-192 160L64 241 64 96c0-17.7-14.3-32-32-32S0 78.3 0 96L0 416c0 17.7 14.3 32 32 32s32-14.3 32-32l0-145 11.5 9.6 192 160z"/>
        </svg>
    )
}

const Action : React.FC<ActionProps> = ({ filled, children, onClick }) =>
{
    return (
        <div onClick={onClick} className="flex h-[2rem] aspect-square bg-white data-[filled=false]:bg-transparent mx-2 justify-center items-center p-2.5 rounded-full cursor-pointer opacity-75 hover:opacity-100" data-filled={filled}>
            {children}
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

const SongBar : React.FC<SongBarOptions> = ({ setSongIndex, audio }) =>
{
    const [time, setTime] = useState(0);
    const [paused, setPaused] = useState(audio.paused);

    useEffect(() => {
        const updateTime = () => {
            setTime(audio.currentTime);
        };

        // Set interval to update time while audio is playing
        const interval = setInterval(() => {
            if (!audio.paused) {
                updateTime();
            }
        }, 1000);

        // Cleanup function to clear the interval
        return () => {
            clearInterval(interval);
        };
    }, [audio]);

    return (
        <div className="flex flex-col h-full w-[25rem]">
            <div className="flex w-full h-2/3 justify-center items-end">
                <Action filled={false}>
                    <IconBack />
                </Action>
                <Action filled={true} onClick={()=>{
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
                    }} >
                    <IconPlay paused={paused} />
                </Action>
                <Action filled={false}>
                    <IconFoward />
                </Action>
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