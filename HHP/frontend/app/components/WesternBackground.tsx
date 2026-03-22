"use client";

import { useEffect, useState } from "react";

// ── CSS injected once into <head> ────────────────────────────────────────────
const BG_CSS = `
@keyframes vintagePan {
  0%   { transform: scale(1.06) translate(-10px,  2px); }
  20%  { transform: scale(1.10) translate(  7px, -4px); }
  40%  { transform: scale(1.12) translate( -8px,  5px); }
  60%  { transform: scale(1.09) translate( 10px, -3px); }
  80%  { transform: scale(1.07) translate( -6px,  3px); }
  100% { transform: scale(1.06) translate(-10px,  2px); }
}
@keyframes filmFlicker {
  0%,100%{ opacity:1;    }  2%{ opacity:.96; }  4%{ opacity:1;    }
  7%     { opacity:.93; }  9%{ opacity:.97; } 14%{ opacity:.95; }
  18%    { opacity:1;    } 23%{ opacity:.94; } 29%{ opacity:.98; }
  35%    { opacity:.91; } 41%{ opacity:.97; } 48%{ opacity:.94; }
  55%    { opacity:1;    } 63%{ opacity:.96; } 72%{ opacity:.93; }
  80%    { opacity:.97; } 88%{ opacity:.95; } 95%{ opacity:1;    }
}
@keyframes grainShift {
  0%  { transform:translate(0,0);       } 20%{ transform:translate(-48px,-28px); }
  40% { transform:translate(32px,38px); } 60%{ transform:translate(-18px,12px);  }
  80% { transform:translate(22px,-18px);} 100%{ transform:translate(0,0);        }
}
@keyframes filmScratch {
  0%,85%{ opacity:0; left:30%; width:1px; }
  87%   { opacity:.35; left:22%; width:1px; }
  89%   { opacity:0;   left:22%; }
  91%   { opacity:0;   left:64%; width:2px; }
  93%   { opacity:.22; left:64%; width:2px; }
  95%   { opacity:0;   left:64%; }
  97%   { opacity:.28; left:45%; width:1px; }
  99%   { opacity:0;   left:45%; }
}
@keyframes burnPulse {
  0%,100%{ opacity:.14; } 50%{ opacity:.22; }
}
@keyframes jitter {
  0%,100%{ transform:translateX(0);     }
  10%    { transform:translateX(0.6px); }
  30%    { transform:translateX(-0.4px);}
  50%    { transform:translateX(0.8px); }
  70%    { transform:translateX(-0.5px);}
  90%    { transform:translateX(0.3px); }
}
`;

