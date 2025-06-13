// Firebase 設定（請填入你自己的專案設定）
const firebaseConfig = {
  apiKey: "AIzaSyAmJTXQa9Nil4b7wqJ4XkATuV27_6jaX8I",
  authDomain: "ct-b2678.firebaseapp.com",
  databaseURL: "https://ct-b2678-default-rtdb.firebaseio.com",
  projectId: "ct-b2678",
  storageBucket: "ct-b2678.firebasestorage.app",
  messagingSenderId: "481365724243",
  appId: "1:481365724243:web:845c66fcf353d4ab18caa6",
  measurementId: "G-RGMZLJLBM8"
};
// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

const authSection = document.getElementById("auth-section");
const diarySection = document.getElementById("diary-section");
const menuButton = document.getElementById("menu-button");
const sideMenu = document.getElementById("side-menu");
const diaryList = document.getElementById("diary-list");
const historySection = document.getElementById("history-section");
const backgroundSection = document.getElementById("background-section");
const homeSection = document.getElementById("home-section");
const vinyl = document.getElementById("vinyl-container");



function toggleMenu() {
    const sideMenu = document.getElementById("side-menu");
    sideMenu.classList.toggle("show");
}

function showSection(section) {
  const sections = ["home-section", "auth-section", "diary-section", "history-section", "background-section"];

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  const targetSection = document.getElementById(section);
  if (targetSection) {
    targetSection.style.display = "block";
    if (section === "history-section" && auth.currentUser) {
      loadDiariesForMonth(auth.currentUser.uid, currentYear, currentMonth);
    }
  }
  

  // ⬅️ 額外加：點選後自動關閉 menu
  sideMenu.classList.remove("show");
}



// 使用者註冊
function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => alert("註冊成功！"))
    .catch(err => alert(err.message));
}

// 使用者登入
function signIn() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, password)
    .catch(err => alert(err.message));
}

// 使用者登出
function signOut() {
  auth.signOut();
}

// 登入狀態監控
auth.onAuthStateChanged(user => {
  const menuButton = document.getElementById("menu-button"); 
  if (user) {
    authSection.style.display = "none";
    diarySection.style.display = "block";
    menuButton.style.display = "block";
    showSection('home-section'); 
    const uid = user.uid;
    db.ref(`users/${uid}/backgroundUrl`).once("value").then(snapshot => {
      const bgUrl = snapshot.val();
      if (bgUrl) {
        document.body.style.backgroundImage = `url('${bgUrl}')`;
      }
    });
  } else {
    authSection.style.display = "block";
    homeSection.style.display = "block";
    diarySection.style.display = "none";
    historySection.style.display = "none";
    backgroundSection.style.display = "none";
    menuButton.style.display = "none";  
    sideMenu.classList.remove("show");
    document.body.style.backgroundImage = ""; 
  }
});

// 儲存日記
function submitDiary() {
  const user = auth.currentUser;
  if (!user) return;

  const dateInput = document.getElementById("diaryDate").value;
  const dateKey = dateInput || new Date().toISOString().split('T')[0];

  const musicLink = document.getElementById("musicLink").value;
  const mood = document.getElementById("mood").value;
  const text = document.getElementById("diaryText").value;

  const data = {
    date: dateKey,
    musicLink,
    mood,
    text,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  };

  db.ref('diaries/' + user.uid + '/' + dateKey).set(data)
    .then(() => {
      alert("✅ 日記已儲存！");
      document.getElementById("musicLink").value = "";
      document.getElementById("mood").value = "";
      document.getElementById("diaryText").value = "";
      document.getElementById("diaryDate").value = "";
    })
    .catch(err => alert("❌ 儲存失敗：" + err.message));
}


let selectedDate = null; // yyyy-mm-dd
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();


