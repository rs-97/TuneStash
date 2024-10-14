import IconGear from "../assets/gear.svg";
import IconAPIErr from "../assets/api_err.svg";
import IconAPISuc from "../assets/api_suc.svg";

interface APIHandlerOptions
{
    setSettingsActive : React.Dispatch<React.SetStateAction<boolean>>,
    apiStatus : boolean
}

const APIHandler : React.FC<APIHandlerOptions> = ({ setSettingsActive, apiStatus }) =>
{
    function click()
    {
        setSettingsActive(true)
    }

    return (
        <div className="flex w-full h-[3rem] px-2 bg-zinc-950/50 backdrop-blur-sm group items-center" data-error={!apiStatus}>
            <div className="flex h-[2rem] w-[2rem] p-2 opacity-75">
                <img src={ !apiStatus ? IconAPIErr : IconAPISuc } alt="gear" className="pointer-events-none" />
            </div>
            <div className="flex-1 h-full flex items-center pl-2">
                <span className="text-white/80 group-data-[error=true]:text-red-500/80 text-xs font-medium pointer-events-none">
                    { !apiStatus ? "API Keys Error" : "API Keys Active" }
                </span>
            </div>
            <div className="flex h-[2rem] w-[2rem] p-2 opacity-50 hover:opacity-100 cursor-pointer" onClick={click}>
                <img src={IconGear} alt="gear" className="pointer-events-none" />
            </div>
        </div>
    )
}

export default APIHandler;