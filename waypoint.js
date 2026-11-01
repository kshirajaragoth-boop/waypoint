'use strict';

(() => {
  const LOCAL_PREVIEW = window.WAYPOINT_IS_LOCAL_PREVIEW(location.protocol, location.search);
  const HOSTED_PREVIEW = LOCAL_PREVIEW && location.protocol !== 'file:';
  const STORAGE_KEY = HOSTED_PREVIEW ? 'waypoint.preview.workspace.v1' : 'waypoint.workspace.v1';
  const ATTACHMENT_DB = HOSTED_PREVIEW ? 'waypoint.preview.attachments.v1' : 'waypoint.attachments.v1';
  const REMOTE_API = location.protocol !== 'file:' && !LOCAL_PREVIEW;
  const MAX_LOCAL_FILE_BYTES = 10 * 1024 * 1024;
  const MAX_REMOTE_FILE_BYTES = 2.5 * 1024 * 1024;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const id = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  const shortDate = value => new Date(value).toLocaleDateString(undefined, {month:'short', day:'numeric'});
  const timeLabel = value => new Date(value).toLocaleTimeString(undefined, {hour:'numeric', minute:'2-digit'});
  const DEFAULT_TAGS = ['Observation', 'Assumption', 'Question', 'Quote', 'Idea', 'Follow-up', 'Care', 'Resource'];
  const PEOPLE_DIRECTORY = [
    {id:'manuel-beltran',name:'Manuel Beltrán',role:'Assistant Professor – Senior Scale',institution:'Srishti Manipal Institute',focus:'Artist and researcher working across technology, society, media, AI, and online influence.',url:'https://srishtimanipalinstitute.in/teaching_faculty/manuel-beltran/',initials:'MB',tone:'peach'},
    {id:'naveen-bagalkot',name:'Naveen Bagalkot, PhD',role:'Professor',institution:'Srishti Manipal Institute',focus:'Design researcher working across HCI, participatory design, STS, and community-based care.',url:'https://srishtimanipalinstitute.in/teaching_faculty/naveen-bagalkot/',initials:'NB',tone:'sage'},
    {id:'shatarupa-bhattacharyya',name:'Shatarupa Bhattacharyya, PhD',role:'Assistant Professor – Senior Scale',institution:'Srishti Manipal Institute',focus:'Theatre artist and social scientist working across theatre and cultural studies.',url:'https://srishtimanipalinstitute.in/teaching_faculty/dr-shatarupa-bhattacharyya/',initials:'SB',tone:'blue'}
  ];
  const iconPaths = {
    plus:'M12 5v14M5 12h14', search:'M16.5 10a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0ZM15 15l6 6',
    chat:'M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z',
    notes:'M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2 5h6M9 12h6M9 16h4',
    themes:'M9 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12 14a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9 19a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-14a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9 5h6M6 8v8m12-8v8M9 19h6',
    people:'M15 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M13 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm4-3a4 4 0 0 1 0 8m4 9v-2a4 4 0 0 0-3-3.9',
    brief:'M3 7h18v13H3zM8 7V4h8v3M3 12h18M10 12v2h4v-2', close:'m6 6 12 12M6 18 18 6',
    arrow:'M5 12h14m-5-5 5 5-5 5', external:'M7 17 17 7M7 7h10v10', chevron:'m9 18 6-6-6-6', menu:'M4 7h16M4 12h16M4 17h16',
    send:'M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z', folder:'M3 6h7l2 2h9v11H3z',
    trash:'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7', download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
    waypoint:'M4 18 9 6l4 9 3-6 4 9M18 5h.01', dots:'M5 12h.01M12 12h.01M19 12h.01',
    file:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm0 0v6h6M8 13h8m-8 4h8',
    image:'M4 4h16v16H4zM4 15l4-4 4 4 3-3 5 5M14.5 9.5h.01'
  };
  const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${iconPaths[name] || iconPaths.waypoint}"/></svg>`;
  const brand = () => `<span class="brand-mark"><svg viewBox="0 0 185 145" aria-hidden="true"><path d="M66.33 119.08C57.51 116.87 54.89 114.12 38.39 89.74 29.74 76.96 20.31 63.3 17.43 59.4 8.21 46.86 6.61 41.3 9.44 31.55 14.04 15.75 32.24 8.56 47.14 16.67c6.2 3.38 6.08 3.23 21.97 27.65l12.91 19.83 7.89-11.96c7.35-11.11 8.31-12.15 13.73-14.8 7.95-3.89 14.77-3.89 22.72 0 5.58 2.73 6.24 3.48 15.48 17.66 5.32 8.14 9.95 14.84 10.31 14.88.36.04 3.63-2.63 7.27-5.93 5.73-5.19 7.15-6 10.54-6 3.99 0 7.04 2.54 7.04 5.85 0 1.73-22.42 39.79-25.25 42.87-3.66 3.98-10.23 5.83-15.6 4.4-6.18-1.65-6.99-2.49-17.46-18.1-5.44-8.12-9.22-12.89-9.5-12-.78 2.51-17.32 28.31-20.02 31.23-5.02 5.43-15.69 8.61-22.84 6.83Z" fill="#fbf2e8"/><circle cx="164.5" cy="29.9" r="16.6" fill="var(--coral)"/></svg></span><span>Waypoint</span>`;
  let data = loadData();
  let activeProjectId = null;
  let activeChatId = null;
  let view = 'chat';
  let modal = null;
  let sidebarOpen = false;
  let sidebarCollapsed = false;
  let projectsExpanded = true;
  let activeTag = '';
  let authMode = 'login';
  let toastTimer;
  let introTimer;
  let dismissBrandIntro=()=>{};
  let remoteAuthenticated = false;
  let remoteSyncTimer = 0;
  let remoteSyncChain = Promise.resolve();
  let lastPageKey = '';

  function makeHealthcareDemo() {
    if (typeof window.WAYPOINT_CAREPATH !== 'function') {
      throw new Error('CarePath demo data did not load.');
    }
    return window.WAYPOINT_CAREPATH();
  }
  function blankData() {
    const demo=makeHealthcareDemo();
    return {profile:null,projects:[demo.project],people:demo.people,demoDismissed:false};
  }
  function loadData() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!saved || typeof saved !== 'object') return blankData();
      if (saved.profile?.name) saved.profile.name=String(saved.profile.name).toLowerCase();
      const projects = Array.isArray(saved.projects) ? saved.projects : [];
      const people = Array.isArray(saved.people) ? saved.people : [];
      projects.forEach(project => {
        project.chats ||= [];
        project.notes ||= [];
        project.people ||= [];
        project.links ||= [];
        project.brief ||= {};
        project.tags ||= [];
        project.notes.forEach(note => { note.tags ||= []; });
        if(!Array.isArray(saved.people))project.people.forEach(person=>{
          const exists=people.some(entry=>entry.directoryId===person.directoryId||(entry.name===person.name&&entry.url===person.url));
          if(!exists)people.push({...person,role:person.role||person.aff||'',notes:person.notes||person.ev||''});
        });
      });
      const demo=makeHealthcareDemo();
      const existingDemo=projects.find(project=>project.demoId==='healthcare-research');
      if(existingDemo)window.WAYPOINT_CAREPATH.mergeProject(existingDemo,demo.project);
      else projects.unshift(demo.project);
      demo.people.forEach(person => {
        if (!people.some(existing => existing.id === person.id)) people.push(person);
      });
      const demoDismissed=false;
      return {profile:saved.profile || null, projects, people,demoDismissed};
    } catch { return blankData(); }
  }
  function persist() {
    let localSaved=true;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    catch {
      localSaved=false;
      showToast(REMOTE_API?'Browser cache is full; saving your workspace to your account.':'Could not save in this browser. Export your work before leaving.');
    }
    if (REMOTE_API && remoteAuthenticated) scheduleRemoteSync();
    return localSaved;
  }
  async function requestJson(path, options={}) {
    const response=await fetch(path,{credentials:'same-origin',...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(options.headers||{})}});
    let payload={};
    try { payload=await response.json(); } catch { payload={}; }
    if(!response.ok){
      const error=new Error(payload.error||`Request failed (${response.status}).`);
      error.status=response.status;
      throw error;
    }
    return payload;
  }
  function scheduleRemoteSync() {
    clearTimeout(remoteSyncTimer);
    remoteSyncTimer=setTimeout(async()=>{
      try { await syncRemoteWorkspace(); }
      catch(error) { showToast(`Could not sync your workspace: ${error.message}`); }
    },350);
  }
  async function syncRemoteWorkspace() {
    clearTimeout(remoteSyncTimer);
    if(!remoteAuthenticated)return;
    const snapshot=JSON.stringify(data);
    const operation=remoteSyncChain.then(()=>requestJson('/api/workspace',{method:'PUT',body:snapshot}));
    remoteSyncChain=operation.then(()=>undefined,()=>undefined);
    const result=await operation;
    if(result.warning)showToast(result.warning);
  }
  async function loadRemoteWorkspace() {
    try {
      const {user}=await requestJson('/api/auth');
      const workspace=await requestJson('/api/workspace');
      data={...workspace,profile:user};
      remoteAuthenticated=true;
      render();
    } catch(error) {
      remoteAuthenticated=false;
      data.profile=null;
      render();
      if(error.status!==401)showToast(error.message);
    }
  }
  function currentProject() { return data.projects.find(project => project.id === activeProjectId) || null; }
  function currentChat() { return currentProject()?.chats.find(chat => chat.id === activeChatId) || null; }
  function touch(project) { project.updatedAt = Date.now(); }
  function showToast(message) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 2600);
  }
  function render() {
    const app = $('#app');
    if (!modal) $('#dialog-root').innerHTML = '';
    if (!introTimer) startBrandIntro();
    const pageKey=`${data.profile?.id||'auth'}:${activeProjectId||'home'}:${view}:${activeChatId||''}`;
    const animate=!!lastPageKey&&pageKey!==lastPageKey;
    if (!data.profile) {
      app.innerHTML = renderAuth();
    } else if (!currentProject()) {
      activeProjectId = null;
      activeChatId = null;
      app.innerHTML = view==='global-people'?renderPeopleHome():renderHome();
    } else {
      app.innerHTML = renderWorkspace();
    }
    if(animate){
      const page=$('.main-area',app)||$('.auth-frame',app);
      page?.classList.add('page-transition');
    }
    lastPageKey=pageKey;
  }
  function startBrandIntro() {
    const loader=$('#brand-loader');
    if(!loader)return;
    const finish=()=>{
      clearTimeout(introTimer);
      loader.classList.add('is-leaving');
      setTimeout(()=>loader.remove(),220);
      introTimer=-1;
    };
    dismissBrandIntro=finish;
    introTimer=setTimeout(finish,1050);
  }
  function initCursorHalo() {
    const halo=$('#cursor-halo');
    if(!halo||matchMedia('(hover: none)').matches||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    let frame=0;
    let nextX=0;
    let nextY=0;
    let nextVisible=false;
    let nextInteractive=false;
    const paint=()=>{
      halo.style.transform=`translate3d(${nextX}px,${nextY}px,0)`;
      halo.dataset.visible=String(nextVisible);
      halo.dataset.interactive=String(nextInteractive);
      frame=0;
    };
    document.addEventListener('pointermove',event=>{
      if(event.pointerType!=='mouse')return;
      const target=event.target.closest('button,a,[data-glow],.directory-card,.project-card');
      nextVisible=true;
      nextInteractive=!!target;
      nextX=event.clientX-7;nextY=event.clientY-7;
      if(!frame)frame=requestAnimationFrame(paint);
    },{passive:true});
    document.addEventListener('pointerleave',()=>{nextVisible=false;if(!frame)frame=requestAnimationFrame(paint);},{passive:true});
  }
  function renderAuth() {
    const email = data.profile?.email || '';
    const joining = authMode === 'join';
    return `<main class="auth-screen"><div class="auth-frame"><header class="auth-topbar"><a class="brand" href="#">${brand()}</a><div class="auth-mode-switch"><button data-action="auth-mode" data-id="join" class="${joining?'is-active':''}">Join</button><button data-action="auth-mode" data-id="login" class="${!joining?'is-active':''}">Log in</button></div></header><section class="auth-card" aria-labelledby="auth-title"><div class="auth-emblem">${icon('waypoint')}</div><h1 id="auth-title">Your research workspace.</h1><p>${joining?'Create your Waypoint account':'Log in to Waypoint'}</p><form id="auth-form">${joining?'<label class="label" for="login-name">Name</label><input id="login-name" name="name" class="text-input" type="text" autocomplete="name" maxlength="80" placeholder="Your name" required>':''}<label class="label" for="login-email">Email</label><input id="login-email" name="email" class="text-input" type="email" autocomplete="email" placeholder="Enter your email address…" value="${esc(email)}" required><label class="label" for="login-password">Password</label><input id="login-password" name="password" class="text-input" type="password" autocomplete="${joining?'new-password':'current-password'}" minlength="10" maxlength="256" placeholder="At least 10 characters" required><button class="btn btn-primary btn-block" type="submit">${joining?'Create account':'Log in'} ${icon('arrow')}</button></form><div class="auth-divider"><span>or continue with</span></div><div class="auth-providers">${[['G','Google'],['✳','ChatGPT'],['●','Apple'],['▦','Microsoft'],['♙','Passkey'],['▤','SSO']].map(([mark,label])=>`<button class="auth-provider" data-action="auth-provider" data-id="${label}"><span class="provider-mark">${mark}</span><span>${label}</span></button>`).join('')}</div><p class="auth-footnote">Login alternatives will be introduced soon.</p></section></div></main>`;
  }
  function renderHome() {
    const projects = [...data.projects].sort((a,b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
    const recent=projects.slice(0,2);
    const recentCards=recent.map(project=>projectCard(project)).join('');
    const allProjectCards=projects.map(project=>projectCard(project)).join('');
    const userName=(data.profile?.name||'Your').toLowerCase();
    return `<div class="workspace ${sidebarCollapsed?'sidebar-collapsed':''}">${renderSidebarV2(false)}<main class="main-area" id="main"><header class="workspace-topbar home-topbar"><div class="breadcrumbs"><button class="icon-button mobile-menu" data-action="toggle-sidebar" aria-label="Open navigation">${icon('menu')}</button><button class="search-trigger global-search-trigger" data-action="search" data-scope="global" aria-label="Search all projects and research">${icon('search')}<span>Search Waypoint</span><kbd>Ctrl K</kbd></button></div><div class="topbar-actions"><button class="icon-button universal-people-button" data-action="global-people" aria-label="People directory" title="People directory">${icon('people')}</button></div></header><section class="home-content"><div class="home-heading"><div><h1>${esc(userName)}'s projects</h1><p>wishin you luck :)</p></div></div>${projects.length?`<section class="home-project-section"><div class="section-heading-row"><h2 class="section-label">Recent projects</h2></div><div class="project-grid recent-grid">${recentCards}</div></section><section class="home-project-section all-projects-section"><div class="section-heading-row"><h2 class="section-label">All projects</h2></div><div class="project-grid all-projects-grid">${allProjectCards}</div></section>`:`<section class="empty-home home-empty-state"><h2>No projects yet</h2></section>`}</section><button class="floating-create" data-action="new-project" aria-label="New project" title="New project">${icon('plus')}</button></main></div>`;
  }
  function renderPeopleHome() {
    return `<div class="workspace ${sidebarCollapsed?'sidebar-collapsed':''}">${renderSidebarV2(false)}<main class="main-area" id="main"><header class="workspace-topbar"><div class="breadcrumbs"><strong>People</strong></div><div class="topbar-actions"><button class="search-trigger global-search-trigger" data-action="search" data-scope="global" aria-label="Search all projects and research">${icon('search')}<span>Search Waypoint</span><kbd>Ctrl K</kbd></button></div></header>${renderPeople()}</main></div>`;
  }
  function projectCard(project) {
    const tone=project.isDemo?'blue':['peach','lilac','coral','sage','blue','mint'][data.projects.indexOf(project)%6];
    return `<button class="project-card" data-tone="${tone}" data-action="open-project" data-id="${esc(project.id)}"><span class="project-card-top"><span class="project-icon">${icon('folder')}</span>${project.isDemo?'<span class="demo-badge">DEMO</span>':''}${icon('arrow')}</span><h2>${esc(project.name)}</h2><span class="project-card-meta">${project.isDemo?'Fictional sample · ':''}${project.chats.length} ${project.chats.length===1?'chat':'chats'} <span aria-hidden="true">·</span> ${shortDate(project.updatedAt || project.createdAt)}</span></button>`;
  }
  function renderWorkspace() {
    const project = currentProject();
    const chat = currentChat();
    if (view === 'chat' && !chat) { createChat(project, false); return renderWorkspace(); }
    const titles = {overview:project.name,chat:chat?.title || 'New chat', notes:'Notes', themes:'Themes', people:'People'};
    const breadcrumb=view==='overview'?`<button class="breadcrumb-project" data-action="home">Projects</button>`:`<button class="breadcrumb-project" data-action="project-overview">${esc(project.name)}</button><span aria-hidden="true">/</span><strong>${esc(titles[view])}</strong>`;
    return `<div class="workspace ${sidebarCollapsed?'sidebar-collapsed':''}">${renderSidebarV2(true)}<main class="main-area" id="main"><header class="workspace-topbar"><div class="breadcrumbs"><button class="icon-button mobile-menu" data-action="toggle-sidebar" aria-label="Open navigation">${icon('menu')}</button>${breadcrumb}</div><div class="topbar-actions"><button class="icon-button universal-people-button" data-action="global-people" aria-label="People directory" title="People directory">${icon('people')}</button><button class="search-trigger global-search-trigger" data-action="search" data-scope="global" aria-label="Search all projects and research">${icon('search')}<span>Search Waypoint</span><kbd>Ctrl K</kbd></button><button class="icon-button" data-action="project-menu" aria-label="Project settings" title="Project settings">${icon('dots')}</button></div></header>${renderView(project, chat)}</main></div>`;
  }
  function renderSidebarV2(showProject) {
    const activeProject=currentProject();
    const projects=[...data.projects].sort((a,b)=>(b.updatedAt||b.createdAt)-(a.updatedAt||a.createdAt));
    return `<aside class="sidebar ${sidebarOpen?'is-open':''}" aria-label="Workspace navigation"><div class="sidebar-head"><a class="brand" href="#" data-action="home" title="Waypoint">${brand()}</a><button class="icon-button sidebar-collapse" data-action="collapse-sidebar" aria-label="${sidebarCollapsed?'Expand':'Collapse'} sidebar" title="${sidebarCollapsed?'Expand':'Collapse'} sidebar">${icon('menu')}</button><button class="icon-button sidebar-close" data-action="close-sidebar" aria-label="Close navigation">${icon('close')}</button></div><button class="btn btn-primary btn-block sidebar-new" data-action="new-project" title="New project">${icon('plus')}<span>New project</span></button><div class="sidebar-section projects-nav"><div class="sidebar-section-heading"><button class="projects-title" data-action="home">Projects</button><button class="icon-button projects-expand" data-action="toggle-projects" aria-expanded="${projectsExpanded}" aria-label="${projectsExpanded?'Collapse':'Expand'} projects">${icon(projectsExpanded?'chevron':'arrow')}</button></div>${projectsExpanded?`<div class="project-picker">${projects.length?projects.map(project=>`<button class="project-picker-item" data-action="open-project" data-id="${esc(project.id)}" aria-current="${project.id===activeProject?.id?'page':'false'}" title="${esc(project.name)}">${icon('folder')}<span>${esc(project.name)}</span></button>`).join(''):'<p class="project-picker-empty">No projects yet</p>'}</div>`:''}</div>${showProject&&activeProject?`<section class="sidebar-section"><div class="sidebar-section-heading"><span>Chats</span><button class="icon-button" data-action="new-chat" aria-label="New chat" title="New chat">${icon('plus')}</button></div><div class="chat-list" aria-label="Project chats">${[...activeProject.chats].sort((a,b)=>b.updatedAt-a.updatedAt).map(chat=>`<button class="chat-link" data-action="select-chat" data-id="${esc(chat.id)}" aria-current="${view==='chat'&&chat.id===activeChatId?'page':'false'}" title="${esc(chat.title||'New chat')}"><span class="chat-dot"></span><span>${esc(chat.title||'New chat')}</span></button>`).join('')}</div></section><nav class="sidebar-section" aria-label="Project research"><div class="sidebar-section-heading">Research</div>${[['notes','Notes'],['themes','Themes'],['people','People']].map(([key,label])=>`<button class="sidebar-link" data-action="view" data-id="${key}" aria-current="${view===key?'page':'false'}" title="${label}">${icon(key)}<span>${label}</span>${key==='notes'&&activeProject.notes.length?`<span class="project-hint">${activeProject.notes.length}</span>`:''}</button>`).join('')}</nav><div class="sidebar-bottom"><button class="sidebar-link" data-action="project-brief" title="Edit project brief">${icon('brief')}<span>Edit project brief</span></button><button class="sidebar-link" data-action="search" title="Search in project">${icon('search')}<span>Search in project</span></button><div class="profile-footer"><span class="profile-avatar">${esc((data.profile?.name||'W').trim().slice(0,1).toUpperCase())}</span><span>${esc(data.profile?.name||'')}</span><button class="btn btn-quiet btn-small" data-action="sign-out">Switch</button></div></div>`:`<div class="sidebar-bottom"><div class="profile-footer"><span class="profile-avatar">${esc((data.profile?.name||'W').trim().slice(0,1).toUpperCase())}</span><span>${esc(data.profile?.name||'')}</span><button class="btn btn-quiet btn-small" data-action="sign-out">Switch</button></div></div>`}</aside>`;
  }
  function renderView(project, chat) {
    if (view === 'overview') return renderOverview(project);
    if (view === 'notes') return renderNotes(project);
    if (view === 'themes') return renderThemes();
    if (view === 'people') return renderPeople(project);
    return renderChat(project, chat);
  }
  function renderOverview(project) {
    const brief = project.brief || {};
    const fields = [['Research question','question'],['Audience','audience'],['Scope','scope'],['Timeframe','timeframe'],['Limits','limits']];
    const filled = fields.filter(([,key])=>brief[key]);
    return `<section class="research-view overview-view"><div class="view-heading"><div><h1>${esc(project.name)}</h1><p class="project-greeting">wishin you luck :)</p></div><button class="btn btn-secondary" data-action="project-brief">${icon('brief')} ${filled.length?'Edit':'Add'} project brief</button></div><div class="project-search-row"><label class="project-search project-content-search" data-action="project-content-search">${icon('search')}<input id="project-content-search" type="search" placeholder="Search in this project" aria-label="Search in this project" readonly></label><kbd>Ctrl F</kbd></div><section class="brief-summary"><div class="brief-summary-heading"><h2>Project brief</h2></div>${filled.length?`<dl class="brief-details">${filled.map(([label,key])=>`<div><dt>${label}</dt><dd>${esc(brief[key])}</dd></div>`).join('')}</dl>`:`<p class="brief-empty">No brief added.</p>`}</section><div class="overview-chats-heading"><h2>Chats</h2><button class="btn btn-primary btn-small" data-action="new-chat">${icon('plus')} New chat</button></div>${project.chats.length?`<div class="overview-chat-list">${[...project.chats].sort((a,b)=>b.updatedAt-a.updatedAt).map(chat=>`<button class="overview-chat" data-action="select-chat" data-id="${esc(chat.id)}"><span class="overview-chat-icon">${icon('chat')}</span><span class="overview-chat-copy"><strong>${esc(chat.title||'New chat')}</strong><small>${chat.messages.length} ${chat.messages.length===1?'message':'messages'} · ${shortDate(chat.updatedAt)}</small></span>${icon('arrow')}</button>`).join('')}</div>`:`<p class="brief-helper">No chats yet.</p>`}<div class="overview-bottom"><button class="text-action" data-action="view" data-id="notes">Notes ${project.notes.length?`(${project.notes.length})`:''}</button><button class="text-action" data-action="view" data-id="themes">Themes</button><button class="text-action" data-action="view" data-id="people">People ${project.people.length?`(${project.people.length})`:''}</button></div></section>`;
  }
  function renderChat(project, chat) {
    const messages = chat.messages || [];
    const transcript=messages.map(message=>{
      if(message.role!=='assistant')return `<article class="message">${esc(message.text)}<div class="message-tools"><time class="message-meta">You · ${timeLabel(message.createdAt)}</time><button class="message-save" data-action="save-message" data-id="${esc(message.id)}">Save as note</button></div></article>`;
      const saved=project.notes.some(note=>note.sourceMessageId===message.id);
      const replyLinks=(message.links||[]).filter(link=>safeHttpUrl(link.url));
      return `<article class="demo-assistant-message"><div class="demo-response-label">${icon('waypoint')} Demo response</div><p>${esc(message.text)}</p>${replyLinks.length?`<div class="reply-links"><span class="reply-links-label">Links</span>${replyLinks.map((link,index)=>`<div class="reply-link-row"><a href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">${esc(link.title||link.url)} ${icon('external')}</a><button class="message-save" data-action="save-reply-link" data-id="${esc(message.id)}" data-index="${index}">${project.links.some(savedLink=>savedLink.url===link.url)?'Saved':'Save link'}</button></div>`).join('')}</div>`:''}<div class="reply-actions"><button class="message-save" data-action="save-message" data-id="${esc(message.id)}" ${saved?'disabled':''}>${saved?'Saved as note':'Save as note'}</button>${message.searchPrompt?`<button class="message-save" data-action="google-search" data-id="${esc(message.id)}">Search Google ${icon('external')}</button>`:''}</div></article>`;
    }).join('');
    return `<section class="chat-view" aria-label="Chat"><div class="chat-heading">${esc(chat.title || 'New chat')}</div>${project.isDemo?'<div class="demo-disclaimer">DEMO PROJECT <span>Fictional example content, not real patient research.</span></div>':''}<div class="messages" id="messages">${messages.length ? `${transcript}${project.isDemo?'':'<div class="agent-notice">'+icon('waypoint')+'<span>Agent under construction. Your messages are saved; no response was generated.</span></div>'}` : `<div class="chat-empty"><h1>What are you researching?</h1><p>Start with a question, an idea, or what you want to understand.</p></div>`}</div><div class="composer-wrap"><form class="composer" id="message-form"><textarea id="message-input" name="message" rows="1" placeholder="Message Waypoint…" aria-label="Message Waypoint" maxlength="10000"></textarea><button class="send-button" type="submit" aria-label="Save message">${icon('send')}</button></form><p class="composer-footnote">${project.isDemo?'Demo replies are scripted. New messages save without a response.':`Agent under construction · ${REMOTE_API?'Your workspace saves to your account':'Your messages save in this browser'}`}</p></div></section>`;
  }
  function safeHttpUrl(value) {
    try { return ['http:','https:'].includes(new URL(value).protocol); }
    catch { return false; }
  }
  function renderAttachmentList(attachments=[]) {
    if(!attachments.length)return '';
    return `<div class="note-attachments">${attachments.map(attachment=>`<button type="button" class="attachment-link" data-action="download-attachment" data-id="${esc(attachment.id)}" title="Open ${esc(attachment.name)}">${icon(attachment.type?.startsWith('image/')?'image':'file')}<span>${esc(attachment.name)}</span><small>${(attachment.size/1024).toFixed(0)} KB</small></button>`).join('')}</div>`;
  }
  function renderNotes(project) {
    const allTags = [...new Set([...DEFAULT_TAGS, ...(project.tags||[])])];
    const filtered = activeTag ? project.notes.filter(note=>(note.tags||[]).includes(activeTag)) : project.notes;
    const notesContent=filtered.length ? `<div class="notes-card-grid">${[...filtered].sort((a,b)=>b.createdAt-a.createdAt).map(note=>`<article class="note-card" data-tone="${noteTone(note.tags?.[0])}">${note.text?`<p class="note-card-text">${esc(note.text)}</p>`:''}${renderAttachmentList(note.attachments||[])}${note.tags?.length?`<div class="note-tags">${note.tags.map(tag=>`<span class="tag-pill" data-tag-tone="${noteTone(tag)}">${esc(tag)}</span>`).join('')}</div>`:''}<footer><span>${note.source ? `From ${esc(note.source)}` : 'Added by you'} · ${shortDate(note.createdAt)}</span><span class="note-actions"><button class="text-action" data-action="edit-note" data-id="${esc(note.id)}">Edit</button><button class="icon-button" data-action="delete-note" data-id="${esc(note.id)}" aria-label="Delete note">${icon('trash')}</button></span></footer></article>`).join('')}</div>` : project.notes.length ? `<div class="empty-state"><h2>No notes with this tag</h2><p>Choose another tag or view all notes.</p></div>` : `<div class="empty-state"><h2>No notes yet</h2><p>Save a thought, add a file, or keep a useful link.</p><br><button class="btn btn-secondary" data-action="add-note">${icon('plus')} Add a note</button></div>`;
    const links=(project.links||[]).filter(link=>safeHttpUrl(link.url));
    const linksContent=links.length?`<div class="saved-links-grid">${[...links].sort((a,b)=>b.createdAt-a.createdAt).map(link=>`<article class="saved-link-card"><span class="saved-link-icon">${icon('external')}</span><div class="saved-link-copy"><a href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">${esc(link.title||link.url)}</a><small>${esc(link.source||'Saved from chat')}</small></div><button class="icon-button" data-action="delete-saved-link" data-id="${esc(link.id)}" aria-label="Remove saved link">${icon('trash')}</button></article>`).join('')}</div>`:`<p class="links-empty">Save useful links from a reply to keep them here.</p>`;
    return `<section class="research-view"><div class="view-heading"><div><h1>Notes</h1><p>Your saved research notes.</p></div><button class="btn btn-primary" data-action="add-note">${icon('plus')} Add note</button></div><section class="notes-section"><div class="notes-section-heading"><h2>Notes</h2>${project.notes.length?`<span>${project.notes.length}</span>`:''}</div>${project.notes.length?`<div class="tag-filters"><button class="tag-chip ${!activeTag?'is-selected':''}" data-action="filter-tag" data-id="">All</button>${allTags.filter(tag=>project.notes.some(note=>(note.tags||[]).includes(tag))).map(tag=>`<button class="tag-chip ${activeTag===tag?'is-selected':''}" data-action="filter-tag" data-id="${esc(tag)}">${esc(tag)}</button>`).join('')}</div>`:''}${notesContent}</section><section class="notes-section saved-links-section"><div class="notes-section-heading"><h2>Links</h2><span>${links.length}</span></div>${linksContent}</section></section>`;
  }
  function noteTone(tag='') {
    const key=tag.toLowerCase();
    if(['observation','quote'].includes(key))return 'peach';
    if(['assumption','idea'].includes(key))return 'lilac';
    if(['question','follow-up','follow up'].includes(key))return 'coral';
    if(['care'].includes(key))return 'mint';
    if(['resource'].includes(key))return 'blue';
    return 'sage';
  }
  function renderThemes() {
    return `<section class="research-view"><div class="view-heading"><div><h1>Themes</h1><p>Connections between your research notes.</p></div></div><div class="theme-placeholder"><h2>Themes are under construction</h2><p>Waypoint will help surface relations between notes here when the research agent is available. Nothing is being generated yet.</p></div></section>`;
  }
  function renderPeople(project) {
    return `<section class="research-view people-view"><div class="view-heading"><div><h1>People</h1><p>One people list, available across your workspace.</p></div><button class="btn btn-primary" data-action="add-person">${icon('plus')} Add person</button></div><section class="people-section"><div class="people-section-heading"><div><h2>Your people</h2><p>Contacts saved to your workspace.</p></div></div>${data.people.length?`<div class="people-grid">${data.people.map(person=>`<article class="person-card user-person-card"><div class="person-portrait user-portrait" aria-hidden="true">${esc(person.name.split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase())}</div><div class="person-card-copy"><h3>${esc(person.name)}</h3>${person.role?`<p class="person-role">${esc(person.role)}</p>`:''}${person.email?`<p class="person-detail">${esc(person.email)}</p>`:''}${person.notes?`<p class="person-detail">${esc(person.notes)}</p>`:''}<div class="person-card-actions">${person.url?`<a class="text-action" href="${esc(person.url)}" target="_blank" rel="noopener noreferrer">Source ${icon('external')}</a>`:'<span class="person-source-label">Added by you</span>'}<button class="icon-button" data-action="delete-person" data-id="${esc(person.id)}" aria-label="Remove ${esc(person.name)}">${icon('trash')}</button></div></div></article>`).join('')}</div>`:`<p class="people-empty-line">No one added yet.</p>`}</section><section class="people-section directory-section"><div class="people-section-heading"><div><h2>People directory</h2><p>Faculty profiles from Srishti Manipal Institute.</p></div><span class="directory-count">${PEOPLE_DIRECTORY.length} profiles</span></div><div class="people-grid">${PEOPLE_DIRECTORY.map(profile=>{const added=data.people.some(person=>person.directoryId===profile.id);return `<article class="person-card directory-card"><div class="person-portrait" data-photo-key="${profile.id}" data-tone="${profile.tone}" role="img" aria-label="Portrait slot for ${esc(profile.name)}"><span class="portrait-initials">${profile.initials}</span><span class="portrait-caption">PORTRAIT</span></div><div class="person-card-copy"><span class="person-institution">${esc(profile.institution)}</span><h3>${esc(profile.name)}</h3><p class="person-role">${esc(profile.role)}</p><p class="person-detail">${esc(profile.focus)}</p><div class="person-card-actions"><a class="text-action" href="${esc(profile.url)}" target="_blank" rel="noopener noreferrer">View profile ${icon('external')}</a><button class="btn btn-small ${added?'btn-added':'btn-secondary'}" data-action="add-directory-person" data-id="${esc(profile.id)}" ${added?'disabled':''}>${added?'Added':`${icon('plus')} Add to people`}</button></div></div></article>`;}).join('')}</div></section></section>`;
  }
  function tagPicker(project, selected=[]) {
    const choices=[...new Set([...DEFAULT_TAGS,...(project.tags||[])])];
    return `<fieldset class="tag-field"><legend class="label">Tags</legend><div class="tag-picker">${choices.map(tag=>`<label class="tag-option"><input type="checkbox" name="note-tags" value="${esc(tag)}" ${selected.includes(tag)?'checked':''}><span>${esc(tag)}</span></label>`).join('')}</div><label class="label custom-tags-label" for="custom-tags">Add your own tags</label><input id="custom-tags" class="text-input" name="customTags" placeholder="Type tags separated by commas" value="${esc(selected.filter(tag=>!choices.includes(tag)).join(', '))}"><small class="field-hint">Separate multiple tags with commas.</small></fieldset>`;
  }
  function dialogFrame(title, description, body, buttons, extraClass='') {
    return `<div class="dialog-backdrop" data-action="backdrop"><section class="dialog ${extraClass}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header class="dialog-header"><div><h2>${esc(title)}</h2>${description?`<p>${esc(description)}</p>`:''}</div><button class="icon-button" data-action="close-modal" aria-label="Close">${icon('close')}</button></header>${body}<footer class="dialog-footer">${buttons}</footer></section></div>`;
  }
  function showModal(type, options={}) {
    modal = {type, ...options};
    renderModal();
  }
  function renderModal() {
    const root = $('#dialog-root');
    if (!modal) { root.innerHTML = ''; return; }
    if (modal.type === 'new-project') {
      root.innerHTML = dialogFrame('New project', '', `<form id="project-form" class="dialog-body"><label class="field"><span class="label">Project name</span><input class="text-input" name="name" placeholder="Give your project a name" maxlength="100" required autofocus></label><details class="project-brief-optional"><summary>Add a project brief <span>Optional</span></summary><div class="project-brief-fields"><label class="field"><span class="label">Research question</span><textarea class="text-area" name="question" rows="2" placeholder="What are you trying to understand?"></textarea></label><label class="field"><span class="label">Audience</span><input class="text-input" name="audience" placeholder="Who is this research about?"></label><label class="field"><span class="label">Scope</span><input class="text-input" name="scope" placeholder="What is in or out of scope?"></label><label class="field"><span class="label">Timeframe</span><input class="text-input" name="timeframe" placeholder="When does this need to be done?"></label><label class="field"><span class="label">Limits</span><textarea class="text-area" name="limits" rows="2" placeholder="Constraints or boundaries"></textarea></label></div></details></form>`, `<button class="btn" data-action="close-modal" type="button">Cancel</button><button class="btn btn-primary" form="project-form" type="submit">Create project</button>`);
    } else if (modal.type === 'add-note') {
      root.innerHTML = dialogFrame('Add a note', 'Save a thought or attach a file.', `<form id="note-form" class="dialog-body"><label class="field"><span class="label">Note <span class="project-hint">Optional if you attach a file</span></span><textarea class="text-area" name="text" rows="4" placeholder="Write a note…" maxlength="10000"></textarea></label><label class="field"><span class="label">Files <span class="project-hint">Images, PDF, text, or CSV</span></span><input class="text-input file-input" name="attachments" type="file" accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,text/csv" multiple><small class="field-hint">Up to ${REMOTE_API?'2.5 MB online':'10 MB'} per file.</small></label><label class="field"><span class="label">Source <span class="project-hint">Optional</span></span><input class="text-input" name="source" placeholder="A conversation or source"></label>${tagPicker(currentProject())}</form>`, `<button class="btn" data-action="close-modal" type="button">Cancel</button><button class="btn btn-primary" form="note-form" type="submit">Save note</button>`);
    } else if (modal.type === 'edit-note') {
      const note=currentProject().notes.find(item=>item.id===modal.id);
      if (!note) { modal=null; root.innerHTML=''; return; }
      root.innerHTML = dialogFrame('Edit note', 'Update the note, tags, or add files.', `<form id="note-form" class="dialog-body"><input type="hidden" name="noteId" value="${esc(note.id)}"><label class="field"><span class="label">Note</span><textarea class="text-area" name="text" rows="4" maxlength="10000">${esc(note.text||'')}</textarea></label><label class="field"><span class="label">Add files</span><input class="text-input file-input" name="attachments" type="file" accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,text/csv" multiple><small class="field-hint">Up to ${REMOTE_API?'2.5 MB online':'10 MB'} per file.</small></label>${renderAttachmentList(note.attachments||[])}<label class="field"><span class="label">Source <span class="project-hint">Optional</span></span><input class="text-input" name="source" value="${esc(note.source||'')}" placeholder="A conversation or source"></label>${tagPicker(currentProject(),note.tags||[])}</form>`, `<button class="btn" data-action="close-modal" type="button">Cancel</button><button class="btn btn-primary" form="note-form" type="submit">Save changes</button>`);
    } else if (modal.type === 'add-person') {
      root.innerHTML = dialogFrame('Add a person', 'Save a contact to your workspace.', `<form id="person-form" class="dialog-body"><label class="field"><span class="label">Name</span><input class="text-input" name="name" maxlength="100" required placeholder="Name"></label><label class="field"><span class="label">Role or connection <span class="project-hint">Optional</span></span><input class="text-input" name="role" maxlength="150" placeholder="Participant, researcher, peer…"></label><label class="field"><span class="label">Email <span class="project-hint">Optional</span></span><input class="text-input" name="email" type="email" maxlength="200" placeholder="Email address"></label><label class="field"><span class="label">Link or notes <span class="project-hint">Optional</span></span><textarea class="text-area" name="notes" rows="3" placeholder="Where you found them or why they may help"></textarea></label></form>`, `<button class="btn" data-action="close-modal" type="button">Cancel</button><button class="btn btn-primary" form="person-form" type="submit">Save person</button>`);
    } else if (modal.type === 'brief') {
      const brief = currentProject().brief || {};
      root.innerHTML = dialogFrame('Edit project brief', 'Add context when it is useful. All fields are optional.', `<form id="brief-form" class="dialog-body"><label class="field"><span class="label">Research question</span><textarea class="text-area" name="question" rows="2" placeholder="What are you trying to understand?">${esc(brief.question||'')}</textarea></label><label class="field"><span class="label">Audience</span><input class="text-input" name="audience" value="${esc(brief.audience||'')}" placeholder="Who is this research about?"></label><label class="field"><span class="label">Scope</span><input class="text-input" name="scope" value="${esc(brief.scope||'')}" placeholder="What is in or out of scope?"></label><label class="field"><span class="label">Timeframe</span><input class="text-input" name="timeframe" value="${esc(brief.timeframe||'')}" placeholder="When does this need to be done?"></label><label class="field"><span class="label">Limits</span><textarea class="text-area" name="limits" rows="2" placeholder="Constraints, access, or boundaries">${esc(brief.limits||'')}</textarea></label></form>`, `<button class="btn" data-action="close-modal" type="button">Cancel</button><button class="btn btn-primary" form="brief-form" type="submit">Save brief</button>`);
    } else if (modal.type === 'project-menu') {
      const project=currentProject();
      root.innerHTML = dialogFrame('Project settings', 'Manage this project.', `<div class="dialog-body"><label class="field"><span class="label">Project name</span><input class="text-input" id="rename-project" maxlength="100" value="${esc(project.name)}"></label><button class="btn btn-block" data-action="export-project" type="button">${icon('download')} Export project data</button>${project.isDemo?'<p class="field-hint">CarePath is the shared demo project included in every account.</p>':'<br><br><button class="btn btn-danger btn-block" data-action="delete-project" type="button">'+icon('trash')+' Delete project</button>'}</div>`, `<button class="btn" data-action="close-modal" type="button">Close</button><button class="btn btn-primary" data-action="rename-project" type="button">Save name</button>`);
    } else if (modal.type === 'search') {
      const isProjectSearch=modal.scope==='project';
      root.innerHTML = `<div class="dialog-backdrop" data-action="backdrop"><section class="dialog search-dialog" role="dialog" aria-modal="true" aria-label="${isProjectSearch?'Search this project':'Search Waypoint'}"><header class="dialog-header"><div><h2>${isProjectSearch?'Search this project':'Search Waypoint'}</h2><p>${isProjectSearch?'Chats, messages, notes, and people in this project.':'Projects, chats, messages, notes, and people.'}</p></div><button class="icon-button" data-action="close-modal" aria-label="Close">${icon('close')}</button></header><div class="dialog-body"><input class="text-input" id="global-search" type="search" placeholder="${isProjectSearch?'Search this project…':'Search everything…'}" autocomplete="off"><div class="search-results" id="search-results"><p class="project-hint">Start typing to search.</p></div></div></section></div>`;
    }
    const first = modal.type === 'search' ? $('#global-search') : $('form input, form textarea, #rename-project', root) || $('input, textarea, button', root);
    if (first) setTimeout(() => first.focus(), 0);
  }
  function createChat(project, shouldRender=true) {
    const chat = {id:id(), title:'New chat', createdAt:Date.now(), updatedAt:Date.now(), messages:[]};
    project.chats.push(chat);
    activeProjectId = project.id;
    activeChatId = chat.id;
    view = 'chat';
    touch(project);
    persist();
    if (shouldRender) render();
    return chat;
  }
  function createProject(name, brief={}) {
    const project = {id:id(), name:name.trim(), createdAt:Date.now(), updatedAt:Date.now(), chats:[], notes:[], links:[], people:[], tags:[], brief};
    data.projects.push(project);
    activeProjectId=project.id;
    createChat(project,false);
    view='chat';
    persist();
    render();
    $('#message-input')?.focus();
  }
  function exportProject() {
    const project = currentProject();
    if (!project) return;
    const blob = new Blob([JSON.stringify(project, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'waypoint-project'}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast('Project export downloaded.');
  }
  function deleteProject() {
    const project = currentProject();
    if(project?.isDemo){showToast('CarePath demo is available in every account and cannot be removed.');return;}
    if (!project || !confirm(`Delete “${project.name}” and all its chats, notes, and people? This cannot be undone.`)) return;
    data.projects = data.projects.filter(item => item.id !== project.id);
    if(project.demoId==='healthcare-research'){
      data.demoDismissed=true;
      data.people=data.people.filter(person=>person.demoProjectId!==project.id);
    }
    activeProjectId = null;
    activeChatId = null;
    modal = null;
    persist();
    render();
  }
  async function signOut() {
    if(REMOTE_API){
      try {
        await syncRemoteWorkspace();
        await requestJson('/api/auth',{method:'POST',body:JSON.stringify({action:'logout'})});
      }
      catch(error){showToast(`Could not sign out: ${error.message}`);return;}
      remoteAuthenticated=false;
      localStorage.removeItem(STORAGE_KEY);
      data=blankData();
    }
    data.profile=null;
    view='chat';activeProjectId=null;activeChatId=null;modal=null;
    if(!REMOTE_API)persist();
    render();
  }
  function renderSearchResults(query) {
    const resultsRoot = $('#search-results');
    if (!resultsRoot) return;
    const needle = query.trim().toLowerCase();
    if (!needle) { resultsRoot.innerHTML = '<p class="project-hint">Start typing to search.</p>'; return; }
    const results = [];
    const scopedProjects=modal?.scope==='project'&&currentProject()?[currentProject()]:data.projects;
    scopedProjects.forEach(project => {
      if (modal?.scope!=='project' && project.name.toLowerCase().includes(needle)) results.push({project, type:'project', label:project.name, detail:'Project'});
      project.chats.forEach(chat => {
        if ((chat.title || '').toLowerCase().includes(needle)) results.push({project, chat, type:'chat', label:chat.title || 'New chat', detail:`Chat · ${project.name}`});
        (chat.messages || []).forEach(message => { if (message.text.toLowerCase().includes(needle)) results.push({project, chat, type:'chat', label:message.text, detail:`Message · ${project.name}`}); });
      });
      project.notes.forEach(note => { if (note.text.toLowerCase().includes(needle) || (note.source||'').toLowerCase().includes(needle) || (note.tags||[]).some(tag=>tag.toLowerCase().includes(needle))) results.push({project, type:'notes', label:note.text, detail:`Note · ${project.name}`}); });
      project.people.forEach(person => { if ([person.name,person.role,person.email,person.notes].join(' ').toLowerCase().includes(needle)) results.push({project, type:'people', label:person.name, detail:`Person · ${project.name}`}); });
    });
    if(modal?.scope!=='project')data.people.forEach(person=>{if([person.name,person.role,person.email,person.notes].join(' ').toLowerCase().includes(needle))results.push({project:null,type:'directory-person',label:person.name,detail:'People directory'});});
    resultsRoot.innerHTML = results.length ? results.slice(0,30).map((result,index)=>`<button class="search-result" data-action="search-result" data-index="${index}">${icon(result.type==='project'?'folder':result.type==='chat'?'chat':result.type==='notes'?'notes':'people')}<span class="search-result-copy"><strong>${esc(result.label.slice(0,130))}</strong><small>${esc(result.detail)}</small></span></button>`).join('') : '<p class="project-hint">No results.</p>';
    resultsRoot._results = results.slice(0,30);
  }
  function submitMessage(text) {
    const project = currentProject();
    const chat = currentChat();
    const clean = text.trim();
    if (!project || !chat || !clean) return;
    chat.messages.push({id:id(), text:clean, createdAt:Date.now()});
    if (chat.title === 'New chat') chat.title = clean.replace(/\s+/g,' ').slice(0,42) + (clean.length > 42 ? '…' : '');
    chat.updatedAt = Date.now();
    touch(project);
    persist();
    render();
    const messages = $('#messages');
    if (messages) messages.scrollTop = messages.scrollHeight;
    $('#message-input')?.focus();
  }
  function openAttachmentDatabase() {
    return new Promise((resolve,reject)=>{
      const request=indexedDB.open(ATTACHMENT_DB,1);
      request.onupgradeneeded=()=>request.result.createObjectStore('files',{keyPath:'id'});
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||new Error('Could not open local file storage.'));
    });
  }
  async function saveLocalAttachment(file, attachmentId) {
    const db=await openAttachmentDatabase();
    return new Promise((resolve,reject)=>{
      const transaction=db.transaction('files','readwrite');
      transaction.objectStore('files').put({id:attachmentId,name:file.name,type:file.type,size:file.size,blob:file});
      transaction.oncomplete=()=>{db.close();resolve();};
      transaction.onerror=()=>{db.close();reject(transaction.error||new Error('Could not save this file.'));};
    });
  }
  async function getLocalAttachment(attachmentId) {
    const db=await openAttachmentDatabase();
    return new Promise((resolve,reject)=>{
      const request=db.transaction('files','readonly').objectStore('files').get(attachmentId);
      request.onsuccess=()=>{db.close();resolve(request.result||null);};
      request.onerror=()=>{db.close();reject(request.error||new Error('Could not read this file.'));};
    });
  }
  function readFileAsDataUrl(file) {
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(String(reader.result||''));
      reader.onerror=()=>reject(reader.error||new Error(`Could not read ${file.name}.`));
      reader.readAsDataURL(file);
    });
  }
  async function saveNoteAttachments(files, project, note) {
    const supportedTypes=new Set(['image/jpeg','image/png','image/gif','image/webp','application/pdf','text/plain','text/csv']);
    for(const file of files){
      const maxBytes=REMOTE_API?MAX_REMOTE_FILE_BYTES:MAX_LOCAL_FILE_BYTES;
      if(file.size>maxBytes)throw new Error(`${file.name} is too large. The limit is ${REMOTE_API?'2.5 MB':'10 MB'} per file.`);
      if(!supportedTypes.has(file.type))throw new Error(`${file.name} has an unsupported file type.`);
      const attachmentId=id();
      let attachment;
      if(REMOTE_API){
        const dataUrl=await readFileAsDataUrl(file);
        const result=await requestJson('/api/attachments',{method:'POST',body:JSON.stringify({
          projectId:project.id,noteId:note.id,name:file.name,type:file.type,data:dataUrl
        })});
        attachment=result.attachment;
      }else{
        await saveLocalAttachment(file,attachmentId);
        attachment={id:attachmentId,name:file.name,type:file.type,size:file.size,storage:'local'};
      }
      note.attachments ||= [];
      note.attachments.push(attachment);
    }
  }
  async function downloadAttachment(attachmentId) {
    const note=currentProject()?.notes.find(item=>(item.attachments||[]).some(file=>file.id===attachmentId));
    const attachment=note?.attachments.find(file=>file.id===attachmentId);
    if(!attachment)return;
    let blob;
    if(attachment.storage==='local'){
      const saved=await getLocalAttachment(attachmentId);
      if(!saved)throw new Error('This locally saved file is no longer available.');
      blob=saved.blob;
    }else{
      const response=await fetch(`/api/attachments?id=${encodeURIComponent(attachmentId)}`,{credentials:'same-origin'});
      if(!response.ok)throw new Error('Could not download this file. Please sign in again.');
      blob=await response.blob();
    }
    const url=URL.createObjectURL(blob);
    const anchor=document.createElement('a');
    anchor.href=url;
    anchor.download=attachment.name;
    anchor.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function handleFormSubmit(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    event.preventDefault();
    const fields = new FormData(form);
    if (form.id === 'auth-form') {
      const email = String(fields.get('email') || '').trim();
      if (!email) return;
      const password=String(fields.get('password')||'');
      if(REMOTE_API){
        const action=authMode==='join'?'signup':'login';
        try{
          const result=await requestJson('/api/auth',{method:'POST',body:JSON.stringify({
            action,email,password,name:String(fields.get('name')||'')
          })});
          const workspace=await requestJson('/api/workspace');
          data={...workspace,profile:result.user};
          remoteAuthenticated=true;
          view='chat';activeProjectId=null;activeChatId=null;
          render();
        }catch(error){showToast(error.message);}
        return;
      }
      const name=(String(fields.get('name')||email.split('@')[0]).replace(/[._-]+/g,' ').toLowerCase());
      data.profile = {id:data.profile?.id || id(), name, email};
      view='chat';activeProjectId=null;activeChatId=null;
      persist(); render(); return;
    }
    if (form.id === 'project-form') {
      const name = String(fields.get('name') || '').trim();
      if (!name) return;
      const brief=Object.fromEntries(['question','audience','scope','timeframe','limits'].map(key=>[key,String(fields.get(key)||'').trim()]).filter(([,value])=>value));
      modal = null; createProject(name,brief); return;
    }
    if (form.id === 'person-form') {
      const name = String(fields.get('name') || '').trim();
      if (!name) return;
      data.people.push({id:id(),name,role:String(fields.get('role')||'').trim(),email:String(fields.get('email')||'').trim(),notes:String(fields.get('notes')||'').trim(),createdAt:Date.now()});
      if(currentProject())touch(currentProject());
      modal=null;persist();render();showToast('Person saved to your workspace.');return;
    }
    const project = currentProject();
    if (!project) return;
    if (form.id === 'message-form') {
      submitMessage(String(fields.get('message') || '')); return;
    }
    if (form.id === 'note-form') {
      const text = String(fields.get('text') || '').trim();
      const files=[...fields.getAll('attachments')].filter(value=>value instanceof File&&value.size>0);
      if (!text&&!files.length) { showToast('Add a note or choose a file.'); return; }
      const tags=[...new Set([...fields.getAll('note-tags').map(String),...String(fields.get('customTags')||'').split(',').map(tag=>tag.trim()).filter(Boolean)])];
      const custom=tags.filter(tag=>!DEFAULT_TAGS.includes(tag));
      project.tags=[...new Set([...(project.tags||[]),...custom])];
      const noteId=String(fields.get('noteId')||'');
      const existing=project.notes.find(note=>note.id===noteId);
      const note=existing||{id:id(),text:'',source:'',tags:[],attachments:[],createdAt:Date.now()};
      note.text=text;
      note.source=String(fields.get('source')||'').trim();
      note.tags=tags;
      note.attachments ||= [];
      if(!existing)project.notes.push(note);
      touch(project);modal=null;persist();render();
      let noteSynced=!REMOTE_API||!files.length;
      try{
        if(files.length&&REMOTE_API){await syncRemoteWorkspace();noteSynced=true;}
        await saveNoteAttachments(files,project,note);
        persist();render();
        showToast(existing?'Note updated.':'Note saved.');
      }catch(error){
        persist();render();
        showToast(noteSynced?`Note saved, but attachment failed: ${error.message}`:`Could not sync this note: ${error.message}`);
      }
      return;
    }
    if (form.id === 'brief-form') {
      project.brief = Object.fromEntries([...fields.entries()].map(([key,value])=>[key,String(value).trim()]));
      touch(project); modal = null; persist(); render(); showToast('Project brief saved.');
    }
  }
  document.addEventListener('submit', handleFormSubmit);
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    const targetId = button.dataset.id;
    if (action === 'backdrop' && event.target === button) { modal = null; renderModal(); return; }
    if (action === 'new-project') { showModal('new-project'); return; }
    if (action === 'auth-mode') { authMode=targetId; render(); return; }
    if (action === 'auth-provider') { showToast('Login alternatives will be introduced soon.'); return; }
    if (action === 'skip-intro') { dismissBrandIntro(); return; }
    if (action === 'sign-out') { signOut();return; }
    if (action === 'global-people') { activeProjectId=null;activeChatId=null;view='global-people';sidebarOpen=false;modal=null;render();return; }
    if (action === 'home') { activeProjectId = null; activeChatId = null; view='chat'; sidebarOpen = false; modal=null; render(); return; }
    if (action === 'toggle-projects') { projectsExpanded=!projectsExpanded; render(); return; }
    if (action === 'collapse-sidebar') { sidebarCollapsed=!sidebarCollapsed; render(); return; }
    if (action === 'project-overview') { view='overview'; sidebarOpen=false; modal=null; render(); return; }
    if (action === 'open-project') {
      const project = data.projects.find(item => item.id === targetId);
      if (!project) return;
      activeProjectId = project.id; activeChatId = [...project.chats].sort((a,b)=>b.updatedAt-a.updatedAt)[0]?.id || null;
      view = 'overview'; sidebarOpen=false; projectsExpanded=true; activeTag=''; render(); return;
    }
    if (action === 'new-chat') { const project=currentProject(); if(project) createChat(project); return; }
    if (action === 'select-chat') { activeChatId=targetId; view='chat'; sidebarOpen=false; render(); return; }
    if (action === 'view') { view=targetId; sidebarOpen=false; render(); return; }
    if (action === 'toggle-sidebar') { sidebarOpen=!sidebarOpen; render(); return; }
    if (action === 'close-sidebar') { sidebarOpen=false; render(); return; }
    if (action === 'brief'||action==='project-brief') { showModal('brief'); return; }
    if (action === 'project-menu') { showModal('project-menu'); return; }
    if (action === 'add-note') { showModal('add-note'); return; }
    if (action === 'add-person') { showModal('add-person'); return; }
    if (action === 'add-directory-person') {
      const profile=PEOPLE_DIRECTORY.find(entry=>entry.id===targetId);
      if(!profile||data.people.some(person=>person.directoryId===profile.id))return;
      data.people.push({id:id(),directoryId:profile.id,name:profile.name,role:profile.role,url:profile.url,notes:profile.focus,src:'directory',createdAt:Date.now()});
      persist();render();showToast(`${profile.name} added to your people.`);return;
    }
    if (action === 'save-message') {
      const project=currentProject(), message=currentChat()?.messages.find(item=>item.id===targetId);
      if (project && message && !project.notes.some(note=>note.sourceMessageId===message.id)) {
        project.notes.push({id:id(),text:message.text,source:`Chat: ${currentChat().title}`,sourceMessageId:message.id,tags:[],attachments:[],createdAt:Date.now()});
        touch(project);persist();render();showToast('Reply saved to notes.');
      }
      return;
    }
    if (action === 'save-reply-link') {
      const project=currentProject(),message=currentChat()?.messages.find(item=>item.id===targetId);
      const link=message?.links?.filter(entry=>safeHttpUrl(entry.url))[Number(button.dataset.index)];
      if(project&&link){
        project.links||=[];
        if(!project.links.some(entry=>entry.url===link.url)){
          project.links.push({id:id(),title:link.title||link.url,url:link.url,source:`${currentChat().title} · demo reply`,messageId:message.id,createdAt:Date.now()});
          touch(project);persist();render();showToast('Link saved to Notes.');
        }
      }
      return;
    }
    if (action === 'google-search') {
      const message=currentChat()?.messages.find(item=>item.id===targetId);
      if(message?.searchPrompt){
        const searchUrl=new URL('https://www.google.com/search');
        searchUrl.searchParams.set('q',message.searchPrompt);
        window.open(searchUrl.toString(),'_blank','noopener,noreferrer');
      }
      return;
    }
    if (action === 'download-attachment') {
      downloadAttachment(targetId).catch(error=>showToast(error.message));
      return;
    }
    if (action === 'search') { showModal('search',{scope:button.dataset.scope||(currentProject()?'project':'global')}); return; }
    if (action === 'project-content-search') { showModal('search',{scope:'project'}); return; }
    if (action === 'close-modal') { modal=null; renderModal(); return; }
    if (action === 'export-project') { exportProject(); return; }
    if (action === 'delete-project') { deleteProject(); return; }
    if (action === 'rename-project') {
      const project=currentProject(), input=$('#rename-project'), name=input?.value.trim();
      if (project && name) { project.name=name; touch(project); persist(); modal=null; render(); showToast('Project renamed.'); }
      return;
    }
    if (action === 'delete-note') {
      const project=currentProject();
      if (project && confirm('Delete this note?')) { project.notes=project.notes.filter(note=>note.id!==targetId); touch(project); persist(); render(); }
      return;
    }
    if (action === 'edit-note') { showModal('edit-note',{id:targetId}); return; }
    if (action === 'filter-tag') { activeTag=targetId||''; render(); return; }
    if (action === 'delete-saved-link') {
      const project=currentProject();
      if(project){project.links=(project.links||[]).filter(link=>link.id!==targetId);touch(project);persist();render();}
      return;
    }
    if (action === 'delete-person') {
      const project=currentProject();
      if (confirm('Remove this person from your workspace?')) {
        data.people=data.people.filter(person=>person.id!==targetId);
        data.projects.forEach(item=>{item.people=item.people.filter(person=>person.id!==targetId);});
        if(project)touch(project);
        persist();render();
      }
      return;
    }
    if (action === 'search-result') {
      const results=$('#search-results')?._results || [];
      const result=results[Number(button.dataset.index)];
      if (!result) return;
      if(result.type==='directory-person'){activeProjectId=null;activeChatId=null;view='global-people';modal=null;sidebarOpen=false;render();return;}
      activeProjectId=result.project.id;
      if (result.chat) activeChatId=result.chat.id;
      else activeChatId=result.project.chats[0]?.id || null;
      if (!activeChatId && result.type==='chat') createChat(result.project,false);
      view=result.type==='project'?'overview':result.type==='chat'?'chat':result.type;
      modal=null; sidebarOpen=false; render(); return;
    }
  });
  document.addEventListener('input', event => {
    if (event.target.id === 'global-search') renderSearchResults(event.target.value);
    if (event.target.id === 'message-input') {
      const button = $('.send-button');
      if (button) button.disabled = !event.target.value.trim();
      event.target.style.height = 'auto';
      event.target.style.height = `${Math.min(event.target.scrollHeight,180)}px`;
    }
  });
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (data.profile) showModal('search',{scope:'global'});
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f' && currentProject()) {
      event.preventDefault();
      showModal('search',{scope:'project'});
    }
    if (event.key === 'Escape' && modal) { modal=null; renderModal(); }
    if (event.key === 'Enter' && event.target.id === 'message-input' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault(); submitMessage(event.target.value);
    }
  });
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY) { data=loadData(); render(); }
  });
  initCursorHalo();
  if(REMOTE_API){
    data.profile=null;
    render();
    loadRemoteWorkspace();
  }else render();
})();
