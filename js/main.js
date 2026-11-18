'use strict';

/* ==========================================================================
   main.js — интерактив лендинга Автотехцентра на Стасова, 2
   Чистый ES6, одна точка входа init() на DOMContentLoaded.
   Каждый модуль проверяет наличие своих элементов.
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. Шапка при скролле
   -------------------------------------------------------------------------- */
function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;

    const onScroll = () => {
        if (window.scrollY > 10) {
            header.classList.add('header--scrolled');
        } else {
            header.classList.remove('header--scrolled');
        }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
}

/* --------------------------------------------------------------------------
   2. Мобильное меню
   -------------------------------------------------------------------------- */
function initMobileMenu() {
    const burger = document.querySelector('.header__burger');
    const menu = document.querySelector('.mobile-menu');
    if (!burger || !menu) return;

    const closeBtn = menu.querySelector('.mobile-menu__close');

    const openMenu = () => {
        menu.classList.add('mobile-menu--open');
        menu.setAttribute('aria-hidden', 'false');
        burger.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    };

    const closeMenu = () => {
        menu.classList.remove('mobile-menu--open');
        menu.setAttribute('aria-hidden', 'true');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    };

    burger.addEventListener('click', () => {
        if (menu.classList.contains('mobile-menu--open')) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    if (closeBtn) closeBtn.addEventListener('click', closeMenu);

    // Закрытие по клику на любую ссылку внутри меню
    menu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', closeMenu);
    });

    // Закрытие по клику вне меню
    document.addEventListener('click', (event) => {
        if (!menu.classList.contains('mobile-menu--open')) return;

        const isInside = menu.contains(event.target);
        const isBurger = burger.contains(event.target);
        if (!isInside && !isBurger) closeMenu();
    });

    // Закрытие по Escape
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && menu.classList.contains('mobile-menu--open')) {
            closeMenu();
            burger.focus();
        }
    });
}

/* --------------------------------------------------------------------------
   3. Плавный скролл: общий помощник с учётом высоты шапки
   -------------------------------------------------------------------------- */
function scrollToElement(target) {
    if (!target) return;

    const header = document.querySelector('.header');
    const headerHeight = header ? header.offsetHeight : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - headerHeight;

    window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
}

function initSmoothScroll() {
    const scrollTarget = (hash) => {
        if (!hash || hash === '#') return;
        scrollToElement(document.querySelector(hash));
    };

    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[href^="#"], [data-scroll]');
        if (!link) return;

        const hash = link.getAttribute('data-scroll') || link.getAttribute('href');
        if (!hash || !hash.startsWith('#')) return;

        event.preventDefault();
        scrollTarget(hash);
    });
}

/* --------------------------------------------------------------------------
   4. Квиз: шаги, прогресс, выбор опции, навигация
   -------------------------------------------------------------------------- */
function initQuiz() {
    const form = document.querySelector('.quiz__form');
    if (!form) return null;

    const steps = Array.from(form.querySelectorAll('.quiz-step'));
    const progressBar = form.querySelector('.quiz__progress-bar');
    const backBtn = form.querySelector('.quiz__back');
    const nextBtn = form.querySelector('.quiz__next');
    const submitBtn = form.querySelector('.quiz__submit');
    const errorBox = form.querySelector('.quiz__error');

    if (!steps.length) return null;

    const total = steps.length;
    const state = { current: 1, engineType: '' };

    const showError = (message) => {
        if (errorBox) errorBox.textContent = message || '';
    };

    const clearFieldErrors = () => {
        form.querySelectorAll('.quiz__input--error, .quiz__textarea--error').forEach((el) => {
            el.classList.remove('quiz__input--error', 'quiz__textarea--error');
        });
    };

    const goToStep = (index) => {
        const next = Math.min(Math.max(index, 1), total);
        state.current = next;

        steps.forEach((step) => {
            const stepNum = Number(step.dataset.step);
            step.classList.toggle('quiz-step--active', stepNum === next);
        });

        if (progressBar) {
            progressBar.style.width = (next / total) * 100 + '%';
            progressBar.setAttribute('aria-valuenow', String(next));
        }

        if (backBtn) backBtn.hidden = next === 1;
        if (nextBtn) nextBtn.hidden = next === total;
        if (submitBtn) submitBtn.hidden = next !== total;

        clearFieldErrors();
        showError('');
    };

    // Выбор варианта ответа
    form.querySelectorAll('.quiz-option').forEach((option) => {
        option.addEventListener('click', () => {
            form.querySelectorAll('.quiz-option').forEach((item) => {
                item.classList.remove('quiz-option--active');
            });
            option.classList.add('quiz-option--active');
            state.engineType = option.dataset.value || '';
        });
    });

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (validateStep(form, state.current)) {
                goToStep(state.current + 1);
            }
        });
    }

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            goToStep(state.current - 1);
        });
    }

    // Стартовое состояние
    goToStep(1);

    // Публичное управление квизом для других модулей
    return {
        state,
        goToStep,
        showError,
        clearFieldErrors
    };
}

