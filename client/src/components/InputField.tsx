import { useEffect, useState } from "react"

interface InputFieldOptions
{
    active : boolean,
    setActive : React.Dispatch<React.SetStateAction<boolean>>,
    onSubmit : Function,
    submitLabel : string,
    fields : string[],
    defaults : string[] | undefined
}

interface ButtonOptions
{
    label : string,
    invert : boolean,
    onClick : React.MouseEventHandler<HTMLButtonElement>,
}

const Button : React.FC<ButtonOptions> = ({ label, invert, onClick }) =>
{
    return (
        <button className="bg-zinc-600 p-0.5 px-2 ml-2 rounded-sm font-bold data-[invert=true]:bg-zinc-200 data-[invert=true]:text-zinc-900" onClick={onClick} data-invert={invert}>{label}</button>
    )
}

const InputField : React.FC<InputFieldOptions> = ({ active, setActive, onSubmit, submitLabel, fields, defaults }) =>
{
    const [values, setValues] = useState([]);

    useEffect(() =>
    {
        setValues(defaults || Array(fields.length).fill(''));
    }, [defaults])

    function submit(e)
    {
        if (e.preventDetault)
        { e.preventDetault(); }
        onSubmit(values);
    }

    function cancel()
    {
        setActive(false);
    }

    function update(index, value)
    {
        let newValues = JSON.parse(JSON.stringify(values));
        newValues[index] = value;
        setValues(newValues);
    }

    if (active)
    {
        const inputs = fields.map(( v, i ) =>
        {
            const id = "id_" + v.replace(" ", "");
            return (
                <div className="relative w-full flex items-center my-1">
                    <label for={id} data-empty={(values[i] == undefined || values[i] == "")} className="absolute flex text-white/30 pl-3 data-[empty=false]:-translate-y-5 data-[empty=false]:text-xs data-[empty=false]:text-white/90 data-[empty=false]:font-semibold transition-all">{v}</label>
                    <input id={id} onChange={(e) => { update( i, e.target.value ) }} type="text" value={values[i]} className="placeholder:font-medium w-full rounded-sm border-2 border-zinc-800 bg-transparent p-2 px-3 outline-none" />
                </div>
            )
        });

        return (
            <div className="flex absolute w-full h-full z-20 bg-zinc-950/50 justify-center items-center">
                <div className="flex flex-col w-1/2 min-h-[2rem] bg-zinc-900 items-center justify-center p-3">
                    <form className="flex flex-col w-full text-white/80 text-sm" onSubmit={submit}>
                        {inputs}
                    </form>
                    <div className="flex w-full text-white/80 text-sm mt-3 pl-1.5 justify-end items-center">
                        <div className="flex">
                            <Button label="Cancel" invert={false} onClick={cancel} />
                            <Button label={submitLabel} invert={true} onClick={submit} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    return (<></>)
}

export default InputField;