// ── Shared sky gradient helper ────────────────────────────────────────────────
type Grad = { id: string; stops: [string, string, string, string] };
function SkyGrad({ g }: { g: Grad }) {
  return (
    <linearGradient id={g.id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stopColor={g.stops[0]} />
      <stop offset="35%"  stopColor={g.stops[1]} />
      <stop offset="70%"  stopColor={g.stops[2]} />
      <stop offset="100%" stopColor={g.stops[3]} />
    </linearGradient>
  );
}
const DUSK: Grad  = { id:"dusk",  stops:["#1A0600","#6B2800","#A04818","#C86828"] };
const AMBER: Grad = { id:"amber", stops:["#1F0800","#8B3A00","#C06020","#E08040"] };
const BLOOD: Grad = { id:"blood", stops:["#120000","#6B1800","#9B3010","#C05020"] };
const NIGHT: Grad = { id:"night", stops:["#04010A","#080310","#110618","#1A0808"] };
const DUSK2: Grad = { id:"dusk2", stops:["#150410","#5C1A20","#9B3828","#C06030"] };

const SZ = { width:"100%", height:"100%", preserveAspectRatio:"xMidYMid slice" } as const;
const VB = "0 0 1440 900";

// ── SCENE 1 — The Wagon Train ─────────────────────────────────────────────────
function Scene1() {
  return (
    <svg viewBox={VB} xmlns="http://www.w3.org/2000/svg" {...SZ}>
      <defs><SkyGrad g={DUSK}/></defs>
      <rect width="1440" height="900" fill="url(#dusk)"/>
      <rect y="730" width="1440" height="170" fill="#0E0400"/>
      <rect y="718" width="1440" height="18" fill="#1A0800"/>
      {/* Distant ridge */}
      <polygon points="0,680 140,560 280,620 440,520 600,590 760,500 920,565 1080,490 1240,545 1440,510 1440,730 0,730" fill="#130500" opacity="0.85"/>
      {/* Mesa 1 */}
      <polygon points="60,620 40,730 360,730 360,648 318,602 250,582 160,584" fill="#0E0400"/>
      {/* Mesa 2 */}
      <polygon points="500,570 480,730 820,730 820,600 778,558 700,540 610,544" fill="#0D0400"/>
      {/* Mesa 3 */}
      <polygon points="1000,590 978,730 1280,730 1280,618 1238,576 1160,560 1076,564" fill="#0E0400"/>
      {/* Wagon 1 */}
      <g fill="#0B0300" transform="translate(140,640)">
        <path d="M0,28 Q55,-22 110,28 L110,80 L0,80 Z"/>
        <rect x="0" y="28" width="110" height="55" rx="3"/>
        <circle cx="18" cy="90" r="22" fill="none" stroke="#0B0300" strokeWidth="5"/>
        <circle cx="92" cy="90" r="22" fill="none" stroke="#0B0300" strokeWidth="5"/>
        <line x1="18" y1="68" x2="18" y2="112" stroke="#0B0300" strokeWidth="2"/>
        <line x1="-4" y1="90" x2="40" y2="90" stroke="#0B0300" strokeWidth="2"/>
        <ellipse cx="-36" cy="72" rx="32" ry="11"/>
        <ellipse cx="-80" cy="70" rx="28" ry="10"/>
        <ellipse cx="-2" cy="52" rx="11" ry="7" transform="rotate(-12,-2,52)"/>
      </g>
      {/* Wagon 2 */}
      <g fill="#0A0200" transform="translate(480,648)">
        <path d="M0,24 Q50,-16 100,24 L100,75 L0,75 Z"/>
        <rect x="0" y="24" width="100" height="52" rx="3"/>
        <circle cx="16" cy="82" r="20" fill="none" stroke="#0A0200" strokeWidth="4"/>
        <circle cx="84" cy="82" r="20" fill="none" stroke="#0A0200" strokeWidth="4"/>
        <ellipse cx="-32" cy="64" rx="28" ry="10"/>
        <ellipse cx="-68" cy="62" rx="24" ry="9"/>
      </g>
      {/* Wagon 3 */}
      <g fill="#090200" transform="translate(850,655)">
        <path d="M0,20 Q44,-14 88,20 L88,68 L0,68 Z"/>
        <rect x="0" y="20" width="88" height="50" rx="3"/>
        <circle cx="14" cy="75" r="18" fill="none" stroke="#090200" strokeWidth="4"/>
        <circle cx="74" cy="75" r="18" fill="none" stroke="#090200" strokeWidth="4"/>
        <ellipse cx="-28" cy="58" rx="25" ry="9"/>
      </g>
    </svg>
  );
}

// ── SCENE 2 — Frontier Town Main Street ──────────────────────────────────────
function Scene2() {
  return (
    <svg viewBox={VB} xmlns="http://www.w3.org/2000/svg" {...SZ}>
      <defs><SkyGrad g={BLOOD}/></defs>
      <rect width="1440" height="900" fill="url(#blood)"/>
      <rect y="700" width="1440" height="200" fill="#0E0400"/>
      <rect y="690" width="1440" height="16" fill="#150500"/>
      <rect y="680" width="1440" height="16" fill="#120400"/>
      {/* Saloon (center, tallest) */}
      <g fill="#09020A">
        <rect x="380" y="340" width="210" height="350"/>
        <rect x="366" y="268" width="238" height="82"/>
        <path d="M370,268 Q484,210 610,268 L596,268 Q484,228 384,268 Z"/>
        <rect x="395" y="390" width="52" height="65" fill="#1A0808"/>
        <rect x="490" y="390" width="52" height="65" fill="#1A0808"/>
        <rect x="430" y="560" width="50" height="140" rx="2"/>
        <rect x="372" y="590" width="8" height="110" fill="#09020A"/>
        <rect x="580" y="590" width="8" height="110" fill="#09020A"/>
      </g>
      {/* Sheriff's Office (left) */}
      <g fill="#08020A">
        <rect x="80" y="440" width="170" height="260"/>
        <rect x="68" y="368" width="194" height="80"/>
        <rect x="95" y="480" width="44" height="56" fill="#160606"/>
        <rect x="175" y="480" width="44" height="56" fill="#160606"/>
        <rect x="130" y="558" width="44" height="142" rx="2"/>
      </g>
      {/* General Store (right of saloon) */}
      <g fill="#070109">
        <rect x="618" y="420" width="180" height="280"/>
        <rect x="606" y="350" width="204" height="78"/>
        <rect x="630" y="460" width="48" height="58" fill="#140506"/>
        <rect x="716" y="460" width="48" height="58" fill="#140506"/>
        <rect x="668" y="565" width="52" height="135" rx="2"/>
      </g>
      {/* Livery Stable (far right) */}
      <g fill="#070108">
        <rect x="1050" y="420" width="230" height="280"/>
        <rect x="1038" y="340" width="254" height="88"/>
        <path d="M1044,340 Q1164,278 1284,340 Z"/>
        <rect x="1110" y="510" width="80" height="190" rx="4"/>
      </g>
      {/* Narrow building far right */}
      <g fill="#060107">
        <rect x="1320" y="460" width="120" height="240"/>
        <rect x="1308" y="392" width="144" height="74"/>
        <rect x="1330" y="500" width="38" height="48" fill="#130505"/>
        <rect x="1390" y="500" width="38" height="48" fill="#130505"/>
      </g>
      {/* Horse + hitching post */}
      <g fill="#060100" transform="translate(460,590)">
        <ellipse cx="50" cy="52" rx="46" ry="14"/>
        <rect x="78" y="30" width="10" height="32" rx="5" transform="rotate(-18,83,46)"/>
        <ellipse cx="90" cy="26" rx="13" ry="8" transform="rotate(-18,90,26)"/>
        <rect x="4" y="62" width="8" height="40" rx="3"/>
        <rect x="22" y="62" width="8" height="44" rx="3"/>
        <rect x="60" y="62" width="8" height="44" rx="3"/>
        <rect x="78" y="62" width="8" height="38" rx="3"/>
      </g>
      <rect x="516" y="614" width="6" height="86" fill="#060100"/>
      <rect x="500" y="622" width="38" height="6" rx="3" fill="#060100"/>
      {/* People */}
      <g fill="#050100">
        <ellipse cx="300" cy="688" rx="9" ry="11"/>
        <rect x="294" y="664" width="12" height="26" rx="3"/>
        <rect x="290" y="658" width="20" height="8" rx="2"/>
        <ellipse cx="820" cy="686" rx="9" ry="11"/>
        <rect x="814" y="662" width="12" height="26" rx="3"/>
        <rect x="810" y="656" width="20" height="8" rx="2"/>
        <ellipse cx="870" cy="687" rx="8" ry="10"/>
        <rect x="864" y="665" width="11" height="24" rx="3"/>
        <rect x="860" y="659" width="18" height="7" rx="2"/>
      </g>
      {/* Tumbleweed */}
      <g fill="none" stroke="#1A0808" strokeWidth="2.5" transform="translate(960,662)">
        <circle cx="18" cy="18" r="18"/>
        <line x1="0" y1="18" x2="36" y2="18"/>
        <line x1="18" y1="0" x2="18" y2="36"/>
        <line x1="5" y1="5" x2="31" y2="31"/>
        <line x1="31" y1="5" x2="5" y2="31"/>
      </g>
    </svg>
  );
}

// ── SCENE 3 — The Solitary Saguaro ───────────────────────────────────────────
function Scene3() {
  return (
    <svg viewBox={VB} xmlns="http://www.w3.org/2000/svg" {...SZ}>
      <defs><SkyGrad g={AMBER}/></defs>
      <rect width="1440" height="900" fill="url(#amber)"/>
      <rect y="750" width="1440" height="150" fill="#0E0400"/>
      <rect y="738" width="1440" height="18" fill="#1A0800"/>
      {/* Distant mesa */}
      <polygon points="0,620 100,510 220,555 380,478 540,535 680,492 820,545 960,500 1100,540 1260,490 1440,520 1440,750 0,750" fill="#130500" opacity="0.8"/>
      {/* Large saguaro */}
      <g fill="#0A0300">
        <rect x="545" y="260" width="52" height="490" rx="26"/>
        <rect x="428" y="368" width="120" height="38" rx="19"/>
        <rect x="418" y="268" width="38" height="120" rx="19"/>
        <rect x="593" y="418" width="112" height="36" rx="18"/>
        <rect x="664" y="338" width="36" height="115" rx="18"/>
      </g>
      {/* Rider on horse */}
      <g fill="#080200" transform="translate(960,622)">
        <ellipse cx="55" cy="60" rx="56" ry="17"/>
        <rect x="84" y="34" width="12" height="38" rx="6" transform="rotate(-20,90,53)"/>
        <ellipse cx="100" cy="29" rx="16" ry="10" transform="rotate(-20,100,29)"/>
        <rect x="6" y="72" width="9" height="44" rx="4"/>
        <rect x="24" y="72" width="9" height="50" rx="4"/>
        <rect x="66" y="72" width="9" height="50" rx="4"/>
        <rect x="84" y="72" width="9" height="42" rx="4"/>
        <ellipse cx="42" cy="44" rx="11" ry="16"/>
        <circle cx="42" cy="26" r="9"/>
        <rect x="29" y="18" width="26" height="6" rx="3"/>
        <rect x="32" y="5" width="20" height="15" rx="4"/>
      </g>
      {/* Joshua tree */}
      <g fill="#090200" transform="translate(1230,530)">
        <rect x="15" y="90" width="22" height="220" rx="5"/>
        <rect x="-12" y="68" width="28" height="16" rx="8" transform="rotate(-32,-2,76)"/>
        <rect x="-28" y="22" width="22" height="14" rx="7" transform="rotate(-10,-17,29)"/>
        <rect x="32" y="58" width="28" height="16" rx="8" transform="rotate(28,46,66)"/>
        <rect x="36" y="12" width="22" height="14" rx="7" transform="rotate(18,47,19)"/>
        <polygon points="-28,22 -20,0 -10,22" fill="#090200"/>
        <polygon points="-14,22 -6,2 4,22" fill="#090200"/>
        <polygon points="32,12 40,-8 48,12" fill="#090200"/>
        <polygon points="46,14 54,-6 62,14" fill="#090200"/>
      </g>
      {/* Small cactus left */}
      <g fill="#080200">
        <rect x="200" y="605" width="24" height="145" rx="12"/>
        <rect x="156" y="645" width="46" height="20" rx="10"/>
        <rect x="154" y="628" width="20" height="38" rx="10"/>
        <rect x="222" y="668" width="42" height="18" rx="9"/>
        <rect x="242" y="654" width="18" height="32" rx="9"/>
      </g>
    </svg>
  );
}

// ── SCENE 4 — Desert Rides ────────────────────────────────────────────────────
function Scene4() {
  return (
    <svg viewBox={VB} xmlns="http://www.w3.org/2000/svg" {...SZ}>
      <defs>
        <linearGradient id="s4sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1A0600"/>
          <stop offset="30%"  stopColor="#7B3200"/>
          <stop offset="60%"  stopColor="#B85818"/>
          <stop offset="100%" stopColor="#D87030"/>
        </linearGradient>
      </defs>
      <rect width="1440" height="900" fill="url(#s4sky)"/>
      <rect y="680" width="1440" height="220" fill="#0E0400"/>
      <rect y="668" width="1440" height="20" fill="#180600"/>
      {/* Flat horizon ridge */}
      <polygon points="0,650 200,600 400,630 600,590 800,620 1000,585 1200,615 1440,595 1440,680 0,680" fill="#120400" opacity="0.9"/>
      {/* Galloping horse + rider */}
      <g fill="#0A0200" transform="translate(340,520)">
        {/* Body - stretched galloping */}
        <ellipse cx="120" cy="100" rx="100" ry="22"/>
        {/* Neck angled forward */}
        <rect x="190" y="58" width="14" height="55" rx="7" transform="rotate(-25,197,85)"/>
        {/* Head */}
        <ellipse cx="218" cy="50" rx="20" ry="12" transform="rotate(-25,218,50)"/>
        {/* Mane */}
        <path d="M178,55 Q192,40 206,52" fill="none" stroke="#080100" strokeWidth="5" strokeLinecap="round"/>
        {/* Tail */}
        <path d="M20,92 Q-20,60 -10,40" fill="none" stroke="#080100" strokeWidth="8" strokeLinecap="round"/>
        {/* Front legs stretched forward */}
        <rect x="175" y="115" width="10" height="55" rx="5" transform="rotate(-35,180,142)"/>
        <rect x="155" y="118" width="10" height="55" rx="5" transform="rotate(-20,160,145)"/>
        {/* Back legs stretched back */}
        <rect x="38" y="115" width="10" height="55" rx="5" transform="rotate(30,43,142)"/>
        <rect x="18" y="112" width="10" height="55" rx="5" transform="rotate(45,23,139)"/>
        {/* Rider body */}
        <ellipse cx="100" cy="80" rx="14" ry="20"/>
        {/* Rider head */}
        <circle cx="100" cy="58" r="11"/>
        {/* Cowboy hat - tilted back from speed */}
        <rect x="84" y="48" width="32" height="7" rx="3"/>
        <rect x="88" y="35" width="24" height="16" rx="5"/>
        {/* Lasso / arm forward */}
        <path d="M110,70 Q145,55 160,65" fill="none" stroke="#080100" strokeWidth="4" strokeLinecap="round"/>
      </g>
      {/* Dust cloud at hooves */}
      <g fill="#180800" opacity="0.5">
        <ellipse cx="400" cy="695" rx="90" ry="18"/>
        <ellipse cx="360" cy="690" rx="60" ry="14"/>
        <ellipse cx="450" cy="698" rx="70" ry="16"/>
        <ellipse cx="320" cy="692" rx="45" ry="12"/>
      </g>
      {/* Long shadow */}
      <ellipse cx="490" cy="702" rx="130" ry="10" fill="#080200" opacity="0.4"/>
      {/* Faint riders in distance */}
      <ellipse cx="1100" cy="670" rx="30" ry="9" fill="#080200" opacity="0.6"/>
      <ellipse cx="1160" cy="668" rx="28" ry="9" fill="#080200" opacity="0.5"/>
      <ellipse cx="1220" cy="671" rx="26" ry="8" fill="#080200" opacity="0.4"/>
    </svg>
  );
}

// ── SCENE 5 — Campfire Stories ────────────────────────────────────────────────
function Scene5() {
  return (
    <svg viewBox={VB} xmlns="http://www.w3.org/2000/svg" {...SZ}>
      <defs>
        <SkyGrad g={NIGHT}/>
        <radialGradient id="fireGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#C05010" stopOpacity="0.55"/>
          <stop offset="60%"  stopColor="#801800" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#400800" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1440" height="900" fill="url(#night)"/>
      <rect y="720" width="1440" height="180" fill="#080200"/>
      <rect y="710" width="1440" height="16" fill="#0E0300"/>
      {/* Stars */}
      {[
        [120,80],[250,120],[400,60],[560,95],[720,45],[880,80],[1040,55],
        [1180,100],[1320,70],[1420,110],[180,160],[640,140],[1000,130],
        [300,40],[820,160],[1100,85],[460,175],[1260,50],[90,145],[750,30],
      ].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r={i%4===0?2.5:1.5} fill="#C8A060" opacity={0.4+Math.random()*0.3}/>
      ))}
      {/* Crescent moon */}
      <g transform="translate(1180,80)">
        <circle cx="0" cy="0" r="42" fill="#C8A040" opacity="0.25"/>
        <circle cx="14" cy="-6" r="36" fill="#04010A" opacity="0.95"/>
      </g>
      {/* Fire glow on ground */}
      <ellipse cx="720" cy="730" rx="260" ry="80" fill="url(#fireGlow)"/>
      {/* Campfire */}
      <g transform="translate(680,680)">
        {/* Logs */}
        <rect x="0" y="30" width="80" height="10" rx="5" fill="#0E0300" transform="rotate(-25,40,35)"/>
        <rect x="20" y="28" width="80" height="10" rx="5" fill="#0E0300" transform="rotate(20,60,33)"/>
        {/* Flames */}
        <path d="M30,28 Q40,0 50,28 Q55,10 60,28 Q50,18 45,28 Z" fill="#B04010" opacity="0.9"/>
        <path d="M35,28 Q45,-8 55,28 Q60,5 65,28 Q55,15 50,28 Z" fill="#C85010" opacity="0.8"/>
        <path d="M38,28 Q48,-14 58,28 Q48,12 43,28 Z" fill="#E07020" opacity="0.6"/>
      </g>
      {/* Seated figures (4) around fire */}
      <g fill="#060100">
        {/* Figure left */}
        <g transform="translate(490,665)">
          <ellipse cx="0" cy="0" rx="18" ry="22"/>
          <circle cx="0" cy="-26" r="11"/>
          <rect x="-8" y="-18" width="22" height="7" rx="3"/>
        </g>
        {/* Figure far left */}
        <g transform="translate(560,655)">
          <ellipse cx="0" cy="0" rx="16" ry="20"/>
          <circle cx="0" cy="-24" r="10"/>
          <rect x="-7" y="-17" width="20" height="6" rx="3"/>
        </g>
        {/* Figure right */}
        <g transform="translate(870,665)">
          <ellipse cx="0" cy="0" rx="18" ry="22"/>
          <circle cx="0" cy="-26" r="11"/>
          <rect x="-8" y="-18" width="22" height="7" rx="3"/>
        </g>
        {/* Figure back */}
        <g transform="translate(730,640)">
          <ellipse cx="0" cy="0" rx="14" ry="18"/>
          <circle cx="0" cy="-22" r="9"/>
          <rect x="-6" y="-15" width="18" height="6" rx="3"/>
        </g>
      </g>
      {/* Horses in background */}
      <g fill="#050100" opacity="0.5">
        <ellipse cx="300" cy="710" rx="44" ry="12"/>
        <ellipse cx="1100" cy="712" rx="40" ry="11"/>
      </g>
    </svg>
  );
}

