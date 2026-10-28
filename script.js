/*======================================
    フローチャート
===================================== */
const questions = {
  start: {
    text: "今日はどんな気分ですか？",
    choices: [
      { label: "ワイワイ楽しみたい", next: "lively" },
      { label: "まったり楽しみたい", next: "calm" }
    ]
  },
  lively: {
    text: "どんな時にうれしいと感じますか？",
    choices: [
      { label: "「あった！」を見つけたとき", next: "lively-find" },
      { label: "複数人で一緒に楽しむとき", next: "result-4" }
    ]
  },
  "lively-find": {
    text: "どちらの内容が気になりますか？",
    choices: [
      { label: "ちょっと新しいものに出会いたい", next: "result-12" },
      { label: "五日市のことをもっと知りたい", next: "result-3" }
    ]
  },
  calm: {
    text: "どっちをやってみたいですか？",
    choices: [
      { label: "身近なもので、不思議を試してみたい！", next: "result-6" },
      { label: "物語を楽しみたい", next: "calm-story" }
    ]
  },
  "calm-story": {
    text: "どんな物語がいいですか？",
    choices: [
      { label: "マフラーのもちぬしをさがしにいこう！", next: "result-5" },
      { label: "まちの音をさがしにいこう！", next: "result-7" }
    ]
  }
};

const results = {
  "result-12": {
    classes: [
      { name: "1組", color: "#D94B4B", tagline: "楽しみながら英語の力を高めよう" },
      { name: "2組", color: "#E88AA4", tagline: "幅広い年齢で英語を楽しもう" }
    ],
    title: "英語カルタ",
    titleParts: [{ text: "英語", color: "#D94B4B" }, { text: "カルタ", color: "#E88AA4" }],
    description: "1組のみんなが作った英語カルタです。\n英語カルタと神経衰弱ともに楽しめる物です。読み札にも絵や英単語が描いてあるため、読み手も英語を楽しめるようになっています！",
    discription2:　"2組のみんなが作った英語カルタです。\n子どもでもわかりやすい馴染みのある単語で作っており、QRで音声を流すことも可能です。１人でも家族でも！",
    number:1
  },
  "result-3": {
    classes: [{ name: "3組", color: "#D9B62B", tagline: "五日市の言葉と遊ぼう" }],
    title: "国語カルタ",
    description: "3組のみんなが作った国語カルタです。\nQRで音声の読み上げ機能をつけたカルタを作りました。お店での待ち時間に使って欲しいです！",
    number:3
  },
  "result-4": {
    classes: [{ name: "4組", color: "#E87B32", tagline: "みんなで楽しく歌おう" }],
    title: "絵本「だぁれの？」の歌",
    description: "4組のみんなが作った歌です。\n地域の子どもたちが楽しく歌ってくれるように絵本の世界観そのままにして作りました。５組の「だぁれの？」という絵本の歌です。絵本のQRを読み込んで聞いてみて下さい！",
    number:4
  },
  "result-5": {
    classes: [{ name: "5組", color: "#8064A8", tagline: "親子で一緒に会話して絵本を楽しもう" }],
    title: "絵本",
    description: "5組のみんなが作った絵本です。\n五日市のコイン通りに置いてある十二支の銅像を入れた五日市ならではの絵本を作りました。繰り返し読んでも楽しめる絵本となっています！",
    number:5
  },
  "result-6": {
    classes: [{ name: "6組", color: "#4D83C4", tagline: "身近な道具で、サイエンス体験！" }],
    title: "サイエンスグッズ",
    description: "6組のみんなが作ったサイエンスグッズです。\nお家でも再現しやすく、アレンジしやすいように、身の回りのものを使ってつくりました。ぜひ、チャレンジしてみてください！",
    number:6
  },
  "result-7": {
    classes: [{ name: "7組", color: "#5A9A63", tagline: "ぱっしーとおとのぼうけんにでかけよう！" }],
    title: "絵本",
    description: "7組のみんなが作った絵本です。\n各グループで工夫して絵本を６冊作りました。子どもが興味を持てるようなキャラにしました。たくさん読んでください！",
    number:7
  }
};

const panel = document.getElementById("panel");
const step_count = document.getElementById("step-count");
const backButton = document.getElementById("back-button");
const resetButton = document.getElementById("reset-button");
let current = "start";
const history = [];

