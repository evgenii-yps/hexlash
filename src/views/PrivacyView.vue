<template>
  <div class="pv-root">
    <!-- Шапка та же по составу, что на других страницах вне игры (404, сброс
         пароля): знак + живое слово HEXLASH, слово никогда не картинкой. Плюс
         кнопка назад. Шапка App.vue на этом адресе выключена — иначе её логотип
         вставал поверх текста страницы. -->
    <header class="pv-top">
      <div class="pv-top-in">
        <button type="button" class="pv-back" @click="goBack">
          <span class="pv-back-arrow" aria-hidden="true">‹</span>
          <span>{{ t.privacy.back }}</span>
        </button>

        <router-link to="/" class="pv-lock" aria-label="Hexlash home">
          <HexlashMark :size="48" class="pv-mark" />
          <span class="pv-word">HEXLASH</span>
        </router-link>
      </div>
    </header>

    <main class="pv-main">
      <article class="pv-col">
        <h1 class="pv-title">{{ t.privacy.title }}</h1>
        <p class="pv-updated">{{ t.privacy.updated }}</p>
        <p class="pv-intro">{{ t.privacy.intro }}</p>

        <section v-for="s in t.privacy.sections" :key="s.h" class="pv-sec">
          <h2 class="pv-h2">{{ s.h }}</h2>
          <template v-for="(b, i) in s.blocks" :key="i">
            <p v-if="b.p" class="pv-p">{{ b.p }}</p>
            <ul v-else-if="b.ul" class="pv-ul">
              <li v-for="item in b.ul" :key="item">{{ item }}</li>
            </ul>
          </template>
        </section>
      </article>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { t } from '@/locales/index.js';
import { HexlashMark } from '@/components/brand/hexlashMark.js';

const router = useRouter();

// «Назад» ведёт туда, откуда пришли: из кабинета — в кабинет, со входа — ко
// входу. vue-router кладёт предыдущий адрес в history.state.back; если его нет
// (страницу открыли прямой ссылкой или в новой вкладке), назад идти некуда и мы
// ведём на главную — router.back() в такой вкладке вывел бы человека с сайта.
const goBack = () => {
  if (window.history.state && window.history.state.back) router.back();
  else router.push('/');
};
</script>

<style scoped>
/* Вся страница — только токены из tokens.css. Шрифт задан явно на каждом
   тексте: базовый шрифт игрового шелла здесь не наследуется, и опираться на
   наследование нельзя. */
.pv-root {
  --mark: 48px; /* бокс знака; от него выводятся слово и зазор связки 44·24·14 */
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--void);
  color: var(--ink);
  font-family: var(--font-mono);
}

/* ── Шапка ───────────────────────────────────────────────────────────────── */
.pv-top {
  position: sticky;
  top: 0;
  z-index: var(--z-topbar);
  background: var(--void);
  border-bottom: 1px solid var(--line);
}
.pv-top-in {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--sp-3) var(--sp-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-4);
}

.pv-back {
  min-height: var(--h-btn-sm);
  padding: 0 var(--sp-3) 0 0;
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  background: none;
  border: 0;
  border-radius: var(--r-none);
  color: var(--ink-dim);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: var(--t-md);
  letter-spacing: var(--ls-title);
  text-transform: uppercase;
  cursor: pointer;
  transition: color var(--d-fast);
}
.pv-back-arrow { font-size: var(--t-xl); line-height: 1; }
.pv-back:hover { color: var(--ink); }
.pv-back:focus-visible,
.pv-lock:focus-visible { outline: 1px solid var(--ink-dim); outline-offset: 2px; }

/* Связка знак + слово: знак 44 · слово 24 · зазор 14, всё от --mark. */
.pv-lock {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--mark) * 14 / 44);
  color: var(--ink);
  text-decoration: none;
}
.pv-mark { width: var(--mark); height: var(--mark); display: block; flex: none; }
.pv-word {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: calc(var(--mark) * 24 / 44);
  line-height: 1;
  letter-spacing: var(--ls-title);
  text-transform: uppercase;
}

/* ── Колонка ─────────────────────────────────────────────────────────────── */
.pv-main { padding: var(--sp-7) var(--sp-4) calc(var(--sp-7) * 2); }
.pv-col { max-width: 720px; margin: 0 auto; }

.pv-title {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--t-3xl);
  line-height: 1;
  letter-spacing: var(--ls-tight);
  text-transform: uppercase;
  color: var(--ink);
}
.pv-updated {
  margin: var(--sp-3) 0 0;
  font-size: var(--t-xs);
  letter-spacing: var(--ls-meta);
  text-transform: uppercase;
  color: var(--ink-dim);
}
.pv-intro {
  margin: var(--sp-6) 0 0;
  font-size: var(--t-md);
  line-height: 1.7;
  color: var(--ink);
  overflow-wrap: break-word;
}

.pv-sec {
  margin-top: var(--sp-7);
  padding-top: var(--sp-5);
  border-top: 1px solid var(--line);
}
.pv-h2 {
  margin: 0 0 var(--sp-4);
  font-family: var(--font-display);
  font-weight: 800;
  font-size: var(--t-lg);
  line-height: 1.2;
  letter-spacing: var(--ls-title);
  text-transform: uppercase;
  color: var(--ink);
}
.pv-p {
  margin: 0 0 var(--sp-4);
  font-size: var(--t-md);
  line-height: 1.7;
  color: var(--ink);
  overflow-wrap: break-word;
}
.pv-p:last-child { margin-bottom: 0; }

.pv-ul {
  margin: 0 0 var(--sp-4);
  padding: 0;
  list-style: none;
}
.pv-ul:last-child { margin-bottom: 0; }
.pv-ul li {
  position: relative;
  margin: 0 0 var(--sp-3);
  padding-left: var(--sp-5);
  font-size: var(--t-md);
  line-height: 1.7;
  color: var(--ink);
  overflow-wrap: break-word;
}
.pv-ul li:last-child { margin-bottom: 0; }
/* Квадратный маркер, не круглый: скруглений в проекте нет. */
.pv-ul li::before {
  content: '';
  position: absolute;
  left: var(--sp-1);
  top: 0.78em;
  width: 5px;
  height: 5px;
  background: var(--ink-dim);
}

/* Розовый на этой странице — только ссылки. Сейчас ссылок в тексте нет, правило
   стоит на случай, когда появится адрес для связи. */
.pv-col a { color: var(--pink); text-decoration: none; border-bottom: 1px solid currentColor; }

@media (max-width: 480px) {
  .pv-main { padding-top: var(--sp-6); }
  .pv-sec { margin-top: var(--sp-6); }
}
</style>
