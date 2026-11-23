// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Vaibhav Agarwal

/* neko-fin — 100% static, file-based. No deps. */
(function(){
"use strict";
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const grid=$("#grid"), q=$("#q"), countEl=$("#count"), feat=$("#featuredCard");
let ALL=[], FILTER="all", SEARCH="";
const LS_POSTS="nf_posts", LS_AUTH="nf_auth", LS_THEME="nf-theme", SES="nf_session";

/* ---------- theme ---------- */
$("#themeBtn").onclick=()=>{const h=document.documentElement;const n=h.getAttribute("data-theme")==="dark"?"light":"dark";h.setAttribute("data-theme",n);try{localStorage.setItem(LS_THEME,n)}catch(e){}toast(n==="dark"?"🌙 dark":"☀️ light")};
$("#topBtn").onclick=()=>window.scrollTo({top:0,behavior:"smooth"});
$("#menuBtn").onclick=()=>{const m=$("#mLinks");m.hidden=!m.hidden};
$$("#mLinks a").forEach(a=>a.onclick=()=>$("#mLinks").hidden=true);

function toast(m){const t=$("#toast");t.textContent=m;t.hidden=false;clearTimeout(t._x);t._x=setTimeout(()=>t.hidden=true,2200)}

/* ---------- tiny markdown ---------- */
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function md(src){
  let h=esc(src);
  // code blocks
  h=h.replace(/```(\w*)\n([\s\S]*?)```/g,(m,l,c)=>"<pre><code>"+c.trim()+"</code></pre>");
  // tables
  h=h.replace(/^((?:\|.*\|\n?)+)/gm,block=>{
    if(!/^\|?[\s:\-|]+\|?$/m.test(block)) {
      // try parse simple table
      const rows=block.trim().split("\n").filter(r=>r.includes("|"));
      if(rows.length>=2){
        let out="<table><thead><tr>";
        const head=rows[0].split("|").map(s=>s.trim()).filter(Boolean);
        head.forEach(c=>out+="<th>"+inline(c)+"</th>");out+="</tr></thead><tbody>";
        rows.slice(1).forEach(r=>{
          if(/^[\s|:\-]+$/.test(r))return;
          out+="<tr>";r.split("|").map(s=>s.trim()).filter((_,i,a)=>true).forEach(c=>{if(c)out+="<td>"+inline(c)+"</td>"});
          out+="</tr>";
        });
        return out+"</tbody></table>";
      }
    }
    return block;
  });
  const lines=h.split("\n");let out="",inUL=false,inOL=false;
  for(let ln of lines){
    if(/^<pre>/.test(ln)){if(inUL){out+="</ul>";inUL=false}if(inOL){out+="</ol>";inOL=false}out+=ln+"\n";continue}
    if(/^#{1,4}\s/.test(ln)){if(inUL){out+="</ul>";inUL=false}if(inOL){out+="</ol>";inOL=false}
      const l=ln.match(/^(#{1,4})\s(.*)/);const n=l[1].length;out+="<h"+(n+1)+">"+inline(l[2])+"</h"+(n+1)+">";continue}
    if(/^&gt;\s?/.test(ln)){if(inUL){out+="</ul>";inUL=false}out+="<blockquote>"+inline(ln.replace(/^&gt;\s?/,""))+"</blockquote>";continue}
    if(/^---+$/.test(ln.trim())){out+="<hr>";continue}
    if(/^[-*]\s+/.test(ln)){if(inOL){out+="</ol>";inOL=false}if(!inUL){out+="<ul>";inUL=true}out+="<li>"+inline(ln.replace(/^[-*]\s+/,""))+"</li>";continue}
    if(/^\d+\.\s+/.test(ln)){if(inUL){out+="</ul>";inUL=false}if(!inOL){out+="<ol>";inOL=true}out+="<li>"+inline(ln.replace(/^\d+\.\s+/,""))+"</li>";continue}
    if(ln.trim()===""){if(inUL){out+="</ul>";inUL=false}if(inOL){out+="</ol>";inOL=false}continue}
    if(/^<table>|^<th|^<tr|^<\/|^\|/.test(ln)&&ln.includes("<table")){out+=ln;continue}
    if(inUL){out+="</ul>";inUL=false}if(inOL){out+="</ol>";inOL=false}
    out+="<p>"+inline(ln)+"</p>";
  }
  if(inUL)out+="</ul>";if(inOL)out+="</ol>";
  return out.replace(/<p><(h\d|ul|ol|blockquote|pre|table)/g,"<$1").replace(/<\/(h\d|ul|ol|blockquote|pre|table)><\/p>/g,"</$1>");
  function inline(s){
    return s
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g,"<img loading=\"lazy\" alt=\"$1\" src=\"$2\">")
      .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g,"<a href=\"$2\" target=\"_blank\" rel=\"noopener\">$1 ↗</a>")
      .replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>")
      .replace(/(^|\W)\*([^*\n]+)\*/g,"$1<em>$2</em>")
      .replace(/`([^`]+)`/g,"<code>$1</code>");
  }
}
function readingTime(t){const w=String(t).split(/\s+/).length;return Math.max(1,Math.round(w/200))+" min read"}

/* ---------- frontmatter ---------- */
function parseMD(raw,file){
  let meta={},body=raw;
  const m=raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if(m){body=m[2];m[1].split("\n").forEach(l=>{
    const i=l.indexOf(":");if(i>0){const k=l.slice(0,i).trim().toLowerCase();let v=l.slice(i+1).trim().replace(/^["']|["']$/g,"");meta[k]=v}
  });}
  const refs=[];
  if(meta.references){meta.references.split(";").forEach(r=>{const p=r.split("|");if(p.length>=2)refs.push({t:p[0].trim(),u:p[1].trim()});else if(r.trim().startsWith("http"))refs.push({t:r.trim(),u:r.trim()})});}
  return {title:meta.title||"Untitled",date:meta.date||new Date().toISOString().slice(0,10),category:cap(meta.category||"Misc"),tags:(meta.tags||"").split(",").map(s=>s.trim()).filter(Boolean),excerpt:meta.excerpt||body.replace(/[#*>`]/g,"").slice(0,140)+"…",refs,body:body.trim(),file};
  function cap(s){s=String(s).trim().toLowerCase();return s==="market"?"Market":"Misc"}
}