function showModal(date, mood, musicLink, text) {
  selectedDate = date;

  document.getElementById("modal-date").textContent = `📅 日期：${date}`;
  document.getElementById("modal-mood").value = mood || "";
  document.getElementById("modal-text").value = text || "";
  document.getElementById("modal-music").value = musicLink || "";

  const musicContainer = document.getElementById("modal-music-container");
  musicContainer.innerHTML = ""; // 清空先前的內容

  if (musicLink) {
    // 解析 YouTube 連結，轉換為嵌入式格式
    const videoId = extractYouTubeVideoId(musicLink);
    if (videoId) {
      const iframe = document.createElement("iframe");
      iframe.width = "100%";
      iframe.height = "200";
      iframe.src = `https://www.youtube.com/embed/${videoId}`;
      iframe.frameBorder = "0";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;

      musicContainer.appendChild(iframe);
    } else {
      musicContainer.textContent = "無效的 YouTube 連結";
    }
  }

  document.getElementById("diary-modal").classList.remove("hidden");
  document.addEventListener("keydown", function(event) {
  if (event.key === "Escape") {
    closeModal();
  }
});

}

// 解析 YouTube 影片 ID
function extractYouTubeVideoId(url) {
  const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})/);
  return match ? match[1] : null;
}

function closeModal() {
  document.getElementById("diary-modal").classList.add("hidden");
}
function saveEditedDiary() {
  const uid = auth.currentUser.uid;
  const mood = document.getElementById("modal-mood").value.trim();
  const musicLink = document.getElementById("modal-music").value.trim();
  const text = document.getElementById("modal-text").value.trim();

  const diaryData = {
    mood,
    musicLink,
    text,
    date: selectedDate,
    timestamp: Date.now()
  };

  db.ref(`diaries/${uid}/${selectedDate}`).set(diaryData)
    .then(() => {
      alert("✅ 已更新日記！");
      closeModal();
      loadDiariesForMonth(uid, currentYear, currentMonth); // 重新渲染
    });
}


function changeMonth(offset) {
  currentMonth += offset;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  } else if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  loadDiariesForMonth(auth.currentUser.uid, currentYear, currentMonth);
}

function loadDiariesForMonth(uid, year, month) {
  db.ref('diaries/' + uid)
    .orderByChild("timestamp")
    .once("value")
    .then(snapshot => {
      const diaryMap = {};
      snapshot.forEach(childSnapshot => {
        const data = childSnapshot.val();
        if (new Date(data.date).getFullYear() === year &&
            new Date(data.date).getMonth() === month) {
          diaryMap[data.date] = data;
        }
      });
      renderCalendar(diaryMap, year, month);
    });
}

function renderCalendar(diaryMap, year, month) {
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  const calendarTitle = document.getElementById("calendar-title");
  calendarTitle.textContent = `${year}年 ${month + 1}月`; // 顯示年月

  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const table = document.createElement("table");
  table.classList.add("calendar-table");

  const headerRow = document.createElement("tr");
  ["日", "一", "二", "三", "四", "五", "六"].forEach(day => {
    const th = document.createElement("th");
    th.textContent = day;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  let day = 1;
  for (let i = 0; i < 6; i++) {
    const row = document.createElement("tr");
    for (let j = 0; j < 7; j++) {
      const cell = document.createElement("td");

      if (i === 0 && j < startDay) {
        cell.innerHTML = "";
      } else if (day <= daysInMonth) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const diary = diaryMap[dateStr];

        if (diary) {
          cell.innerHTML = `<div class="diary-cell"><strong>${day}</strong><br>${diary.mood}</div>`;
          cell.classList.add("has-diary");
          cell.onclick = () => {
            selectedDate = dateStr;
            const { mood, musicLink, text } = diary;
            showModal(dateStr, mood, musicLink, text);
          };
        } else {
          cell.textContent = day;
        }

        day++;
      }
      row.appendChild(cell);
    }
    table.appendChild(row);
    if (day > daysInMonth) break;
  }

  calendar.appendChild(table);
}


function changeBackground() {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    alert("請先登入");
    return;
  }

  const bgUrl = document.getElementById("bg-url").value.trim();
  if (!bgUrl) {
    alert("請輸入圖片網址！");
    return;
  }

  // 1. 套用背景
  document.body.style.backgroundImage = `url(${bgUrl})`;

  // 2. 存到 Realtime Database
  db.ref('users/' + uid).update({
    backgroundUrl: bgUrl
  }).then(() => {
    alert("背景已更新！");
  }).catch(error => {
    console.error("儲存背景時發生錯誤：", error);
    alert("儲存失敗，請稍後再試。");
  });
}

  const audio = document.getElementById("bg-music");
  const btn   = document.getElementById("toggle-music");
  btn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play();
      btn.textContent = "🔊";
    } else {
      audio.pause();
      btn.textContent = "🔇";
    }
  });