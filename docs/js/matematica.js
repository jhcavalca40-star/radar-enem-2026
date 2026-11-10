(() => {
  'use strict';

  const data = mathData;
  const {topics, archive, arch, days, scenarios, pairs, top} = data;
  const metrics = {
    standard:{label:'Questões padrão',match:q=>!!q.archetype},
    modeling:{label:'Questões de modelagem',match:q=>q.type==='Modelagem'},
    crossing:{label:'Questões com cruzamento',match:q=>!!q.second},
    intelligent:{label:'Questões inteligentes',match:q=>q.difficulty==='Inteligente'},
  };
  const profileFields = {
    pattern:q=>q.archetype?'Questão padrão':'Fora dos padrões mapeados',
    combination:q=>!q.second?'Um assunto principal':q.crossArea?'Cruza áreas diferentes':'Cruza assuntos da mesma área',
  };
  const chartValue = (q, field) => profileFields[field]?.(q) ?? q[field];
  const questionById = new Map(archive.map(q => [q.id,q]));
  const topicById = new Map(topics.map(t => [t.id,t]));
  const archById = new Map(arch.map(a => [a.id,a]));
  const trainById = new Map(topics.flatMap(t => t.train).map(r => [r.id,r]));
  const topById = new Map(top.map(q => [q.id,q]));
  const ppl = archive.filter(q => q.bank === 'ENEM PPL');
  const fields = {
    questions: ['mBank','mExam','mQuestionArea','mQuestionType','mQuestionSearch'],
    archetypes: ['mArchArea','mArchSearch'],
    topics: ['mOrder','mArea','mLevel','mDay','mSearch'],
  };
  const page = {questions:0, archetypes:0};
  const sizes = {questions:24, archetypes:12};
  let questionScope = null;
  let evidenceOrigin = null;
  const reviewed = radarProgress.matematica;
  let questionOpener;
  const h = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  const pt = new Intl.NumberFormat('pt-BR');
  const num = n => pt.format(n);
  const percent = (n,total) => `${Math.round(n / total * 100)}%`;
  const normalize = value => String(value ?? '').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim();
  const contains = (query, ...values) => !query || normalize(values.join(' ')).includes(query);
  const value = id => $(id).value;
  const unique = values => [...new Set(values)].sort((a,b) => a.localeCompare(b,'pt-BR',{numeric:true}));
  const motion = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  const reach = (element, focus) => {
    element.scrollIntoView({behavior:motion(), block:'start'});
    if (focus) focus.focus({preventScroll:true});
  };
  const selected = (filter, item) => filter === 'all' || filter === String(item);

  const labels = {'1':'Etapa 1 · Mapeamento','2':'Etapa 2 · Questões padrão','3':'Etapa 3 · Questões inteligentes','4':'Etapa 4 · Cruzamentos',R:'Radar de Matemática'};
  const pdfLink = (code, pageNo, label=labels[code]) => {
    const {url} = radarSources[code];
    const text = `${h(label)}${pageNo ? ` · p. ${pageNo}` : ''}`;
    if (/^https:\/\//i.test(url)) {
      const destination = new URL(url);
      if (pageNo) destination.hash = `page=${pageNo}`;
      return `<a href="${h(destination.href)}" target="_blank" rel="noopener">${text}</a>`;
    }
    return `<a href="#mFonte-${code}" data-local-source>${text} · acervo local</a>`;
  };
  const textBlock = (title, content) => content ? `<div class="math-block"><h4>${h(title)}</h4><p>${h(content)}</p></div>` : '';
  const topicButton = (id, label=id) => `<button type="button" class="tag math-link ${h(id[0])}" data-topic="${h(id)}">${h(label)}</button>`;
  const subjectTags = (...subjects) => [...new Set(subjects.map(s => data.subjectToTopic[s]).filter(Boolean))].map(id=>topicButton(id)).join('');
  const questionLabel = q => `${q.exam} · Q${q.num}`;
  const questionButton = (id, mode='base', label=questionLabel(questionById.get(id))) => `<button type="button" class="math-action" data-question="${h(id)}" data-mode="${mode}">${h(label)}</button>`;
  const archButton = id => `<button type="button" class="tag M" data-arch="${h(id)}">${h(id)}</button>`;
  const stat = (n,label) => `<div class="kpi"><b>${h(n)}</b><span>${h(label)}</span></div>`;
  const empty = message => `<p class="empty">${h(message)}</p>`;

  function renderCover(panel) {
    const math = panel === 'math';
    const preview = math ? countBy(archive,'type').slice(0,3) : countBy(SAS,'k').map(([kind,n])=>[TIPO[kind],n]);
    const label = math ? 'Questões mapeadas · tipos de cobrança' : 'Questões de Química no SAS · tipos de comando';
    const max = Math.max(...preview.map(([,n])=>n));
    const previewRows = preview.map(([name,n])=>`<div class="brand-preview-row"><span>${h(name)}</span><span class="track" aria-hidden="true"><i style="width:${100*n/max}%"></i></span><span class="value">${num(n)}</span></div>`).join('');
    $('coverShortcuts').innerHTML=`<a class="brand-shortcut primary" href="${math?'#mSas':'#sas'}">
      <span class="brand-shortcut-title">Simulados e provas <span aria-hidden="true">↗</span></span><small>${h(label)}</small>
      <div class="brand-preview">${previewRows}</div></a>
      <a class="brand-shortcut" href="${math?'#mTemas':'#temas'}"><span class="brand-shortcut-title">Temas <span aria-hidden="true">↗</span></span>
      <strong>${math?topics.length:T.length}</strong><small>fichas para revisão</small></a>
      <a class="brand-shortcut" href="${math?'#mCruzamentos':'#nCruzamentos'}"><span class="brand-shortcut-title">Cruzamentos <span aria-hidden="true">↗</span></span>
      <strong>${math?scenarios.length:CROSS.length}</strong><small>${math?'cenários de treino':'contextos relacionados'}</small></a>`;
  }

  function optionList(id, first, options) {
    $(id).innerHTML = `<option value="all">${h(first)}</option>` + options.map(item => {
      const [key,label] = Array.isArray(item) ? item : [item,item];
      return `<option value="${h(key)}">${h(label)}</option>`;
    }).join('');
  }

  function switchRadar(panel, userAction=false) {
    const math = panel === 'math';
    const changed = $('mathPanel').hidden === math;
    $('naturePanel').hidden = math;
    $('mathPanel').hidden = !math;
    $('brandMathPartner').hidden = !math;
    if (changed) {
      $('brandArea').textContent = math ? 'Matemática' : 'Ciências da Natureza';
      $('brandDescription').textContent = math
        ? 'Temas de revisão, abordagens e questões dos cadernos mapeados.'
        : 'Física, Química e Biologia em um plano de quatro dias.';
      renderCover(panel);
      window.radarMotion.changeArea();
    }
    tip.hidden = true;
    document.querySelectorAll('.view-nav [data-panel]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.panel === panel)));
    if (userAction) {
      history.replaceState(null,'',math?'#matematica':location.pathname+location.search);
      window.scrollTo({top:0,behavior:'instant'});
      document.querySelector(`.view-nav [data-panel="${panel}"]`).focus({preventScroll:true});
    }
  }

  function updateProgress() {
    const done = topics.filter(t => reviewed[t.id] === true).length;
    $('mTotal').textContent = topics.length;
    $('mMP').textContent = topics.filter(t => t.level === 'MP').length;
    $('mDone').textContent = done;
    $('mProgress').style.width = percent(done,topics.length);
    $('mProgressText').textContent = `${percent(done,topics.length)} do radar revisado`;
    days.forEach((day,index) => {
      const count = day.topics.filter(n => reviewed[`M${String(n).padStart(2,'0')}`] === true).length;
      const el = $(`mDayCard${index+1}`);
      el.querySelector('.bar i').style.width = percent(count,day.topics.length);
      el.querySelector('.count').textContent = `${count}/${day.topics.length} temas revisados`;
    });
  }

  function renderDays() {
    $('mDays').innerHTML = days.map((day,index) => `<button type="button" class="day" data-mday="${index+1}" id="mDayCard${index+1}" aria-pressed="false">
      <span class="num">DIA ${index+1}</span><h3>${h(day.title)}</h3><p>${h(day.text)}</p>
      <div class="mix"><span class="M">Matemática ${day.topics.length}</span></div><div class="bar"><i></i></div><span class="count"></span></button>`).join('');
    updateProgress();
  }

  function renderApproach(a) {
    const source = /^https?:\/\//i.test(a.url || '') ? `<a href="${h(a.url)}" target="_blank" rel="noopener">${h(a.source)}</a>` : h(a.source);
    return `<details class="math-approach" data-approach="${h(a.id)}"><summary>${h(a.title)}</summary>
      <div class="math-line"><span class="chip">${h(a.type)}</span>${a.cross?'<span class="chip">Cruzamento</span>':''}</div>
      ${textBlock('Contexto',a.context)}${source ? `<p class="math-note">Fonte do contexto · ${source}</p>` : ''}
      ${textBlock('Valores da abordagem',a.values)}${textBlock('Comando provável',a.command)}
      <details class="math-approach"><summary>Conferir fórmula, conta e armadilha</summary><code class="formula">${h(a.formula)}</code>
      ${textBlock('Caminho da conta',a.solution)}${textBlock('Armadilha',a.trap)}${textBlock('Cruzamento',a.cross)}</details></details>`;
  }

  function topicCard(t) {
    const first = t.approaches[0];
    const exactLabel = t.exact ? 'no recorte confirmado' : 'no Radar de origem';
    const mainTrap = first.trap;
    return `<article class="card${reviewed[t.id]===true?' done':''}" id="c${t.id}" data-mcard="${t.id}">
      <div class="card-top"><span class="id M" style="padding:1px 6px;border-radius:5px">Matemática ${t.id}</span><span class="lvl ${t.level}">${h(LV[t.level])}</span><span class="dtag">Dia ${t.day}</span></div>
      <h3>${h(t.title)}</h3><div class="stat-line"><span class="chip">${h(t.area)}</span><span class="chip">${t.frequency} ${exactLabel}</span>
      ${t.ppl?`<span class="chip ppl">PPL 2025 · ${t.ppl} ${t.ppl===1?'questão':'questões'}</span>`:''}
      ${t.sas!==null?`<span class="chip">SAS no recorte · ${t.sas}</span>`:''}</div>
      <p class="rev">${h(t.review)}</p><code class="formula">${h(first.formula)}</code><ul><li>${h(mainTrap)}</li></ul>
      <details class="m-topic-details"><summary>Como pode cair e por que está no radar</summary>
        ${textBlock('Por que está no radar',t.why)}
        <p class="math-note">${t.exact?'Contagem conferida na Etapa 2. O total inclui as ocorrências do PPL indicadas.':'Frequência publicada na ficha de origem. Os vínculos disponíveis com a Etapa 2 aparecem abaixo.'} ${pdfLink('R',t.page,'Ficha no PDF')}</p>
        <div class="math-block"><h4>Questões padrão</h4>${t.patterns.map(p=>`<p>${p.id?archButton(p.id)+' ':''}${h(p.name)}</p>`).join('')}</div>
        ${t.approaches.map(renderApproach).join('')}
        <div class="math-block"><h4>Questões de treino</h4><div class="math-training">${t.train.map(q=>questionButton(q.id,'train')).join('')}</div></div>
        ${textBlock('Competências e habilidades nas questões vinculadas',t.skills.join(' · '))}
        ${t.nature.length?`<div class="math-block"><h4>Conexões com Natureza</h4><div class="tags">${t.nature.map(id=>topicButton(id,`${SUB[id[0]]} T${id.slice(1)}`)).join('')}</div></div>`:''}
      </details>
      <label class="check"><input type="checkbox" data-mreview="${t.id}" ${reviewed[t.id]===true?'checked':''}> Revisado</label></article>`;
  }

  function renderTopics() {
    const [order,area,level,day,raw] = fields.topics.map(value);
    const search = normalize(raw);
    const list = topics.filter(t => selected(area,t.area) && selected(level,t.level) && selected(day,t.day)
      && contains(search,t.id,t.tid,t.title,t.area,t.review,...t.approaches.flatMap(a=>[a.title,a.context,a.formula,a.command,a.trap])))
      .sort(order==='frequency'?(a,b)=>b.frequency-a.frequency || ORD[a.level]-ORD[b.level]:(a,b)=>a.day-b.day || ORD[a.level]-ORD[b.level] || a.id.localeCompare(b.id));
    $('mCount').textContent = `${list.length} de ${topics.length} temas`;
    $('mGrid').innerHTML = list.length ? list.map(topicCard).join('') : empty('Nenhum tema com esses filtros.');
    document.querySelectorAll('[data-mday]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mday===day)));
  }

  function jumpMath(id) {
    if (!topicById.has(id)) return;
    switchRadar('math');
    ['mArea','mLevel','mDay'].forEach(name=>$(name).value='all');
    $('mSearch').value='';
    renderTopics();
    const card = $(`c${id}`);
    const details = card.querySelector('.m-topic-details');
    details.open = true;
    reach(card,details.querySelector('summary'));
    if (motion()==='smooth') card.animate?.([{boxShadow:'0 0 0 3px var(--math)'},{boxShadow:'0 0 0 0 transparent'}],{duration:1200});
  }

  function countBy(list, field) {
    const count = new Map();
    list.forEach(q=>{
      const label=chartValue(q,field);
      if(label) count.set(label,(count.get(label)||0)+1);
    });
    return [...count].sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0],'pt-BR'));
  }

  function barRow(label, n, max, attrs='') {
    const tag = attrs ? 'button' : 'div';
    const config = attrs ? `type="button" ${attrs}` : '';
    return `<${tag} class="row${attrs?'':' math-static'}" ${config}><span class="lbl">${h(label)}</span><span class="trk" aria-hidden="true"><span class="fill" style="width:${max?n/max*100:0}%"></span></span><span class="val">${num(n)}</span></${tag}>`;
  }

  function mathChart(title, list, attrs, maxRows=list.length) {
    const showRows = rows=>rows.map(([label,n])=>barRow(label,n,list[0]?.[1],attrs(label))).join('');
    return `<div class="chart math-chart"><h3>${h(title)}</h3><div class="rows">${showRows(list.slice(0,maxRows))}</div>
      ${list.length>maxRows?`<details><summary>Ver mais (${list.length-maxRows})</summary><div class="rows">${showRows(list.slice(maxRows))}</div></details>`:''}</div>`;
  }

  function renderChartsMath() {
    const exams = new Set(archive.map(q=>q.exam));
    const allApproaches = topics.flatMap(t=>t.approaches);
    const contextSources = new Set(allApproaches.map(a=>a.url).filter(Boolean));
    $('mBaseKpis').innerHTML = [stat(num(archive.length),'questões de Matemática mapeadas'),stat(exams.size,`${exams.size-1} simulados e a prova PPL 2025`),
      stat(allApproaches.length,'abordagens nos 25 temas'),stat(contextSources.size,'links de contexto usados nas abordagens')].join('');
    const topicOrSubject = label => data.subjectToTopic[label] ? `data-topic="${data.subjectToTopic[label]}"` : `data-base-subject="${h(label)}"`;
    $('mCharts').innerHTML = mathChart('Questões por área',countBy(archive,'area'),area=>`data-base-area="${h(area)}"`)
      + mathChart('Assuntos mais cobrados',countBy(archive,'subject'),topicOrSubject,10)
      + mathChart('Assuntos no PPL 2025',countBy(ppl,'subject'),label=>`data-base-subject="${h(label)}" data-bank="ENEM PPL"`,8);

  }

  function renderBankComparison() {
    const key = value('mComparisonMetric'), metric = metrics[key];
    const byBank=value('mComparisonGroup')==='bank', bankFilter=value('mAnalysisBank');
    const grouped = new Map();
    for (const q of archive) {
      if (!byBank && !selected(bankFilter,q.bank)) continue;
      const label = byBank ? q.bank : q.exam;
      if (!grouped.has(label)) grouped.set(label,{bank:q.bank, exams:new Set(), matches:0});
      const row=grouped.get(label);
      row.exams.add(q.exam);
      if (metric.match(q)) row.matches++;
    }
    const scores=[...grouped].map(([label,row])=>({label,...row,score:row.matches/row.exams.size}))
      .sort((a,b)=>b.score-a.score || a.label.localeCompare(b.label,'pt-BR'));
    const max=Math.round(scores[0].score*10)/10;
    const bars=rows=>rows.map(({label,bank,exams,score})=>barRow(
      byBank ? `${label} · ${exams.size} ${exams.size===1?'caderno':'cadernos'}` : label,
      Math.round(score*10)/10,max,`data-comparison-bank="${h(bank)}" data-comparison-exam="${h(byBank?'all':label)}" data-comparison-metric="${key}"`
    )).join('');
    window.radarMotion.renderBars($('mComparisonRows'),bars(scores.slice(0,10))+(scores.length>10?`<details><summary>Ver mais ${scores.length-10} cadernos</summary><div class="rows">${bars(scores.slice(10))}</div></details>`:''));
    $('mComparisonNote').textContent=byBank
      ? 'Média de questões por caderno de cada banca. O PPL 2025 é uma referência de uma prova. Clique para abrir as questões que compõem a média.'
      : 'Contagem por caderno no indicador escolhido. A seleção de banca acima define os cadernos comparados.';
  }

  function fillAnalysisExams() {
    optionList('mAnalysisExam','Todos os cadernos',unique(archive.filter(q=>selected(value('mAnalysisBank'),q.bank)).map(q=>q.exam)));
  }

  function renderAnalysis() {
    const bank=value('mAnalysisBank'), exam=value('mAnalysisExam');
    const list=archive.filter(q=>selected(bank,q.bank)&&selected(exam,q.exam));
    const examCount=new Set(list.map(q=>q.exam)).size;
    const classified=list.filter(metrics.standard.match).length;
    const crossed=list.filter(metrics.crossing.match).length;
    $('mSasKpis').innerHTML = [stat(num(list.length),'questões mapeadas'),stat(examCount,examCount===1?'caderno':'cadernos'),
      stat(num(classified),'questões seguem um padrão'),stat(num(crossed),'cruzam dois assuntos')].join('');
    const baseAttrs=`data-bank="${h(bank)}" data-exam="${h(exam)}"`;
    const chart=(title,field,limit)=>mathChart(title,countBy(list,field),label=>`${baseAttrs} data-chart-field="${field}" data-chart-value="${h(label)}"`,limit);
    window.radarMotion.renderBars($('mSasCharts'),chart('Assunto principal','subject',8)+chart('Áreas de Matemática','area',8)
      +chart('Tipos de cobrança','type')+chart('Competências','competency')+chart('Habilidades','skill',8)+chart('Recursos visuais','visual'));
    window.radarMotion.renderBars($('mProfileCharts'),chart('Classificação Heron','difficulty')+chart('Questões padrão','pattern')+chart('Cruzamento de assuntos','combination'));
    const label=exam!=='all'?exam:bank!=='all'?bank:'Base completa · 38 simulados e ENEM PPL 2025';
    $('mAnalysisNote').innerHTML=`${h(label)} · ${pdfLink('1',null,'Ver mapeamento em PDF')}`;
  }

  function pager(key,id,total) {
    const limit=sizes[key], pages=Math.max(1,Math.ceil(total/limit));
    page[key] = Math.min(page[key],pages-1);
    $(id).innerHTML = pages<=1 ? '' : `<button type="button" class="math-action" data-page="${key}" data-step="-1" ${page[key]===0?'disabled':''}>Anterior</button>
      <span class="count" aria-live="polite">Página ${page[key]+1} de ${pages}</span><button type="button" class="math-action" data-page="${key}" data-step="1" ${page[key]+1===pages?'disabled':''}>Próxima</button>`;
    return page[key]*limit;
  }

  function fillExams() {
    const bank=value('mBank');
    optionList('mExam','Todos os cadernos',unique(archive.filter(q=>selected(bank,q.bank)).map(q=>q.exam)));
  }

  function renderQuestions() {
    const [bank,exam,area,type,raw] = fields.questions.map(value);
    const search = normalize(raw), number = search.match(/^q?\s*(\d{3})$/)?.[1];
    const matchesScope = q => {
      if (!questionScope) return true;
      if (questionScope.pair) return q.second && [q.subject,q.second].sort().join('|')===questionScope.pair;
      if (questionScope.metric) return metrics[questionScope.metric].match(q);
      return chartValue(q,questionScope.field)===questionScope.value;
    };
    const list = archive.filter(q => selected(bank,q.bank) && selected(exam,q.exam) && selected(area,q.area) && selected(type,q.type) && matchesScope(q)
      && (number?String(q.num)===number:contains(search,q.exam,q.num,q.subject,q.subtopic,q.competency,q.skill,q.type,q.context,q.archetype,q.second,q.difficulty)));
    const label = list.length===1?'questão':'questões';
    $('mQuestionCount').innerHTML = `${num(list.length)} ${label}${questionScope?` <button type="button" class="math-action" data-clear-scope>Limpar · ${h(questionScope.label)}</button>`:''}`;
    const start=pager('questions','mQuestionPages',list.length);
    $('mQuestions').innerHTML = list.length ? list.slice(start,start+sizes.questions).map(q=>`<tr>
      <td>${questionButton(q.id)}</td><td>${h(q.subject)} ${subjectTags(q.subject)}</td>
      <td>${h(q.type)}</td><td>${h(q.competency)} · ${h(q.skill)}</td><td>${q.archetype?archButton(q.archetype):'—'}</td></tr>`).join('')
      : `<tr><td colspan="5">${empty('Nenhuma questão com esses filtros.')}</td></tr>`;
  }

  function setQuestionFilters({bank='all',exam='all',area='all',type='all',scope=null}={}) {
    $('mBank').value=bank;
    fillExams();
    $('mExam').value=exam;
    $('mQuestionArea').value=area;
    $('mQuestionType').value=type;
    $('mQuestionSearch').value='';
    questionScope=scope;
    page.questions=0;
    renderQuestions();
  }

  function clearEvidence() {
    evidenceOrigin = null;
    $('mEvidenceReturn').hidden = true;
  }

  function openBase(filters, origin) {
    setQuestionFilters(filters);
    const labels = [filters.scope?.label,filters.area,filters.type,filters.exam,filters.bank].filter(label=>label && label!=='all');
    evidenceOrigin = origin;
    $('mEvidenceReturn').hidden = false;
    $('mEvidenceLabel').textContent = ['Recorte do gráfico',...labels].join(' · ');
    reach($('mQuestaoBase'),$('mBank'));
    if (motion()==='smooth') $('mEvidenceReturn').animate([{backgroundColor:'var(--brand-soft)'},{backgroundColor:'var(--brand-tint)'}],{duration:550,easing:'ease-out'});
  }

  function renderArchetypes() {
    const area=value('mArchArea'), search=normalize(value('mArchSearch'));
    const list=arch.filter(a=>selected(area,a.area)&&contains(search,a.id,a.title,a.prompt,a.formulas));
    $('mArchCount').textContent=`${list.length} de ${arch.length} padrões`;
    const start=pager('archetypes','mArchPages',list.length);
    $('mArch').innerHTML=list.length?list.slice(start,start+sizes.archetypes).map(a=>`<details id="ma${a.id}"><summary><strong>${a.id}</strong> ${h(a.title)} · ${a.total} questões</summary>
      <div class="math-line"><span class="chip">${h(a.area)}</span><span class="chip">${a.exams} cadernos</span><span class="chip">${a.banks} bancas</span><span class="chip">${a.sas} SAS · ${a.ppl} PPL</span>${subjectTags(a.subject)}</div>
      ${textBlock('Como a banca cobra',a.prompt)}${textBlock('Roteiro',a.steps)}<code class="formula">${h(a.formulas)}</code>${textBlock('Armadilhas',a.trap)}
      <div class="math-training">${a.examples.map(id=>questionButton(id)).join('')}</div><p class="math-note">${pdfLink('2',a.page,'Roteiro e recortes no PDF')}</p></details>`).join(''):empty('Nenhum padrão encontrado.');
  }

  function openArchetype(id) {
    if (!archById.has(id)) return;
    $('mArchArea').value='all';
    $('mArchSearch').value=id;
    page.archetypes=0;
    renderArchetypes();
    const item=$(`ma${id}`);
    item.open=true;
    reach(item,item.querySelector('summary'));
  }

  const axes = ['Elegância','Modelagem','Cruzamento','Distratores','Contexto'];
  function renderTop() {
    const list=top.filter(q=>selected(value('mTopArea'),q.area));
    $('mTopCount').textContent=`${list.length} de ${top.length} selecionadas`;
    $('mTop').innerHTML=list.map(q=>`<article class="bet" data-top-rank="${q.rank}">
      <div class="math-line"><span class="math-code">#${String(q.rank).padStart(2,'0')}</span><span class="chip">${q.total}/25</span><span class="chip">${h(q.area)}</span></div>
      <h3>${h(questionLabel(questionById.get(q.id)))}</h3><p class="note">${h(q.subject)}</p>
      <div class="math-metric">${axes.map((name,i)=>`<span>${name} ${q.scores[i]}/5</span>`).join('')}</div>
      <div class="math-line">${questionButton(q.id,'top','Abrir enunciado')}${subjectTags(q.subject)}</div>
      <details><summary>Ver sacada e resolução</summary>${textBlock('A sacada',q.idea)}${textBlock('Por que se destaca',q.why)}${textBlock('Resolução',q.solution)}${textBlock('Armadilha',q.trap)}
      ${textBlock('Gabarito da resolução',q.answer)}${textBlock('Observação do avaliador',q.note)}</details>
      </article>`).join('');
  }

  function renderPairs() {
    const crossed=archive.filter(q=>q.second).length;
    const distinctAreas=archive.filter(q=>q.crossArea).length;
    $('mCrossKpis').innerHTML=[stat(crossed,'questões com dois assuntos de Matemática'),stat(distinctAreas,'questões cruzam áreas diferentes'),
      stat(pairs.length,'pares observados'),stat(scenarios.length,'cenários de treino')].join('');
    const pairRows = list=>list.map(p=>barRow(`${p.a} × ${p.b}`,p.total,pairs[0].total,`data-pair="${h([p.a,p.b].sort().join('|'))}" data-pair-label="${h(`${p.a} × ${p.b}`)}"`)).join('');
    $('mPairs').innerHTML=`<div class="math-chart"><h3>Pares que já apareceram juntos</h3><div class="rows">${pairRows(pairs.slice(0,8))}</div>
      <details><summary>Ver outros ${pairs.length-8} pares</summary><div class="rows">${pairRows(pairs.slice(8))}</div></details></div>`;
  }

  function renderScenarios() {
    const list=scenarios.filter(s=>selected(value('mCrossType'),s.type)&&selected(value('mCrossLevel'),s.level));
    $('mCrossCount').textContent=`${list.length} de ${scenarios.length} cenários`;
    $('mScenarios').innerHTML=list.length ? list.map(s=>`<article class="cx" data-scenario="${s.id}">
      <div class="math-line"><span class="math-code">${s.id}</span><span class="chip">${h(s.type)} · ${h(s.level)}</span></div><h3>${h(s.title)}</h3>
      <p>${h(s.a)} × ${h(s.b)}</p><div class="tags">${subjectTags(s.a,s.b)}</div><p>${s.total} ${s.total===1?'questão observada':'questões observadas'} no recorte</p>
      <details><summary>Como pode cair</summary>${textBlock('Contexto provável',s.context)}${textBlock('Comando',s.command)}${textBlock('O que cobra',s.formula)}
      ${textBlock('Armadilha',s.trap)}${textBlock('Por que pode cair',s.why)}${s.refs.length?`<div class="math-block"><h4>Questões relacionadas</h4><div class="math-training">${s.refs.map(id=>questionButton(id)).join('')}</div></div>`:''}
      <p class="math-note">${pdfLink('4',s.page,'Cenário no PDF')}</p></details></article>`).join(''):empty('Nenhum cenário com esses filtros.');
  }

  function openQuestion(id, mode, opener) {
    const q=questionById.get(id), image=data.images[id], training=trainById.get(id), selectedTop=topById.get(id);
    const sources=data.locations[id] || {};
    const crop=image?`<figure class="math-figure">
      <button type="button" class="math-action crop-toggle" aria-pressed="false">Ampliar recorte</button>
      <div class="crop-scroll"><img alt="Recorte do enunciado · ${h(questionLabel(q))}" src="imagens/questoes/${h(image.file)}" width="${image.width}" height="${image.height}" decoding="async"></div>
      <figcaption>${pdfLink(image.source,image.page,'Origem do recorte')}</figcaption></figure>`:'';
    const pdfs=Object.entries(sources).filter(([source])=>source!==image?.source).map(([source,n])=>pdfLink(source,n)).join(' · ');
    const answer=mode==='train' && training?training.answer:mode==='top'&&selectedTop?selectedTop.answer:q.answer;
    const summary=mode==='train'&&training?training.summary:q.summary;
    const answerVariants=[...new Set([q.answer,q.changedAnswer,training?.answer,selectedTop?.answer].filter(Boolean))];
    const note=answerVariants.length>1 ? `<p class="math-note"><b>Conferir gabarito.</b> Registros nas fontes · ${h(answerVariants.join(' / '))}.</p>` : '';
    $('mDialogTitle').textContent=questionLabel(q);
    $('mDialogBody').innerHTML=`<p class="lead">${h([q.subject,q.subtopic].filter(Boolean).join(' · '))}</p>
      <div class="math-line"><span class="chip">${h(q.competency)} · ${h(q.skill)}</span><span class="chip">${h(q.type)}</span><span class="chip">${h(q.difficulty)}</span></div>
      ${crop}${!image&&!pdfs?`<p class="math-note">Referência na Etapa 1 · caderno ${h(q.exam)}, página ${h(q.page)}. ${pdfLink('1',null,'Ver mapeamento em PDF')}</p>`:''}
      ${pdfs ? `<p class="math-note">${pdfs}</p>` : ''}
      <details class="math-approach"><summary>Ver o que cobra e o gabarito da análise</summary>${textBlock('O que cobra',summary)}${textBlock('Segundo assunto',q.second)}${textBlock('Gabarito da fonte',answer)}${note}</details>`;
    questionOpener=opener;
    $('mQuestionDialog').showModal();
    $('mDialogBody').scrollTop=0;
    $('mDialogClose').focus();
  }

  function setup() {
    optionList('mArea','Todas as áreas',unique(topics.map(t=>t.area)));
    optionList('mLevel','Todos os níveis',Object.entries(LV));
    optionList('mDay','Todos os dias',days.map((_,i)=>[i+1,`Dia ${i+1}`]));
    const banks=unique(archive.map(q=>q.bank));
    optionList('mAnalysisBank','Todas as bancas',banks);
    optionList('mBank','Todas as bancas',banks);
    optionList('mQuestionArea','Todas as áreas',unique(archive.map(q=>q.area)));
    optionList('mQuestionType','Todos os tipos',unique(archive.map(q=>q.type)));
    $('mComparisonMetric').innerHTML=Object.entries(metrics).map(([key,{label}])=>`<option value="${key}">${h(label)}</option>`).join('');
    optionList('mArchArea','Todas as áreas',unique(arch.map(a=>a.area)));
    optionList('mTopArea','Todas as áreas',unique(top.map(q=>q.area)));
    optionList('mCrossType','Todos os tipos',unique(scenarios.map(s=>s.type)));
    optionList('mCrossLevel','Todas as classificações',['Alta','Média','Ousada']);
    const standard=arch.reduce((sum,a)=>sum+a.total,0);
    $('mArchKpis').innerHTML=[stat(arch.length,'arquétipos'),stat(num(standard),'questões seguem um padrão'),stat(percent(standard,archive.length),'das questões mapeadas')].join('');
    $('mTraps').innerHTML=data.traps.map(t=>`<div class="trap"><h3>${h(t.title)}</h3><p>${h(t.text)}</p><div class="tags">${topicButton(t.key)}<span class="chip">Ref. ${h(t.source)}</span></div></div>`).join('');
    $('mSources').innerHTML=`Base de Matemática · Heron Andrade, com Atlas Zênite e Apeiron. Questões, roteiros, recortes e abordagens provêm dos materiais fornecidos. O banco de pesquisa contém ${data.contextBank} registros de contexto. Os gabaritos das análises são resoluções próprias. Os níveis seguem a fonte e os cenários são projeções de estudo.
      <h2>Acervo de Matemática</h2><ul class="source-list">${Object.entries(labels).map(([code,label])=>`<li id="mFonte-${code}" tabindex="-1">
      <b>${h(label)}</b><span>${h(radarSources[code].file)}</span>
      ${radarSources[code].url ? pdfLink(code,null,'Abrir PDF') : '<span>PDF disponível no acervo local.</span>'}</li>`).join('')}</ul>`;
    fillAnalysisExams();renderAnalysis();renderBankComparison();setQuestionFilters();renderCover('nature');
    renderDays();renderChartsMath();renderArchetypes();renderTop();renderPairs();renderScenarios();renderTopics();
  }

  setup();
  window.switchRadar=switchRadar;
  window.radarMath={jump:jumpMath};
  if (location.hash==='#matematica' || /^#m[A-Z]/.test(location.hash)) {
    switchRadar('math');
    requestAnimationFrame(()=>$(location.hash.slice(1))?.scrollIntoView({behavior:'instant'}));
  }
  window.addEventListener('hashchange',()=>{
    const target=$(location.hash.slice(1));
    if(location.hash==='#matematica') {switchRadar('math');return;}
    const panel=target?.closest('.radar-panel');
    if (panel?.hidden) {switchRadar(panel.id==='mathPanel'?'math':'nature');reach(target);}
  });
  document.querySelectorAll('button[data-panel]').forEach(button=>{
    button.addEventListener('click',()=>switchRadar(button.dataset.panel,true));
  });
  $('mathPanel').addEventListener('click',event=>{
    const b=event.target.closest('button');
    if (!b) return;
    const d=b.dataset;
    if (d.topic) {jump(d.topic);return;}
    if (d.arch) {openArchetype(d.arch);return;}
    if (d.question) {openQuestion(d.question,d.mode,b);return;}
    if (d.mday) {
      $('mDay').value=value('mDay')===d.mday?'all':d.mday;
      renderTopics();
      reach($('mTemas'),$('mDay'));
      return;
    }
    if (d.pair) {openBase({scope:{pair:d.pair,label:d.pairLabel}},b);return;}
    if (d.chartField) {openBase({bank:d.bank,exam:d.exam,scope:{field:d.chartField,value:d.chartValue,label:d.chartValue}},b);return;}
    if (d.comparisonBank) {openBase({bank:d.comparisonBank,exam:d.comparisonExam,scope:{metric:d.comparisonMetric,label:metrics[d.comparisonMetric].label}},b);return;}
    if (d.baseArea) {openBase({bank:d.bank,area:d.baseArea},b);return;}
    if (d.baseType) {openBase({bank:d.bank,type:d.baseType},b);return;}
    if (d.baseSubject) {openBase({bank:d.bank,scope:{field:'subject',value:d.baseSubject,label:d.baseSubject}},b);return;}
    if ('clearScope' in d) {questionScope=null;clearEvidence();page.questions=0;renderQuestions();$('mQuestionSearch').focus();return;}
    if (d.page) {
      page[d.page]+=Number(d.step);
      const render=d.page==='questions'?renderQuestions:renderArchetypes;
      render();
      const buttons=[...document.querySelectorAll(`button[data-page="${d.page}"]:not([disabled])`)];
      (buttons.find(x=>x.dataset.step===d.step)||buttons[0])?.focus();
    }
  });
  $('mGrid').addEventListener('change',event=>{
    const input=event.target;
    const id=input.dataset.mreview;
    if(!id) return;
    radarProgress.mark('matematica',id,input.checked);
  });
  document.addEventListener('radar-progress-changed',()=>{
    $('mGrid').querySelectorAll('[data-mreview]').forEach(input=>{
      input.checked=reviewed[input.dataset.mreview]===true;
      input.closest('.card').classList.toggle('done',input.checked);
    });
    updateProgress();
  });
  const wire = (ids,listener) => ids.forEach(id=>$(id).addEventListener($(id).type==='search'?'input':'change',listener));
  wire(fields.topics,renderTopics);
  wire(fields.questions,event=>{if(event.target.id==='mBank') fillExams();page.questions=0;renderQuestions();});
  wire(['mAnalysisBank','mAnalysisExam'],event=>{
    clearEvidence();
    if(event.target.id==='mAnalysisBank') {
      fillAnalysisExams();
      renderBankComparison();
    }
    renderAnalysis();
    setQuestionFilters({bank:value('mAnalysisBank'),exam:value('mAnalysisExam')});
  });
  wire(['mComparisonGroup','mComparisonMetric'],renderBankComparison);
  wire(fields.archetypes,()=>{page.archetypes=0;renderArchetypes();});
  wire(['mTopArea'],renderTop);
  wire(['mCrossType','mCrossLevel'],renderScenarios);
  $('mBackToGraph').addEventListener('click',()=>{
    const origin = evidenceOrigin?.isConnected ? evidenceOrigin : $('mSas');
    origin.scrollIntoView({behavior:motion(),block:'center'});
    origin.focus({preventScroll:true});
  });
  const dialog=$('mQuestionDialog');
  $('mDialogClose').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{
    $('mDialogBody').replaceChildren();
    questionOpener?.focus({preventScroll:true});
    questionOpener=undefined;
  });
  $('mDialogBody').addEventListener('click',event=>{
    const source=event.target.closest('[data-local-source]');
    if(source) {
      event.preventDefault();
      const target=$(source.hash.slice(1));
      questionOpener=target;
      dialog.close();
      history.replaceState(null,'',source.hash);
      reach(target,target);
      return;
    }
    const button=event.target.closest('.crop-toggle');
    if(!button) return;
    const zoom=button.getAttribute('aria-pressed')==='false';
    const crop=button.nextElementSibling;
    button.setAttribute('aria-pressed',String(zoom));
    button.textContent=zoom?'Ajustar à tela':'Ampliar recorte';
    crop.classList.toggle('zoomed',zoom);
    if(zoom) {
      crop.tabIndex=0;
      crop.setAttribute('role','region');
      crop.setAttribute('aria-label','Recorte ampliado, com rolagem lateral');
    } else {
      crop.scrollLeft=0;
      crop.removeAttribute('tabindex');
      crop.removeAttribute('role');
      crop.removeAttribute('aria-label');
    }
  });
})();