/* ---------- load posts ---------- */
async function load(){
  try{
    const man=await (await fetch("posts.json",{cache:"no-store"})).json();
    const arr=await Promise.all(man.map(async e=>{
      try{const txt=await (await fetch(e.file,{cache:"no-store"})).text();const p=parseMD(txt,e.file);p.id=e.id;return p}
      catch(err){return null}
    }));
    ALL=arr.filter(Boolean);
  }catch(e){ALL=[]}
  // local browser posts
  try{const loc=JSON.parse(localStorage.getItem(LS_POSTS)||"[]");loc.forEach(p=>{p.local=true;ALL.push(p)})}catch(e){}
  ALL.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  render();
}
function filtered(){
  return ALL.filter(p=>{
    if(FILTER!=="all"&&p.category!==FILTER)return false;
    if(SEARCH){const s=(p.title+" "+p.excerpt+" "+(p.tags||[]).join(" ")+" "+p.body).toLowerCase();if(!s.includes(SEARCH))return false}
    return true;
  });
}
function cardHTML(p){
  return '<article class="card"><div class="top"><span class="pill '+p.category+'">'+p.category+'</span><span class="meta">'+esc(p.date)+' · '+readingTime(p.body)+(p.local?' · 💾 local':'')+'</span></div>'
  +'<h3><a href="#/post/'+p.id+'">'+esc(p.title)+'</a></h3><p>'+esc(p.excerpt)+'</p>'
  +'<div class="meta">'+(p.tags||[]).slice(0,3).map(t=>"<span>#"+esc(t)+"</span>").join("")+'</div>'
  +'<a class="go" href="#/post/'+p.id+'">Read →</a></article>';
}
function render(){
  const list=filtered();
  grid.innerHTML=list.length?list.map(cardHTML).join(""):'<p class="muted">No posts found. Try another search — or press Write ✎ to create one.</p>';
  countEl.textContent=list.length+" post"+(list.length===1?"":"s")+(FILTER==="all"?"":" in "+FILTER)+(SEARCH?' for "'+SEARCH+'"':"");
  // featured = newest Market
  const f=ALL.find(p=>p.category==="Market")||ALL[0];
  if(f)feat.innerHTML='<span class="tag">★ FEATURED · '+esc(f.category).toUpperCase()+'</span><h3><a href="#/post/'+f.id+'">'+esc(f.title)+'</a></h3><p>'+esc(f.excerpt)+'</p><p class="meta muted small">'+esc(f.date)+' · '+readingTime(f.body)+'</p><a class="btn small" href="#/post/'+f.id+'">Read featured →</a>';
  // ticker double
  const t=$("#ticker");t.innerHTML=(t.textContent+" ").repeat(2);
}
$$(".chip").forEach(c=>c.onclick=()=>{$$(".chip").forEach(x=>x.classList.remove("on"));c.classList.add("on");FILTER=c.dataset.f;render()});
let qT;q.oninput=()=>{clearTimeout(qT);qT=setTimeout(()=>{SEARCH=q.value.trim().toLowerCase();render()},180)};