/* --------------------------------------------------------------------------
   Валидация отдельного шага (используется квизом и отправкой)
   -------------------------------------------------------------------------- */
function validateStep(form, stepNumber) {
    const errorBox = form.querySelector('.quiz__error');
    const messages = [];

    if (stepNumber === 1) {
        const active = form.querySelector('.quiz-option--active');
        if (!active) messages.push('Выберите направление работ');
    } else if (stepNumber === 2) {
        const problem = form.querySelector('#problem');
        const car = form.querySelector('#car');
        const problemValue = problem ? problem.value.trim() : '';
        const carValue = car ? car.value.trim() : '';

        if (!problemValue && !carValue) {
            if (problem) problem.classList.add('quiz__textarea--error');
            if (car) car.classList.add('quiz__input--error');
            messages.push('Опишите проблему или укажите марку авто');
        }
    } else if (stepNumber === 3) {
        const name = form.querySelector('#name');
        const phone = form.querySelector('#phone');
        const agreement = form.querySelector('input[name="agreement"]');

        if (!name || !name.value.trim()) {
            if (name) name.classList.add('quiz__input--error');
            messages.push('Введите имя');
        }

        const digits = phone ? phone.value.replace(/\D/g, '') : '';
        if (!phone || !digits) {
            if (phone) phone.classList.add('quiz__input--error');
            messages.push('Введите номер телефона');
        } else if (digits.length !== 11) {
            phone.classList.add('quiz__input--error');
            messages.push('Проверьте формат номера: +7 (___) ___-__-__');
        }

        if (!agreement || !agreement.checked) {
            messages.push('Отметьте согласие на обработку персональных данных');
        }
    }

    if (errorBox) errorBox.textContent = messages.join('; ');
    return messages.length === 0;
}

/* --------------------------------------------------------------------------
   5. Кнопки «Узнать цену» в карточках услуг
   -------------------------------------------------------------------------- */
function initServicePriceButtons(quizApi) {
    const buttons = document.querySelectorAll('.service-card__btn');
    if (!buttons.length) return;

    buttons.forEach((button) => {
        button.addEventListener('click', () => {
            const service = button.dataset.service || '';

            // Подставляем услугу в начало поля описания проблемы
            const problem = document.querySelector('#problem');
            if (problem) {
                const line = 'Услуга: ' + service + '\n';
                const rest = problem.value.replace(/^Услуга:.*\n?/, '');
                problem.value = line + rest;
            }

            // Плавный скролл к форме и переход к шагу с описанием
            scrollToElement(document.querySelector('#booking'));

            if (quizApi) {
                quizApi.goToStep(2);

                const car = document.querySelector('#car');
                if (car) {
                    window.setTimeout(() => car.focus({ preventScroll: true }), 400);
                }
            }
        });
    });
}

/* --------------------------------------------------------------------------
   6. Маска телефона +7 (___) ___-__-__
   -------------------------------------------------------------------------- */
