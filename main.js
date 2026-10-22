/*======================================
    アクセス数API関数
======================================*/
const API_URL = 'https://mainworker.itsukaichi-3project.workers.dev';

/**
 * 1. 指定した日数前の日付文字列（YYYY-MM-DD）を返す関数
 * @param {number} daysAgo - 0なら今日、1なら昨日、2なら一昨日...
 */
function getDateString(daysAgo = 0) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}
function getMonthString(monthAgo = 0) {
  const date = new Date()
  date.setDate(1)
  date.setMonth(date.getMonth() - monthAgo)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2,'0')
  return `${year}-${month}`
}

function getCurrentJstHour() {
    const formatter = new Intl.DateTimeFormat('ja-JP', {
        timeZone: 'Asia/Tokyo',
        hour: 'numeric',
        hour12: false // 24時間表記にする（trueにすると午前/午後になる）
    });
    
    // format() は文字列を返すため、数的に扱いたい場合は parseInt で数値化する
    return parseInt(formatter.format(new Date()), 10);
}

/**
 * 2. 指定したKVのkeyの値を呼び出す関数（取得）
 */
async function getKeyValue(key) {
    try {
        const res = await fetch(`${API_URL}/?action=get&key=${encodeURIComponent(key)}`);
        const data = await res.json();
        return data.success ? data.value : null;
    } catch (err) {
        console.error('KV取得エラー:', err);
        return null;
    }
}

/**
 * 3. 指定したKVのkeyに値を書き込む関数（保存）
 */
async function setKeyValue(key, value) {
    try {
        const res = await fetch(`${API_URL}/?action=set&key=${encodeURIComponent(key)}&value=${encodeURIComponent(value)}`);
        const data = await res.json();
        return data.success;
    } catch (err) {
        console.error('KV保存エラー:', err);
        return false;
    }
}

async function incrementValue(key){
  const currentStr = await getKeyValue(key);
  const currentVal = currentStr !== null ? parseInt(currentStr, 10) : 0;
  const newVal = currentVal + 1;
    
  // 新しい値を保存する
  await setKeyValue(key, newVal);
  return newVal;
}
/**
 * 4. 【更新】指定したKVのkeyからJSONを取得し、その中の特定のキーの値を取り出す関数
 * @param {string} kvKey - KVのキー名（例: 'ViewsDay'）
 * @param {string} innerKey - JSON内のキー名（例: '2026-10-12' や 'total'）
 * @param {any} defaultValue - 値が存在しない場合のデフォルト値
 */
async function getInnerValue(kvKey, innerKey, defaultValue = 0) {
    const rawValue = await getKeyValue(kvKey);
    try {
        const data = JSON.parse(rawValue);
        return data[innerKey] ?? defaultValue;
    } catch (e) {
        return defaultValue;
    }
}

/**
 * 5. 【更新】指定したKVのkeyからJSONを取得し、その中の特定のキーの値を書き換えて保存する関数
 * @param {string} kvKey - KVのキー名（例: 'ViewsDay'）
 * @param {string} innerKey - JSON内のキー名（例: '2026-10-12' や 'total'）
 * @param {any} value - 新しく設定する値
 */
async function setInnerValue(kvKey, innerKey, value) {
    // 現在のJSONデータを取得
    const rawValue = await getKeyValue(kvKey);
    let data = {};
    try {
        console.log("setInnerValueのJSON取得は実行された。")
        const parsed=JSON.parse(rawValue)
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)){
          data = parsed;
        }else{
          data={};
        }
    } catch (e) {
        data = {};
        console.log("setInnerValueのJSON取得はエラーになった。")
    }
    
    // 特定のキーの値を書き換え
    data[innerKey] = value;
    
    // JSON文字列に戻してKVに保存
    const updatedJsonString = JSON.stringify(data);
    return await setKeyValue(kvKey, updatedJsonString);
}

/**
 * 6. 【更新】指定したKVのkeyと内部キーを指定してインクリメント（+1して保存）する関数
 * @param {string} kvKey - KVのキー名（例: 'ViewsDay'）
 * @param {string} innerKey - JSON内のキー名（例: getDateString(0) や 'totalCount'）
 */
