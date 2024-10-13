import { useState } from "react"

interface InputFieldOptions
{
    active : boolean,
    setActive : React.Dispatch<React.SetStateAction<boolean>>,
    onSubmit : Function
}

interface ButtonOptions
{
    label : string,
    invert : boolean,
    onClick : React.MouseEventHandler<HTMLButtonElement>,
}

interface ResultTextOptions
{
    type : string
}

const Button : React.FC<ButtonOptions> = ({ label, invert, onClick }) =>
{
    return (
        <button className="bg-zinc-600 p-0.5 px-2 ml-2 rounded-sm font-bold data-[invert=true]:bg-zinc-200 data-[invert=true]:text-zinc-900" onClick={onClick} data-invert={invert}>{label}</button>
    )
}

const ResultText : React.FC<ResultTextOptions> = ({type}) =>
{
    return (
        <span className="font-semibold text-white/20 data-[type='spotify']:text-green-500 data-[type='youtube']:text-red-500 " data-type={type}>
            {type == "none" ? "" : type.toUpperCase()}
        </span>
    )
}

const InputField : React.FC<InputFieldOptions> = ({ active, setActive, onSubmit }) =>
{
    const [link, setLink] = useState("");

    function submit(e)
    {
        if (e.preventDetault)
        {
            e.preventDetault();
        }
        onSubmit(link);
    }

    function cancel()
    {
        setActive(false);
    }

    function update(e)
    {
        setLink(e.target.value)
    }

    if (active)
    {
        return (
            <div className="flex absolute w-full h-full z-20 bg-zinc-950/50 justify-center items-center">
                <div className="flex flex-col w-1/2 min-h-[2rem] bg-zinc-900 items-center justify-center p-4">
                    <form className="flex flex-col w-full text-white/80 text-sm" onSubmit={submit}>
                        <span className="font-bold ml-1">Add New Playlist</span>
                        <input onChange={update} type="text" placeholder="playlist link" className="placeholder:text-white/30 placeholder:font-medium w-full mt-2 rounded-sm border-2 border-zinc-800 bg-transparent p-1 px-2" />
                    </form>
                    <div className="flex w-full text-white/80 text-sm mt-3 pl-1.5 justify-between items-center">
                        <ResultText type="none" />
                        <div className="flex">
                            <Button label="Cancel" invert={false} onClick={cancel} />
                            <Button label="Add" invert={true} onClick={submit} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    return (<></>)
}

export default InputField;