// ── SCENE 6 — Boot Hill Cemetery (NEW) ───────────────────────────────────────
function Scene6() {
  return (
    <svg viewBox={VB} xmlns="http://www.w3.org/2000/svg" {...SZ}>
      <defs><SkyGrad g={DUSK2}/></defs>
      <rect width="1440" height="900" fill="url(#dusk2)"/>
      <rect y="720" width="1440" height="180" fill="#0E0300"/>
      <rect y="710" width="1440" height="16" fill="#150404"/>
      {/* Full moon */}
      <circle cx="1100" cy="140" r="70" fill="#C8A040" opacity="0.22"/>
      <circle cx="1100" cy="140" r="66" fill="#C8A040" opacity="0.12"/>
      {/* Distant hills */}
      <polygon points="0,680 160,560 320,620 500,530 680,600 860,520 1040,580 1200,510 1380,555 1440,540 1440,720 0,720" fill="#120304" opacity="0.9"/>
      {/* Gnarled bare tree (left) */}
      <g fill="#0C0202" opacity="0.85">
        <rect x="160" y="380" width="18" height="340" rx="5"/>
        <rect x="140" y="400" width="62" height="12" rx="6" transform="rotate(-40,140,406)"/>
        <rect x="100" y="360" width="14" height="52" rx="7" transform="rotate(-40,107,386)"/>
        <rect x="178" y="390" width="58" height="12" rx="6" transform="rotate(38,178,396)"/>
        <rect x="226" y="345" width="14" height="60" rx="7" transform="rotate(42,233,375)"/>
        <rect x="130" y="460" width="45" height="10" rx="5" transform="rotate(-20,130,465)"/>
        <rect x="178" y="470" width="40" height="10" rx="5" transform="rotate(22,178,475)"/>
        <rect x="168" y="520" width="35" height="10" rx="5" transform="rotate(-38,168,525)"/>
        <rect x="168" y="520" width="35" height="10" rx="5" transform="rotate(38,168,525)"/>
      </g>
      {/* Grave crosses */}
      {[
        { x:380, y:640, a: -8 }, { x:520, y:650, a:5 }, { x:660, y:638, a:-3 },
        { x:790, y:655, a:10 }, { x:920, y:642, a:-6 }, { x:1050, y:648, a:4 },
        { x:450, y:685, a:3 }, { x:850, y:680, a:-5 },
      ].map(({ x, y, a }, i) => (
        <g key={i} fill="#0A0202" transform={`translate(${x},${y}) rotate(${a})`}>
          <rect x="-4" y="-50" width="8" height="100" rx="3"/>
          <rect x="-22" y="-28" width="44" height="8" rx="3"/>
        </g>
      ))}
      {/* Tumbleweeds */}
      <g fill="none" stroke="#1C0404" strokeWidth="2.5">
        <g transform="translate(300,695)">
          <circle cx="16" cy="16" r="16"/>
          <line x1="0" y1="16" x2="32" y2="16"/>
          <line x1="16" y1="0" x2="16" y2="32"/>
          <line x1="5" y1="5" x2="27" y2="27"/>
          <line x1="27" y1="5" x2="5" y2="27"/>
        </g>
        <g transform="translate(1150,700)">
          <circle cx="12" cy="12" r="12"/>
          <line x1="0" y1="12" x2="24" y2="12"/>
          <line x1="12" y1="0" x2="12" y2="24"/>
        </g>
      </g>
      {/* Lone rider departing */}
      <g fill="#060100" opacity="0.7" transform="translate(1240,665)">
        <ellipse cx="35" cy="36" rx="34" ry="10"/>
        <circle cx="54" cy="18" r="7"/>
        <ellipse cx="26" cy="28" rx="8" ry="11"/>
        <rect x="47" y="22" width="6" height="19" rx="3" transform="rotate(-18,50,31)"/>
        <ellipse cx="54" cy="14" rx="9" ry="5" transform="rotate(-18,54,14)"/>
      </g>
    </svg>
  );
}