async function incrementInnerValue(kvKey, innerKey) {
    // 1. 現在のインナー値を取得する（デフォルトは0）
    const currentValue = await getInnerValue(kvKey, innerKey, 0);
    
    // 2. +1する
    const newValue = currentValue + 1;
    
    // 3. すでに存在する setInnerValue を使って安全に保存する
    await setInnerValue(kvKey, innerKey, newValue);
    
    return newValue;
}

async function incrementInnerValuewithToday(keyname){
  const today=getDateString()
  console.log(today)
  const todayVal = await incrementInnerValue(`${keyname}Days`,`${keyname}_${today}`)
  const allVal = await incrementValue(keyname)
  return {today:todayVal,all:allVal}
}

async function incrementKey(keyname){
  const today=getDateString()
  const month = getMonthString()
  const hour = getCurrentJstHour()
  const todayVal = await incrementInnerValue(`${keyname}Days`,`${keyname}_${today}`)
  const monthVal = await incrementInnerValue(`${keyname}Monthes`,`${keyname}_${month}`)
  const hourVal = await incrementInnerValue(`${keyname}Hours`,`${keyname}_${hour}`)
  const allVal = await incrementValue(keyname)
  return {today:todayVal,all:allVal,month:monthVal,hour:hourVal}
}

async function getInnerValuewithToday(keyname){
  const today = getDateString()
  const yesterday = getDateString(1)
  const todayVal = await getInnerValue(`${keyname}Days`,`${keyname}_${today}`)
  const yesterdayVal = await getInnerValue(`${keyname}Days`,`${keyname}_${yesterday}`)
  const allVal = await getKeyValue(keyname)
  return {today:todayVal,all:allVal,yesterday:yesterdayVal};
}

/*======================================
    表示数表示関数
======================================*/

async function openViews(pagetype = "Main"){
  document
    .getElementById("top-page")
    .classList.add("hidden");

  document
    .getElementById("work-page")
    .classList.add("hidden");
  
  document
    .getElementById("view-page")
    .classList.remove("hidden")

  const daysrawData = await getKeyValue(`View_${pagetype}Days`)
  const monthesrawData = await getKeyValue(`View_${pagetype}Monthes`)
  const hourrawData = await getKeyValue(`View_${pagetype}Hours`)
  const daysData = daysrawData ? JSON.parse(daysrawData) : {}
  const monthesData = monthesrawData ? JSON.parse(monthesrawData) : {}
  const hoursData = hourrawData ? JSON.parse(hourrawData) : {}
  const viewPage = document.getElementById("view-page")
  viewPage.style.setProperty("--current-color","#444")
  const bascs = await getInnerValuewithToday(`View_${pagetype}`)
  document.getElementById("viewPage_All").innerHTML=`総数:${bascs.all} <br> 本日:${bascs.today} <br> 昨日${bascs.yesterday}` 

  for(let i =0;i<7;i++){
    document.getElementById("viewPage_week").innerHTML += `${getDateString(i)} : ${daysData[`View_${pagetype}_${getDateString(i)}`] || 0} <br>`
  }
  for(let i = 0; i<12; i++){
    document.getElementById("viewPage_month").innerHTML += `${getMonthString(i)} : ${monthesData[`View_${pagetype}_${getMonthString(i)}`] || 0} <br>`
  }
  for(let i =0; i<24; i++){
    document.getElementById("viewPage_time").innerHTML += `${i}:00~${i+1}:00 : ${hoursData[`View_${pagetype}_${i}`] || 0} <br>`
  }
}
/* =====================================
   作品情報（ここに生徒2〜3人の意見をそれぞれ設定できます）
===================================== */