function render() {
  panel.replaceChildren();
  const isResult = Object.prototype.hasOwnProperty.call(results, current);
  step_count.textContent = isResult ? "結果" : "質問 " + (history.length + 1);

  if (isResult) {
    const result = results[current];
    const card = document.createElement("div");
    card.className = result.classes.length > 1 ? "result result-dual" : "result";
    card.style.setProperty("--result-color", result.classes[0].color);
    const badges = document.createElement("div");
    badges.className = "result-badges";
    result.classes.forEach((item) => {
      const badge = document.createElement("span");
      badge.className = "class-badge";
      badge.textContent = item.name;
      badge.style.setProperty("--class-color", item.color);
      badges.append(badge);
    });
    const title = document.createElement("h2");
    if (result.titleParts) {
      result.titleParts.forEach((part) => {
        const word = document.createElement("span");
        word.textContent = part.text;
        word.style.color = part.color;
        title.append(word);
      });
    } else {
      title.textContent = result.title;
    }
    const taglines = document.createElement("div");
    taglines.className = "result-taglines";
    result.classes.forEach((item) => {
      const tagline = document.createElement("p");
      tagline.className = "result-tagline";
      tagline.textContent = item.tagline;
      taglines.append(tagline);
    });
    const sourceLabel = document.createElement("p");
    sourceLabel.className = "source-label";
    sourceLabel.textContent = "作品について";
    const description = document.createElement("p");
    description.className = "description";
    description.textContent = result.description;
    const link = document.createElement("p");
    link.className = "link"
    link.textContent="ページに移動↗"
    link.addEventListener("click",()=>{window.location.href = window.location.pathname + `?page=Class&class=${result.number}`})
    let description2 = null
    let link2 = null
    if(result.description2){
      description2 = document.createElement("p")
      description2.className= "description"
      description2.textContent = result.description2
      link2 = document.createElement("p");
      link2.className = "link"
      link2.textContent="ページに移動↗"
      link2.addEventListener("click",()=>{window.location.href = window.location.pathname + `?page=Class&class=${result.number+1}`})
    }
    card.append(badges, title, taglines, sourceLabel, description,link);
    if(description2){
      card.append(description2,link2)
    }
    panel.append(card);
  } else {
    const question = questions[current];
    const heading = document.createElement("h2");
    heading.id = "question-heading";
    heading.tabIndex = -1;
    heading.textContent = question.text;
    const list = document.createElement("div");
    list.className = "choice-list";
    list.setAttribute("role", "group");
    list.setAttribute("aria-labelledby", "question-heading");

    question.choices.forEach((choice) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-button";
      button.textContent = choice.label;
      button.addEventListener("click", () => {
        history.push(current);
        current = choice.next;
        render();
      });
      list.append(button);
    });
    panel.append(heading, list);
  }

  backButton.disabled = history.length === 0;
  resetButton.hidden = history.length === 0 && current === "start";
}

backButton.addEventListener("click", () => {
  if (!history.length) return;
  current = history.pop();
  render();
});

resetButton.addEventListener("click", () => {
  current = "start";
  history.length = 0;
  render();
});

render();
/* =====================================
   トップに戻る
===================================== */

function goHome() {
  closePages()

  document
    .getElementById("top-page")
    .classList.remove("hidden");
  
}
/*======================================
    トップへ戻るボタンの表示制御
======================================*/
const pageTopBtn = document.getElementById('page-top');

// 1. スクロール位置に応じてボタンを表示/非表示切り替え
window.addEventListener('scroll', () => {
  // 200px以上スクロールしたら 'is-active' クラスを付与
  if (window.scrollY > 200) {
    pageTopBtn.classList.add('is-active');
  } else {
    pageTopBtn.classList.remove('is-active');
  }
});

// 2. ボタンクリック時に最上部へスムーズスクロール
pageTopBtn.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth' /* なめらかにスクロール */
  });
});

/*==========================================
プロセス表示処理
==========================================*/
(function initProcessReveal() {
    const steps = document.querySelectorAll('.process-reveal');
    if (!steps.length) return;
    document.documentElement.classList.add('process-js');

    if (!('IntersectionObserver' in window)) {
      steps.forEach((step) => step.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -35px 0px' });
    steps.forEach((step) => observer.observe(step));
  })();

/*=============================================
マップ関数
=============================================*/
const GOOGLE_MY_MAPS_EMBED_URL = 'https://www.google.com/maps/d/embed?mid=1Qqnri_VQ0kdQzX8EJ_DfwzxNvAdB4QI&ehbc=2E312F';

(function showGoogleMyMaps() {
  const mapArea = document.getElementById('google-map-area');
  const embedUrl = GOOGLE_MY_MAPS_EMBED_URL.trim();
  if (!mapArea || !embedUrl) return;

  const frame = document.createElement('iframe');
  frame.className = 'map-frame';
  frame.src = embedUrl;
  frame.title = '五日市の実施店舗マップ';
  frame.loading = 'lazy';
  frame.referrerPolicy = 'no-referrer-when-downgrade';
  frame.allowFullscreen = true;
  mapArea.replaceChildren(frame);
})();