// ── SCENE 7 — The Saloon Night (NEW) ─────────────────────────────────────────
function Scene7() {
  return (
    <svg viewBox={VB} xmlns="http://www.w3.org/2000/svg" {...SZ}>
      <defs>
        <linearGradient id="s7sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#02010A"/>
          <stop offset="40%"  stopColor="#0A0320"/>
          <stop offset="80%"  stopColor="#1A0810"/>
          <stop offset="100%" stopColor="#280C08"/>
        </linearGradient>
        <radialGradient id="lanternL" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#C06820" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#C06820" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1440" height="900" fill="url(#s7sky)"/>
      <rect y="700" width="1440" height="200" fill="#080200"/>
      <rect y="690" width="1440" height="16" fill="#0E0300"/>
      {/* Stars */}
      {[80,180,300,420,560,680,820,960,1100,1240,1380].map((x,i)=>(
        <circle key={i} cx={x} cy={40+i*12} r={1.5} fill="#C8A060" opacity="0.3"/>
      ))}
      {/* Side buildings */}
      <rect x="0"    y="480" width="220" height="220" fill="#05010A"/>
      <rect x="1220" y="500" width="220" height="200" fill="#04010A"/>
      {/* Grand Saloon facade */}
      <g fill="#06010A">
        <rect x="320" y="300" width="800" height="400"/>
        {/* Ornate false front */}
        <rect x="300" y="220" width="840" height="90"/>
        {/* Grand arch at top */}
        <path d="M300,220 Q720,120 1140,220 L1120,220 Q720,140 320,220 Z" fill="#050109"/>
        {/* Decorative crown */}
        <polygon points="720,120 680,220 760,220"/>
        {/* Windows upper floor */}
        {[380,520,660,800,940].map((x,i)=>(
          <rect key={i} x={x} y="340" width="60" height="80" rx="4" fill="#140508"/>
        ))}
        {/* Porch columns */}
        {[340,480,620,760,900,1060,1100].map((x,i)=>(
          <rect key={i} x={x} y="560" width="10" height="145" fill="#050108"/>
        ))}
        {/* Porch rail */}
        <rect x="330" y="640" width="780" height="10" rx="3" fill="#050108"/>
        {/* Bat-wing doors */}
        <rect x="655" y="580" width="55" height="125" rx="4" fill="#0A0310" transform="rotate(-8,682,642)"/>
        <rect x="730" y="580" width="55" height="125" rx="4" fill="#0A0310" transform="rotate(8,757,642)"/>
        {/* Sign */}
        <rect x="560" y="262" width="320" height="50" rx="4" fill="#050108"/>
      </g>
      {/* Lantern glows */}
      <ellipse cx="380" cy="595" rx="55" ry="45" fill="url(#lanternL)"/>
      <ellipse cx="1060" cy="595" rx="55" ry="45" fill="url(#lanternL)"/>
      {/* Horse at post */}
      <g fill="#040100" transform="translate(180,620)">
        <ellipse cx="40" cy="44" rx="40" ry="12"/>
        <rect x="62" y="24" width="9" height="30" rx="4" transform="rotate(-18,66,39)"/>
        <ellipse cx="74" cy="20" rx="12" ry="7" transform="rotate(-18,74,20)"/>
        <rect x="4" y="52" width="7" height="36" rx="3"/>
        <rect x="18" y="52" width="7" height="40" rx="3"/>
        <rect x="50" y="52" width="7" height="40" rx="3"/>
        <rect x="64" y="52" width="7" height="34" rx="3"/>
      </g>
    </svg>
  );
}