const works = {
  0: {
    className: "全体",

    title: "分析結果",

    category: "中学生の分析は？",

    color:"#000",
    bgColor: "#FDF2F2",

    description:
      "中学生がアンケート結果を分析して作ったポスターです\n各クラス特色があるのでぜひ見てみてください。",
    
    howto:
      "",
    photo:"https://raw.githubusercontent.com/Itsukaichi-3project/MainPage/main/Images/3-0.jpg",
    
    points:[
      {
        role:"teacher",
        author:"指導した先生",
        text:"aaa"
      },
      {
        role: "student",
        author: "協力した生徒",
        text:"bbb"
      }
    ],
    audioLink:"",
  },

  1: {

    className: "1組",

    title: "英語カルタ",

    category: "楽しみながら英語の力を高めよう",

    color: "#D94B4B",
    bgColor: "#FDF2F2",

    description:
      "1組のみんなが作った英語カルタです。\n英語カルタと神経衰弱ともに楽しめる物です。読み札にも絵や英単語が描いてあるため、読み手も英語を楽しめるようになっています！",

    howto:
      "①四角い取り札を並べる\n②丸い読み札をに書かれている単語をランダムに読むか、サイトで再生する。\n③読まれた札を取る\n④一番多く札を取れた人が勝ち!\n［神経衰弱の場合］①丸い方と四角い方の札を全て裏側にして全部並べる。\n②丸い札を一枚裏返し、次に四角い札を一枚裏返す。\n③どちらも絵と単語が同じだったらその2枚をもらうことができる。\n④一番多く札を取れたが勝ち！",

    photo: "https://raw.githubusercontent.com/Itsukaichi-3project/MainPage/main/Images/3-1.png",

    // 担任の先生 ＋ 生徒の意見（2〜3人分をここに追加できます）
    points: [
      {
        role: "teacher",
        author: "担任の先生",
        text: "①英語カルタ②神経衰弱の2パターンで楽しく遊べるものになっています。カルタの場合、取り札・読み札共に同じ情報があるため、読み手も楽しながら英語が学べます。"
      },
      {
        role: "student",
        author: "生徒 Aさん",
        text: "四角い札と丸い札の絵柄を揃えました。"
      },
      {
        role: "student",
        author: "生徒 Bさん",
        text: "小さい子が怪我をしないよう、角を丸くしたりしました。"
      }
    ],

    audioLink: null

  },


  2: {

    className: "2組",

    title: "英語カルタ",

    category: "幅広い年齢で英語を楽しもう",

    color: "#E88AA4",
    bgColor: "#FDF6F8",

    description:
      "2組のみんなが作った英語カルタです。\n子どもでもわかりやすい馴染みのある単語で作っており、QRで音声を流すことも可能です。１人でも家族でも！",

    howto:
      "①取り札を並べる\n②読み札をランダムに読むか、サイトで再生する\n③読まれた札を取る\n④一番多く札を取れた人が勝ち！",

    photo: "https://raw.githubusercontent.com/Itsukaichi-3project/MainPage/main/Images/3-2.png",

    points: [
      {
        role: "teacher",
        author: "担任の先生",
        text: "子どもに親しみやすい英語を選び、親子で楽しめる仕様にしました。また、保護者が手を離せない時でもQRコードで音声を自動で流せられるようにするため、ママ会の最中でもお子様だけで遊べます。"
      },
      {
        role: "student",
        author: "生徒 Aさん",
        text: "小さな子でも親しみやすいように、イラストを追加しました。"
      },
      {
        role: "student",
        author: "生徒 Bさん",
        text: "ゲームを楽しめるように、裏面にコインのイラストを追加して得点をつけました。"
      }
    ],

    audioLink: "https://output.jsbin.com/bayadon"

  },


  3: {

    className: "3組",

    title: "国語カルタ",

    category: "五日市の言葉と遊ぼう",

    color: "#D9B62B",
    bgColor: "#FCF9EE",

    description:
      "3組のみんなが作った国語カルタです。\nQRで音声の読み上げ機能をつけたカルタを作りました。お店での待ち時間に使って欲しいです！",

    howto:
      "①絵のかかれた「取り札」をバラバラに並べる\n②読む人を決めてランダムに読むorオリジナル読み上げサイト「ことのはカルタ」を利用する\n③読み上げられた頭文字の「取り札」をとる→一番早く触れた人がその札をゲットできる\n④すべての取り札がなくなったとき、一番多く絵札を持っている人が勝ち！",

    photo: "https://raw.githubusercontent.com/Itsukaichi-3project/MainPage/main/Images/3-3.png",

    points: [
      {
        role: "teacher",
        author: "担任の先生",
        text: "子どもが安全に遊べるよう、一枚一枚角を取りました。"
      },
      {
        role: "student",
        author: "生徒 Aさん",
        text: "読み上げサイトを作成し、子どもだけでも遊べるように工夫しました。"
      },
      {
        role: "student",
        author: "生徒 Bさん",
        text: "小さな取り札一つずつの五日市の魅力をギュッと詰め込んだ、かわいいイラストをかきました！"
      }
    ],

    externalLink:
      "https://kotonoha-karuta.netlify.app/"

  },


  4: {

    className: "4組",

    title: "絵本「だぁれの？」の歌",

    category: "みんなで楽しく歌おう",

    color: "#E87B32",
    bgColor: "#FEF6F0",

    description:
      "4組のみんなが作った歌です。\n地域の子どもたちが楽しく歌ってくれるように絵本の世界観そのままにして作りました。５組の「だぁれの？」という絵本の歌です。絵本のQRを読み込んで聞いてみて下さい！",

    howto:
      "絵本を見ながら歌ったり、情景を想像しながら歌ってみてください。",

    photo: "https://raw.githubusercontent.com/Itsukaichi-3project/MainPage/main/Images/3-4.jpg",
    points: [
      {
        role: "teacher",
        author: "担任の先生",
        text: "絵本の世界観をそのまま再現できるよう、音色や速度を工夫しました。子どもでも歌いやすい音域、速すぎない速度を工夫しました。"
      },
      {
        role: "student",
        author: "生徒 Aさん",
        text: "歌録りをする時、歌いやすさやイメージに合わせてメロディを変更するなどより良いものができるように考えました。"
      },
      {
        role: "student",
        author: "生徒 Bさん",
        text: "優しく明るく可愛い音色になるよう、楽器の組み合わせを工夫しました。"
      }
    ],

    audioLink: "https://output.jsbin.com/loqebev?path=music_3-4.m4a"

  },


  5: {

    className: "5組",

    title: "絵本",

    category: "親子で一緒に会話して絵本を楽しもう",

    color: "#8064A8",
    bgColor: "#F4F2F8",

    description:
      "5組のみんなが作った絵本です。\n五日市のコイン通りに置いてある十二支の銅像を入れた五日市ならではの絵本を作りました。繰り返し読んでも楽しめる絵本となっています！",

    howto:
      "①まずは親子で一緒に読んでみよう。\n②歌付きの絵本動画をQRで読み込んでお子様と一緒に楽しんでみよう。",

    photo: "https://raw.githubusercontent.com/Itsukaichi-3project/MainPage/main/Images/3-5.png",

    points: [
      {
        role: "teacher",
        author: "担任の先生",
        text: "未就学児のお子様でも楽しめるように繰り返しの要素、次は誰か想像したくなるような構成等時には授業外の時間でも皆で議論しながらストーリーを作りました。\nその後、フェルト、紹介文、表紙、繰り返しのページ担当、影作りの担当、ストーリーの詳細担当、背景担当等クラス全員がそれぞれの役割を果たし作り上げました。全員で協力して一つのデザインを作り上げる点にはとても苦労しました。"
      },
      {
        role: "student",
        author: "生徒 Aさん",
        text: "表紙のタイトル「だぁれの？」のフォントをマフラーにしようと提案し、表紙から「見てみよう」「面白そうだな」と思えるように工夫を施しました。"
      },
      {
        role: "student",
        author: "生徒 Bさん",
        text: "写真を撮ったり、編集をする上で、写真の明るさを調整したり、写真を撮る際にフェルトなどの配置なども決めていました。編集では、撮った写真の明るさを調整しました。"
      },
      {
        role: "student",
        author: "生徒 Cさん",
        text: "背景の森のところを緑や黄緑などを使ってぼかしすぎないように淡くしたり、背景の形を揃えました。"}      
    ]

  },


  6: {

    className: "6組",

    title: "サイエンスグッズ",

    category: "身近な道具で、サイエンス体験！",

    color: "#4D83C4",
    bgColor: "#EFF4F9",

    description:
      "6組のみんなが作ったサイエンスグッズです。\nお家でも再現しやすく、アレンジしやすいように、身の回りのものを使ってつくりました。ぜひ、チャレンジしてみてください！",

    howto:
      "Aシマシマギョの冒険（詳細は「浮沈子」で検索\n ①ペットボトルを「グッ！」と押してみよう。\n ②魚が沈んだら、今度は手を離してみよう？！\n B磁石でGO！\n ①リンゴマークがついた磁石をスタート位置に置こう。\n ②割りばしの先についた磁石を近づけて、スタートに置いた磁石を反発させてゴールまで連れて行こう。",

    photo: "https://raw.githubusercontent.com/Itsukaichi-3project/MainPage/main/Images/3-6.png",

    points: [
      {
        role: "teacher",
        author: "担任の先生",
        text: "シマシマギョの冒険において、１つのペットボトルに３つの魚を入れることで、魚の沈み方に差が出て、動的な違いを生み出しました。"
      },
      {
        role: "student",
        author: "生徒 Aさん",
        text: "磁石でGOのマップについて、子供に身近に感じてもらえるように、コイン通りを意識して作成しました。"
      },
      {
        role: "student",
        author: "生徒 Bさん",
        text:"シマシマギョの冒険について、子供が見て明るい気持ちになるように、南国風をイメージして、暖かみのある見た目に仕上げました。"
      }
    ]

  },


  7: {

    className: "7組",

    title: "絵本",

    category: "ぱっしーとおとのぼうけんにでかけよう！",

    color: "#5A9A63",
    bgColor: "#F1F7F2",

    description:
      "7組のみんなが作った絵本です。\n各グループで工夫して絵本を６冊作りました。子どもが興味を持てるようなキャラにしました。たくさん読んでください！",

    howto:
      "音を想像しながら読んでみる",

    photo: "https://raw.githubusercontent.com/Itsukaichi-3project/MainPage/main/Images/3-7.png",

    points: [
      {
        role: "teacher",
        author: "担任の先生",
        text: "ものがたりの内容を小さい子でも分かりやすいようなシンプルな物語にし、キャラクターもライオンがモデルの可愛いキャラクターになっています。"
      },
      {
        role: "student",
        author: "生徒 Aさん",
        text: "オノマトペの部分とぱっしーをフェルトで作って、ページごとの作画の差がないようにしました。小さい子でも分かりやすい物語で色々な色を使っているので可愛くできました！"
      }
    ]

  }

};