/* ---------- router ---------- */
function route(){
  const h=location.hash||"#/";
  if(!h.startsWith("#/"))return; // in-page anchor like #latest
  const parts=h.slice(2).split("/");
  const name=parts[0]||"";
  ["view-home","view-post","view-about","view-disclaimer"].forEach(id=>$("#"+id).hidden=true);
  $$("[data-nav]").forEach(a=>a.classList.remove("on"));
  if(name==="" ){ $("#view-home").hidden=false; const nav=document.querySelector('[data-nav="home"]'); if(nav)nav.classList.add("on"); }
  else if(name==="market"){ $("#view-home").hidden=false; FILTER="Market"; syncChips(); render(); document.querySelector('[data-nav="market"]').classList.add("on"); }
  else if(name==="misc"){ $("#view-home").hidden=false; FILTER="Misc"; syncChips(); render(); document.querySelector('[data-nav="misc"]').classList.add("on"); }
  else if(name==="about"){ $("#view-about").hidden=false; }
  else if(name==="disclaimer"){ $("#view-disclaimer").hidden=false; }
  else if(name==="post"){ openPost(parts[1]); return; }
  window.scrollTo({top:0});
}
function syncChips(){$$(".chip").forEach(x=>x.classList.toggle("on",x.dataset.f===(FILTER==="all"?"all":FILTER)))}
function openPost(id){
  const p=ALL.find(x=>x.id===id);
  if(!p){location.hash="#/";return}
  $("#view-post").hidden=false;
  $("#pCat").textContent="● "+p.category+" · "+p.date;
  $("#pTitle").textContent=p.title;
  $("#pMeta").textContent=p.date+" · "+readingTime(p.body)+" · by Shrin"+(p.tags&&p.tags.length?" · #"+p.tags.join(" #"):"");
  $("#pBody").innerHTML=md(p.body);
  const rb=$("#pRefs"),rl=$("#pRefList");
  if(p.refs&&p.refs.length){rb.hidden=false;rl.innerHTML=p.refs.map(r=>'<li><a href="'+esc(r.u)+'" target="_blank" rel="noopener">'+esc(r.t)+' ↗</a><br><small class="muted">'+esc(r.u)+'</small></li>').join("")}
  else{rb.hidden=true;rl.innerHTML=""}
  const i=ALL.indexOf(p),prev=ALL[i-1],next=ALL[i+1];
  $("#postNav").innerHTML="<span>"+(prev?'<a href="#/post/'+prev.id+'">← '+esc(prev.title.slice(0,40))+"</a>":"")+"</span><span>"+(next?'<a href="#/post/'+next.id+'">'+esc(next.title.slice(0,40))+" →</a>":"")+"</span>";
  $("#copyLink").onclick=async()=>{try{await navigator.clipboard.writeText(location.href);toast("Link copied ✓")}catch(e){toast("Copy manually: "+location.href)}};
  window.scrollTo({top:0});
}
$("#backBtn").onclick=()=>location.hash="#/";
window.addEventListener("hashchange",route);