// ── SCENE 8 — The Showdown (NEW) ─────────────────────────────────────────────
function Scene8() {
  return (
    <svg viewBox={VB} xmlns="http://www.w3.org/2000/svg" {...SZ}>
      <defs>
        <linearGradient id="s8sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1A0200"/>
          <stop offset="30%"  stopColor="#6B1800"/>
          <stop offset="65%"  stopColor="#B04010"/>
          <stop offset="100%" stopColor="#D86020"/>
        </linearGradient>
      </defs>
      <rect width="1440" height="900" fill="url(#s8sky)"/>
      <rect y="680" width="1440" height="220" fill="#0E0300"/>
      <rect y="668" width="1440" height="18" fill="#160400"/>
      {/* Main street perspective lines */}
      <polygon points="0,668 560,668 720,900 0,900" fill="#0A0200" opacity="0.3"/>
      <polygon points="1440,668 880,668 720,900 1440,900" fill="#0A0200" opacity="0.3"/>
      {/* Buildings left side */}
      <g fill="#06010A">
        <rect x="0"   y="420" width="180" height="260"/>
        <rect x="0"   y="350" width="200" height="78"/>
        <rect x="200" y="440" width="160" height="240"/>
        <rect x="188" y="365" width="184" height="82"/>
      </g>
      {/* Buildings right side */}
      <g fill="#060109">
        <rect x="1260" y="420" width="180" height="260"/>
        <rect x="1240" y="350" width="200" height="78"/>
        <rect x="1080" y="440" width="165" height="240"/>
        <rect x="1068" y="362" width="188" height="84"/>
      </g>
      {/* Gunfighter LEFT — low crouch, hand near holster */}
      <g fill="#080100" transform="translate(260,540)">
        <ellipse cx="0" cy="58" rx="14" ry="20"/>
        <circle cx="0" cy="36" r="10"/>
        <rect x="-6" y="28" width="18" height="6" rx="2"/>
        <rect x="-2" y="30" width="14" height="14" rx="3"/>
        {/* Arm reaching for gun */}
        <rect x="8" y="52" width="28" height="7" rx="3" transform="rotate(15,22,55)"/>
        {/* Legs spread, crouching */}
        <rect x="-8" y="74" width="9" height="48" rx="4" transform="rotate(-12,-3,98)"/>
        <rect x="4" y="74" width="9" height="48" rx="4" transform="rotate(14,8,98)"/>
      </g>
      {/* Gunfighter RIGHT — mirror stance */}
      <g fill="#070100" transform="translate(1150,540) scale(-1,1)">
        <ellipse cx="0" cy="58" rx="14" ry="20"/>
        <circle cx="0" cy="36" r="10"/>
        <rect x="-6" y="28" width="18" height="6" rx="2"/>
        <rect x="-2" y="30" width="14" height="14" rx="3"/>
        <rect x="8" y="52" width="28" height="7" rx="3" transform="rotate(15,22,55)"/>
        <rect x="-8" y="74" width="9" height="48" rx="4" transform="rotate(-12,-3,98)"/>
        <rect x="4" y="74" width="9" height="48" rx="4" transform="rotate(14,8,98)"/>
      </g>
      {/* Long shadows stretching toward each other */}
      <ellipse cx="340" cy="685" rx="120" ry="8" fill="#040100" opacity="0.4"/>
      <ellipse cx="1100" cy="685" rx="120" ry="8" fill="#040100" opacity="0.4"/>
      {/* Tumbleweed center */}
      <g fill="none" stroke="#1C0404" strokeWidth="2.5" transform="translate(700,652)">
        <circle cx="20" cy="20" r="20"/>
        <line x1="0" y1="20" x2="40" y2="20"/>
        <line x1="20" y1="0" x2="20" y2="40"/>
        <line x1="6" y1="6" x2="34" y2="34"/>
        <line x1="34" y1="6" x2="6" y2="34"/>
      </g>
    </svg>
  );
}

