const UNIT_RANGES={"02":[3,6],"04":[3,8],"05":[5,9],"06":[4,10],"07":[6,11],"08":[6,11],"09":[7,13]};
function unitOf(code){const y=code.slice(2,4),n=+code.slice(6),[me,ve]=UNIT_RANGES[y];return n<=me?"ME":n<=ve?"VE":"TU"}
const UN={ME:"Matéria e energia",VE:"Vida e evolução",TU:"Terra e Universo"};
const LV={MP:"Muito provável",P:"Provável",A:"Aposta"}, SUB={F:"Física",Q:"Química",B:"Biologia"}, ORD={MP:0,P:1,A:2};
const isPPL=k=>/PPL 2025/.test(WHY[k]||"");
const key=t=>t.s+t.i;
const done=radarProgress.natureza;
const st={sub:"all",lvl:"all",day:"all",q:"",ord:"plano"};
const $=id=>document.getElementById(id);
const esc=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");

function renderDays(){
  $("days").innerHTML=DAYS.map(d=>{
    const items=T.filter(t=>t.d===d.n), c={F:0,Q:0,B:0};items.forEach(t=>c[t.s]++);
    const ok=items.filter(t=>done[key(t)]).length, pct=Math.round(ok/items.length*100);
    return `<button class="day" data-day="${d.n}" aria-pressed="${st.day==String(d.n)}"><span class="num">DIA ${d.n} · ${d.date}</span><h3>${d.t}</h3><p>${d.p}</p><div class="mix">${["F","Q","B"].filter(s=>c[s]).map(s=>`<span class="${s}">${SUB[s]} ${c[s]}</span>`).join("")}</div><div class="bar"><i style="width:${pct}%"></i></div><span class="count">${ok}/${items.length} temas revisados</span></button>`}).join("");
  document.querySelectorAll("#days .day").forEach(b=>b.onclick=()=>{setSeg("fDay",st.day===b.dataset.day?"all":b.dataset.day);$("temas").scrollIntoView()});
}
function renderCross(){
  $("cross").innerHTML=CROSS.map(c=>`<div class="cx"><h3>${c.t}</h3><p>${c.p}</p><div class="tags">${c.k.map(k=>`<button class="tag ${k[0]}" data-k="${k}">${k[0]==="F"?"Fís":k[0]==="Q"?"Quí":"Bio"} T${k.slice(1)}</button>`).join("")}</div></div>`).join("");
  document.querySelectorAll(".tag[data-k]").forEach(b=>b.onclick=()=>jump(b.dataset.k));
}
function renderTraps(){$("traps").innerHTML=TRAPS.map(t=>`<div class="trap"><h3>${t.t}</h3><p>${t.p}</p></div>`).join("")}
function jump(k){
  if(k.startsWith("M")){window.radarMath.jump(k);return}
  window.switchRadar?.("nature");
  st.q="";$("q").value="";setSeg("fSub","all",1);setSeg("fLvl","all",1);setSeg("fDay","all");
  const el=$("c"+k);if(el){el.querySelector("details").open=true;el.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"center"});el.querySelector("summary").focus({preventScroll:true});!matchMedia("(prefers-reduced-motion: reduce)").matches&&el.animate?.([{boxShadow:"0 0 0 3px var(--accent)"},{boxShadow:"0 0 0 0 transparent"}],{duration:1600})}
}
const natureMathLinks={"F01":["M03","M10"],"B14":["M08"],"F19":["M12"],"F25":["M12"],"Q13":["M12"],"F18":["M15"]};
function renderGrid(){
  const q=st.q.trim().toLowerCase();
  const list=T.filter(t=>(st.sub==="all"||t.s===st.sub)&&(st.lvl==="all"||t.n===st.lvl)&&(st.day==="all"||String(t.d)===st.day)&&(!q||(t.t+" "+t.r+" "+t.f+" "+t.a.join(" ")+" "+t.c).toLowerCase().includes(q)))
    .sort(st.ord==="freq"?(a,b)=>(QN[key(b)]??-1)-(QN[key(a)]??-1)||ORD[a.n]-ORD[b.n]:(a,b)=>a.d-b.d||ORD[a.n]-ORD[b.n]||a.s.localeCompare(b.s)||a.i.localeCompare(b.i));
  $("count").textContent=list.length+" de "+T.length+" temas";
  $("grid").innerHTML=list.length?list.map(t=>{const k=key(t);return `<article class="card s${t.s}${done[k]?" done":""}" id="c${k}">
    <div class="card-top"><span class="id ${t.s}" style="padding:1px 6px;border-radius:5px">${SUB[t.s]} T${t.i}</span><span class="lvl ${t.n}">${LV[t.n]}</span><span class="dtag">Dia ${t.d}</span></div>
    <h3>${esc(t.t)}</h3>
    <div class="stat-line">${QN[k]!=null?`<span class="chip">${QN[k]} questões nos simulados</span>`:""}${isPPL(k)?`<span class="chip ppl">Caiu no PPL 2025</span>`:""}${t.s==="Q"?`<details class="sas-chip"><summary class="chip">SAS 2026: ${SAS_N[k]||0}</summary><p>${esc(SAS.filter(q=>q.t===k).map(q=>q.id).join(", ")||"Nenhuma questão nos 6 simulados.")}</p></details>`:""}</div>
    <p class="rev">${esc(t.r)}</p><code class="formula">${esc(t.f)}</code>
    <ul>${t.a.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
    <p class="bncc">${(BN[k]||[]).length?"Base no Fundamental: "+BN[k].map(c=>`<code>${c}</code> ${HAB[c]}`).join(" · "):"Sem habilidade de base no Fundamental: conteúdo próprio do Ensino Médio."}</p>
    <details><summary>Como pode cair e por que está no radar</summary><p>${esc(t.c)}</p><p>${esc(WHY[k]||"")}</p></details>
    ${natureMathLinks[k]?`<div class="tags">${natureMathLinks[k].map(id=>`<button type="button" class="tag nature-math" onclick="jump('${id}')">Matemática ${id}</button>`).join("")}</div>`:""}
    <label class="check"><input type="checkbox" id="ck${k}" data-k="${k}" ${done[k]?"checked":""}> Revisado</label></article>`}).join(""):`<p class="empty">Nenhum tema com esses filtros.</p>`;
  document.querySelectorAll("#grid .check input").forEach(c=>c.onchange=()=>radarProgress.mark("natureza",c.dataset.k,c.checked));
}
document.addEventListener("radar-progress-changed",()=>{
  document.querySelectorAll("#grid .check input").forEach(c=>{
    c.checked=done[c.dataset.k]===true;
    c.closest(".card").classList.toggle("done",c.checked);
  });
  renderDays();
  renderStats();
});
function renderStats(){const n=T.filter(t=>done[key(t)]===true).length;$("sTotal").textContent=T.length;$("sDone").textContent=n;const p=Math.round(n/T.length*100);$("pAll").style.width=p+"%";$("pTxt").textContent=p+"% do radar revisado";$("sMP").textContent=T.filter(t=>t.n==="MP").length}
function setSeg(id,v,silent){const map={fSub:"sub",fLvl:"lvl",fDay:"day",fOrd:"ord"};st[map[id]]=v;document.querySelectorAll("#"+id+" button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.v===v));if(!silent){renderGrid();renderDays()}}
["fSub","fLvl","fDay","fOrd"].forEach(id=>document.querySelectorAll("#"+id+" button").forEach(b=>b.onclick=()=>setSeg(id,b.dataset.v)));
$("q").oninput=e=>{st.q=e.target.value;renderGrid()};

const tip=document.createElement("div");tip.className="tip";tip.hidden=true;document.body.appendChild(tip);
tip.setAttribute("aria-hidden","true");
function showTip(e,html){tip.innerHTML=html;tip.hidden=false;const r=tip.getBoundingClientRect();let x=e.clientX+14,y=e.clientY+14;if(x+r.width>innerWidth-8)x=e.clientX-r.width-14;if(y+r.height>innerHeight-8)y=e.clientY-r.height-14;tip.style.left=Math.max(8,x)+"px";tip.style.top=Math.max(8,y)+"px"}
function renderCharts(){
  const col={F:"var(--cF)",Q:"var(--cQ)",B:"var(--cB)"}, unit={F:"subtópico",Q:"subtópico",B:"arquétipo"};
  $("charts").innerHTML=["F","Q","B"].map(s=>{
    const rows=T.filter(t=>t.s===s&&QN[key(t)]!=null).sort((a,b)=>QN[key(b)]-QN[key(a)]);
    const max=Math.max(...rows.map(t=>QN[key(t)]));
    const entries=rows.map(t=>{
      const k=key(t);
      return {k,v:QN[k],l:`${isPPL(k)?'<span class="ppl"></span>':""}T${t.i} ${esc(t.t)}`,
        tip:`<b>${SUB[t.s]} T${t.i} · ${QN[k]} questões</b><br>${esc(WHY[k])}<br><span style="opacity:.75">${LV[t.n]} · Dia ${t.d}</span>`};
    });
    return `<div class="chart"><div><h3>${SUB[s]}: questões nos simulados</h3><p class="sub">contagem por ${unit[s]} · ${rows.length} temas</p></div><div class="rows">${entries.map(r=>chartEntry(r,max,col[s])).join("")}</div></div>`;
  }).join("");
  wireTips("#charts");
}
function renderPPL(){
  $("kPPL").textContent=T.filter(t=>isPPL(key(t))).length;
  $("pplGrid").innerHTML=["F","Q","B"].map(s=>{const items=T.filter(t=>t.s===s&&isPPL(key(t)));
    return `<div class="ppl-col"><h3>${SUB[s]} no PPL 2025 (${items.length} temas)</h3><ul>${items.map(t=>{const w=WHY[key(t)];const txt=w.split(/;\s*/).find(p=>/PPL 2025/.test(p))||w;return `<li><button class="tag ${s}" data-k="${key(t)}">T${t.i}</button> ${esc(txt.replace(/^\s*/,"").replace(/^./,c=>c.toUpperCase()))}</li>`}).join("")}</ul></div>`}).join("");
  document.querySelectorAll("#pplGrid .tag").forEach(b=>b.onclick=()=>jump(b.dataset.k));
}
function renderUnits(){
  const cnt={ME:new Set(),VE:new Set(),TU:new Set()}, none=[];
  T.forEach(t=>{const k=key(t),c=BN[k]||[];if(!c.length)none.push(t);c.forEach(x=>cnt[unitOf(x)].add(k))});
  const desc={ME:"Materiais, transformações, energia elétrica e térmica, radiações. É a base da maior parte da Física e da Química do radar.",VE:"Seres vivos, corpo humano, ecossistemas, hereditariedade e evolução. Sustenta quase toda a Biologia do radar.",TU:"Terra, Sol, Lua, clima e atmosfera. No ENEM aparece pouco: só via gravitação, efeito estufa, ozônio e ciclo da água."};
  $("units").innerHTML=["ME","VE","TU"].map(u=>`<div class="unit"><span class="eyebrow">${UN[u]}</span><b>${cnt[u].size}</b><p>temas do radar com base nesta unidade. ${desc[u]}</p></div>`).join("");
  $("gapBox").innerHTML=`<h3>${none.length} temas sem base no Fundamental</h3><p>São conteúdos que só aparecem no Ensino Médio. Aqui não existe atalho de 9º ano: o raciocínio tem de estar treinado. Priorize os muito prováveis desta lista.</p><div class="tags">${none.sort((a,b)=>ORD[a.n]-ORD[b.n]).map(t=>`<button class="tag ${t.s}" data-k="${key(t)}" title="${esc(t.t)}">${t.s==="F"?"Fís":t.s==="Q"?"Quí":"Bio"} T${t.i} ${esc(t.t.split(":")[0])}</button>`).join("")}</div>`;
  document.querySelectorAll("#gapBox .tag").forEach(b=>b.onclick=()=>jump(b.dataset.k));
}
// ===== SAS 2026: classificação questão a questão (Química) =====
// [simulado-questão, tema do radar, tipo (c cálculo · s seleção por quadro · k conceitual), contexto, x = interdisciplinar]
const SAS_N={};SAS.forEach(q=>SAS_N[q.t]=(SAS_N[q.t]||0)+1);
const TIPO={c:"Cálculo",s:"Seleção por quadro",k:"Conceitual"};
const AREA=[["Físico-Química",1,15],["Geral e Inorgânica",16,19],["Orgânica",20,23],["Ambiental",24,25]];
const sasSt={s:"all",k:"all"};

function chartEntry(r,max,color){
  const tag=r.k?"button":"div";
  return `<div class="chart-entry"><${tag} class="row" ${r.k?`type="button" data-k="${r.k}"`:""}>
    <span class="lbl">${r.l}</span><span class="trk"><span class="fill" style="width:${max?r.v/max*100:0}%;background:${color}"></span></span><span class="val">${r.v}</span>
    </${tag}><details class="chart-evidence"><summary title="Ver detalhes da barra"><span aria-hidden="true">ⓘ</span><span class="sr-only">Detalhes · ${r.l}</span></summary>
    <div class="chart-evidence-text">${r.tip}</div></details></div>`;
}
function bars(el,rows,max,color){$(el).innerHTML=rows.map(r=>chartEntry(r,max,color)).join("")}
function wireTips(sel){
  document.querySelectorAll(sel+" .row").forEach(row=>{
    if(row.dataset.k) row.onclick=()=>jump(row.dataset.k);
    row.onpointermove=e=>{
      if(e.pointerType==="mouse") showTip(e,row.nextElementSibling.querySelector(".chart-evidence-text").innerHTML);
    };
    row.onpointerleave=()=>tip.hidden=true;
  });
}
function renderSAS(){
  const n=SAS.length,c=SAS.filter(q=>q.k==="c").length,s=SAS.filter(q=>q.k==="s").length,x=SAS.filter(q=>q.x).length;
  $("sasKpis").innerHTML=`<div class="kpi"><b>270</b><span>questões de Natureza em 6 simulados</span></div><div class="kpi"><b>${n}</b><span>de Química (${Math.round(n/270*100)}%), cerca de ${(n/6).toFixed(1).replace(".",",")} por simulado</span></div><div class="kpi"><b>${Math.round(c/n*100)}%</b><span>pedem cálculo (${c} questões)</span></div><div class="kpi"><b>${Math.round(s/n*100)}%</b><span>são seleção a partir de quadro ou teste (${s})</span></div><div class="kpi"><b>${x}</b><span>interdisciplinares com Biologia, contadas em Química</span></div>`;
  const qt=T.filter(t=>t.s==="Q").map(t=>({k:key(t),v:SAS_N[key(t)]||0,t})).sort((a,b)=>b.v-a.v||ORD[a.t.n]-ORD[b.t.n]);
  bars("sasRows",qt.map(r=>({k:r.k,v:r.v,l:`T${r.t.i} ${esc(r.t.t)}<span class="lvl sm ${r.t.n}">${r.t.n}</span>`,tip:`<b>T${r.t.i} · ${r.v} no SAS · ${QN[r.k]} no radar</b><br>${SAS.filter(q=>q.t===r.k).map(q=>`S${q.id}: ${esc(q.c)}`).join("<br>")||"Nenhuma questão nos 6 simulados."}`})),Math.max(...qt.map(r=>r.v)),"var(--cQ)");
  const ar=AREA.map(([l,a,b])=>({l,v:SAS.filter(q=>{const i=+q.t.slice(1);return i>=a&&i<=b}).length}));
  bars("sasArea",ar.map(r=>({l:r.l,v:r.v,tip:`${r.v} de ${n} questões (${Math.round(r.v/n*100)}%)`})),Math.max(...ar.map(r=>r.v)),"var(--cQ)");
  bars("sasTipo",["c","s","k"].map(k=>({l:TIPO[k],v:SAS.filter(q=>q.k===k).length,tip:`${SAS.filter(q=>q.k===k).length} de ${n} questões`})),n,"var(--cQ)");
  $("sasGap").innerHTML=[
   ["Convergem (alto nos dois)","Separação de misturas, estequiometria com rendimento, polaridade, funções orgânicas, química das águas e atmosfera."],
   ["Radar alto, SAS baixo","Isomeria (0), Le Chatelier (1), termoquímica (1), meia-vida (1). Lacuna de treino de quem fez só o SAS."],
   ["SAS alto, radar médio","Atomística e espectros (6, radar Provável), seleção de solvente e polímero por propriedade."]
  ].map(([a,b])=>`<div><b>${a}</b><span>${b}</span></div>`).join("");
  wireTips("#sas");
  $("sasF").innerHTML=`<button data-v="all" aria-pressed="true">Todos</button>`+[1,2,3,4,5,6].map(i=>`<button data-v="${i}" aria-pressed="false">${i}º</button>`).join("");
  [["sasF","s"],["sasT","k"]].forEach(([id,f])=>document.querySelectorAll("#"+id+" button").forEach(b=>b.onclick=()=>{sasSt[f]=b.dataset.v;document.querySelectorAll("#"+id+" button").forEach(o=>o.setAttribute("aria-pressed",o===b));renderSasTbl()}));
  renderSasTbl();
}
function renderSasTbl(){
  const list=SAS.filter(q=>(sasSt.s==="all"||String(q.s)===sasSt.s)&&(sasSt.k==="all"||q.k===sasSt.k));
  $("sasCount").textContent=list.length+" questões";
  $("sasTbl").querySelector("tbody").innerHTML=list.map(q=>{const t=T.find(x=>key(x)===q.t);return `<tr><td class="qid">${q.s}º · Q${q.id.split("-")[1]}</td><td><button class="tag Q" data-k="${q.t}">T${t.i}</button> ${esc(t.t)}</td><td>${esc(q.c)}${q.x?'<span class="x">Quí/Bio</span>':""}</td><td>${TIPO[q.k]}</td></tr>`}).join("");
  document.querySelectorAll("#sasTbl .tag").forEach(b=>b.onclick=()=>jump(b.dataset.k));
}
function renderBets(){
  $("bets").innerHTML=BETS.map((b,i)=>`<article class="bet"><div style="display:flex;justify-content:space-between;align-items:center"><span class="n">APOSTA ${String(i+1).padStart(2,"0")}</span><span class="strength" title="força da evidência: ${b.f} de 5">${[1,2,3,4,5].map(j=>`<i class="${j<=b.f?"on":""}"></i>`).join("")}<span aria-label="Força da evidência: ${b.f} de 5">${b.f}/5</span></span></div><h3>${b.t}</h3>
  <div class="ev">${b.q.length?`<span>SAS:</span>${b.q.map(q=>`<span class="q">${q.replace("-","º·Q")}</span>`).join("")}`:"<span>SAS: nenhuma questão</span>"}<span style="margin-left:6px">Radar:</span>${b.r.map(k=>`<button class="tag ${k[0]}" data-k="${k}">${k[0]==="F"?"Fís":k[0]==="Q"?"Quí":"Bio"} T${k.slice(1)}</button>`).join("")}</div>
  <span class="lbl2">Núcleo</span><p>${b.d}</p><span class="lbl2">Comandos que mais apareceram</span><p class="cmd">${b.m}</p></article>`).join("");
  document.querySelectorAll("#bets .tag").forEach(b=>b.onclick=()=>jump(b.dataset.k));
}
renderDays();renderCross();renderTraps();renderCharts();renderPPL();renderUnits();renderSAS();renderBets();renderGrid();renderStats();
