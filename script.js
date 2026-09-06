// THE STOCK ROOM v2.0 — front-end interactions
const nav=document.querySelector('.links'),menu=document.querySelector('.menu');
if(menu&&nav){menu.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const open=nav.classList.toggle('mobile');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close menu':'Open menu');});document.addEventListener('click',e=>{if(nav.classList.contains('mobile')&&!nav.contains(e.target)&&e.target!==menu){nav.classList.remove('mobile');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open menu')}});window.addEventListener('resize',()=>{if(window.innerWidth>800){nav.classList.remove('mobile');menu.setAttribute('aria-expanded','false')}});}
document.querySelectorAll('.links a').forEach(a=>a.addEventListener('click',()=>{nav?.classList.remove('mobile');menu?.setAttribute('aria-expanded','false')}));
const year=document.querySelector('.year')||document.getElementById('year'); if(year) year.textContent=new Date().getFullYear();
const modal=document.getElementById('modal'), close=document.querySelector('.close');
document.querySelectorAll('.course-btn').forEach(b=>b.addEventListener('click',()=>modal?.classList.add('open')));
close?.addEventListener('click',()=>modal?.classList.remove('open')); modal?.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('open')});
document.querySelectorAll('.faq-q').forEach(q=>q.addEventListener('click',()=>{const a=q.nextElementSibling;a?.classList.toggle('open');const i=q.querySelector('span');if(i)i.textContent=a?.classList.contains('open')?'−':'+'}));
const obs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target)}}),{threshold:.08});document.querySelectorAll('.card,.section,.portrait,.scene3d').forEach(e=>{e.classList.add('reveal');obs.observe(e)});
// Demo-only local progress helpers. No real-money execution.
const state=JSON.parse(localStorage.getItem('tsr_demo')||'null')||{balance:5000,pnl:0,days:0,points:0,account:'TSR-'+Math.floor(100000+Math.random()*900000)};
localStorage.setItem('tsr_demo',JSON.stringify(state));
document.querySelectorAll('[data-demo-balance]').forEach(e=>e.textContent='$'+state.balance.toFixed(2));
document.querySelectorAll('[data-demo-pnl]').forEach(e=>e.textContent=(state.pnl>=0?'+':'')+'$'+state.pnl.toFixed(2));
document.querySelector