// ── SCENE 9 — The Canyon Pass (NEW) ──────────────────────────────────────────
function Scene9() {
  return (
    <svg viewBox={VB} xmlns="http://www.w3.org/2000/svg" {...SZ}>
      <defs>
        <linearGradient id="s9sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1A0600"/>
          <stop offset="50%"  stopColor="#8B3800"/>
          <stop offset="100%" stopColor="#C06030"/>
        </linearGradient>
      </defs>
      <rect width="1440" height="900" fill="#0A0200"/>
      {/* Narrow strip of sky between canyon walls */}
      <rect x="400" y="0" width="640" height="500" fill="url(#s9sky)"/>
      {/* Canyon wall LEFT - massive */}
      <polygon points="0,0 460,0 460,200 420,350 380,480 340,600 300,700 260,780 220,840 180,880 0,900" fill="#0C0300"/>
      <polygon points="0,0 380,0 380,150 340,280 300,420 260,560 220,660 180,750 140,830 100,880 0,900" fill="#090200"/>
      {/* Canyon wall RIGHT - massive */}
      <polygon points="1440,0 980,0 980,200 1020,350 1060,480 1100,600 1140,700 1180,780 1220,840 1260,880 1440,900" fill="#0C0300"/>
      <polygon points="1440,0 1060,0 1060,150 1100,280 1140,420 1180,560 1220,660 1260,750 1300,830 1340,880 1440,900" fill="#090200"/>
      {/* Canyon floor */}
      <polygon points="300,900 400,750 500,650 620,720 720,900" fill="#0A0200"/>
      <polygon points="1140,900 1040,750 940,650 820,720 720,900" fill="#0A0200"/>
      <rect y="820" width="1440" height="80" fill="#070100"/>
      {/* River/path at bottom */}
      <ellipse cx="720" cy="880" rx="180" ry="30" fill="#150500"/>
      {/* Rocky ledge details on walls */}
      <polygon points="50,400 180,380 200,420 60,440" fill="#0A0200" opacity="0.5"/>
      <polygon points="1260,380 1390,360 1400,400 1270,420" fill="#0A0200" opacity="0.5"/>
      {/* Eagle silhouette in sky */}
      <g fill="#0A0200" transform="translate(650,120)">
        <ellipse cx="70" cy="22" rx="24" ry="8"/>
        <path d="M0,22 Q35,0 70,22" fill="none" stroke="#0A0200" strokeWidth="6" strokeLinecap="round"/>
        <path d="M70,22 Q105,0 140,22" fill="none" stroke="#0A0200" strokeWidth="6" strokeLinecap="round"/>
      </g>
      {/* Tiny rider far in canyon */}
      <g fill="#080100" opacity="0.7" transform="translate(695,780)">
        <ellipse cx="25" cy="20" rx="22" ry="7"/>
        <ellipse cx="18" cy="12" rx="6" ry="8"/>
        <circle cx="18" cy="4" r="5"/>
      </g>
    </svg>
  );
}

