const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
// Reuse the existing real-canvas game harness without rerunning unrelated campaign cases.
const harness=fs.readFileSync(path.join(__dirname,'campaign.cjs'),'utf8').split('const g=game();')[0];
const game=new Function('require','__dirname',harness+'\nreturn game;')(require,__dirname);
const g=game(),run=g.run;
assert.equal(run('collectedStarCount()'),0,'existing saves start with no collected stars');
assert.ok(run('Object.keys(realms).every(r=>trailStars(r).length>=5)'),'all levels contain trails');
assert.ok(run('Object.keys(realms).every(r=>trailStars(r).every(s=>s.x>0&&s.x<realms[r].width))'),'stars stay inside room bounds');
assert.ok(run('(()=>{const ids=Object.keys(realms).flatMap(r=>trailStars(r).map(s=>s.id));return new Set(ids).size===ids.length})()'),'star IDs are unique across rooms');
// Walk with the actual cloth physics: collection requires no extra button or puzzle.
run("resetCloth(330);keys.add('arrowright');for(let i=0;i<160;i++){time+=1/60;clothStep();collectTrailStars()}keys.clear()");
assert.ok(run('collectedStarCount()')>=5,'ordinary movement collects the first trail');
const count=run('collectedStarCount()');
run('saveGame()');
const restored=game(Object.fromEntries(g.store));
assert.equal(restored.run('collectedStarCount()'),count,'stars persist after reload');
restored.run("resetCloth(330);keys.add('arrowright');for(let i=0;i<160;i++){time+=1/60;clothStep();collectTrailStars()}keys.clear()");
assert.equal(restored.run('collectedStarCount()'),count,'revisiting the trail cannot farm duplicate stars');
const slot2=game({...Object.fromEntries(g.store),'rag-meg-circle-dress-active-slot-v1':'2'});
assert.equal(slot2.run('collectedStarCount()'),0,'save slots have independent totals');
run("story.dressFound=true;resetCloth(1060);dressBody.y=groundAt(1060)-42;for(const p of cloth){p.x=1060;p.ox=1060;p.y=dressBody.y;p.oy=p.y}collectTrailStars()");
assert.ok(run('collectedStarCount()')>count,'circle-dress collision collects stars');
run('forgetJourney()');assert.equal(run('collectedStarCount()'),0,'reset clears stars in active slot');
const scene=game();scene.run('camera=180;background();drawWorld();drawCloth();renderResources()');
fs.writeFileSync('/tmp/rag-stars-desktop.png',scene.cv.toBuffer('image/png'));
scene.cv.width=390;scene.cv.height=844;scene.run('innerWidth=390;innerHeight=844;resize();camera=180;background();drawWorld();drawCloth()');
fs.writeFileSync('/tmp/rag-stars-mobile.png',scene.cv.toBuffer('image/png'));
console.log('PASS: trails in every area, stable IDs, real movement pickup, no duplicate collection, reload, separate save slots, circle dress, reset, and desktop/mobile renders.');