function initPhoneMask() {
    const phone = document.querySelector('#phone');
    if (!phone) return;

    const format = (value) => {
        let digits = value.replace(/\D/g, '');

        if (digits.startsWith('8')) digits = '7' + digits.slice(1);
        if (!digits.startsWith('7')) digits = '7' + digits;
        digits = digits.slice(0, 11);

        let result = '+7';
        if (digits.length > 1) result += ' (' + digits.slice(1, 4);
        if (digits.length >= 4) result += ') ' + digits.slice(4, 7);
        if (digits.length >= 7) result += '-' + digits.slice(7, 9);
        if (digits.length >= 9) result += '-' + digits.slice(9, 11);

        return result;
    };

    phone.addEventListener('input', () => {
        phone.value = format(phone.value);
        phone.classList.remove('quiz__input--error');
    });

    phone.addEventListener('focus', () => {
        if (!phone.value.trim()) phone.value = '+7 (';
    });

    phone.addEventListener('blur', () => {
        if (phone.value.replace(/\D/g, '').length <= 1) phone.value = '';
    });
}

/* --------------------------------------------------------------------------
   7–8. Отправка формы (валидация шага 3 + имитация)
   -------------------------------------------------------------------------- */
function initFormSubmit(quizApi) {
    const form = document.querySelector('.quiz__form');
    if (!form) return;

    const submitBtn = form.querySelector('.quiz__submit');

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        // Валидируем все шаги перед отправкой
        for (let step = 1; step <= 3; step += 1) {
            if (!validateStep(form, step)) {
                if (quizApi) quizApi.goToStep(step);
                // goToStep сбрасывает ошибки — повторная валидация их возвращает
                validateStep(form, step);
                return;
            }
        }

        const originalText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Отправляем…';
        }

        window.setTimeout(() => {
            openModal();

            // Сброс формы и квиза к первому шагу
            form.reset();
            form.querySelectorAll('.quiz-option--active').forEach((option) => {
                option.classList.remove('quiz-option--active');
            });
            if (quizApi) {
                quizApi.state.engineType = '';
                quizApi.goToStep(1);
            }

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText || 'Отправить заявку';
            }
        }, 1200);
    });
}

/* --------------------------------------------------------------------------
   9. Модальное окно успеха
   -------------------------------------------------------------------------- */
let modalLastFocused = null;

function openModal() {
    const modal = document.querySelector('.modal');
    if (!modal) return;

    modalLastFocused = document.activeElement;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('modal--open');
    document.body.style.overflow = 'hidden';

    const focusable = getModalFocusable(modal);
    const first = modal.querySelector('.modal__btn') || focusable[0];
    if (first) first.focus();
}

function closeModal() {
    const modal = document.querySelector('.modal');
    if (!modal || !modal.classList.contains('modal--open')) return;

    modal.classList.remove('modal--open');
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    if (modalLastFocused && typeof modalLastFocused.focus === 'function') {
        modalLastFocused.focus();
    }
}

function getModalFocusable(modal) {
    return Array.from(
        modal.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
    ).filter((el) => el.offsetParent !== null);
}

function initModal() {
    const modal = document.querySelector('.modal');
    if (!modal) return;

    modal.querySelectorAll('[data-modal-close]').forEach((el) => {
        el.addEventListener('click', closeModal);
    });

    // Закрытие по Escape и ловушка фокуса
    document.addEventListener('keydown', (event) => {
        if (!modal.classList.contains('modal--open')) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            closeModal();
            return;
        }

        if (event.key === 'Tab') {
            const focusable = getModalFocusable(modal);
            if (!focusable.length) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }
    });
}

/* --------------------------------------------------------------------------
   10. Текущий год в футере
   -------------------------------------------------------------------------- */
function initCurrentYear() {
    const copyright = document.querySelector('.footer__copyright');
    if (!copyright) return;

    const year = new Date().getFullYear();
    copyright.textContent = '© ' + year + ' Автотехцентр на Стасова, 2 — Пенза';
}

/* --------------------------------------------------------------------------
   11. Точка входа
   -------------------------------------------------------------------------- */
function init() {
    initHeaderScroll();
    initMobileMenu();
    initSmoothScroll();

    const quizApi = initQuiz();
    initServicePriceButtons(quizApi);
    initPhoneMask();
    initFormSubmit(quizApi);

    initModal();
    initCurrentYear();
}

document.addEventListener('DOMContentLoaded', init);