// ── SCENE 10 — The Gold Mine (NEW) ───────────────────────────────────────────
function Scene10() {
  return (
    <svg viewBox={VB} xmlns="http://www.w3.org/2000/svg" {...SZ}>
      <defs>
        <linearGradient id="s10sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1A0600"/>
          <stop offset="40%"  stopColor="#7B3200"/>
          <stop offset="75%"  stopColor="#A85018"/>
          <stop offset="100%" stopColor="#C86828"/>
        </linearGradient>
        <radialGradient id="mineGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#C08020" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#C08020" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1440" height="900" fill="url(#s10sky)"/>
      <rect y="700" width="1440" height="200" fill="#0E0300"/>
      <rect y="688" width="1440" height="18" fill="#180500"/>
      {/* Rocky hillside */}
      <polygon points="0,700 0,400 120,360 220,400 340,330 460,380 560,300 660,360 740,290 820,350 900,280 1000,340 1080,260 1160,320 1280,260 1380,300 1440,280 1440,700" fill="#0C0300"/>
      <polygon points="0,700 0,480 140,430 280,470 440,400 600,445 740,380 880,430 1020,368 1160,415 1300,360 1440,390 1440,700" fill="#0A0200"/>
      {/* Mine entrance arch */}
      <g fill="#060100" transform="translate(580,520)">
        {/* Arch */}
        <path d="M0,220 L0,60 Q140,-30 280,60 L280,220 Z"/>
        {/* Hollow inside */}
        <path d="M18,220 L18,68 Q140,0 262,68 L262,220 Z" fill="#020000"/>
        {/* Timber frame */}
        <rect x="-10" y="55" width="20" height="168" rx="4" fill="#0C0200"/>
        <rect x="270"  y="55" width="20" height="168" rx="4" fill="#0C0200"/>
        <rect x="-10" y="50" width="300" height="16" rx="3" fill="#0C0200"/>
        {/* Cross brace */}
        <rect x="0" y="100" width="280" height="10" rx="3" fill="#0A0200"/>
      </g>
      {/* Mine glow */}
      <ellipse cx="720" cy="720" rx="140" ry="60" fill="url(#mineGlow)"/>
      {/* Cart tracks */}
      <g stroke="#0C0200" strokeWidth="5" fill="none">
        <line x1="620" y1="900" x2="680" y2="740"/>
        <line x1="700" y1="900" x2="760" y2="740"/>
        {[860,820,780].map((y,i)=>(
          <line key={i} x1="614" y1={y} x2="766" y2={y}/>
        ))}
      </g>
      {/* Mine cart */}
      <g fill="#080200" transform="translate(890,650)">
        <rect x="0" y="0" width="80" height="50" rx="4"/>
        <polygon points="-5,50 85,50 90,70 -10,70"/>
        <circle cx="12" cy="74" r="14" fill="none" stroke="#080200" strokeWidth="4"/>
        <circle cx="68" cy="74" r="14" fill="none" stroke="#080200" strokeWidth="4"/>
        {/* Ore/rocks in cart */}
        <ellipse cx="20" cy="18" rx="14" ry="8" fill="#0A0200"/>
        <ellipse cx="45" cy="15" rx="16" ry="9" fill="#0A0200"/>
        <ellipse cx="62" cy="20" rx="12" ry="7" fill="#0A0200"/>
      </g>
      {/* Miner silhouettes */}
      <g fill="#060100">
        {/* Miner 1 with pickaxe */}
        <g transform="translate(420,660)">
          <ellipse cx="0" cy="44" rx="13" ry="18"/>
          <circle cx="0" cy="24" r="10"/>
          <rect x="-5" y="16" width="16" height="6" rx="2"/>
          {/* Pickaxe */}
          <rect x="8" y="20" width="38" height="5" rx="2" transform="rotate(-40,8,22)"/>
          <rect x="30" y="6" width="16" height="7" rx="2" transform="rotate(-40,30,8)"/>
        </g>
        {/* Miner 2 */}
        <g transform="translate(1000,662)">
          <ellipse cx="0" cy="42" rx="12" ry="17"/>
          <circle cx="0" cy="23" r="9"/>
          <rect x="-5" y="15" width="15" height="6" rx="2"/>
          <rect x="8" y="20" width="36" height="5" rx="2" transform="rotate(35,8,22)"/>
          <rect x="30" y="6" width="14" height="7" rx="2" transform="rotate(35,30,8)"/>
        </g>
      </g>
      {/* Pickaxe & shovel leaned on wall */}
      <g stroke="#080200" strokeWidth="5" strokeLinecap="round" fill="none" transform="translate(490,630)">
        <line x1="0" y1="0" x2="30" y2="70"/>
        <line x1="-6" y1="0" x2="6" y2="12"/>
        <line x1="70" y1="0" x2="40" y2="70"/>
        <ellipse cx="70" cy="0" rx="8" ry="4" fill="#080200" stroke="none"/>
      </g>
    </svg>
  );
}

