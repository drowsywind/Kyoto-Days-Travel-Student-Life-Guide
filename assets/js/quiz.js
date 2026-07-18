(() => {
  'use strict';

  const Motion = window.KyotoDaysMotion;
  if (!Motion) {
    throw new Error('motion.js must be loaded before quiz.js');
  }

  function initQuiz() {
    const quizRoot = document.querySelector('#quizApp');
    if (!quizRoot) return;

    const questions = [
      { question: '千本鳥居で有名な場所はどこですか？', answers: ['清水寺', '伏見稲荷大社', '金閣寺'], correct: 1 },
      { question: '竹林の小径があるエリアは？', answers: ['嵐山', '祇園', '京都駅'], correct: 0 },
      { question: '京都市バスは、基本的にどこから乗りますか？', answers: ['前のドア', '後ろのドア', 'どちらでもよい'], correct: 1 },
      { question: '金閣寺の正式名称は？', answers: ['鹿苑寺', '慈照寺', '建仁寺'], correct: 0 },
      { question: '京都の夏に特に注意したいことは？', answers: ['乾燥', '熱中症', '積雪'], correct: 1 }
    ];

    let currentIndex = 0;
    let score = 0;

    quizRoot.setAttribute('aria-live', 'polite');
    quizRoot.setAttribute('aria-atomic', 'true');

    const focusHeading = (heading, shouldFocus) => {
      if (!shouldFocus) return;
      window.requestAnimationFrame(() => heading.focus());
    };

    const replaceQuizCard = (card, heading, shouldFocus, withMotion) => {
      const update = () => quizRoot.replaceChildren(card);

      if (!withMotion) {
        update();
        focusHeading(heading, shouldFocus);
        return;
      }

      update();
      Motion.animate(card, [
        { opacity: 0, clipPath: 'inset(0 0 100% 0)', transform: 'translate3d(0, 12px, 0)' },
        { opacity: 1, clipPath: 'inset(0)', transform: 'translate3d(0, 0, 0)' }
      ], {
        duration: 820,
        easing: 'cubic-bezier(.22, .62, .26, 1)'
      });
      focusHeading(heading, shouldFocus);
    };

    const renderResult = (shouldFocus, withMotion = true) => {
      const card = document.createElement('div');
      card.className = 'quiz-card';

      const heading = document.createElement('h2');
      heading.tabIndex = -1;
      heading.textContent = `${score} / ${questions.length} 点`;

      const message = document.createElement('p');
      message.textContent = score >= 4
        ? '京都マスター級です。'
        : score >= 2
          ? 'よくできました。各ガイドページも確認してみましょう。'
          : 'もう一度サイトを見てから挑戦してみましょう。';

      const retry = document.createElement('button');
      retry.className = 'btn btn-primary';
      retry.id = 'retryQuiz';
      retry.type = 'button';
      retry.textContent = 'もう一度挑戦';
      retry.addEventListener('click', () => {
        currentIndex = 0;
        score = 0;
        renderQuestion(true);
      });

      card.append(heading, message, retry);
      replaceQuizCard(card, heading, shouldFocus, withMotion);
    };

    const renderQuestion = (shouldFocus, withMotion = true) => {
      if (currentIndex >= questions.length) {
        renderResult(shouldFocus, withMotion);
        return;
      }

      const item = questions[currentIndex];
      const card = document.createElement('div');
      card.className = 'quiz-card';

      const progress = document.createElement('div');
      progress.className = 'quiz-progress';
      progress.setAttribute('role', 'progressbar');
      progress.setAttribute('aria-label', 'クイズの進行状況');
      progress.setAttribute('aria-valuemin', '0');
      progress.setAttribute('aria-valuemax', String(questions.length));
      progress.setAttribute('aria-valuenow', String(currentIndex));

      const progressBar = document.createElement('span');
      progressBar.style.width = `${(currentIndex / questions.length) * 100}%`;
      progress.append(progressBar);

      const counter = document.createElement('p');
      counter.textContent = `問題 ${currentIndex + 1} / ${questions.length}`;

      const heading = document.createElement('h2');
      heading.tabIndex = -1;
      heading.textContent = item.question;

      const options = document.createElement('div');
      options.className = 'quiz-options';
      item.answers.forEach((answer, answerIndex) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.choice = String(answerIndex);
        button.textContent = answer;
        button.addEventListener('click', () => {
          if (answerIndex === item.correct) score += 1;
          currentIndex += 1;
          renderQuestion(true);
        });
        options.append(button);
      });

      card.append(progress, counter, heading, options);
      replaceQuizCard(card, heading, shouldFocus, withMotion);
    };

    renderQuestion(false, false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuiz, { once: true });
  } else {
    initQuiz();
  }
})();
