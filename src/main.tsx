import * as React from "react"
import * as ReactDOM from "react-dom"
import * as firebase from "firebase"
import { App } from "./components/App"

const firebaseConfig = {
    apiKey: "AIzaSyAW2exvhaNxD0yBruLvchsce1N2S6JF4M8",
    authDomain: "trpg-character-sheet.firebaseapp.com",
    databaseURL: "https://trpg-character-sheet.firebaseio.com",
    projectId: "trpg-character-sheet",
    storageBucket: "trpg-character-sheet.appspot.com",
    messagingSenderId: "276649674788",
    appId: "1:276649674788:web:ab81028227d16d3bbcb0b1",
    measurementId: "G-RL28T0QY06"
};
firebase.initializeApp(firebaseConfig);
firebase.analytics();

ReactDOM.render(
    <App strage={firebase.storage()} />,
    document.getElementById("body")
)