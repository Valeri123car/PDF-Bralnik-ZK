import gzdc from "./gzdcc.png"
import "./components.css"

function Header(){
    return(
        <div className="header">
        <img src={gzdc} alt='GZ-Celje'/>
        </div>
    );
}

export default Header;