/* =====================================
   クラスページを開く
===================================== */

function openClass(classNumber) {

  const work = works[classNumber];


  document
    .getElementById("top-page")
    .classList.add("hidden");

  document
    .getElementById("view-page")
    .classList.add("hidden");

  document
    .getElementById("work-page")
    .classList.remove("hidden");


  /* クラスカラー */

  const workPage = document.getElementById("work-page");
  workPage.style.setProperty("--current-color", work.color);
  workPage.style.setProperty("--student-bg", work.bgColor || "#f7fafc");


  /* 基本情報 */

  document
    .getElementById("work-class")
    .textContent =
      work.className;

  document
    .getElementById("work-title")
    .textContent =
      work.title;

  document
    .getElementById("work-category")
    .textContent =
      work.category;

  document
    .getElementById("work-description")
    .textContent =
      work.description;

  document
    .getElementById("work-howto")
    .textContent =
      work.howto;

  if(classNumber==0){
    document.getElementById("work-howto").classList.add("hidden")
  }else{
    document.getElementById("work-howto").classList.remove("hidden")
  }
  /* =================================
     制作の工夫（複数人の吹き出しを自動生成）
  ================================= */
  const pointContainer = document.getElementById("work-point-container");
  pointContainer.innerHTML = "";

  if (work.points && work.points.length > 0) {
    work.points.forEach(p => {
      const itemDiv = document.createElement("div");
      
      if (p.role === "teacher") {
        itemDiv.className = "comment-item teacher";
        itemDiv.innerHTML = `
          <div class="comment-author">${p.author}</div>
          <div class="comment-bubble-wrapper">
            <div class="comment-icon">教</div>
            <div class="comment-bubble">${p.text}</div>
          </div>
        `;
      } else {
        itemDiv.className = "comment-item student";
        itemDiv.innerHTML = `
          <div class="comment-author">${p.author}</div>
          <div class="comment-bubble-wrapper">
            <div class="comment-icon">生</div>
            <div class="comment-bubble">${p.text}</div>
          </div>
        `;
      }
      pointContainer.appendChild(itemDiv);
    });
  } else {
    const fallbackDiv = document.createElement("div");
    fallbackDiv.className = "comment-item teacher";
    fallbackDiv.innerHTML = `
      <div class="comment-author">制作の工夫</div>
      <div class="comment-bubble-wrapper">
        <div class="comment-icon">※</div>
        <div class="comment-bubble">${work.point || "準備中"}</div>
      </div>
    `;
    pointContainer.appendChild(fallbackDiv);
  }


  /* =================================
     写真
  ================================= */

  const photoArea =
    document.getElementById("photo-area");

  photoArea.innerHTML = "";

  if (work.photo) {

    const image =
      document.createElement("img");

    image.src = work.photo;

    image.className = "work-photo";

    image.alt =
      work.className + "の作品";

    photoArea.appendChild(image);
  }

/* =================================
   外部サイト
================================= */

const descriptionBox =
  document
    .getElementById("work-description")
    .parentElement;

descriptionBox.querySelectorAll(".external-link").forEach(button => button.remove());

if (work.externalLink) {

  const button =
    document.createElement("a");

  button.href =
    work.externalLink;

  button.target = "_blank";

  button.rel = "noopener noreferrer";

  button.className =
    "external-link";

  button.textContent =
    "3組 ことのはカルタ サイトを見る";

  descriptionBox.appendChild(button);

}

if ([0,1, 2, 4].includes(Number(classNumber))) {
  const audioButton = document.createElement(work.audioLink ? "a" : "button");
  audioButton.className = "external-link";
  audioButton.textContent = classNumber === 4 ? "絵本つきの映像をみる" : classNumber === 0 ? "各クラスのポスターを見る" :"読み上げ音声を聞く";

  if (work.audioLink) {
    audioButton.href = work.audioLink;
    audioButton.target = "_blank";
    audioButton.rel = "noopener noreferrer";
  } else {
    audioButton.type = "button";
    audioButton.disabled = true;
    audioButton.title = "音源URLを設定すると再生できます";
  }

  descriptionBox.appendChild(audioButton);
}
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* =====================================
   トップに戻る
===================================== */

function goHome() {

  document
    .getElementById("work-page")
    .classList.add("hidden");

  document
    .getElementById("top-page")
    .classList.remove("hidden");


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

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

/*=========================================
    アンケートページ遷移制御
=========================================*/
const ancateButton = document.getElementById("ancateButton")
if (JSON.parse(localStorage.getItem('isAnswerd'))){
  ancateButton.classList.add("invisible")
}else{
  ancateButton.classList.remove("invisible")
}

function goAncate(){
  localStorage.setItem('isAnswerd', JSON.stringify(true));
  window.location.href="https://docs.google.com/forms/d/e/1FAIpQLSdfpfIci9iykP1b3fJvDNePSY6cwy2ZkW6E-o2_Hkt1PDCzCA/viewform?usp=dialog"
}

/*=========================================
    アクセス数制御
=========================================*/


async function count(pageState = "Main"){
  const today = getDateString()
  const yesterday = getDateString(1)
  const rawData= await getKeyValue("View_MainDays")
  const daysData = JSON.parse(rawData)
  console.log(daysData)
  const all = await getKeyValue("View_Main")
  document.getElementById("view").innerHTML=`本日:${String(daysData[`View_Main_${today}`] || 0)} <br> 昨日:${String(daysData[`View_Main_${yesterday}`] || 0)} <br> 総数:${String(all)}`
  await incrementKey(`View_${pageState}`)
}


/*======================================
    リンクルート管理
======================================*/
const urlParams = new URLSearchParams(window.location.search);
const pageState = urlParams.get("page") ?? "Main"
const classNumberSt = urlParams.get("class") ?? ""
const viewTypeSt = urlParams.get("viewtype") ?? "Main"
count(pageState+classNumberSt)

if (!pageState){
  goHome();
}else if(pageState=="Main"){
  goHome();
}else if(pageState=="Class"){
  const classNumber = Number(classNumberSt)
  if ([0,1,2,3,4,5,6,7].includes(classNumber)){
    openClass(classNumber)
  }else{
    console.log("クラス番号が有効ではありません")
  }
}else if(pageState=="View"){
  openViews(viewTypeSt)
}
/*==========================================
viewページセレクト処理
==========================================*/
const typeSelect = document.getElementById("view_type")
typeSelect.addEventListener("change",(event) => {
  const type = event.target.value;
  window.location.href=window.location.pathname + `?page=View&viewtype=${type}`
});
