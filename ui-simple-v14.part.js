/* v13.2.4 — Simplified five-tab presentation layer.
   The adaptive engine stays intact; the interface deliberately exposes fewer
   decisions. Primary workflow: Today → Learn → Practice → Progress → More. */

function smSimpleHeader(kicker,title,copy){
  return '<div class="dm24-header"><div class="dm24-kicker">'+esc(kicker)+'</div><h2>'+esc(title)+'</h2>'+
    (copy?'<p>'+esc(copy)+'</p>':'')+'</div>';
}
function smSimpleStat(label,value,note){
  return '<div class="dm24-stat"><div class="dm24-stat-value">'+esc(String(value))+'</div><div class="dm24-stat-label">'+esc(label)+'</div>'+
    (note?'<div class="dm24-stat-note">'+esc(note)+'</div>':'')+'</div>';
}
function smSimpleTodayStats(entry,date,r){
  var f=entry&&entry.kind==='content'?shapeToday(entry,date,plan.P,r):null;
  var blocks=f?(f.shaped.blocks||[]):(entry&&entry.blocks||[]);
  var work=blocks.filter(function(b){return ['lunch','buffer','protected'].indexOf(b.kind)<0;});
  var done=0;
  work.forEach(function(b){var d=b.foldedFrom?(state.days[b.foldedFrom]||{}):r;var key=b.foldedFrom?b.foldedBlockId:b.i;var v=(d.checks||{})[key];if(v===true)done++;});
  return {blocks:work,done:done,total:work.length};
}
function renderToday(){
  var date=activeDate(), entry=plan.byDate[date], r=recFor(date), P=plan.P;
  var nx=SM.nextExam(P,date), ts=smSimpleTodayStats(entry,date,r);
  var out=smSimpleHeader('ॐ · TODAY','What do I do today?','Your schedule is already planned. Just take the next unfinished block.');
  out+='<div class="dm24-today-meta">'+
    '<span>'+esc(date)+'</span>'+
    (nx?'<span>Exam · '+esc(nx.iso)+'</span>':'')+
    '<span>'+(state.layer==='empathy'||r.layer==='empathy'?'Empathy mode':'Normal mode')+'</span></div>';
  out+='<div class="dm24-stats">'+smSimpleStat('Blocks',ts.done+' / '+ts.total,'completed')+smSimpleStat('Study target',r.layer==='empathy'?(P.empathyHours||7.25)+' h':P.dailyHours.toFixed(2)+' h','scheduled')+'</div>';
  if(!entry){ out+=card('<div class="eyebrow drape">Today</div><p class="lbl">No scheduled work on this date.</p><p class="muted sm">Use the calendar in Plan when you need to inspect the campaign.</p>','drape'); return out; }
  out+=renderTodaySchedule(entry,date,r,P);
  out+='<div class="dm24-divider"></div>';
  out+=quickMcqCard(entry,date);
  return out;
}

function renderStudy(){
  var B=plan.B, ph=curriculumPhaseNow(), topics=B.topics||[];
  var phaseTopics=topics.filter(function(t){return t.phase===ph;});
  var out=smSimpleHeader('LEARN','Learn the syllabus.','Phase → topic → lecture. Nothing else is required here.');
  out+='<div class="dm24-focus"><b>Current phase</b><span>'+ph+'. '+esc(SM.PHASE_NAME[ph]||('Phase '+ph))+'</span></div>';
  out+='<div class="dm24-section-title">Current phase topics</div><div class="dm24-topic-list">'+phaseTopics.map(function(t){
    var a=topicAcc(t.i); return '<div class="dm24-topic-row"><div><b>'+esc(t.n)+'</b><span>'+t.nlec+' lectures · '+(t.dtq+t.spq).toLocaleString()+' questions</span></div>'+
      '<span class="dm24-topic-pct">'+(a==null?'—':Math.round(a*100)+'%')+'</span></div>'; }).join('')+'</div>';
  out+='<div class="dm24-section-title">All phases</div><div class="dm24-phase-list">'+[1,2,3,4,5,6,7].map(function(k){
    var arr=topics.filter(function(t){return t.phase===k;});
    return '<details><summary><b>'+k+'. '+esc(SM.PHASE_NAME[k]||('Phase '+k))+'</b><span>'+arr.length+' topics</span></summary><div class="dm24-phase-topics">'+arr.map(function(t){return '<div><b>'+esc(t.n)+'</b><span>'+t.nlec+' lectures · '+(t.dtq+t.spq).toLocaleString()+' questions</span></div>';}).join('')+'</div></details>'; }).join('')+'</div>';
  return out;
}

