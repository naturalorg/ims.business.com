import {initializeApp,getApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import * as A from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import * as D from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
window.FBLib={...A,...D,initializeApp,getApp};
window.__fbResolve();