/* ---------- auth (browser-local only!) ---------- */
async function sha(s){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join("")}
const DEF_U="nekofin", DEF_P="123456789@neko.me.to@yolo-hi-meow";
async function getAuth(){
  try{const a=JSON.parse(localStorage.getItem(LS_AUTH)||"null");if(a&&a.u&&a.pHash)return a}catch(e){}
  return {u:DEF_U,pHash:await sha(DEF_P)};
}
function isAuthed(){try{return sessionStorage.getItem(SES)==="1"}catch(e){return false}}
$("#writeBtn").onclick=async()=>{
  if(isAuthed()){openEditor();return}
  $("#loginModal").hidden=false;$("#loginErr").hidden=true;setTimeout(()=>$("#loginPass").focus(),50);
};
$("#loginCancel").onclick=()=>$("#loginModal").hidden=true;
$("#loginGo").onclick=async()=>{
  const u=$("#loginUser").value.trim(),p=$("#loginPass").value;
  const a=await getAuth();
  if(u===a.u&&(await sha(p))===a.pHash){try{sessionStorage.setItem(SES,"1")}catch(e){}$("#loginModal").hidden=false;$("#loginModal").hidden=true;$("#loginPass").value="";openEditor();toast("Unlocked ✓")}
  else{const e=$("#loginErr");e.textContent="Wrong username or password.";e.hidden=false}
};

