document.addEventListener('DOMContentLoaded', () => {
  // Ambient cloud layers: local SVG only, no network dependency.
  const ambient = document.createElement('div');
  ambient.className = 'ambient-layer';
  ambient.innerHTML = '<img class="ambient-cloud" src="assets/images/cloud.svg" alt=""><img class="ambient-cloud" src="assets/images/cloud.svg" alt=""><img class="ambient-cloud" src="assets/images/cloud.svg" alt="">';
  document.body.prepend(ambient);

  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  if (toggle && nav) toggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', nav.classList.contains('open'));
  });

  const toTop = document.querySelector('.to-top');
  if (toTop) {
    window.addEventListener('scroll', () => toTop.classList.toggle('show', window.scrollY > 500), {passive:true});
    toTop.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
  }

  // Scroll reveal with reduced-motion fallback.
  const revealTargets = document.querySelectorAll('.section-title,.section-lead,.card,.feature,.guide-row,.visual-intro,.transport-visual,.info-table,.notice,.timeline article,.cta,.gallery button');
  revealTargets.forEach(node => node.classList.add('reveal'));
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), {threshold:.12, rootMargin:'0px 0px -40px'});
    revealTargets.forEach(node => observer.observe(node));
  } else revealTargets.forEach(node => node.classList.add('is-visible'));

  // Gentle parallax for the home collage.
  const collage = document.querySelector('.hero-collage');
  if (collage && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener('scroll', () => {
      const y = Math.min(window.scrollY * .08, 42);
      collage.style.transform = `translate3d(0,${y}px,0)`;
    }, {passive:true});
  }

  document.querySelectorAll('.filter-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    document.querySelectorAll('[data-category]').forEach(card => {
      const visible = filter === 'all' || card.dataset.category === filter;
      card.style.display = visible ? '' : 'none';
      if (visible) requestAnimationFrame(() => card.classList.add('is-visible'));
    });
  }));

  document.querySelectorAll('.accordion button').forEach(btn => btn.addEventListener('click', () => {
    const item = btn.parentElement;
    item.classList.toggle('open');
    btn.setAttribute('aria-expanded', item.classList.contains('open'));
  }));

  const lightbox = document.querySelector('.lightbox');
  if (lightbox) {
    const lbImg = lightbox.querySelector('img');
    document.querySelectorAll('.gallery button').forEach(btn => btn.addEventListener('click', () => {
      const img = btn.querySelector('img'); lbImg.src = img.src; lbImg.alt = img.alt; lightbox.classList.add('open');
    }));
    lightbox.addEventListener('click', e => { if (e.target === lightbox || e.target.tagName === 'BUTTON') lightbox.classList.remove('open'); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') lightbox.classList.remove('open'); });
  }

  const form = document.querySelector('#contactForm');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault(); let ok = true;
    const rules = [['name',v=>v.trim().length>=2,'お名前を2文字以上で入力してください。'],['email',v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),'正しいメールアドレスを入力してください。'],['category',v=>!!v,'お問い合わせ種類を選択してください。'],['message',v=>v.trim().length>=10,'お問い合わせ内容を10文字以上で入力してください。']];
    rules.forEach(([id,test,msg])=>{const el=document.getElementById(id),error=document.querySelector(`[data-error="${id}"]`);const valid=test(el.value);error.textContent=valid?'':msg;if(!valid)ok=false;});
    if(ok){document.querySelector('.success-box').style.display='block';form.reset();}
  });

  const quizRoot = document.querySelector('#quizApp');
  if (quizRoot) {
    const questions=[{q:'千本鳥居で有名な場所はどこですか？',a:['清水寺','伏見稲荷大社','金閣寺'],correct:1},{q:'竹林の小径があるエリアは？',a:['嵐山','祇園','京都駅'],correct:0},{q:'京都市バスは、基本的にどこから乗りますか？',a:['前のドア','後ろのドア','どちらでもよい'],correct:1},{q:'金閣寺の正式名称は？',a:['鹿苑寺','慈照寺','建仁寺'],correct:0},{q:'京都の夏に特に注意したいことは？',a:['乾燥','熱中症','積雪'],correct:1}];
    let i=0,score=0; const render=()=>{if(i>=questions.length){quizRoot.innerHTML=`<div class="quiz-card"><span class="eyebrow">RESULT</span><h2>${score} / ${questions.length} 点</h2><p>${score>=4?'京都マスター級です。':score>=2?'よくできました。各ガイドページも確認してみましょう。':'もう一度サイトを見てから挑戦してみましょう。'}</p><button class="btn btn-primary" id="retryQuiz">もう一度挑戦</button></div>`;document.getElementById('retryQuiz').addEventListener('click',()=>{i=0;score=0;render();});return;}const item=questions[i];quizRoot.innerHTML=`<div class="quiz-card"><div class="quiz-progress"><span style="width:${(i/questions.length)*100}%"></span></div><p>問題 ${i+1} / ${questions.length}</p><h2>${item.q}</h2><div class="quiz-options">${item.a.map((x,n)=>`<button data-choice="${n}">${x}</button>`).join('')}</div></div>`;quizRoot.querySelectorAll('[data-choice]').forEach(btn=>btn.addEventListener('click',()=>{if(+btn.dataset.choice===item.correct)score++;i++;render();}));};render();
  }
});
