// Run with Node; canvas is only needed for rendering smoke checks.
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
let canvasModule;try{canvasModule=require('@napi-rs/canvas')}catch{canvasModule=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules','@napi-rs/canvas'))}const {createCanvas}=canvasModule;
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');const code=html.split('<script>')[1].split('</script>')[0];
function game(initial={}){
 const store=new Map(Object.entries(initial)), nodes=new Map(),cv=createCanvas(1000,760);
 function el(id=''){const classes=new Set();return {id,style:{},children:[],classList:{add(...a){a.forEach(x=>classes.add(x))},remove(...a){a.forEach(x=>classes.delete(x))},contains(x){return classes.has(x)},toggle(x,on){if(on===undefined)on=!classes.has(x);on?classes.add(x):classes.delete(x);return on}},addEventListener(){},append(...c){this.children.push(...c)},replaceChildren(...c){this.children=c},setAttribute(k,v){this[k]=v},focus(){},blur(){},click(){this.onclick?.()},closest(){return null},getBoundingClientRect(){return {left:0,top:0,width:112,height:112}},setPointerCapture(){},hasPointerCapture(){return false},releasePointerCapture(){},textContent:'',innerHTML:''}}
 function get(q){if(!nodes.has(q))nodes.set(q,el(q));return nodes.get(q)}
 const canvas=get('#c');canvas.getContext=()=>cv.getContext('2d');
 const context=vm.createContext({console,Math,Set,Map,Number,JSON,Date,Array,Object,String,Boolean,Infinity,document:{querySelector:get,querySelectorAll(){return []},createElement:el,addEventListener(){},activeElement:null,hidden:false},innerWidth:1000,innerHeight:760,devicePixelRatio:1,matchMedia:()=>({matches:false}),localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},performance:{now:()=>100000},requestAnimationFrame(){},setTimeout(){return 1},clearTimeout(){},setInterval(){},addEventListener(){},window:{},navigator:{}});
 vm.runInContext(code,context);const run=s=>vm.runInContext(s,context);run("soundOn=false;audioReady=()=>{};tone=()=>{};tutorialSeen=true;mode='game';started=true;");return {run,nodes,store,cv};
}
const g=game();const run=g.run;
assert.equal(run('Object.values(realms).filter(r=>r.act).length'),23);
assert.equal(run('Object.values(realms).flatMap(r=>r.objects).filter(o=>o.campaign).length'),47);
run("travel('insidehouse');");assert.equal(run('realm'),'town','act III must be locked before homecoming');
run("story.dressFound=true;discoveries.add('puzzle:homecolor');travel('insidehouse');resetCloth(750);dressBody.y=floor-500;for(let i=0;i<180;i++){time+=1/60;realmPhysics()}");
assert.equal(run("solved('politehinge')"),false,'flying high must not bypass campaign puzzles');
run("const testMove=(x,y)=>{const dx=x-dressBody.x,dy=y-dressBody.y;dressBody.x=x;dressBody.y=y;dressBody.vx=0;dressBody.vy=0;for(const p of cloth){p.x+=dx;p.ox=p.x;p.y+=dy;p.oy=p.y}};const tick=(n=1)=>{for(let k=0;k<n;k++){time+=1/60;dressPhysics();realmPhysics()}};const testHold=(x,y,n=100)=>{for(let k=0;k<n;k++){const p=cloth[0];grab={index:0,sx:x+(p.x-dressBody.x)-camera,sy:y+(p.y-dressBody.y)-viewY};tick()}grab=null;};");
run("story.turns.politehinge=0;let gate=stationById('politehinge');let tar=campaignTarget(gate,gate.steps[0]);testMove(tar.x,tar.y);testHold(tar.x,tar.y)");
assert.equal(run("campaignStage(stationById('politehinge'))"),0,'wrong orientation is rejected');
run("story.turns.politehinge=1;gate=stationById('politehinge');tar=campaignTarget(gate,gate.steps[0]);testMove(tar.x,tar.y);testHold(tar.x,tar.y)");
assert.equal(run("campaignStage(stationById('politehinge'))"),1,'actual dress physics can settle inside first rotated opening');
run('saveGame()');const restored=game(Object.fromEntries(g.store));assert.equal(restored.run("campaignStage(realms.insidehouse.objects.find(o=>o.id==='politehinge'))"),1,'partial puzzle survives reload');
// The old completed save continues, instead of ending at the former act-II finale.
const old=game({'rag-meg-circle-dress-save-v3':JSON.stringify({story:{dressFound:true,ended:true,realm:'homecoming',position:800},discoveries:['puzzle:prism','puzzle:homecolor','world:homecoming']})});assert.equal(old.run('story.ended'),false);old.run("travel('insidehouse')");assert.equal(old.run('realm'),'insidehouse');
// Traverse all campaign stages using the real mesh integrator, plus synthetic held inputs.
const stats=run(`(()=>{let count=0;for(const spec of campaignRoomSpecs){const [key,act,title,color,gate]=spec;if(gate==='arcs'){for(const id of ['waterarc','colorarc','airarc'])if(!solved(id))throw Error('missing branch '+id)}else if(!solved(gate))throw Error('unmet gate '+key+': '+gate);travel(key);if(realm!==key)throw Error('travel failed '+key);for(const o of objects.filter(o=>o.campaign)){for(let j=campaignStage(o);j>=0&&j<o.steps.length;j++){if(solved(o.id))break;const st=o.steps[j];pose=null;grab=null;squeezeUntil=0;story.fold=st.fold??0;story.ink=st.ink||'pink';story.water=st.water||0;story.wet=!!story.water;if(st.turn!==undefined)story.turns[o.id]=st.turn;if(st.pour){story.water=1;testMove(o.x,groundAt(o.x)-240);squeezeMeg();if(!discoveries.has('poured:'+o.id))throw Error('pour failed '+o.id);squeezeUntil=0}if(st.echo){echoActors=[];for(const p of campaignPads(o,st)){echoActors.push({station:o.id,start:campaignClock,frames:Array.from({length:180},()=>({x:p.x,alt:groundAt(p.x)-p.y,ink:p.ink||'pink',fold:0,angle:0}))})}}else echoActors=[];const t=campaignTarget(o,st);testMove(t.x,t.y);if(st.hang){interact(o.id);for(let k=0;k<180&&!discoveries.has('stage:'+o.id+':'+j);k++)tick()}else {for(let k=0;k<300&&!discoveries.has('stage:'+o.id+':'+j);k++){const t=campaignTarget(o,st);testHold(t.x,t.y,1)}}if(!discoveries.has('stage:'+o.id+':'+j))throw Error('not achievable: '+key+'/'+o.id+'/'+j+' '+JSON.stringify({x:dressBody.x,y:dressBody.y,fold:campaignFold(),fits:campaignClothFits(st.fold),condition:campaignConditions(o,st),pose}));count++;}if(!solved(o.id))throw Error('puzzle not completed '+o.id)} }return count})()`);
assert.equal(run('story.ended'),true);assert.equal(run('mode'),'ending');assert.equal(run("solved('adequatehook')"),true);
g.nodes.get('#ending-wander').click();assert.equal(run('mode'),'game');
console.log('PASS: '+stats+' remaining campaign stages through actual dress/cloth physics; prerequisite gates, partial-save reload, old-save continuation and final ending.');
// Record echoes through the actual record controls; verify pads require distinct bodies and colors.
run("travel('yesterdayround');const eo=stationById('threevoices');echoActors=[];const pads=campaignPads(eo,eo.steps[0]);for(const p of pads){testMove(p.x,p.y);recordCampaignEcho();for(let k=0;k<80;k++){testMove(p.x,p.y);time+=1/60;campaignPhysics()}recordCampaignEcho()}");
assert.equal(run('echoActors.length'),2);assert.equal(run('campaignEchoesFit(eo,eo.steps[0])'),true);run('echoActors.pop()');assert.equal(run('campaignEchoesFit(eo,eo.steps[0])'),false);
// Dye mixtures use actual pump/squeeze/basin interactions and persist the discovered palette.
run("travel('orchardmix');const basin=objects.find(o=>o.device==='basin');for(const c of ['blue','yellow']){story.ink=c;story.water=1;testMove(basin.x,groundAt(basin.x)-45);squeezeMeg()}interact(basin.id)");assert.equal(run('story.ink'),'green');assert.equal(run("campaignPalette().includes('green')"),true);
// Render every room in the real canvas implementation, including gates and late-game devices.
for(const spec of run('campaignRoomSpecs.map(s=>[s[0]])')){const key=spec[0];run(`travel('${key}');camera=480;focus=objects.find(o=>o.campaign);background();drawWorld();drawCloth();progressHUD();showJourneyMap()`)}
run("travel('circlefinish');camera=500;background();drawWorld();drawCloth()");fs.writeFileSync('/tmp/rag-campaign-final.png',g.cv.toBuffer('image/png'));
run('forgetJourney()');assert.equal(run('realm'),'town');assert.equal(run('story.dressFound'),false);assert.equal(run('echoActors.length'),0);assert.equal(run('story.ended'),false);assert.equal(run("solved('adequatehook')"),false);
console.log('PASS: two recorded echoes, pad separation, actual dye mixing, every new world render and map, reset clears campaign state.');
// Representative unsolved scenes; inspect glyph counts to guard against doubled labels.
const v=game();v.run("story.dressFound=true;discoveries.add('puzzle:homecolor');travel('insidehouse');resetCloth(720);camera=430;focus=stationById('politehinge');messageUntil=0");
const cx=v.cv.getContext('2d'),labels=[],fill=cx.fillText.bind(cx);cx.fillText=(...a)=>{labels.push(a[0]);fill(...a)};
v.run('background();drawWorld();drawCloth()');assert.equal(labels.filter(x=>x==='POLITE HINGE').length,1);fs.writeFileSync('/tmp/rag-campaign-house.png',v.cv.toBuffer('image/png'));
module.exports={game};
// Earlier acts still work after the campaign integration.
const b=game();b.run("story.dressFound=true;discoveries.add('puzzle:seam');travel('bloom');const light=objects.find(o=>o.id==='firstlight');const t=light.spatial[0];resetCloth(light.x);const dy=groundAt(light.x)-t.dy-dressBody.y;dressBody.y+=dy;for(const p of cloth){p.y+=dy;p.oy+=dy};for(let n=0;n<10;n++)spatialPhysics()");assert.equal(b.run("solved('firstlight')"),true);
const seam=game();seam.run("discoveries.add('puzzle:sky');discoveries.add('puzzle:water');discoveries.add('puzzle:earth');travel('hem');resetCloth(750);interact('seam');for(let i=0;i<240;i++){time+=1/60;clothStep();realmPhysics()}");assert.equal(seam.run("solved('seam')"),true);seam.run("travel('town',10230);takeDress()");assert.equal(seam.run('realm'),'bloom');assert.equal(seam.run('story.dressFound'),true);
// Devices should only render a focused label once.
v.run("focus=objects.find(o=>o.device==='pump');camera=focus.x-250;messageUntil=0");labels.length=0;v.run('background();drawWorld()');assert.equal(labels.filter(x=>x===v.run('focus.name')).length,1);
// Water, dye, and echo requirements cannot be satisfied merely by occupying an outline.
const negative=game();negative.run("story.dressFound=true;discoveries.add('puzzle:firstdye');travel('orchardroots');const c=stationById('borrowedbranch');story.ink='pink'");assert.equal(negative.run('campaignConditions(c,c.steps[0])'),false);negative.run("story.ink='blue'");assert.equal(negative.run('campaignConditions(c,c.steps[0])'),true);
negative.run("discoveries.add('puzzle:palettekeeper');travel('weatherbasement');const rain=stationById('rainballast');story.fold=1;story.water=2");assert.equal(negative.run('campaignConditions(rain,rain.steps[0])'),false);
console.log('PASS: original seam and dress acquisition, original act-II fitting puzzle, single object labels, color and water rejection.');
const weighted=game();weighted.run("story.dressFound=true;discoveries.add('puzzle:homecolor');travel('insidehouse');const bridge=stationById('bathtubbridge');story.water=0;rotateCampaign(bridge)");assert.equal(weighted.run('campaignTurn(bridge)'),0);weighted.run('story.water=2;rotateCampaign(bridge)');assert.equal(weighted.run('campaignTurn(bridge)'),1);
console.log('PASS: water weight physically enables the house turn plates.');
