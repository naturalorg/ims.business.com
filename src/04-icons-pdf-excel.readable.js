const Ic = ({ n, s = 15 }) => {
  const p = { stroke: "currentColor", strokeWidth: "1.8", fill: "none", width: s, height: s, viewBox: "0 0 24 24" };
  const icons = {
    building: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M8 10v2m0 4v2M12 10v2m0 4v2M16 10v2m0 4v2" })),
    chart: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("polyline", { points: "22 12 18 12 15 21 9 3 6 12 2 12" })),
    cart: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("circle", { cx: "9", cy: "21", r: "1" }), /* @__PURE__ */ React.createElement("circle", { cx: "20", cy: "21", r: "1" }), /* @__PURE__ */ React.createElement("path", { d: "M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6" })),
    receipt: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" }), /* @__PURE__ */ React.createElement("polyline", { points: "14 2 14 8 20 8" }), /* @__PURE__ */ React.createElement("line", { x1: "16", y1: "13", x2: "8", y2: "13" }), /* @__PURE__ */ React.createElement("line", { x1: "16", y1: "17", x2: "8", y2: "17" }), /* @__PURE__ */ React.createElement("polyline", { points: "10 9 9 9 8 9" })),
    shield: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" })),
    file: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" }), /* @__PURE__ */ React.createElement("polyline", { points: "14 2 14 8 20 8" }), /* @__PURE__ */ React.createElement("line", { x1: "16", y1: "13", x2: "8", y2: "13" }), /* @__PURE__ */ React.createElement("line", { x1: "16", y1: "17", x2: "8", y2: "17" }), /* @__PURE__ */ React.createElement("line", { x1: "10", y1: "9", x2: "8", y2: "9" })),
    bell: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" })),
    plus2: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "5", x2: "12", y2: "19" }), /* @__PURE__ */ React.createElement("line", { x1: "5", y1: "12", x2: "19", y2: "12" })),
    tag: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01" })),
    history: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("polyline", { points: "12 8 12 12 14 14" }), /* @__PURE__ */ React.createElement("path", { d: "M3.05 11a9 9 0 1 0 .5-4H1" }), /* @__PURE__ */ React.createElement("polyline", { points: "1 3 1 7 5 7" })),
    plus: /* @__PURE__ */ React.createElement("svg", { ...p, strokeWidth: "2" }, /* @__PURE__ */ React.createElement("path", { d: "M12 5v14M5 12h14" })),
    trash: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("polyline", { points: "3 6 5 6 21 6" }), /* @__PURE__ */ React.createElement("path", { d: "M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6" }), /* @__PURE__ */ React.createElement("path", { d: "M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" })),
    edit: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" }), /* @__PURE__ */ React.createElement("path", { d: "M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z" })),
    save: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" }), /* @__PURE__ */ React.createElement("polyline", { points: "17 21 17 13 7 13 7 21" }), /* @__PURE__ */ React.createElement("polyline", { points: "7 3 7 8 15 8" })),
    pdf: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" }), /* @__PURE__ */ React.createElement("polyline", { points: "14 2 14 8 20 8" })),
    xlsx: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M8 12l2 2 4-4M8 8h8M8 16h4" })),
    x: /* @__PURE__ */ React.createElement("svg", { ...p, strokeWidth: "2" }, /* @__PURE__ */ React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), /* @__PURE__ */ React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" })),
    users: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" }), /* @__PURE__ */ React.createElement("circle", { cx: "9", cy: "7", r: "4" }), /* @__PURE__ */ React.createElement("path", { d: "M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" })),
    sun: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "5" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "1", x2: "12", y2: "3" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "21", x2: "12", y2: "23" }), /* @__PURE__ */ React.createElement("line", { x1: "4.22", y1: "4.22", x2: "5.64", y2: "5.64" }), /* @__PURE__ */ React.createElement("line", { x1: "18.36", y1: "18.36", x2: "19.78", y2: "19.78" }), /* @__PURE__ */ React.createElement("line", { x1: "1", y1: "12", x2: "3", y2: "12" }), /* @__PURE__ */ React.createElement("line", { x1: "21", y1: "12", x2: "23", y2: "12" }), /* @__PURE__ */ React.createElement("line", { x1: "4.22", y1: "19.78", x2: "5.64", y2: "18.36" }), /* @__PURE__ */ React.createElement("line", { x1: "18.36", y1: "5.64", x2: "19.78", y2: "4.22" })),
    moon: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" })),
    logout: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" })),
    dashboard: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "3", width: "7", height: "7" }), /* @__PURE__ */ React.createElement("rect", { x: "14", y: "3", width: "7", height: "7" }), /* @__PURE__ */ React.createElement("rect", { x: "14", y: "14", width: "7", height: "7" }), /* @__PURE__ */ React.createElement("rect", { x: "3", y: "14", width: "7", height: "7" })),
    settings: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "3" }), /* @__PURE__ */ React.createElement("path", { d: "M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83l-.06.06a2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" })),
    check: /* @__PURE__ */ React.createElement("svg", { ...p, strokeWidth: "2.5" }, /* @__PURE__ */ React.createElement("polyline", { points: "20 6 9 17 4 12" })),
    copy: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" })),
    new: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" }), /* @__PURE__ */ React.createElement("polyline", { points: "14 2 14 8 20 8" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "18", x2: "12", y2: "12" }), /* @__PURE__ */ React.createElement("line", { x1: "9", y1: "15", x2: "15", y2: "15" })),
    eye: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "3" })),
    eyeoff: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" }), /* @__PURE__ */ React.createElement("line", { x1: "1", y1: "1", x2: "23", y2: "23" })),
    lock: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "11", width: "18", height: "11", rx: "2", ry: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M7 11V7a5 5 0 0110 0v4" })),
    bank: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("line", { x1: "3", y1: "22", x2: "21", y2: "22" }), /* @__PURE__ */ React.createElement("line", { x1: "6", y1: "18", x2: "6", y2: "11" }), /* @__PURE__ */ React.createElement("line", { x1: "10", y1: "18", x2: "10", y2: "11" }), /* @__PURE__ */ React.createElement("line", { x1: "14", y1: "18", x2: "14", y2: "11" }), /* @__PURE__ */ React.createElement("line", { x1: "18", y1: "18", x2: "18", y2: "11" }), /* @__PURE__ */ React.createElement("polygon", { points: "12 2 20 7 4 7" })),
    upload: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("polyline", { points: "16 16 12 12 8 16" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "12", x2: "12", y2: "21" }), /* @__PURE__ */ React.createElement("path", { d: "M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" })),
    refresh: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("polyline", { points: "23 4 23 10 17 10" }), /* @__PURE__ */ React.createElement("path", { d: "M20.49 15a9 9 0 1 1-2.12-9.36L23 10" })),
    search: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("circle", { cx: "11", cy: "11", r: "8" }), /* @__PURE__ */ React.createElement("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })),
    dollar: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "1", x2: "12", y2: "23" }), /* @__PURE__ */ React.createElement("path", { d: "M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" })),
    calendar: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "4", width: "18", height: "18", rx: "2", ry: "2" }), /* @__PURE__ */ React.createElement("line", { x1: "16", y1: "2", x2: "16", y2: "6" }), /* @__PURE__ */ React.createElement("line", { x1: "8", y1: "2", x2: "8", y2: "6" }), /* @__PURE__ */ React.createElement("line", { x1: "3", y1: "10", x2: "21", y2: "10" })),
    clock: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /* @__PURE__ */ React.createElement("polyline", { points: "12 6 12 12 16 14" })),
    "trending-up": /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("polyline", { points: "23 6 13.5 15.5 8.5 10.5 1 18" }), /* @__PURE__ */ React.createElement("polyline", { points: "17 6 23 6 23 12" })),
    "trending-down": /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("polyline", { points: "23 18 13.5 8.5 8.5 13.5 1 6" }), /* @__PURE__ */ React.createElement("polyline", { points: "17 18 23 18 23 12" })),
    database: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }), /* @__PURE__ */ React.createElement("path", { d: "M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" }), /* @__PURE__ */ React.createElement("path", { d: "M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" })),
    folder: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" })),
    "folder-open": /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" }), /* @__PURE__ */ React.createElement("polyline", { points: "2 10 22 10" })),
    alert: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "8", x2: "12", y2: "12" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "16", x2: "12.01", y2: "16" })),
    info: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "16", x2: "12", y2: "12" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "8", x2: "12.01", y2: "8" })),
    package: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("line", { x1: "16.5", y1: "9.4", x2: "7.5", y2: "4.21" }), /* @__PURE__ */ React.createElement("path", { d: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" }), /* @__PURE__ */ React.createElement("polyline", { points: "3.27 6.96 12 12.01 20.73 6.96" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "22.08", x2: "12", y2: "12" })),
    list: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("line", { x1: "8", y1: "6", x2: "21", y2: "6" }), /* @__PURE__ */ React.createElement("line", { x1: "8", y1: "12", x2: "21", y2: "12" }), /* @__PURE__ */ React.createElement("line", { x1: "8", y1: "18", x2: "21", y2: "18" }), /* @__PURE__ */ React.createElement("line", { x1: "3", y1: "6", x2: "3.01", y2: "6" }), /* @__PURE__ */ React.createElement("line", { x1: "3", y1: "12", x2: "3.01", y2: "12" }), /* @__PURE__ */ React.createElement("line", { x1: "3", y1: "18", x2: "3.01", y2: "18" })),
    chevron: /* @__PURE__ */ React.createElement("svg", { ...p, strokeWidth: "2.5" }, /* @__PURE__ */ React.createElement("polyline", { points: "9 18 15 12 9 6" })),
    crown: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M2 20h20M4 20l2-8 6 4 6-4 2 8" }), /* @__PURE__ */ React.createElement("polyline", { points: "4 12 12 4 20 12" })),
    whatsapp: /* @__PURE__ */ React.createElement("svg", { ...p, fill: "none" }, /* @__PURE__ */ React.createElement("path", { d: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" })),
    award: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "8", r: "6" }), /* @__PURE__ */ React.createElement("path", { d: "M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" })),
    camera: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "13", r: "4" })),
    circle: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10" })),
    hash: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("line", { x1: "4", y1: "9", x2: "20", y2: "9" }), /* @__PURE__ */ React.createElement("line", { x1: "4", y1: "15", x2: "20", y2: "15" }), /* @__PURE__ */ React.createElement("line", { x1: "10", y1: "3", x2: "8", y2: "21" }), /* @__PURE__ */ React.createElement("line", { x1: "16", y1: "3", x2: "14", y2: "21" })),
    inbox: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("polyline", { points: "22 12 16 12 14 15 10 15 8 12 2 12" }), /* @__PURE__ */ React.createElement("path", { d: "M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" })),
    mail: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" }), /* @__PURE__ */ React.createElement("polyline", { points: "22,6 12,13 2,6" })),
    "map-pin": /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "10", r: "3" })),
    phone: /* @__PURE__ */ React.createElement("svg", { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.64A2 2 0 012 .82h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.58a16 16 0 006.29 6.29l1.42-1.42a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7a2 2 0 011.72 2.02z" }))
  };
  return icons[n] || null;
};
const LogoIcon = ({ size = 32 }) => {
  const id = `bb-grad-${size}-${Math.random().toString(36).slice(2, 7)}`;
  return /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 56 56", width: size, height: size, style: { flexShrink: 0, display: "block" } }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id, x1: "0", y1: "0", x2: "56", y2: "56", gradientUnits: "userSpaceOnUse" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#4F6FE8" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#F1495C" }))), /* @__PURE__ */ React.createElement("path", { d: "M28 4L8 12V28C8 39.5 17 49.5 28 52C39 49.5 48 39.5 48 28V12L28 4Z", fill: `url(#${id})` }), /* @__PURE__ */ React.createElement("path", { d: "M28 4L8 12V28C8 39 17 48 28 51C28 51 8 38 8 28V14L28 4Z", fill: "#FFFFFF", fillOpacity: "0.12" }), /* @__PURE__ */ React.createElement("rect", { x: "18", y: "17", width: "20", height: "3", rx: "1.5", fill: "white", fillOpacity: "0.95" }), /* @__PURE__ */ React.createElement("rect", { x: "18", y: "23", width: "16", height: "3", rx: "1.5", fill: "white", fillOpacity: "0.75" }), /* @__PURE__ */ React.createElement("rect", { x: "18", y: "29", width: "18", height: "3", rx: "1.5", fill: "white", fillOpacity: "0.75" }), /* @__PURE__ */ React.createElement("polygon", { points: "28,36 29.8,39.2 33.4,38.2 31.6,41.3 33.8,43.8 30.1,43.5 28,46.5 25.9,43.5 22.2,43.8 24.4,41.3 22.6,38.2 26.2,39.2", fill: "#FCD34D", fillOpacity: "0.97" }));
};
const MON3 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDateDMY = (d) => {
  if (!d) return "";
  if (typeof d !== "string") return fmtDate(d) || "";
  const p = d.split("-");
  if (p.length !== 3) return d;
  const mi = parseInt(p[1], 10) - 1;
  return `${p[2].padStart(2, "0")} ${MON3[mi] || p[1]} ${p[0]}`;
};
const payTermsLabel = (inv) => {
  if (inv.paymentTerms) return inv.paymentTerms;
  if (!inv.date || !inv.dueDate) return "\u2014";
  const n = Math.round((new Date(inv.dueDate) - new Date(inv.date)) / 864e5);
  if (isNaN(n)) return "\u2014";
  return n <= 0 ? "Due on receipt" : "Net " + n;
};
const placeOfSupplyLabel = (inv, co) => {
  var _a, _b;
  if (inv.placeOfSupply) return inv.placeOfSupply;
  const sc = stateCode((((_a = inv.billTo) == null ? void 0 : _a.gstin) || "").trim());
  if (sc && STATE_CODES[sc]) return `${STATE_CODES[sc]} (${sc})`;
  return ((_b = inv.billTo) == null ? void 0 : _b.state) || co.state || "";
};
const amountInWordsIN = (amt) => {
  const n = Math.abs(Number(amt) || 0);
  let rup = Math.floor(n + 1e-9), paise = Math.round((n - rup) * 100);
  if (paise >= 100) {
    rup += 1;
    paise = 0;
  }
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (x) => x < 20 ? ones[x] : tens[Math.floor(x / 10)] + (x % 10 ? "-" + ones[x % 10] : "");
  const three = (x) => x >= 100 ? ones[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " " + two(x % 100) : "") : two(x);
  const cr = Math.floor(rup / 1e7), lk = Math.floor(rup % 1e7 / 1e5), th2 = Math.floor(rup % 1e5 / 1e3), rest = rup % 1e3;
  const words = [cr && three(cr) + " Crore", lk && two(lk) + " Lakh", th2 && two(th2) + " Thousand", rest && three(rest)].filter(Boolean).join(" ");
  let s = "Indian Rupee " + (words || "Zero");
  if (paise) s += " and " + two(paise) + " Paise";
  return s + " Only";
};
const makePDF = (inv, co, terms) => {
  try {
    inv = fcView(inv);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const PW = 210, PH = 297;
    const L = 6.5, R = PW - 6.5, FT = 6.5, FB = PH - 6.5, CW = R - L;
    const PAD = 3.5, MIDX = 105, SPLIT = 117.5;
    const CONT_Y = 22;
    const DARK = [25, 25, 25], MED = [85, 85, 85], LGRAY = [140, 140, 140], GRID = [150, 150, 150], BAR = [238, 238, 238], RED = [200, 35, 35];
    const rawType = inv.docType || "TAX INVOICE";
    const isCN = rawType === "CREDIT NOTE", isDN = rawType === "DEBIT NOTE", isNote = isCN || isDN;
    const isNonGST = rawType === "NON GST INVOICE";
    const gstType = inv.gstType || "INTRA";
    const docTitle = isCN ? "Credit Note" : isDN ? "Debit Note" : inv.isB2C ? "TAX INVOICE (B2C)" : rawType;
    const items = (inv.items || []).filter((r) => r.desc);
    let DRY = false;
    const font = (b, i) => doc.setFont("helvetica", b && i ? "bolditalic" : b ? "bold" : i ? "italic" : "normal");
    const T = (s, x, y, o = {}) => {
      if (DRY) return;
      const { size = 7.5, bold = false, italic = false, color = DARK, align = "left" } = o;
      font(bold, italic);
      doc.setFontSize(size);
      doc.setTextColor(...color);
      doc.text(String(s), x, y, { align });
    };
    const wrap = (s, w, size = 7.5, bold = false, italic = false) => {
      font(bold, italic);
      doc.setFontSize(size);
      return doc.splitTextToSize(String(s == null ? "" : s), w);
    };
    const tw = (s, size, bold = false, italic = false) => {
      font(bold, italic);
      doc.setFontSize(size);
      return doc.getTextWidth(String(s));
    };
    const HL = (y, x1 = L, x2 = R, w = 0.25, c = GRID) => {
      if (DRY) return;
      doc.setDrawColor(...c);
      doc.setLineWidth(w);
      doc.line(x1, y, x2, y);
    };
    const VL = (x, y1, y2, w = 0.25, c = GRID) => {
      if (DRY) return;
      doc.setDrawColor(...c);
      doc.setLineWidth(w);
      doc.line(x, y1, x, y2);
    };
    const FILL = (x, y, w, h, c) => {
      if (DRY) return;
      doc.setFillColor(...c);
      doc.rect(x, y, w, h, "F");
    };
    const imgFmt = (d) => d.startsWith("data:image/png") ? "PNG" : d.startsWith("data:image/webp") ? "WEBP" : "JPEG";
    const money = (str, xr, y, size = 7.5, bold = false, color = DARK) => {
      if (DRY) return;
      const numW = tw(str, size, bold);
      const em = size * 0.3528, gw = em * 0.5, h = em * 0.72, gap = em * 0.16;
      const x0 = xr - numW - gap - gw, top = y - h;
      T(str, xr, y, { size, bold, color, align: "right" });
      doc.setDrawColor(...color);
      doc.setLineWidth(Math.max(0.12, em * (bold ? 0.085 : 0.065)));
      doc.line(x0, top, x0 + gw, top);
      doc.line(x0, top + h * 0.2, x0 + gw, top + h * 0.2);
      const cx = x0 + gw * 0.5, cy2 = top + h * 0.25, rx = gw * 0.42, ry2 = h * 0.25;
      let px = cx, py = top;
      for (let i = 1; i <= 10; i++) {
        const a = -Math.PI / 2 + Math.PI * i / 10, nx = cx + rx * Math.cos(a), ny = cy2 + ry2 * Math.sin(a);
        doc.line(px, py, nx, ny);
        px = nx;
        py = ny;
      }
      doc.line(cx, top + h * 0.5, x0, top + h * 0.5);
      doc.line(x0 + gw * 0.15, top + h * 0.5, x0 + gw * 0.95, top + h);
    };
    let Y = FT;
    const newPage = () => {
      doc.addPage();
      Y = CONT_Y;
    };
    const logoBox = 24, logoX = L + PAD, logoY = FT + 2.5;
    const textX = co.logo ? logoX + logoBox + 5 : L + PAD;
    if (co.logo) {
      try {
        let w = logoBox, h = logoBox;
        try {
          const p = doc.getImageProperties(co.logo);
          const r = p.width / p.height;
          if (r > 1) h = logoBox / r;
          else w = logoBox * r;
        } catch (e) {
        }
        doc.addImage(co.logo, imgFmt(co.logo), logoX + (logoBox - w) / 2, logoY + (logoBox - h) / 2, w, h);
      } catch (e) {
      }
    }
    const coName = co.name || "Your Company";
    const pan = co.panNo || (co.gstin && co.gstin.length >= 12 ? co.gstin.substring(2, 12) : "");
    const coLines = [];
    if (co.formerName) coLines.push("(Formerly known as " + co.formerName + ")");
    String(co.address || "").split("\n").map((s) => s.trim()).filter(Boolean).forEach((s) => coLines.push(s));
    const cityLine = [[co.city, co.pin].filter(Boolean).join(" - "), co.state, "India"].filter(Boolean).join(", ");
    if (cityLine) coLines.push(cityLine);
    if (co.gstin || pan) coLines.push([co.gstin ? "GSTIN " + co.gstin : "", pan ? "PAN:" + pan : ""].filter(Boolean).join(", "));
    const webMail = [co.website ? "web: " + co.website : "", co.email ? "Email: " + co.email : "", co.phone ? "Ph: " + co.phone : ""].filter(Boolean).join(", ");
    if (webMail) coLines.push(webMail);
    const titleSize0 = 21;
    let titleSize = titleSize0;
    while (titleSize > 13 && tw(docTitle, titleSize) > 60) titleSize -= 1;
    const coBlockW = R - PAD - 62 - textX;
    T(coName, textX, FT + 7, { size: 13, bold: true });
    let cy = FT + 10.8;
    coLines.forEach((l) => {
      wrap(l, coBlockW, 7).forEach((s) => {
        T(s, textX, cy, { size: 7, color: DARK });
        cy += 3.2;
      });
    });
    const hdrBottom = Math.max(FT + 30, cy + 1.5, logoY + logoBox + 2.5);
    T(docTitle, R - PAD, hdrBottom - 3.4, { size: titleSize, align: "right" });
    Y = hdrBottom;
    HL(Y);
    const metaL = [], metaR = [];
    if (isNote) {
      metaL.push(["#", inv.invNo || "\u2014"]);
      metaL.push([isCN ? "Credit Date" : "Debit Date", fmtDateDMY(inv.date) || "\u2014"]);
      if (inv.poNo) metaL.push(["Ref#", inv.poNo]);
      if (inv.origInvNo) metaL.push(["Invoice#", inv.origInvNo]);
      if (inv.origInvDate) metaL.push(["Invoice Date", fmtDateDMY(inv.origInvDate)]);
    } else {
      metaL.push(["INVOICE NO", inv.invNo || "\u2014"]);
      metaL.push(["INVOICE DATE", fmtDateDMY(inv.date) || "\u2014"]);
      metaL.push(["TERMS", payTermsLabel(inv)]);
      if (inv.poNo) metaR.push(["PO No", inv.poNo]);
    }
    metaR.unshift(["Place Of Supply", placeOfSupplyLabel(inv, co) || "\u2014"]);
    const mRow = 4.2, mTop = Y;
    const mH = Math.max(metaL.length, metaR.length) * mRow + 4.2;
    metaL.forEach(([k, v], i) => {
      const y = mTop + 4.4 + i * mRow;
      T(k, L + PAD, y, { color: MED });
      T(": " + v, L + PAD + 45.5, y, { bold: true });
    });
    metaR.forEach(([k, v], i) => {
      const y = mTop + 4.4 + i * mRow;
      T(k, MIDX + PAD, y, { color: MED });
      T(": " + v, MIDX + PAD + 41, y, { bold: true });
    });
    VL(MIDX, mTop, mTop + mH);
    Y = mTop + mH;
    HL(Y);
    const bt = inv.billTo || {};
    const st = inv.sameAddress ? bt : inv.shipTo || bt;
    const partyLines = (d, isBill, w) => {
      const out = [];
      out.push({ t: d.name || "", bold: isBill, size: isBill ? 9 : 7.5 });
      String(d.address || "").split("\n").map((s) => s.trim()).filter(Boolean).forEach((s) => wrap(s, w, 7.5).forEach((x) => out.push({ t: x })));
      if (d.city) out.push({ t: d.city });
      const ps = [d.pin, d.state].filter(Boolean).join(" ");
      if (ps) out.push({ t: ps });
      if (isBill && (d.city || d.state || d.pin)) out.push({ t: "India" });
      if (isBill && d.gstin) out.push({ t: "GSTIN " + d.gstin });
      if (d.phone) out.push({ t: "Ph: " + d.phone });
      if (d.email) out.push({ t: d.email });
      return out;
    };
    const colWBill = isNote ? CW - 2 * PAD : MIDX - L - 2 * PAD;
    const billLines = partyLines(bt, true, colWBill);
    const shipLines = isNote ? [] : partyLines(st, false, R - MIDX - 2 * PAD);
    const barH = 4.6;
    FILL(L, Y, CW, barH, BAR);
    T("Bill To", L + PAD, Y + 3.3, { bold: true });
    if (!isNote) T("Ship To", MIDX + PAD, Y + 3.3, { bold: true });
    HL(Y + barH);
    const partyTop = Y + barH;
    const lineH = 3.9;
    const heightOf = (ls) => ls.reduce((s, l) => s + (l.size && l.size > 8 ? 4.6 : lineH), 0);
    const partyH = Math.max(heightOf(billLines), heightOf(shipLines), 12) + 5.5;
    const drawParty = (ls, x) => {
      let y = partyTop + 4.6;
      ls.forEach((l) => {
        T(l.t, x, y, { bold: l.bold, size: l.size || 7.5 });
        y += l.size && l.size > 8 ? 4.6 : lineH;
      });
    };
    drawParty(billLines, L + PAD);
    if (!isNote) drawParty(shipLines, MIDX + PAD);
    if (!isNote) VL(MIDX, Y, partyTop + partyH);
    Y = partyTop + partyH;
    HL(Y);
    const subj = String(inv.subject || "").split("\n").map((s) => s.trim()).filter(Boolean);
    if (subj.length) {
      T("Subject :", L + PAD, Y + 4, { size: 6.5, color: LGRAY });
      let sy = Y + 7.6;
      subj.forEach((s) => wrap(s, CW - 2 * PAD, 7).forEach((x) => {
        T(x, L + PAD, sy, { size: 7 });
        sy += 3.4;
      }));
      Y = sy + 0.6;
      HL(Y);
    }
    const num = (v) => parseFloat(v) || 0;
    const qtyTxt = (r) => {
      const q = parseFloat(r.qty);
      return (isNaN(q) ? "" : q.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })) + (r.unit ? " " + r.unit : "");
    };
    const lineAmt = (r) => isNonGST ? num(r.total) || num(r.qty) * num(r.rate) : num(r.taxable) || num(r.qty) * num(r.rate) * (1 - num(r.discount) / 100);
    const hasDisc = !isNonGST && items.some((r) => num(r.discount) > 0);
    const cols = [];
    cols.push({ h: isNote ? "#" : "S.\nNo", w: 8, al: "left", get: (r, i) => String(i + 1) });
    cols.push({ h: "Item & Description", w: 0, al: "left", get: (r) => r.desc || "" });
    if (!isNonGST) cols.push({ h: "HSN\n/SAC", w: isNote ? 22 : 18, al: "left", get: (r) => r.hsnCode || "" });
    cols.push({ h: "Qty", w: isNote ? 18 : 14, al: "right", get: (r) => qtyTxt(r) });
    cols.push({ h: "Rate", w: isNonGST ? 28 : isNote ? 27 : gstType === "INTRA" ? 25 : 27, al: "right", get: (r) => fmtN(num(r.rate)) });
    if (hasDisc) cols.push({ h: "Disc\n%", w: 10, al: "right", get: (r) => String(num(r.discount)) });
    if (!isNote && !isNonGST) {
      if (gstType === "INTRA") {
        cols.push({ h: "CGST", w: 22, al: "right", get: (r) => fmtN(num(r.gstAmt) / 2) });
        cols.push({ h: "SGST", w: 22, al: "right", get: (r) => fmtN(num(r.gstAmt) / 2) });
      } else cols.push({ h: "IGST", w: 22, al: "right", get: (r) => fmtN(num(r.gstAmt)) });
    }
    cols.push({ h: "Amount", w: isNonGST ? 28 : isNote ? 27 : gstType === "INTRA" ? 22 : 28, al: "right", get: (r) => fmtN(lineAmt(r)) });
    const fixedW = cols.reduce((s, c) => s + c.w, 0);
    cols.find((c) => c.w === 0).w = CW - fixedW;
    const columnStyles = {};
    cols.forEach((c, i) => {
      columnStyles[i] = { cellWidth: c.w, halign: c.al };
    });
    doc.autoTable({
      startY: Y,
      theme: "grid",
      head: [cols.map((c) => c.h)],
      body: items.map((r, i) => cols.map((c) => c.get(r, i))),
      styles: { font: "helvetica", fontSize: 7.5, cellPadding: { top: 1.7, bottom: 1.7, left: 1.8, right: 1.8 }, textColor: DARK, lineColor: GRID, lineWidth: 0.2, overflow: "linebreak", fillColor: [255, 255, 255], valign: "top" },
      headStyles: { fillColor: BAR, textColor: DARK, fontStyle: "bold", fontSize: 7.5, valign: "middle" },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      columnStyles,
      showHead: "everyPage",
      margin: { left: L, right: PW - R, top: CONT_Y, bottom: PH - FB + 2 }
    });
    Y = doc.lastAutoTable.finalY;
    const grandRaw = isNonGST ? items.reduce((s, r) => s + lineAmt(r), 0) : num(inv.grand);
    const grand = Math.abs(grandRaw);
    const sub = Math.abs(num(inv.subtotal)), roff = num(inv.roundOff) * (isCN && num(inv.grand) < 0 ? -1 : 1);
    const rows = [];
    if (isNonGST) {
      rows.push({ label: "Total", val: fmtN(grand), bold: true, big: true, rupee: true, size: 8.5 });
    } else {
      rows.push({ label: "Sub Total", val: fmtN(sub) });
      let taxRows = Object.entries(inv.taxBreakdown || {}).map(([rt, amt]) => [parseFloat(rt) || 0, Math.abs(parseFloat(amt) || 0)]).filter(([rt, amt]) => rt > 0 || amt > 0).sort((a, b) => a[0] - b[0]);
      if (!taxRows.length) taxRows = [[0, 0]];
      taxRows.forEach(([rt, amt]) => {
        if (gstType === "INTRA") {
          const h = +(rt / 2).toFixed(2);
          rows.push({ label: `CGST${h} (${h}%)`, val: fmtN(amt / 2) });
          rows.push({ label: `SGST${h} (${h}%)`, val: fmtN(amt / 2) });
        } else rows.push({ label: `IGST${rt} (${rt}%)`, val: fmtN(amt) });
      });
      if (Math.abs(roff) >= 5e-3) rows.push({ label: "Round Off", val: (roff > 0 ? "+ " : "- ") + fmtN(Math.abs(roff)) });
      rows.push({ label: "Total", val: fmtN(grand), bold: true, big: true, rupee: true, size: 8.5 });
      if (isCN) {
        const used = inv.creditsUsed != null && inv.creditsUsed !== "" ? Math.min(Math.abs(num(inv.creditsUsed)), grand) : grand;
        rows.push({ label: "Credits Used", val: "(-) " + fmtN(used), color: RED });
        rows.push({ label: "Credits Remaining", val: fmtN(Math.max(grand - used, 0)), bold: true, big: true, rupee: true, size: 8 });
      }
    }
    if (inv.__cur) {
      rows.forEach((r) => {
        if (r.rupee) {
          r.rupee = false;
          r.val = inv.__cur + " " + r.val;
        }
      });
      rows.push({ label: "In INR @ " + inv.__rate, val: fmtN(inv.__inr), bold: true, rupee: true, size: 8 });
    }
    const rowH = (r) => r.big ? 6.2 : 4.8;
    const rowsH = rows.reduce((s, r) => s + rowH(r), 0) + 3;
    const leftX = L + PAD, leftW = SPLIT - L - 2 * PAD;
    const inWords = inv.__cur ? amountInWordsFC(grand, inv.__cur) : amountInWordsIN(grand);
    const noteTxt = inv.notes && String(inv.notes).trim() || (isCN ? "" : "Thanks for your business.");
    const pm = co.paymentMode || "netbanking";
    const showBank = !isCN && (pm === "netbanking" || pm === "both");
    const showUPI = !isCN && (pm === "upi" || pm === "both");
    const drawLeft = (y0) => {
      let y = y0 + 5;
      T("Total In Words", leftX, y, { color: MED });
      y += 4.2;
      wrap(inWords, leftW, 7.5, true, true).forEach((l) => {
        T(l, leftX, y, { bold: true, italic: true });
        y += 3.8;
      });
      y += 2.4;
      if (noteTxt) {
        T("Notes", leftX, y, { color: MED });
        y += 3.8;
        String(noteTxt).split("\n").forEach((n) => wrap(n, leftW, 7.5).forEach((l) => {
          T(l, leftX, y);
          y += 3.6;
        }));
        y += 2.4;
      }
      if (showBank || showUPI) {
        let yb = y, yu = y;
        if (showBank) {
          T("Company's Bank Details:", leftX, yb, { bold: true });
          yb += 4;
          if (co.bankName || co.bankAccount) {
            T(coName, leftX, yb, { bold: true });
            yb += 3.8;
            [["Bank Name", co.bankName], ["A/C NO", co.bankAccount], ["IFSC", co.bankIFSC], ["Branch", co.bankBranch]].filter(([, v]) => v).forEach(([k, v]) => {
              T(k, leftX, yb);
              T(": " + v, leftX + 15.5, yb);
              yb += 3.6;
            });
          } else {
            T("No bank details configured.", leftX, yb, { italic: true, color: LGRAY, size: 7 });
            yb += 3.6;
          }
        }
        if (showUPI) {
          const ux = showBank ? leftX + 66 : leftX;
          T("UPI Payment:", ux, yu, { bold: true });
          yu += 4;
          if (co.upiId) {
            T("UPI ID", ux, yu);
            T(": " + co.upiId, ux + 11, yu);
            yu += 4.2;
          }
          if (co.upiQR) {
            const qs = 24;
            if (!DRY) {
              try {
                doc.addImage(co.upiQR, imgFmt(co.upiQR), ux, yu - 1, qs, qs);
              } catch (e) {
              }
            }
            T("Scan to pay", ux + qs / 2, yu + qs + 2.6, { size: 6.5, color: MED, align: "center" });
            yu += qs + 4;
          } else if (!co.upiId) {
            T("No UPI details configured.", ux, yu, { italic: true, color: LGRAY, size: 7 });
            yu += 3.6;
          }
        }
        y = Math.max(yb, yu);
      }
      return y - y0 + 1.5;
    };
    DRY = true;
    const leftH = drawLeft(0);
    DRY = false;
    const sigMin = 24;
    const secH = Math.max(leftH, rowsH + sigMin);
    if (Y + secH > FB - 2) {
      newPage();
      HL(Y - 0.01);
    }
    const secTop = Y;
    drawLeft(secTop);
    let ry = secTop + 1.5;
    rows.forEach((r) => {
      const by = ry + rowH(r) - 1.5, sz = r.size || 7.5, col = r.color || DARK;
      T(r.label, R - 34.5, by, { align: "right", bold: r.bold, size: sz, color: col });
      if (r.rupee) money(r.val, R - 1.8, by, sz, r.bold, col);
      else T(r.val, R - 1.8, by, { align: "right", bold: r.bold, size: sz, color: col });
      ry += rowH(r);
    });
    HL(secTop + rowsH, SPLIT, R);
    const sigCx = (SPLIT + R) / 2;
    T(coName, sigCx, secTop + rowsH + 5, { align: "center" });
    if (co.signatory) T(co.signatory, sigCx, secTop + secH - 6.2, { align: "center", size: 6.5, color: LGRAY });
    T("Authorized Signature", sigCx, secTop + secH - 2.2, { align: "center" });
    VL(SPLIT, secTop, secTop + secH);
    Y = secTop + secH;
    HL(Y);
    if (S.get(SK.SHOW_TERMS, true)) {
      const tl = String(terms || DEFAULT_TERMS).split("\n").map((s) => s.trim()).filter(Boolean);
      const tLines = [];
      tl.forEach((t) => wrap(t, CW - 2 * PAD, 7).forEach((x) => tLines.push(x)));
      const tH = tLines.length * 3.35 + 9;
      if (Y + tH > FB - 2) newPage();
      T("Terms & Conditions", L + PAD, Y + 4.6, { color: MED });
      let ty = Y + 8.6;
      tLines.forEach((l) => {
        T(l, L + PAD, ty, { size: 7 });
        ty += 3.35;
      });
      Y = Y + tH;
      HL(Y);
    }
    if (inv.irn && inv.irn.irn) {
      const qs = 28, iH = qs + 8;
      if (Y + iH > FB - 2) newPage();
      let tx = L + PAD;
      if (inv.irn.qr) {
        try {
          doc.addImage(inv.irn.qr, imgFmt(inv.irn.qr), L + PAD, Y + 4, qs, qs);
        } catch (e) {
        }
        tx = L + PAD + qs + 6;
      }
      const kv = [["IRN", inv.irn.irn], ["Ack No.", inv.irn.ackNo], ["Ack Date", inv.irn.ackDate]].filter(([, v]) => v);
      kv.forEach(([k, v], i) => {
        const yy = Y + 8 + i * 7;
        T(k + " :", tx, yy, { color: MED });
        T(String(v), tx + 22, yy, { bold: true });
      });
      T("e-Invoicing detail(s) generated from the Government's e-Invoicing system.", tx, Y + 8 + kv.length * 7 + 1, { size: 6.8, color: LGRAY });
      Y = Y + iH;
      HL(Y);
    }
    const tp = doc.internal.getNumberOfPages();
    for (let pg = 1; pg <= tp; pg++) {
      doc.setPage(pg);
      doc.setDrawColor(...GRID);
      doc.setLineWidth(0.3);
      doc.rect(L, FT, CW, FB - FT);
      if (pg > 1) {
        T(coName + " \u2014 " + docTitle + " (cont.)", L + PAD, FT + 6, { size: 8, bold: true });
        T((isNote ? "No: " : "Invoice: ") + (inv.invNo || ""), R - PAD, FT + 6, { size: 7.5, color: MED, align: "right" });
        HL(FT + 9.5);
      }
      T(String(pg), PW - 8, PH - 2.6, { size: 6.5, color: LGRAY, align: "right" });
    }
    doc.save((inv.invNo || "Invoice") + ".pdf");
    autoSavePDF(doc, inv);
    toast.success("PDF downloaded!");
  } catch (err) {
    console.error("PDF Error:", err);
    toast.error("PDF error: " + (err.message || String(err)));
  }
};
let _folderHandle = null;
const pickSaveFolder = async () => {
  try {
    if (!window.showDirectoryPicker) {
      toast.error("Auto-folder save needs Chrome or Edge browser.");
      return false;
    }
    _folderHandle = await window.showDirectoryPicker({ mode: "readwrite" });
    toast.success("Save folder set! PDFs will auto-save to B2B / B2C subfolders.");
    return true;
  } catch (e) {
    if (e.name !== "AbortError") toast.error("Could not set folder: " + e.message);
    return false;
  }
};
const autoSavePDF = async (doc, inv) => {
  if (!_folderHandle) {
    return;
  }
  try {
    const folderName = inv.docType === "NON GST INVOICE" ? "Non-GST Invoices" : inv.isB2C ? "B2C Invoices" : inv.docType === "DEBIT NOTE" ? "Debit Notes" : inv.docType === "CREDIT NOTE" ? "Credit Notes" : "B2B Invoices";
    const subFolder = await _folderHandle.getDirectoryHandle(folderName, { create: true });
    const fileName = (inv.invNo || "Invoice") + ".pdf";
    const fileHandle = await subFolder.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    const pdfBlob = doc.output("blob");
    await writable.write(pdfBlob);
    await writable.close();
    toast.success(`Auto-saved to ${folderName}/${fileName}`);
  } catch (e) {
    console.warn("Auto-save failed:", e.message);
  }
};
const makeGSTR1 = (invoices) => {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const XLSX2 = window.XLSX;
  const wb = XLSX2.utils.book_new();
  const taxInvs = invoices.filter((i) => i.docType !== "CREDIT NOTE" && i.docType !== "DEBIT NOTE");
  const b2b = taxInvs.filter((i) => {
    var _a2;
    return !i.isB2C && ((_a2 = i.billTo) == null ? void 0 : _a2.gstin);
  });
  const b2c = taxInvs.filter((i) => {
    var _a2;
    return i.isB2C || !((_a2 = i.billTo) == null ? void 0 : _a2.gstin);
  });
  const credits = invoices.filter((i) => i.docType === "CREDIT NOTE");
  const debits = invoices.filter((i) => i.docType === "DEBIT NOTE");
  const b2bHead = ["GSTIN of Recipient", "Receiver Name", "Invoice Number", "Invoice Date", "Invoice Value", "Place of Supply", "Reverse Charge", "Invoice Type", "E-Commerce GSTIN", "Rate", "Taxable Value", "IGST", "CGST", "SGST", "Cess"];
  const b2bRows = [b2bHead];
  b2b.forEach((inv) => {
    (inv.items || []).filter((r) => r.desc).forEach((r) => {
      var _a2, _b2, _c2, _d2;
      const tR = parseFloat(r.taxRate) || 0, tax = parseFloat(r.taxable) || 0, gst = parseFloat(r.gstAmt) || 0;
      const gt = inv.gstType || "INTRA";
      b2bRows.push([
        (((_a2 = inv.billTo) == null ? void 0 : _a2.gstin) || "").toUpperCase(),
        ((_b2 = inv.billTo) == null ? void 0 : _b2.name) || "",
        inv.invNo || "",
        fmtDate(inv.date) || "",
        Number(getGrand(inv) || 0).toFixed(2),
        ((_c2 = inv.billTo) == null ? void 0 : _c2.state) || stateName((_d2 = inv.billTo) == null ? void 0 : _d2.gstin) || "",
        "N",
        "Regular",
        "",
        tR,
        Number(tax).toFixed(2),
        gt === "INTER" ? Number(gst).toFixed(2) : "",
        gt === "INTRA" ? Number(gst / 2).toFixed(2) : "",
        gt === "INTRA" ? Number(gst / 2).toFixed(2) : "",
        ""
      ]);
    });
  });
  const wsB2B = XLSX2.utils.aoa_to_sheet(b2bRows);
  wsB2B["!cols"] = [{ wch: 20 }, { wch: 22 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 8 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 8 }];
  XLSX2.utils.book_append_sheet(wb, wsB2B, "B2B");
  const b2cHead = ["Type", "Place of Supply", "Rate", "Taxable Value", "IGST", "CGST", "SGST", "Cess"];
  const b2cRows = [b2cHead];
  b2c.forEach((inv) => {
    (inv.items || []).filter((r) => r.desc).forEach((r) => {
      var _a2;
      const tR = parseFloat(r.taxRate) || 0, tax = parseFloat(r.taxable) || 0, gst = parseFloat(r.gstAmt) || 0;
      const gt = inv.gstType || "INTRA";
      b2cRows.push([
        "B2C",
        ((_a2 = inv.billTo) == null ? void 0 : _a2.state) || "",
        tR,
        Number(tax).toFixed(2),
        gt === "INTER" ? Number(gst).toFixed(2) : "",
        gt === "INTRA" ? Number(gst / 2).toFixed(2) : "",
        gt === "INTRA" ? Number(gst / 2).toFixed(2) : "",
        ""
      ]);
    });
  });
  const wsB2C = XLSX2.utils.aoa_to_sheet(b2cRows);
  wsB2C["!cols"] = [{ wch: 10 }, { wch: 18 }, { wch: 8 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 8 }];
  XLSX2.utils.book_append_sheet(wb, wsB2C, "B2C");
  const hsnMap = {};
  invoices.forEach((inv) => {
    const sign = inv.docType === "CREDIT NOTE" ? -1 : 1;
    (inv.items || []).filter((r) => r.desc && r.hsnCode).forEach((r) => {
      const k = r.hsnCode;
      if (!hsnMap[k]) hsnMap[k] = { hsn: r.hsnCode, desc: r.desc, uom: r.unit || "Nos", qty: 0, val: 0, tax: 0, igst: 0, cgst: 0, sgst: 0 };
      const tax = parseFloat(r.taxable) || 0, gst = parseFloat(r.gstAmt) || 0;
      const gt = inv.gstType || "INTRA";
      hsnMap[k].qty += sign * (parseFloat(r.qty) || 0);
      hsnMap[k].val += sign * (parseFloat(r.total) || 0);
      hsnMap[k].tax += sign * tax;
      if (gt === "INTER") hsnMap[k].igst += sign * gst;
      else {
        hsnMap[k].cgst += sign * gst / 2;
        hsnMap[k].sgst += sign * gst / 2;
      }
    });
  });
  const hsnHead = ["HSN/SAC", "Description", "UOM", "Total Qty", "Total Value", "Taxable Value", "IGST", "CGST", "SGST", "Cess"];
  const hsnRows = [hsnHead, ...Object.values(hsnMap).map((h) => [h.hsn, h.desc, h.uom, h.qty.toFixed(2), h.val.toFixed(2), h.tax.toFixed(2), h.igst.toFixed(2), h.cgst.toFixed(2), h.sgst.toFixed(2), "0"])];
  const wsHSN = XLSX2.utils.aoa_to_sheet(hsnRows);
  wsHSN["!cols"] = [{ wch: 12 }, { wch: 30 }, { wch: 8 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 8 }];
  XLSX2.utils.book_append_sheet(wb, wsHSN, "HSN Summary");
  const dsHead = ["Nature of Document", "Sr No From", "Sr No To", "Total Issued", "Total Cancelled"];
  const dsRows = [
    dsHead,
    ["Invoices for outward supply", ((_a = b2b[0]) == null ? void 0 : _a.invNo) || "-", ((_b = b2b[b2b.length - 1]) == null ? void 0 : _b.invNo) || "-", b2b.length, 0],
    ["Invoices for inward supply (B2C)", ((_c = b2c[0]) == null ? void 0 : _c.invNo) || "-", ((_d = b2c[b2c.length - 1]) == null ? void 0 : _d.invNo) || "-", b2c.length, 0],
    ["Debit Notes", ((_e = debits[0]) == null ? void 0 : _e.invNo) || "-", ((_f = debits[debits.length - 1]) == null ? void 0 : _f.invNo) || "-", debits.length, 0],
    ["Credit Notes", ((_g = credits[0]) == null ? void 0 : _g.invNo) || "-", ((_h = credits[credits.length - 1]) == null ? void 0 : _h.invNo) || "-", credits.length, 0]
  ];
  const wsDS = XLSX2.utils.aoa_to_sheet(dsRows);
  wsDS["!cols"] = [{ wch: 34 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 14 }];
  XLSX2.utils.book_append_sheet(wb, wsDS, "Document Summary");
  const cdnrHead = [
    "GSTIN of Recipient",
    "Receiver Name",
    "Note No",
    "Note Date",
    "Note Type",
    "Note Value",
    "Original Invoice No",
    "Original Invoice Date",
    "Place of Supply",
    "Reverse Charge",
    "Rate",
    "Taxable Value",
    "IGST",
    "CGST",
    "SGST",
    "Cess"
  ];
  const cdnrRows = [cdnrHead];
  [...credits, ...debits].forEach((inv) => {
    const sign = inv.docType === "CREDIT NOTE" ? -1 : 1;
    const noteType = inv.docType === "CREDIT NOTE" ? "C" : "D";
    (inv.items || []).filter((r) => r.desc).forEach((r) => {
      var _a2, _b2, _c2, _d2;
      const tR = parseFloat(r.taxRate) || 0, tax = parseFloat(r.taxable) || 0, gst = parseFloat(r.gstAmt) || 0;
      const gt = inv.gstType || "INTRA";
      cdnrRows.push([
        (((_a2 = inv.billTo) == null ? void 0 : _a2.gstin) || "").toUpperCase(),
        ((_b2 = inv.billTo) == null ? void 0 : _b2.name) || "",
        inv.invNo || "",
        fmtDate(inv.date) || "",
        noteType,
        Number(Math.abs(getGrand(inv) || 0)).toFixed(2),
        inv.origInvNo || "",
        inv.origInvDate ? fmtDate(inv.origInvDate) : "",
        ((_c2 = inv.billTo) == null ? void 0 : _c2.state) || stateName((_d2 = inv.billTo) == null ? void 0 : _d2.gstin) || "",
        "N",
        tR,
        Number(sign * tax).toFixed(2),
        gt === "INTER" ? Number(sign * gst).toFixed(2) : "",
        gt === "INTRA" ? Number(sign * gst / 2).toFixed(2) : "",
        gt === "INTRA" ? Number(sign * gst / 2).toFixed(2) : "",
        ""
      ]);
    });
  });
  const wsCDNR = XLSX2.utils.aoa_to_sheet(cdnrRows);
  wsCDNR["!cols"] = [{ wch: 20 }, { wch: 22 }, { wch: 16 }, { wch: 14 }, { wch: 8 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 10 }, { wch: 8 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 8 }];
  XLSX2.utils.book_append_sheet(wb, wsCDNR, "CDNR (Credit-Debit Notes)");
  XLSX2.writeFile(wb, `GSTR1_${today()}.xlsx`);
  toast.success("GSTR-1 report downloaded!");
};
const makePurchaseExcel = (expenses, fmt2 = "xlsx", meta = {}) => {
  const XLSX2 = window.XLSX;
  const wb = XLSX2.utils.book_new();
  const headers = [
    "Sl.No",
    "Date",
    "Voucher No.",
    "Txn Ref No.",
    "Vendor / Supplier Name",
    "Vendor GSTIN",
    "Vendor State",
    "Bill No / Ref No",
    "Bill Date",
    "Due Date",
    "Category",
    "Product",
    "Description",
    "HSN / SAC",
    "Unit",
    "Qty",
    "Rate (Rs.)",
    "Taxable Amount (Rs.)",
    "GST Type",
    "Tax Rate %",
    "CGST %",
    "CGST Amount (Rs.)",
    "SGST %",
    "SGST Amount (Rs.)",
    "IGST %",
    "IGST Amount (Rs.)",
    "Total Tax (Rs.)",
    "Line Total (Rs.)",
    "Added to Stock",
    "Bill Total (Rs.)",
    "TDS Section",
    "TDS Rate %",
    "TDS Amount (Rs.)",
    "Net Payable (Rs.)",
    "Amount Paid (Rs.)",
    "Balance Payable (Rs.)",
    "Payment Mode",
    "Payment Status",
    "Paid Date",
    "Notes",
    "Recorded By"
  ];
  const rows = [...companyHeaderRows(), headers];
  let sl = 1;
  expenses.forEach((e) => {
    const gt = e.gstType || "INTRA";
    const items = expItems(e);
    items.forEach((it, k) => {
      const tR = parseFloat(it.taxRate) || 0;
      const tax = parseFloat(it.taxable) || 0;
      const gst = parseFloat(it.gstAmt) || 0;
      rows.push([
        sl++,
        e.date || "",
        e.voucherNo || "",
        e.txnRefNo || "",
        e.vendor || "",
        (e.vendorGSTIN || "").toUpperCase(),
        e.vendorState || "",
        e.billNo || "",
        e.billDate || "",
        expDueDate(e),
        e.category || "",
        it.product || "",
        it.desc || "",
        it.hsnCode || "",
        it.unit || "Nos",
        parseFloat(it.qty) || 0,
        parseFloat(it.rate) || 0,
        Number(tax).toFixed(2),
        gt,
        tR,
        gt === "INTRA" ? tR / 2 : "",
        gt === "INTRA" ? Number(gst / 2).toFixed(2) : "",
        gt === "INTRA" ? tR / 2 : "",
        gt === "INTRA" ? Number(gst / 2).toFixed(2) : "",
        gt !== "INTRA" ? tR : "",
        gt !== "INTRA" ? Number(gst).toFixed(2) : "",
        Number(gst).toFixed(2),
        Number(parseFloat(it.total) || 0).toFixed(2),
        it.toStock === false ? "No" : "Yes",
        k === 0 ? Number(parseFloat(e.total) || 0).toFixed(2) : "",
        k === 0 ? e.tdsSection || "" : "",
        k === 0 ? e.tdsSection ? parseFloat(e.tdsRate) || 0 : "" : "",
        k === 0 ? Number(parseFloat(e.tdsAmount) || 0).toFixed(2) : "",
        k === 0 ? Number(expNetPayable(e)).toFixed(2) : "",
        k === 0 ? expPaid(e).toFixed(2) : "",
        k === 0 ? expDue(e).toFixed(2) : "",
        k === 0 ? e.payMode || "" : "",
        k === 0 ? e.payStatus || "" : "",
        k === 0 ? e.paidDate || "" : "",
        k === 0 ? e.notes || "" : "",
        k === 0 ? e.createdBy || "" : ""
      ]);
    });
  });
  const ws = XLSX2.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 5 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 24 },
    { wch: 20 },
    { wch: 14 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
    { wch: 16 },
    { wch: 24 },
    { wch: 24 },
    { wch: 10 },
    { wch: 8 },
    { wch: 8 },
    { wch: 12 },
    { wch: 18 },
    { wch: 10 },
    { wch: 8 },
    { wch: 8 },
    { wch: 14 },
    { wch: 8 },
    { wch: 14 },
    { wch: 8 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 12 },
    { wch: 16 },
    { wch: 12 },
    { wch: 10 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 24 },
    { wch: 20 }
  ];
  XLSX2.utils.book_append_sheet(wb, ws, "Purchase Register");
  const prodMap = {};
  expenses.forEach((e) => expItems(e).forEach((it) => {
    const n = it.product || it.desc || "Unnamed";
    if (!prodMap[n]) prodMap[n] = { n, qty: 0, taxable: 0, tax: 0, total: 0, bills: 0 };
    prodMap[n].qty += parseFloat(it.qty) || 0;
    prodMap[n].taxable += parseFloat(it.taxable) || 0;
    prodMap[n].tax += parseFloat(it.gstAmt) || 0;
    prodMap[n].total += parseFloat(it.total) || 0;
    prodMap[n].bills += 1;
  }));
  const pRows = [
    ["Product", "Qty Purchased", "Lines", "Taxable (Rs.)", "Tax (Rs.)", "Total (Rs.)", "Avg Rate (Rs.)"],
    ...Object.values(prodMap).sort((a, b) => b.total - a.total).map((p) => [
      p.n,
      p.qty,
      p.bills,
      p.taxable.toFixed(2),
      p.tax.toFixed(2),
      p.total.toFixed(2),
      (p.qty ? p.taxable / p.qty : 0).toFixed(2)
    ])
  ];
  const wsP = XLSX2.utils.aoa_to_sheet(pRows);
  wsP["!cols"] = [{ wch: 30 }, { wch: 14 }, { wch: 8 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 14 }];
  XLSX2.utils.book_append_sheet(wb, wsP, "Product-wise Purchases");
  const venMap = {};
  expenses.forEach((e) => {
    const v = e.vendor || "Unknown";
    if (!venMap[v]) venMap[v] = { v, gstin: e.vendorGSTIN || "", bills: 0, total: 0, paid: 0, due: 0 };
    venMap[v].bills++;
    venMap[v].total += parseFloat(e.total) || 0;
    venMap[v].paid += expPaid(e);
    venMap[v].due += expDue(e);
  });
  const vRows = [
    ["Vendor", "GSTIN", "Bills", "Purchased (Rs.)", "Paid (Rs.)", "Outstanding (Rs.)"],
    ...Object.values(venMap).sort((a, b) => b.due - a.due).map((v) => [
      v.v,
      v.gstin,
      v.bills,
      v.total.toFixed(2),
      v.paid.toFixed(2),
      v.due.toFixed(2)
    ])
  ];
  const wsV = XLSX2.utils.aoa_to_sheet(vRows);
  wsV["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 8 }, { wch: 18 }, { wch: 16 }, { wch: 18 }];
  XLSX2.utils.book_append_sheet(wb, wsV, "Vendor Outstanding");
  const catMap = {};
  expenses.forEach((e) => {
    const cat = e.category || "Uncategorized";
    if (!catMap[cat]) catMap[cat] = { cat, count: 0, taxable: 0, tax: 0, total: 0, paid: 0, pending: 0 };
    catMap[cat].count++;
    catMap[cat].taxable += parseFloat(e.taxable) || 0;
    catMap[cat].tax += parseFloat(e.gstAmt) || 0;
    catMap[cat].total += parseFloat(e.total) || 0;
    if ((e.payStatus || "").toLowerCase() === "paid") catMap[cat].paid += parseFloat(e.total) || 0;
    else catMap[cat].pending += parseFloat(e.total) || 0;
  });
  const catHead = ["Category", "No. of Bills", "Taxable (Rs.)", "Total Tax (Rs.)", "Total Amount (Rs.)", "Paid (Rs.)", "Pending (Rs.)"];
  const catRows = [catHead, ...Object.values(catMap).map((c) => [c.cat, c.count, c.taxable.toFixed(2), c.tax.toFixed(2), c.total.toFixed(2), c.paid.toFixed(2), c.pending.toFixed(2)])];
  const totRow = [
    "TOTAL",
    expenses.length,
    Object.values(catMap).reduce((s, c) => s + c.taxable, 0).toFixed(2),
    Object.values(catMap).reduce((s, c) => s + c.tax, 0).toFixed(2),
    Object.values(catMap).reduce((s, c) => s + c.total, 0).toFixed(2),
    Object.values(catMap).reduce((s, c) => s + c.paid, 0).toFixed(2),
    Object.values(catMap).reduce((s, c) => s + c.pending, 0).toFixed(2)
  ];
  catRows.push(totRow);
  const wsCat = XLSX2.utils.aoa_to_sheet(catRows);
  wsCat["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 16 }];
  XLSX2.utils.book_append_sheet(wb, wsCat, "Category Summary");
  const monMap = {};
  expenses.forEach((e) => {
    var _a;
    const m = ((_a = e.date) == null ? void 0 : _a.substring(0, 7)) || "?";
    if (!monMap[m]) monMap[m] = { month: m, count: 0, taxable: 0, tax: 0, total: 0 };
    monMap[m].count++;
    monMap[m].taxable += parseFloat(e.taxable) || 0;
    monMap[m].tax += parseFloat(e.gstAmt) || 0;
    monMap[m].total += parseFloat(e.total) || 0;
  });
  const monHead = ["Month", "No. of Bills", "Taxable (Rs.)", "Total Tax (Rs.)", "Total Amount (Rs.)"];
  const monRows = [monHead, ...Object.entries(monMap).sort().map(([m, v]) => [m, v.count, v.taxable.toFixed(2), v.tax.toFixed(2), v.total.toFixed(2)])];
  const wsM = XLSX2.utils.aoa_to_sheet(monRows);
  wsM["!cols"] = [{ wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 18 }];
  XLSX2.utils.book_append_sheet(wb, wsM, "Monthly Summary");
  proExport(fmt2, {
    ...proWbToSpec(wb, { title: "Purchase Register", period: meta.period || "" }),
    pdfSheets: fmt2 === "pdf" ? [{ name: "Purchase Register", aoa: regPurchasePdf(expenses), h0: true }, { name: "Monthly Summary", aoa: monRows, h0: true }, { name: "Vendor-wise Outstanding", aoa: vRows, h0: true }] : void 0
  }, `PurchaseRegister_${today()}`);
};
const makeAuditExcel = (logs) => {
  try {
    const { utils, writeFile } = window.XLSX;
    const rows = logs.map((l) => {
      const meta = getAuditMeta(l.action);
      return {
        "Timestamp": new Date(l.ts).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        "Module": meta.module,
        "Action": meta.action,
        "Detail": l.detail || "",
        "User Name": l.userName || "",
        "User Email": l.user || "",
        "Date": new Date(l.ts).toLocaleDateString("en-IN"),
        "Time": new Date(l.ts).toLocaleTimeString("en-IN")
      };
    });
    const ws = utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 22 }, { wch: 20 }, { wch: 16 }, { wch: 55 }, { wch: 20 }, { wch: 30 }, { wch: 14 }, { wch: 12 }];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Audit Log");
    const actionCounts = {};
    logs.forEach((l) => {
      const meta = getAuditMeta(l.action);
      const k = meta.module + " \u2014 " + meta.action;
      actionCounts[k] = (actionCounts[k] || 0) + 1;
    });
    const sumRows = Object.entries(actionCounts).sort((a, b) => b[1] - a[1]).map(([k, count]) => {
      const [module, action] = k.split(" \u2014 ");
      return { "Module": module, "Action": action, "Count": count };
    });
    const ws2 = utils.json_to_sheet(sumRows);
    ws2["!cols"] = [{ wch: 22 }, { wch: 20 }, { wch: 10 }];
    utils.book_append_sheet(wb, ws2, "Summary");
    const dt = today();
    writeFile(wb, `AuditLog_${dt}.xlsx`);
    toast.success(`Audit log exported \u2014 ${logs.length} entries`);
  } catch (e) {
    toast.error("Export failed: " + e.message);
  }
};
const makeFullExcel = () => {
  try {
    const XLSX2 = window.XLSX;
    const wb = XLSX2.utils.book_new();
    const dt = today();
    const co = S.get(SK.CO, {});
    const invoices = S.get(SK.INV, []);
    const expenses = S.get(SK.EXP, []);
    const pos = S.get(SK.PO, []);
    const customers = S.get(SK.CUST, []);
    const hsnList = S.get(SK.HSN, []);
    const auditLogs = S.get(SK.AUDIT, []);
    const freezeD = S.get(SK.FREEZE, { sales: [], expenses: [] });
    const terms = S.get(SK.TERMS, "");
    const poTerms = S.get(SK.PO_TERMS, "");
    const addSheet = (wb2, data, sheetName, colWidths) => {
      const ws = XLSX2.utils.aoa_to_sheet(data);
      if (colWidths) ws["!cols"] = colWidths.map((w) => ({ wch: w }));
      XLSX2.utils.book_append_sheet(wb2, ws, sheetName);
      return ws;
    };
    const coRows = [
      ["Field", "Value"],
      ["Company Name", co.name || ""],
      ["GSTIN", co.gstin || ""],
      ["PAN Number", co.panNo || ""],
      ["Address", co.address || ""],
      ["City", co.city || ""],
      ["State", co.state || ""],
      ["PIN", co.pin || ""],
      ["Phone", co.phone || ""],
      ["Email", co.email || ""],
      ["Website", co.website || ""],
      ["Bank Name", co.bankName || ""],
      ["Account Number", co.bankAccount || ""],
      ["IFSC Code", co.bankIFSC || ""],
      ["Branch", co.bankBranch || ""],
      ["Authorised Signatory", co.signatory || ""],
      ["UPI ID", co.upiId || ""],
      ["Payment Mode", co.paymentMode || ""],
      ["Export Date", (/* @__PURE__ */ new Date()).toLocaleString("en-IN")],
      ["Total Invoices", invoices.length],
      ["Total Expenses", expenses.length],
      ["Total POs", pos.length]
    ];
    addSheet(wb, coRows, "Company Info", [28, 40]);
    const salesHdr = [
      "Sl.No",
      "Document Type",
      "Invoice No",
      "Invoice Date",
      "Original Invoice No",
      "Original Invoice Date",
      "Sent to Customer",
      "Customer Name",
      "Customer GSTIN",
      "Customer State",
      "Bill To Address",
      "HSN/SAC",
      "Description",
      "Unit",
      "Qty",
      "Rate (Rs.)",
      "Discount %",
      "Taxable Amount (Rs.)",
      "GST Type",
      "Tax Rate %",
      "CGST %",
      "CGST Amount (Rs.)",
      "SGST %",
      "SGST Amount (Rs.)",
      "IGST %",
      "IGST Amount (Rs.)",
      "Total Tax (Rs.)",
      "Invoice Total (Rs.)",
      "Payment Status",
      "Due Date",
      "PO/Reference No",
      "Notes",
      "Created By",
      "Customer Phone",
      "Customer Email",
      "Round Off",
      "Paid Amount (Rs.)",
      "Balance (Rs.)",
      "Paid Date",
      "Subject",
      "Time"
    ];
    const salesRows = [salesHdr];
    let sl = 1;
    invoices.forEach((inv) => {
      const items = (inv.items || []).filter((r) => r.desc);
      const gt = inv.gstType || "INTRA";
      const isNG = inv.docType === "NON GST INVOICE";
      const dt2 = inv.isB2C ? "TAX INVOICE (B2C)" : isNG ? "NON-GST TRANSACTION" : inv.docType || "TAX INVOICE";
      const isCN = inv.docType === "CREDIT NOTE";
      const sign = isCN ? -1 : 1;
      const isCDN = inv.docType === "CREDIT NOTE" || inv.docType === "DEBIT NOTE";
      (items.length ? items : [{ desc: "\u2014", qty: 1, rate: 0 }]).forEach((r, idx) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
        const tR = isNG ? 0 : parseFloat(r.taxRate) || 0;
        const tax = isNG ? 0 : parseFloat(r.taxable) || 0;
        const gst = isNG ? 0 : parseFloat(r.gstAmt) || 0;
        const lineTotal = isNG ? (parseFloat(r.qty) || 0) * (parseFloat(r.rate) || 0) : parseFloat(r.total) || 0;
        salesRows.push([
          idx === 0 ? sl : "",
          dt2,
          inv.invNo || "",
          fmtDate(inv.date) || "",
          isCDN ? inv.origInvNo || "" : "",
          isCDN ? inv.origInvDate ? fmtDate(inv.origInvDate) : "" : "",
          inv.sentToCustomer ? "Yes" : "No",
          ((_a = inv.billTo) == null ? void 0 : _a.name) || "",
          (((_b = inv.billTo) == null ? void 0 : _b.gstin) || "").toUpperCase(),
          stateName((_c = inv.billTo) == null ? void 0 : _c.gstin) || ((_d = inv.billTo) == null ? void 0 : _d.state) || "",
          [(_e = inv.billTo) == null ? void 0 : _e.address, (_f = inv.billTo) == null ? void 0 : _f.city, (_g = inv.billTo) == null ? void 0 : _g.state, (_h = inv.billTo) == null ? void 0 : _h.pin].filter(Boolean).join(", "),
          isNG ? "" : r.hsnCode || "",
          r.desc || "",
          isNG ? "Nos" : r.unit || "Nos",
          r.qty || 1,
          r.rate || 0,
          isNG ? 0 : r.discount || 0,
          Number(sign * tax).toFixed(2),
          isNG ? "NON-GST" : gt,
          tR,
          isNG ? "" : gt === "INTRA" ? tR / 2 : "",
          isNG ? "" : gt === "INTRA" ? Number(sign * gst / 2).toFixed(2) : "",
          isNG ? "" : gt === "INTRA" ? tR / 2 : "",
          isNG ? "" : gt === "INTRA" ? Number(sign * gst / 2).toFixed(2) : "",
          isNG ? "" : gt !== "INTRA" ? tR : "",
          isNG ? "" : gt !== "INTRA" ? Number(sign * gst).toFixed(2) : "",
          isNG ? 0 : Number(sign * gst).toFixed(2),
          Number(isNG ? lineTotal : getGrand(inv)).toFixed(2),
          inv.status || "",
          inv.dueDate ? fmtDate(inv.dueDate) : "",
          inv.poNo || "",
          inv.notes || "",
          inv.createdBy || "",
          ((_i = inv.billTo) == null ? void 0 : _i.phone) || "",
          ((_j = inv.billTo) == null ? void 0 : _j.email) || "",
          idx === 0 ? inv.roundOff || 0 : "",
          idx === 0 ? Number(invPaid(inv)).toFixed(2) : "",
          idx === 0 ? Number(Math.abs(getGrand(inv)) - invPaid(inv)).toFixed(2) : "",
          inv.paidDate ? fmtDate(inv.paidDate) : "",
          inv.subject || "",
          inv.time || ""
        ]);
        if (idx === 0) sl++;
      });
    });
    addSheet(
      wb,
      salesRows,
      "Sales Register",
      [5, 20, 16, 13, 16, 16, 8, 22, 20, 16, 28, 12, 28, 8, 7, 12, 8, 18, 10, 9, 8, 16, 8, 16, 8, 16, 14, 18, 14, 13, 14, 22, 20, 14, 24, 9, 14, 14, 12, 20, 10]
    );
    const salesTotals = {};
    invoices.forEach((inv) => {
      var _a;
      const isCN = inv.docType === "CREDIT NOTE", sign = isCN ? -1 : 1;
      const isNG = inv.docType === "NON GST INVOICE";
      const m = ((_a = inv.date) == null ? void 0 : _a.substring(0, 7)) || "Unknown";
      if (!salesTotals[m]) salesTotals[m] = { b2b: 0, b2c: 0, ng: 0, dn: 0, cn: 0, taxable: 0, tax: 0, total: 0 };
      if (isCN) salesTotals[m].cn++;
      else if (inv.docType === "DEBIT NOTE") salesTotals[m].dn++;
      else if (isNG) salesTotals[m].ng++;
      else if (inv.isB2C) salesTotals[m].b2c++;
      else salesTotals[m].b2b++;
      const g = getGrand(inv);
      salesTotals[m].total += sign * g;
      (inv.items || []).filter((r) => r.desc).forEach((r) => {
        salesTotals[m].taxable += isNG ? 0 : sign * (parseFloat(r.taxable) || 0);
        salesTotals[m].tax += isNG ? 0 : sign * (parseFloat(r.gstAmt) || 0);
      });
    });
    const mSalesHdr = ["Month", "B2B", "B2C", "Non-GST", "Debit Notes", "Credit Notes", "Net Taxable (Rs.)", "Net Tax (Rs.)", "Net Total (Rs.)"];
    const mSalesRows = [mSalesHdr, ...Object.entries(salesTotals).sort().map(([m, v]) => [
      m,
      v.b2b,
      v.b2c,
      v.ng,
      v.dn,
      v.cn,
      Number(v.taxable).toFixed(2),
      Number(v.tax).toFixed(2),
      Number(v.total).toFixed(2)
    ])];
    const mTot = Object.values(salesTotals).reduce((a, v) => ({ b2b: a.b2b + v.b2b, b2c: a.b2c + v.b2c, ng: a.ng + v.ng, dn: a.dn + v.dn, cn: a.cn + v.cn, taxable: a.taxable + v.taxable, tax: a.tax + v.tax, total: a.total + v.total }), { b2b: 0, b2c: 0, ng: 0, dn: 0, cn: 0, taxable: 0, tax: 0, total: 0 });
    mSalesRows.push(["TOTAL", mTot.b2b, mTot.b2c, mTot.ng, mTot.dn, mTot.cn, mTot.taxable.toFixed(2), mTot.tax.toFixed(2), mTot.total.toFixed(2)]);
    addSheet(wb, mSalesRows, "Monthly Sales Summary", [12, 8, 8, 10, 12, 12, 18, 16, 16]);
    const purHdr = [
      "Sl.No",
      "Date",
      "Vendor Name",
      "Vendor GSTIN",
      "Vendor State",
      "Bill No",
      "Bill Date",
      "Category",
      "Description",
      "HSN/SAC",
      "Unit",
      "Qty",
      "Rate (Rs.)",
      "Taxable (Rs.)",
      "GST Type",
      "Tax Rate %",
      "CGST %",
      "CGST Amt (Rs.)",
      "SGST %",
      "SGST Amt (Rs.)",
      "IGST %",
      "IGST Amt (Rs.)",
      "Total Tax (Rs.)",
      "Total Amount (Rs.)",
      "Payment Mode",
      "Payment Status",
      "Paid Date",
      "Notes",
      "Recorded By"
    ];
    const purRows = [purHdr];
    let psl = 1;
    expenses.forEach((e) => {
      const tR = parseFloat(e.taxRate) || 0, tax = parseFloat(e.taxable) || 0;
      const gst = parseFloat(e.gstAmt) || 0, gt = e.gstType || "INTRA";
      purRows.push([
        psl++,
        e.date || "",
        e.vendor || "",
        (e.vendorGSTIN || "").toUpperCase(),
        e.vendorState || "",
        e.billNo || "",
        e.billDate || "",
        e.category || "",
        e.description || "",
        e.hsnCode || "",
        e.unit || "Nos",
        parseFloat(e.qty) || 1,
        parseFloat(e.rate) || 0,
        Number(tax).toFixed(2),
        gt,
        tR,
        gt === "INTRA" ? tR / 2 : "",
        gt === "INTRA" ? Number(gst / 2).toFixed(2) : "",
        gt === "INTRA" ? tR / 2 : "",
        gt === "INTRA" ? Number(gst / 2).toFixed(2) : "",
        gt !== "INTRA" ? tR : "",
        gt !== "INTRA" ? Number(gst).toFixed(2) : "",
        Number(gst).toFixed(2),
        Number(parseFloat(e.total) || 0).toFixed(2),
        e.payMode || "",
        e.payStatus || "",
        e.paidDate || "",
        e.notes || "",
        e.createdBy || ""
      ]);
    });
    addSheet(
      wb,
      purRows,
      "Purchase Register",
      [5, 12, 24, 20, 14, 14, 12, 16, 28, 10, 8, 6, 12, 16, 10, 8, 8, 14, 8, 14, 8, 14, 14, 16, 16, 14, 12, 24, 20]
    );
    const catMap = {};
    expenses.forEach((e) => {
      const cat = e.category || "Uncategorized";
      if (!catMap[cat]) catMap[cat] = { count: 0, taxable: 0, tax: 0, total: 0, paid: 0, pending: 0 };
      catMap[cat].count++;
      catMap[cat].taxable += parseFloat(e.taxable) || 0;
      catMap[cat].tax += parseFloat(e.gstAmt) || 0;
      catMap[cat].total += parseFloat(e.total) || 0;
      if ((e.payStatus || "").toLowerCase() === "paid") catMap[cat].paid += parseFloat(e.total) || 0;
      else catMap[cat].pending += parseFloat(e.total) || 0;
    });
    const catHdr = ["Category", "No. of Bills", "Taxable (Rs.)", "Total Tax (Rs.)", "Total Amount (Rs.)", "Paid (Rs.)", "Pending (Rs.)"];
    const catRows = [catHdr, ...Object.entries(catMap).sort().map(([cat, v]) => [
      cat,
      v.count,
      v.taxable.toFixed(2),
      v.tax.toFixed(2),
      v.total.toFixed(2),
      v.paid.toFixed(2),
      v.pending.toFixed(2)
    ])];
    const cTot = Object.values(catMap).reduce((a, v) => ({ count: a.count + v.count, taxable: a.taxable + v.taxable, tax: a.tax + v.tax, total: a.total + v.total, paid: a.paid + v.paid, pending: a.pending + v.pending }), { count: 0, taxable: 0, tax: 0, total: 0, paid: 0, pending: 0 });
    catRows.push(["TOTAL", cTot.count, cTot.taxable.toFixed(2), cTot.tax.toFixed(2), cTot.total.toFixed(2), cTot.paid.toFixed(2), cTot.pending.toFixed(2)]);
    addSheet(wb, catRows, "Purchase Category Summary", [22, 12, 16, 16, 18, 16, 16]);
    const monMap = {};
    expenses.forEach((e) => {
      var _a;
      const m = ((_a = e.date) == null ? void 0 : _a.substring(0, 7)) || "Unknown";
      if (!monMap[m]) monMap[m] = { count: 0, taxable: 0, tax: 0, total: 0, paid: 0, pending: 0 };
      monMap[m].count++;
      monMap[m].taxable += parseFloat(e.taxable) || 0;
      monMap[m].tax += parseFloat(e.gstAmt) || 0;
      monMap[m].total += parseFloat(e.total) || 0;
      if ((e.payStatus || "").toLowerCase() === "paid") monMap[m].paid += parseFloat(e.total) || 0;
      else monMap[m].pending += parseFloat(e.total) || 0;
    });
    const mPurHdr = ["Month", "No. of Bills", "Taxable (Rs.)", "Total Tax (Rs.)", "Total Amount (Rs.)", "Paid (Rs.)", "Pending (Rs.)"];
    const mPurRows = [mPurHdr, ...Object.entries(monMap).sort().map(([m, v]) => [
      m,
      v.count,
      v.taxable.toFixed(2),
      v.tax.toFixed(2),
      v.total.toFixed(2),
      v.paid.toFixed(2),
      v.pending.toFixed(2)
    ])];
    addSheet(wb, mPurRows, "Monthly Purchase Summary", [12, 12, 16, 16, 18, 16, 16]);
    const poHdr = [
      "Sl.No",
      "PO Number",
      "PO Date",
      "Delivery By",
      "Status",
      "Vendor Name",
      "Vendor GSTIN",
      "Vendor Address",
      "Deliver To",
      "Description",
      "HSN/SAC",
      "Qty",
      "Unit",
      "Rate (Rs.)",
      "Line Amount (Rs.)",
      "Sub Total (Rs.)",
      "Taxes/Freight (Rs.)",
      "Grand Total (Rs.)",
      "Ref No",
      "Notes",
      "Created By"
    ];
    const poRows = [poHdr];
    let poSl = 1;
    pos.forEach((po) => {
      const items = (po.items || []).filter((r) => r.desc);
      const grand = (po.items || []).reduce((s, r) => s + (parseFloat(r.qty) || 0) * (parseFloat(r.rate) || 0), 0) + Number(po.taxes || 0);
      (items.length ? items : [{ desc: "\u2014", qty: "", unit: "", rate: "", hsnCode: "" }]).forEach((it, idx) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i;
        poRows.push([
          idx === 0 ? poSl : "",
          idx === 0 ? po.poNo : "",
          idx === 0 ? fmtDate(po.date) : "",
          idx === 0 ? fmtDate(po.deliveryDate) : "",
          idx === 0 ? po.status || "Draft" : "",
          idx === 0 ? ((_a = po.vendorTo) == null ? void 0 : _a.name) || "" : "",
          idx === 0 ? (((_b = po.vendorTo) == null ? void 0 : _b.gstin) || "").toUpperCase() : "",
          idx === 0 ? [(_c = po.vendorTo) == null ? void 0 : _c.address, (_d = po.vendorTo) == null ? void 0 : _d.city, (_e = po.vendorTo) == null ? void 0 : _e.state, (_f = po.vendorTo) == null ? void 0 : _f.pin].filter(Boolean).join(", ") : "",
          idx === 0 ? [(_g = po.deliverTo) == null ? void 0 : _g.name, (_h = po.deliverTo) == null ? void 0 : _h.address, (_i = po.deliverTo) == null ? void 0 : _i.city].filter(Boolean).join(", ") : "",
          it.desc || "",
          it.hsnCode || "",
          it.qty || "",
          it.unit || "Nos",
          parseFloat(it.rate) || 0,
          Number((parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0)).toFixed(2),
          idx === 0 ? Number((po.items || []).reduce((s, r) => s + (parseFloat(r.qty) || 0) * (parseFloat(r.rate) || 0), 0)).toFixed(2) : "",
          idx === 0 ? Number(po.taxes || 0).toFixed(2) : "",
          idx === 0 ? Number(grand).toFixed(2) : "",
          idx === 0 ? po.refNo || "" : "",
          idx === 0 ? po.notes || "" : "",
          idx === 0 ? po.createdBy || "" : ""
        ]);
        if (idx === 0) poSl++;
      });
    });
    addSheet(
      wb,
      poRows,
      "PO Register",
      [5, 16, 12, 12, 10, 24, 18, 30, 28, 28, 12, 8, 8, 14, 16, 16, 14, 16, 14, 24, 20]
    );
    const custHdr = ["Sl.No", "Name", "Contact Person", "GSTIN", "PAN", "Address", "City", "State", "PIN", "Phone", "Email", "Payment Terms (days)", "Credit Limit (Rs.)", "Opening Balance (Rs.)", "Invoices (count)", "Total Invoiced (Rs.)", "Outstanding (Rs.)", "Notes", "Created Date"];
    const custRows = [custHdr, ...customers.map((c, i) => [
      i + 1,
      c.name || "",
      c.contact || "",
      (c.gstin || "").toUpperCase(),
      c.pan || "",
      c.address || "",
      c.city || "",
      c.state || "",
      c.pin || "",
      c.phone || "",
      c.email || "",
      c.terms || "",
      c.creditLimit || "",
      c.openingBal || "",
      invoices.filter((v) => {
        var _a;
        return (((_a = v.billTo) == null ? void 0 : _a.name) || "") === c.name;
      }).length,
      Number(invoices.filter((v) => {
        var _a;
        return (((_a = v.billTo) == null ? void 0 : _a.name) || "") === c.name && v.docType !== "CREDIT NOTE";
      }).reduce((a, v) => a + Math.abs(getGrand(v)), 0)).toFixed(2),
      Number(invoices.filter((v) => {
        var _a;
        return (((_a = v.billTo) == null ? void 0 : _a.name) || "") === c.name && v.status !== "Draft" && v.status !== "Cancelled" && v.status !== "Paid" && v.docType !== "CREDIT NOTE";
      }).reduce((a, v) => a + Math.abs(getGrand(v)) - invPaid(v), 0)).toFixed(2),
      c.notes || "",
      c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN") : ""
    ])];
    addSheet(wb, custRows, "Customer Database", [5, 24, 18, 18, 14, 28, 14, 14, 8, 14, 24, 12, 14, 14, 10, 16, 16, 24, 14]);
    const hsnHdr = ["Sl.No", "Type", "Code", "Description", "Category", "GST Rate %", "Default Unit"];
    const hsnRows = [hsnHdr, ...hsnList.map((h, i) => [i + 1, h.type || "HSN", h.code || "", h.desc || "", h.category || "", h.taxRate || "", h.unit || "Nos"])];
    addSheet(wb, hsnRows, "HSN-SAC Database", [5, 8, 12, 40, 18, 10, 10]);
    const allMonths = [.../* @__PURE__ */ new Set([
      ...invoices.map((i) => {
        var _a;
        return (_a = i.date) == null ? void 0 : _a.substring(0, 7);
      }).filter(Boolean),
      ...expenses.map((e) => {
        var _a;
        return (_a = e.date) == null ? void 0 : _a.substring(0, 7);
      }).filter(Boolean)
    ])].sort();
    const plHdr = ["Month", "Sales (Rs.)", "Total Tax Collected (Rs.)", "Purchases/Expenses (Rs.)", "Net Profit (Rs.)", "Sales Frozen", "Expenses Frozen"];
    const plRows = [plHdr, ...allMonths.map((m) => {
      const mInvs = invoices.filter((i) => {
        var _a;
        return (_a = i.date) == null ? void 0 : _a.startsWith(m);
      });
      const mExps = expenses.filter((e) => {
        var _a;
        return (_a = e.date) == null ? void 0 : _a.startsWith(m);
      });
      const mSales = mInvs.reduce((s, i) => s + getGrand(i), 0);
      const mTax = mInvs.reduce((s, i) => s + (parseFloat(i.totalGST) || 0), 0);
      const mExp = mExps.reduce((s, e) => s + (parseFloat(e.total) || 0), 0);
      const salesFrz = (freezeD.sales || []).includes(m) ? "Yes" : "No";
      const expFrz = (freezeD.expenses || []).includes(m) ? "Yes" : "No";
      return [m, mSales.toFixed(2), mTax.toFixed(2), mExp.toFixed(2), (mSales - mExp).toFixed(2), salesFrz, expFrz];
    })];
    addSheet(wb, plRows, "Period P&L Summary", [12, 16, 22, 22, 16, 12, 14]);
    const frzHdr = ["Month", "Sales Frozen", "Expenses Frozen"];
    const frzRows = [frzHdr, ...allMonths.map((m) => [
      m,
      (freezeD.sales || []).includes(m) ? " Frozen" : "Open",
      (freezeD.expenses || []).includes(m) ? " Frozen" : "Open"
    ])];
    if ((freezeD.sales || []).length > 0 || (freezeD.expenses || []).length > 0) {
      addSheet(wb, frzRows, "Frozen Periods", [12, 14, 16]);
    }
    if (auditLogs.length > 0) {
      const auditHdr = ["Timestamp", "Action", "Detail", "User Name", "User Email", "Date", "Time"];
      const auditRows = [auditHdr, ...(Array.isArray(auditLogs) ? auditLogs : Object.values(auditLogs)).map((l) => [
        new Date(l.ts).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        (l.action || "").replace(/_/g, " "),
        l.detail || "",
        l.userName || "",
        l.user || "",
        new Date(l.ts).toLocaleDateString("en-IN"),
        new Date(l.ts).toLocaleTimeString("en-IN")
      ])];
      addSheet(wb, auditRows, "Audit Log", [22, 20, 55, 20, 30, 14, 12]);
      const actCounts = {};
      (Array.isArray(auditLogs) ? auditLogs : Object.values(auditLogs)).forEach((l) => {
        const a = l.action || "UNKNOWN";
        actCounts[a] = (actCounts[a] || 0) + 1;
      });
      const actRows = [["Action", "Count"], ...Object.entries(actCounts).sort((a, b) => b[1] - a[1]).map(([a, c]) => [a.replace(/_/g, " "), c])];
      addSheet(wb, actRows, "Audit Summary", [30, 10]);
    }
    const termsRows = [["Type", "Terms & Conditions"], ["Invoice T&C", terms], ["PO T&C", poTerms]];
    addSheet(wb, termsRows, "Terms & Conditions", [14, 80]);
    XLSX2.writeFile(wb, `ArcticBooks_FullBackup_${dt}.xlsx`);
    toast.success(`Full backup downloaded \u2014 ${wb.SheetNames.length} sheets, ${invoices.length} invoices, ${expenses.length} expenses, ${pos.length} POs`);
  } catch (e) {
    console.error("Full backup error:", e);
    toast.error("Backup failed: " + (e.message || String(e)));
  }
};
const makeExcel = (invoices, fmt2 = "xlsx", meta = {}) => {
  const XLSX2 = window.XLSX;
  const wb = XLSX2.utils.book_new();
  const headers = [
    "Sl.No",
    "Document Type",
    "Invoice No",
    "Voucher No.",
    "Txn Ref No.",
    "Invoice Date",
    "Original Invoice No",
    "Original Invoice Date",
    "Sent to Customer",
    "Customer Name",
    "Customer GSTIN",
    "Customer State",
    "Bill To Address",
    "HSN/SAC",
    "Description",
    "Unit",
    "Qty",
    "Rate (Rs.)",
    "Discount %",
    "Taxable Amount (Rs.)",
    "GST Type",
    "Tax Rate %",
    "CGST %",
    "CGST Amount (Rs.)",
    "SGST %",
    "SGST Amount (Rs.)",
    "IGST %",
    "IGST Amount (Rs.)",
    "Total Tax (Rs.)",
    "Invoice Total (Rs.)",
    "Payment Status",
    "Due Date",
    "PO/Reference No",
    "Notes",
    "Created By"
  ];
  const rows = [...companyHeaderRows(), headers];
  let sl = 1;
  invoices.forEach((inv) => {
    const items = (inv.items || []).filter((r) => r.desc);
    const gt = inv.gstType || "INTRA";
    const isNG = inv.docType === "NON GST INVOICE";
    const dt = inv.isB2C ? "TAX INVOICE (B2C)" : isNG ? "NON-GST TRANSACTION" : inv.docType || "TAX INVOICE";
    const isCN = dt === "CREDIT NOTE";
    const sign = isCN ? -1 : 1;
    const isCDN = inv.docType === "CREDIT NOTE" || inv.docType === "DEBIT NOTE";
    items.forEach((r) => {
      var _a, _b, _c, _d, _e, _f, _g, _h;
      const tR = isNG ? 0 : parseFloat(r.taxRate) || 0;
      const tax = isNG ? 0 : parseFloat(r.taxable) || 0;
      const gst = isNG ? 0 : parseFloat(r.gstAmt) || 0;
      const lineTotal = isNG ? (parseFloat(r.qty) || 0) * (parseFloat(r.rate) || 0) : parseFloat(r.total) || 0;
      rows.push([
        sl++,
        dt,
        inv.invNo || "",
        inv.voucherNo || "",
        inv.txnRefNo || "",
        fmtDate(inv.date) || "",
        isCDN ? inv.origInvNo || "" : "",
        isCDN ? inv.origInvDate ? fmtDate(inv.origInvDate) : "" : "",
        inv.sentToCustomer ? "Yes" : "No",
        ((_a = inv.billTo) == null ? void 0 : _a.name) || "",
        (((_b = inv.billTo) == null ? void 0 : _b.gstin) || "").toUpperCase(),
        stateName((_c = inv.billTo) == null ? void 0 : _c.gstin) || ((_d = inv.billTo) == null ? void 0 : _d.state) || "",
        [(_e = inv.billTo) == null ? void 0 : _e.address, (_f = inv.billTo) == null ? void 0 : _f.city, (_g = inv.billTo) == null ? void 0 : _g.state, (_h = inv.billTo) == null ? void 0 : _h.pin].filter(Boolean).join(", "),
        isNG ? "" : r.hsnCode || "",
        r.desc || "",
        isNG ? "Nos" : r.unit || "Nos",
        r.qty || 1,
        r.rate || 0,
        isNG ? 0 : r.discount || 0,
        Number(sign * tax).toFixed(2),
        isNG ? "NON-GST" : gt,
        tR,
        isNG ? "" : gt === "INTRA" ? tR / 2 : "",
        isNG ? "" : gt === "INTRA" ? Number(sign * gst / 2).toFixed(2) : "",
        isNG ? "" : gt === "INTRA" ? tR / 2 : "",
        isNG ? "" : gt === "INTRA" ? Number(sign * gst / 2).toFixed(2) : "",
        isNG ? "" : gt !== "INTRA" ? tR : "",
        isNG ? "" : gt !== "INTRA" ? Number(sign * gst).toFixed(2) : "",
        isNG ? 0 : Number(sign * gst).toFixed(2),
        Number(isNG ? lineTotal : getGrand(inv)).toFixed(2),
        inv.status || "Sent",
        inv.dueDate ? fmtDate(inv.dueDate) : "",
        inv.poNo || "",
        inv.notes || "",
        inv.createdBy || ""
      ]);
    });
  });
  const ws = XLSX2.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 5 }, { wch: 20 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 13 }, { wch: 16 }, { wch: 16 }, { wch: 8 }, { wch: 22 }, { wch: 20 }, { wch: 16 }, { wch: 28 }, { wch: 12 }, { wch: 28 }, { wch: 8 }, { wch: 7 }, { wch: 12 }, { wch: 8 }, { wch: 18 }, { wch: 10 }, { wch: 9 }, { wch: 8 }, { wch: 16 }, { wch: 8 }, { wch: 16 }, { wch: 8 }, { wch: 16 }, { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 13 }, { wch: 14 }, { wch: 22 }, { wch: 20 }];
  XLSX2.utils.book_append_sheet(wb, ws, "Sales Register");
  const totals = {};
  invoices.forEach((inv) => {
    var _a;
    const isCN = inv.docType === "CREDIT NOTE", sign = isCN ? -1 : 1;
    const isB2C = inv.isB2C || false;
    const isNG = inv.docType === "NON GST INVOICE";
    (inv.items || []).filter((r) => r.desc).forEach((r) => {
      var _a2;
      const m2 = ((_a2 = inv.date) == null ? void 0 : _a2.substring(0, 7)) || "?";
      if (!totals[m2]) totals[m2] = { inv: 0, b2c: 0, cn: 0, dn: 0, ng: 0, taxable: 0, tax: 0, total: 0 };
      totals[m2].taxable += isNG ? 0 : sign * (parseFloat(r.taxable) || 0);
      totals[m2].tax += isNG ? 0 : sign * (parseFloat(r.gstAmt) || 0);
      totals[m2].total += isNG ? (parseFloat(r.qty) || 0) * (parseFloat(r.rate) || 0) : sign * (parseFloat(r.total) || 0);
    });
    const m = ((_a = inv.date) == null ? void 0 : _a.substring(0, 7)) || "?";
    if (!totals[m]) totals[m] = { inv: 0, b2c: 0, cn: 0, dn: 0, ng: 0, taxable: 0, tax: 0, total: 0 };
    if (isCN) totals[m].cn++;
    else if (inv.docType === "DEBIT NOTE") totals[m].dn++;
    else if (isNG) totals[m].ng++;
    else if (isB2C) totals[m].b2c++;
    else totals[m].inv++;
  });
  const summRows = [
    ["Month", "B2B Invoices", "B2C Invoices", "Non-GST", "Debit Notes", "Credit Notes", "Net Taxable (Rs.)", "Net Tax (Rs.)", "Net Total (Rs.)"],
    ...Object.entries(totals).sort().map(([m, v]) => [m, v.inv, v.b2c, v.ng, v.dn, v.cn, Number(v.taxable).toFixed(2), Number(v.tax).toFixed(2), Number(v.total).toFixed(2)])
  ];
  const ws2 = XLSX2.utils.aoa_to_sheet(summRows);
  ws2["!cols"] = [{ wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 18 }, { wch: 18 }];
  XLSX2.utils.book_append_sheet(wb, ws2, "Monthly Summary");
  proExport(fmt2, {
    ...proWbToSpec(wb, { title: "Sales Register", period: meta.period || "" }),
    pdfSheets: fmt2 === "pdf" ? [{ name: "Sales Register", aoa: regSalesPdf(invoices), h0: true }, { name: "Monthly Summary", aoa: summRows, h0: true }] : void 0
  }, `SalesRegister_${today()}`);
};
