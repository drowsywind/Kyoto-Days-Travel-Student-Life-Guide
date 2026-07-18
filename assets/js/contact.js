(() => {
  'use strict';

  const Motion = window.KyotoDaysMotion;
  if (!Motion) {
    throw new Error('motion.js must be loaded before contact.js');
  }

  function initContactForm() {
    const form = document.querySelector('#contactForm');
    if (!form) return;

    const successBox = form.querySelector('.success-box');
    const rules = [
      ['name', value => value.trim().length >= 2, 'お名前を2文字以上で入力してください。'],
      ['email', value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), '正しいメールアドレスを入力してください。'],
      ['category', value => Boolean(value), 'お問い合わせ種類を選択してください。'],
      ['message', value => value.trim().length >= 10, 'お問い合わせ内容を10文字以上で入力してください。']
    ];

    const liveRegion = document.createElement('div');
    liveRegion.className = 'form-live-region';
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    Object.assign(liveRegion.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0'
    });
    form.append(liveRegion);

    if (successBox) {
      successBox.setAttribute('role', 'status');
      successBox.setAttribute('aria-live', 'polite');
      successBox.setAttribute('aria-atomic', 'true');
    }

    const fields = rules.map(([id]) => {
      const input = form.querySelector(`#${id}`);
      const error = form.querySelector(`[data-error="${id}"]`);
      if (!input || !error) return { id, input, error };

      if (!error.id) error.id = `${id}-error`;
      const describedBy = new Set((input.getAttribute('aria-describedby') || '')
        .split(/\s+/)
        .filter(Boolean));
      describedBy.add(error.id);
      input.setAttribute('aria-describedby', [...describedBy].join(' '));
      input.setAttribute('aria-invalid', 'false');
      return { id, input, error };
    });

    const clearSuccess = () => {
      if (successBox) successBox.style.display = 'none';
      liveRegion.textContent = '';
    };

    form.addEventListener('input', clearSuccess);
    form.addEventListener('change', clearSuccess);

    form.addEventListener('submit', event => {
      event.preventDefault();
      clearSuccess();

      let firstInvalid = null;
      let invalidCount = 0;

      rules.forEach(([id, test, message]) => {
        const field = fields.find(candidate => candidate.id === id);
        if (!field || !field.input || !field.error) return;

        const isValid = test(field.input.value);
        field.error.textContent = isValid ? '' : message;
        field.input.setAttribute('aria-invalid', String(!isValid));

        if (!isValid) {
          invalidCount += 1;
          if (!firstInvalid) firstInvalid = field.input;
        }
      });

      if (firstInvalid) {
        liveRegion.textContent = `入力内容に${invalidCount}件のエラーがあります。`;
        firstInvalid.focus();
        return;
      }

      if (successBox) {
        successBox.style.display = 'block';
        Motion.animate(successBox, [
          { opacity: 0, clipPath: 'inset(0 100% 0 0)', transform: 'translate3d(-8px, 0, 0)' },
          { opacity: 1, clipPath: 'inset(0)', transform: 'translate3d(0, 0, 0)' }
        ], {
          duration: 780,
          easing: 'cubic-bezier(.22, .62, .26, 1)'
        });
      }

      form.reset();
      fields.forEach(field => {
        if (!field.input || !field.error) return;
        field.input.setAttribute('aria-invalid', 'false');
        field.error.textContent = '';
      });
      liveRegion.textContent = successBox
        ? successBox.textContent.trim()
        : '入力内容を確認しました。';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactForm, { once: true });
  } else {
    initContactForm();
  }
})();
