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
      {
        question: '千本鳥居で有名な場所はどこですか？',
        answers: ['清水寺', '伏見稲荷大社', '金閣寺'],
        correct: 1,
        explanation: '伏見稲荷大社は、朱色の鳥居が連なる「千本鳥居」で知られ、稲荷山の参拝路へ続いています。',
        link: { href: 'fushimi.html', label: '伏見稲荷大社のガイド' }
      },
      {
        question: '竹林の小径があるエリアは？',
        answers: ['嵐山', '祇園', '京都駅'],
        correct: 0,
        explanation: '竹林の小径は嵐山・嵯峨野エリアにあり、渡月橋や天龍寺と合わせて歩けます。',
        link: { href: 'arashiyama.html', label: '嵐山のガイド' }
      },
      {
        question: '京都市バスは、基本的にどこから乗りますか？',
        answers: ['前のドア', '後ろのドア', 'どちらでもよい'],
        correct: 1,
        explanation: '多くの市バスは後ろのドアから乗り、降りるときに前のドアで運賃を支払います。路線や車両によって異なる場合は、車内の案内に従いましょう。',
        link: { href: 'bus.html', label: 'バスの乗り方' }
      },
      {
        question: '金閣寺の正式名称は？',
        answers: ['鹿苑寺', '慈照寺', '建仁寺'],
        correct: 0,
        explanation: '金閣寺の正式名称は鹿苑寺です。慈照寺は銀閣寺の正式名称です。',
        link: { href: 'kinkakuji.html', label: '金閣寺のガイド' }
      },
      {
        question: '京都の夏に特に注意したいことは？',
        answers: ['乾燥', '熱中症', '積雪'],
        correct: 1,
        explanation: '京都の夏は高温多湿です。こまめな水分補給と休憩で熱中症を防ぎましょう。',
        link: { href: 'about.html', label: '季節ごとの楽しみ方' }
      }
    ];

    let currentIndex = 0;
    let picks = [];

    quizRoot.setAttribute('aria-live', 'polite');

    const el = (tag, className, text) => {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    };

    const showCard = (card, focusTarget, shouldFocus, withMotion) => {
      quizRoot.replaceChildren(card);
      if (withMotion) {
        Motion.animate(card, [
          { opacity: 0, clipPath: 'inset(0 0 100% 0)', transform: 'translate3d(0, 12px, 0)' },
          { opacity: 1, clipPath: 'inset(0)', transform: 'translate3d(0, 0, 0)' }
        ], {
          duration: 820,
          easing: 'cubic-bezier(.22, .62, .26, 1)'
        });
      }
      if (shouldFocus && focusTarget) window.requestAnimationFrame(() => focusTarget.focus());
    };

    const score = () => picks.filter((pick, index) => pick === questions[index].correct).length;

    const renderResult = shouldFocus => {
      const total = score();
      const card = el('div', 'quiz-card');
      const heading = el('h2', 'quiz-score', `${total} / ${questions.length} 点`);
      heading.tabIndex = -1;

      const message = el('p', '', total >= 4
        ? '京都マスター級です。'
        : total >= 2
          ? 'よくできました。間違えた問題のガイドも確認してみましょう。'
          : 'もう一度サイトを見てから挑戦してみましょう。');

      const review = el('ol', 'quiz-review');
      review.setAttribute('aria-label', '答え合わせ');
      questions.forEach((item, index) => {
        const ok = picks[index] === item.correct;
        const li = el('li');
        const mark = el('span', `mark ${ok ? 'ok' : 'ng'}`, ok ? '○' : '×');
        mark.setAttribute('aria-label', ok ? '正解' : '不正解');
        const body = el('div');
        body.append(el('span', '', item.question));
        body.append(el('small', '', ok
          ? `答え：${item.answers[item.correct]}`
          : `あなたの答え：${item.answers[picks[index]]} ／ 正解：${item.answers[item.correct]}`));
        li.append(mark, body);
        review.append(li);
      });

      const actions = el('div', 'quiz-actions');
      const retry = el('button', 'btn btn-primary', 'もう一度挑戦');
      retry.type = 'button';
      retry.addEventListener('click', () => {
        currentIndex = 0;
        picks = [];
        renderQuestion(true);
      });
      const home = el('a', 'btn btn-outline', 'ホームへ戻る');
      home.href = 'index.html';
      actions.append(retry, home);

      card.append(heading, message, review, actions);
      showCard(card, heading, shouldFocus, true);
    };

    const renderQuestion = (shouldFocus, withMotion = true) => {
      if (currentIndex >= questions.length) {
        renderResult(shouldFocus);
        return;
      }

      const item = questions[currentIndex];
      const card = el('div', 'quiz-card');

      const progress = el('div', 'quiz-progress');
      progress.setAttribute('role', 'progressbar');
      progress.setAttribute('aria-label', 'クイズの進行状況');
      progress.setAttribute('aria-valuemin', '0');
      progress.setAttribute('aria-valuemax', String(questions.length));
      progress.setAttribute('aria-valuenow', String(currentIndex));
      const progressBar = el('span');
      progressBar.style.width = `${(currentIndex / questions.length) * 100}%`;
      progress.append(progressBar);

      const counter = el('p', 'quiz-counter', `問題 ${currentIndex + 1} / ${questions.length}`);
      const heading = el('h2', '', item.question);
      heading.tabIndex = -1;

      const options = el('div', 'quiz-options');
      const feedbackSlot = el('div');
      let answered = false;

      const choose = answerIndex => {
        // Lock the question on the first pick, so a double click or a quick second tap
        // cannot answer the next question by accident.
        if (answered) return;
        answered = true;
        picks[currentIndex] = answerIndex;
        const ok = answerIndex === item.correct;

        buttons.forEach((button, index) => {
          button.disabled = true;
          if (index === item.correct) {
            button.classList.add('is-correct');
            button.append(el('span', 'quiz-mark', '正解'));
          } else if (index === answerIndex) {
            button.classList.add('is-wrong');
            button.append(el('span', 'quiz-mark', 'あなたの答え'));
          } else {
            button.classList.add('is-dim');
          }
        });

        const feedback = el('div', `quiz-feedback ${ok ? 'is-correct' : 'is-wrong'}`);
        feedback.append(el('strong', '', ok ? '正解です！' : `不正解。正解は「${item.answers[item.correct]}」です。`));
        feedback.append(el('p', '', item.explanation));
        const more = el('a', 'text-link', `${item.link.label}を読む →`);
        more.href = item.link.href;
        feedback.append(more);

        const actions = el('div', 'quiz-actions');
        const isLast = currentIndex === questions.length - 1;
        const next = el('button', 'btn btn-primary', isLast ? '結果を見る' : '次の問題へ');
        next.type = 'button';
        next.addEventListener('click', () => {
          currentIndex += 1;
          renderQuestion(true);
        });
        actions.append(next);

        feedbackSlot.replaceChildren(feedback, actions);
        Motion.animate(feedbackSlot, [
          { opacity: 0, transform: 'translate3d(0, 8px, 0)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0)' }
        ], { duration: 480, easing: 'cubic-bezier(.22, .62, .26, 1)' });
        window.requestAnimationFrame(() => next.focus({ preventScroll: true }));
      };

      const buttons = item.answers.map((answer, answerIndex) => {
        const button = el('button');
        button.type = 'button';
        button.dataset.choice = String(answerIndex);
        button.append(el('span', '', answer));
        button.addEventListener('click', () => choose(answerIndex));
        options.append(button);
        return button;
      });

      card.append(progress, counter, heading, options, feedbackSlot);
      showCard(card, heading, shouldFocus, withMotion);
    };

    renderQuestion(false, false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuiz, { once: true });
  } else {
    initQuiz();
  }
})();