// ── Scene roster ─────────────────────────────────────────────────────────────
const SCENES = [
  Scene1, Scene2, Scene3, Scene4, Scene5,
  Scene6, Scene7, Scene8, Scene9, Scene10,
];

const SCENE_MS = 14000;   // each scene shows for ~14 s
const FADE_MS  = 2500;    // crossfade duration

// ── Component ─────────────────────────────────────────────────────────────────
export default function WesternBackground() {
  // Two render slots that alternate (avoids re-mounting)
  const [slotA, setSlotA]       = useState(0);
  const [slotB, setSlotB]       = useState<number | null>(null);
  const [activeSlot, setActive] = useState<"a" | "b">("a");

  // Inject CSS once
  useEffect(() => {
    if (document.getElementById("ff-bg-css")) return;
    const el = document.createElement("style");
    el.id = "ff-bg-css";
    el.textContent = BG_CSS;
    document.head.appendChild(el);
  }, []);

  // Cycle scenes
  useEffect(() => {
    const t = setTimeout(() => {
      const current = activeSlot === "a" ? slotA : (slotB ?? slotA);
      const next = (current + 1) % SCENES.length;
      if (activeSlot === "a") {
        setSlotB(next);
        setActive("b");
      } else {
        setSlotA(next);
        setActive("a");
      }
    }, SCENE_MS);
    return () => clearTimeout(t);
  }, [activeSlot, slotA, slotB]);

  const SceneA = SCENES[slotA];
  const SceneB = slotB !== null ? SCENES[slotB] : null;

  const layerStyle = (visible: boolean): React.CSSProperties => ({
    position: "absolute",
    inset: "-8% -6%",          // oversized so pan edges never show
    opacity: visible ? 1 : 0,
    transition: `opacity ${FADE_MS}ms ease-in-out`,
    animation: "vintagePan 30s ease-in-out infinite, filmFlicker 0.45s step-start infinite",
    filter: "blur(5px) brightness(0.85)",
    willChange: "transform, opacity",
  });

  return (
    <div
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: -1, overflow: "hidden", pointerEvents: "none" }}
    >
      {/* ── Scene layers ── */}
      <div style={layerStyle(activeSlot === "a")}><SceneA /></div>
      {SceneB && <div style={layerStyle(activeSlot === "b")}><SceneB /></div>}

      {/* ── Dark overlay (keeps UI readable) ── */}
      <div style={{
        position: "absolute", inset: 0,
        background: "rgba(10,3,0,0.62)",
        zIndex: 2,
      }}/>

      {/* ── Film grain (fast-shifting noise) ── */}
      <div style={{
        position: "absolute",
        inset: "-40px",
        zIndex: 3,
        opacity: 0.07,
        animation: "grainShift 0.18s step-start infinite",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "240px 240px",
      }}/>

      {/* ── Film scratch line ── */}
      <div style={{
        position: "absolute",
        top: 0, bottom: 0,
        width: "1px",
        background: "linear-gradient(to bottom, transparent 0%, rgba(255,220,140,0.85) 25%, rgba(255,220,140,0.95) 75%, transparent 100%)",
        animation: "filmScratch 9s linear infinite",
        zIndex: 4,
      }}/>

      {/* ── Vignette burn at edges ── */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at center, transparent 55%, rgba(6,1,0,0.75) 100%)",
        animation: "burnPulse 5s ease-in-out infinite",
        zIndex: 5,
      }}/>

      {/* ── Top/bottom film burn strips ── */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(6,1,0,0.45) 0%, transparent 7%, transparent 93%, rgba(6,1,0,0.45) 100%)",
        zIndex: 6,
      }}/>

      {/* ── Subtle horizontal jitter on entire composition ── */}
      <div style={{
        position: "absolute", inset: 0,
        animation: "jitter 0.08s step-start infinite",
        zIndex: 7,
        mixBlendMode: "overlay",
        opacity: 0,   // invisible but the jitter is applied via parent perspective
      }}/>
    </div>
  );
}
