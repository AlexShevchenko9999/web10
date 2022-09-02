import React from 'react';
import Authenticator from './Authenticator'
import AppStore from './components/AppStore/AppStore'
import ReactDOM from "react-dom";
import { pass, R, C, T, startRectangles } from "rectangles-npm";

/* Top Pane Site Branding Component */
function App(){
    
    /* App Mode State */
    const [mode,setMode] = React.useState("app_store")


    return mode == "authenticator" ? <Authenticator /> : mode == "app_store" ? <AppStore setMode =  {setMode}/> : null
}

ReactDOM.render(<App />, document.getElementById("root"));
startRectangles(document.getElementById("root"));