function renderPractice(){
  if(practiceMode==='revise') return renderRevise();
  if(practiceMode==='log') return renderSimpleQuickLog();
  var due=SM.dueQueue(state.misses,Date.now(),60).total;
  var sets=SM.repairSets(state.scores,state.repairs,Date.now(),capDays(),4).total;
  var entry=plan.byDate[activeDate()];
  var out=smSimpleHeader('PRACTICE','Questions without the paperwork.','Log the result in one tap. The adaptive engine handles the rest.');
  out+='<div class="dm24-action-grid"><button class="dm24-primary-action" data-practice="log"><b>Log an MCQ</b><span>Topic → Right · Fragile · Wrong</span></button><button class="dm24-primary-action" data-practice="revise"><b>Revise due</b><span>'+(due?due+' item'+(due===1?'':'s')+' due':'Nothing due')+'</span></button></div>';
  out+='<div class="dm24-stats">'+smSimpleStat('Due',due,'retrieval')+smSimpleStat('Repair sets',sets,'needs another look')+smSimpleStat('Logged',Object.keys(state.mcq||{}).length,'question records')+'</div>';
  return out;
}
function renderSimpleQuickLog(){
  var entry=plan.byDate[activeDate()], out=smSimpleHeader('PRACTICE · LOG','Log an MCQ','Choose a topic, then tap the outcome. That is all.');
  out+=quickMcqCard(entry,activeDate());
  out+='<div class="dm24-back"><button class="btn sm" data-practice="hub">← Back to Practice</button></div>';
  return out;
}

function renderProgressTab(){
  var b=progressBreakdown(), due=SM.dueQueue(state.misses,Date.now(),60).total, pace=paceOverall();
  var cov=b.all.total?Math.round(b.all.done/b.all.total*100):0;
  var qPct=b.questions.total?Math.round(b.questions.done/b.questions.total*100):0;
  var lPct=b.lectures.total?Math.round(b.lectures.done/b.lectures.total*100):0;
  var acc=b.accuracy==null?'—':Math.round(b.accuracy*100)+'%';
  var out=smSimpleHeader('PROGRESS','How am I doing?','A small dashboard. Open the detail only when you actually need it.');
  out+='<div class="dm24-progress-grid">'+
    smSimpleStat('Syllabus',cov+'%',b.all.done+' / '+b.all.total+' min')+
    smSimpleStat('Lectures',lPct+'%',b.lectures.done+' / '+b.lectures.total+' min')+
    smSimpleStat('MCQs',qPct+'%',b.questions.done+' / '+b.questions.total+' min')+
    smSimpleStat('Accuracy',acc,'logged questions')+
    smSimpleStat('Due',due,'retrieval items')+
    smSimpleStat('Pace',pace==null?'—':Math.round(pace)+' s','per question')+'</div>';
  var nx=SM.nextExam(plan.P,todayISO());
  out+='<div class="dm24-focus"><b>Exam</b><span>'+(nx?esc(nx.iso):'Not set')+'</span></div>';
  out+='<details class="dm24-detail"><summary>Detailed progress</summary>';
  out+=card('<div class="eyebrow">Accuracy by topic</div><div class="dm24-mini-list">'+SM.CURRICULUM.map(function(t){var a=topicAcc(t.i);return '<div><span>'+esc(t.n)+'</span><span>'+(a==null?'—':Math.round(a*100)+'%')+'</span></div>';}).join('')+'</div>');
  out+='</details>';
  return out;
}

function renderMore(){
  return smSimpleHeader('MORE','Everything else.','Learn and other less-frequent tools stay here so the main navigation stays calm.')+
    '<div class="dm24-more-list">'+
    '<button data-go-tab="study"><b>Learn</b><span>Open phases, topics and lectures</span></button>'+
    '<button data-go-tab="log"><b>Log an MCQ</b><span>Open the full question logger</span></button>'+
    '<button data-go-tab="plan"><b>Plan</b><span>Inspect or change the campaign</span></button>'+
    '<button data-go-tab="settings"><b>Setup</b><span>Modes, exam date, reminders and backup</span></button>'+
    '<button data-go-tab="help"><b>Help & feedback</b><span>How to use the app and send feedback for improvement</span></button>'+
    '<button data-go-tab="ai"><b>AI tools</b><span>Optional study support</span></button>'+
    '</div>';
}