/* ---------- editor ---------- */
function today(){return new Date().toISOString().slice(0,10)}
function openEditor(){
  $("#editorModal").hidden=false;
  if(!$("#fDate").value)$("#fDate").value=today();
  listDrafts();live();
}
$("#edClose").onclick=()=>$("#editorModal").hidden=true;
$("#edCreds").onclick=()=>{const b=$("#credsBox");b.hidden=!b.hidden};
["fTitle","fCat","fDate","fTags","fExcerpt","fRefs","fBody"].forEach(id=>$("#"+id).addEventListener("input",live));
$("#previewBtn").onclick=live;
function curForm(){
  const refs=$("#fRefs").value.split("\n").map(s=>s.trim()).filter(Boolean).map(l=>{const p=l.split("|");return p.length>=2?{t:p[0].trim(),u:p[1].trim()}:{t:l,u:l}});
  return {id:slug($("#fTitle").value)||("post-"+Date.now()),title:$("#fTitle").value.trim()||"Untitled",date:$("#fDate").value||today(),category:$("#fCat").value,tags:$("#fTags").value.split(",").map(s=>s.trim()).filter(Boolean),excerpt:$("#fExcerpt").value.trim()||$("#fBody").value.replace(/[#*>`]/g,"").slice(0,140)+"…",refs,body:$("#fBody").value};
}
function live(){$("#livePrev").innerHTML=md($("#fBody").value||"*Nothing yet — start writing…*")}
function slug(s){return String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,60)}
$("#saveBtn").onclick=()=>{
  const p=curForm();
  if(!p.title||!p.body){toast("Add title + body first");return}
  let arr=[];try{arr=JSON.parse(localStorage.getItem(LS_POSTS)||"[]")}catch(e){}
  const i=arr.findIndex(x=>x.id===p.id);
  if(i>=0)arr[i]=p;else arr.push(p);
  try{localStorage.setItem(LS_POSTS,JSON.stringify(arr))}catch(e){toast("Storage full");return}
  ALL=ALL.filter(x=>x.id!==p.id);p.local=true;ALL.push(p);ALL.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  render();listDrafts();toast("Saved to this browser ✓ (Export .md to publish)");
};
function listDrafts(){
  let arr=[];try{arr=JSON.parse(localStorage.getItem(LS_POSTS)||"[]")}catch(e){}
  const ul=$("#draftList");
  ul.innerHTML=arr.length?"":'<li class="muted">No browser posts yet.</li>';
  arr.forEach(p=>{
    const li=document.createElement("li");
    li.innerHTML="<span>"+esc(p.title)+" <small class='muted'>"+esc(p.date)+"</small></span>";
    const b1=document.createElement("button");b1.textContent="Load";b1.onclick=()=>{$("#fTitle").value=p.title;$("#fCat").value=p.category;$("#fDate").value=p.date;$("#fTags").value=(p.tags||[]).join(", ");$("#fExcerpt").value=p.excerpt||"";$("#fRefs").value=(p.refs||[]).map(r=>r.t+" | "+r.u).join("\n");$("#fBody").value=p.body;live();toast("Loaded into editor")};
    const b2=document.createElement("button");b2.textContent="Export";b2.onclick=()=>downloadMD(p);
    const b3=document.createElement("button");b3.textContent="Delete";b3.onclick=()=>{arr=arr.filter(x=>x.id!==p.id);localStorage.setItem(LS_POSTS,JSON.stringify(arr));ALL=ALL.filter(x=>x.id!==p.id);render();listDrafts();toast("Deleted")};
    const w=document.createElement("span");w.append(b1,b2,b3);li.append(w);ul.append(li);
  });
}
function toMD(p){
  const refStr=(p.refs||[]).map(r=>r.t+" | "+r.u).join("; ");
  return "---\ntitle: \""+p.title.replace(/"/g,"'")+"\"\ndate: "+p.date+"\ncategory: "+p.category+"\ntags: "+(p.tags||[]).join(", ")+"\nexcerpt: \""+(p.excerpt||"").replace(/"/g,"'").slice(0,200)+"\"\nreferences: "+refStr+"\n---\n\n"+p.body+"\n";
}
function downloadMD(p){
  const blob=new Blob([toMD(p)],{type:"text/markdown"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=p.id+".md";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
  toast("Downloaded "+p.id+".md — put it in /posts + list in posts.json");
}
$("#exportBtn").onclick=()=>downloadMD(curForm());
$("#importBtn").onclick=()=>$("#fileIn").click();
$("#fileIn").onchange=e=>{
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{
    const txt=String(r.result||"");
    if(txt.startsWith("---")){const p=parseMD(txt,f.name);$("#fTitle").value=p.title;$("#fCat").value=p.category;$("#fDate").value=/\d{4}-\d{2}-\d{2}/.test(p.date)?p.date:today();$("#fTags").value=(p.tags||[]).join(", ");$("#fExcerpt").value=p.excerpt;$("#fRefs").value=(p.refs||[]).map(x=>x.t+" | "+x.u).join("\n");$("#fBody").value=p.body}
    else{$("#fTitle").value=f.name.replace(/\.(txt|md)$/i,"").replace(/[-_]+/g," ");$("#fBody").value=txt;if(!$("#fDate").value)$("#fDate").value=today()}
    live();toast("Imported "+f.name+" ✓");
  };
  r.readAsText(f);e.target.value="";
};
$("#cSave").onclick=async()=>{
  const old=$("#cOld").value,a=await getAuth();
  if((await sha(old))!==a.pHash){toast("Old password wrong");return}
  const nu=$("#cUser").value.trim()||a.u, np=$("#cPass").value;
  if(!np||np.length<8){toast("New password min 8 chars");return}
  localStorage.setItem(LS_AUTH,JSON.stringify({u:nu,pHash:await sha(np)}));
  $("#cOld").value="";$("#cPass").value="";$("#cUser").value="";
  toast("Login updated on this browser ✓");
};

load().then(route);
})();
