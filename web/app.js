import { createClient } from "@supabase/supabase-js";

const URL = "https://wxuynmtypruipghvsevh.supabase.co";
const KEY = "sb_publishable__WMXh65F0lV7k8I8yOjI6g_5m_8-Xv4"; // publishable, можно в фронте
const sb = createClient(URL, KEY);

const $ = (id) => document.getElementById(id);
const greeting = $("greeting"), authPanel = $("auth-panel");
const accPanel = $("account-panel"), stub = $("stub");

$("btn-auth-open").onclick = () => { authPanel.classList.toggle("hidden"); };
$("btn-logout").onclick = async () => { await sb.auth.signOut(); await refresh(); };

$("btn-signup").onclick = async () => {
  const email = $("email").value.trim(), password = $("password").value;
  $("auth-msg").textContent = "";
  const { error } = await sb.auth.signUp({ email, password });
  if (error) { $("auth-msg").textContent = "Ошибка: " + error.message; return; }
  $("auth-msg").textContent = "Аккаунт создан.";
  authPanel.classList.add("hidden");
  await refresh();
};
$("btn-login").onclick = async () => {
  const email = $("email").value.trim(), password = $("password").value;
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) { $("auth-msg").textContent = "Ошибка: " + error.message; return; }
  $("auth-msg").textContent = "";
  authPanel.classList.add("hidden");
  await refresh();
};

const AV_COLORS = ["#2475d6","#0a8f3c","#d14e22","#4b34b8","#03928c","#a91b42"];
function setAvatar(nick) {
  const av = $("avatar"), letter = $("avatar-letter");
  if (!nick) {
    av.classList.remove("is-user"); av.classList.add("is-guest");
    av.style.background = "#cfd8dc"; av.title = "гость"; letter.textContent = "?";
    return;
  }
  const ch = (nick[0] || "?").toUpperCase();
  let h = 0; for (const c of nick) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  av.classList.remove("is-guest"); av.classList.add("is-user");
  av.style.background = AV_COLORS[h % AV_COLORS.length];
  av.title = nick; letter.textContent = ch;
}

  $("btn-save").onclick = async () => {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;
  const nick = $("nick").value.trim(), bio = $("bio").value.trim();
  $("acc-msg").textContent = ""; $("nick-status").textContent = "";
  if (!/^[A-Za-z0-9_]{3,20}$/.test(nick)) { $("nick-status").textContent = "Ник 3-20: a-z 0-9 _"; return; }
  const { data: taken } = await sb.from("profiles").select("id").ilike("nick", nick).neq("id", user.id).limit(1);
  if (taken && taken.length) { $("nick-status").textContent = "Ник уже занят — другой взять не сможет, выбери другой."; return; }
  const { error } = await sb.from("profiles").update({ nick, bio }).eq("id", user.id);
  if (error) { $("acc-msg").textContent = /duplicate|unique|23505/i.test(error.message) ? "Ник уже занят." : "Ошибка: " + error.message; return; }
  $("acc-msg").textContent = "Сохранено.";
  await refresh();
};

document.querySelectorAll(".tile").forEach(t => {
  t.onclick = async () => {
    const go = t.dataset.go;
    stub.classList.add("hidden"); accPanel.classList.add("hidden");
    if (go === "account") {
      accPanel.classList.remove("hidden");
    } else {
      const names = { chats:"Чаты", feed:"Лента", communities:"Сообщества", settings:"Настройки", safety:"Безопасность" };
      stub.innerHTML = `<h2>${names[go] ?? go}</h2><p class="muted">Раздел в разработке. Сначала бэкенд и dashboard.</p>`;
      stub.classList.remove("hidden");
    }
  };
});

async function refresh() {
  const { data: { user } } = await sb.auth.getUser();
  $("btn-logout").classList.toggle("hidden", !user);
  $("btn-auth-open").classList.toggle("hidden", !!user);
  if (!user) {
    greeting.textContent = "Здравствуйте, гость";
    setAvatar(null);
    return;
  }
  const { data } = await sb.from("profiles").select("nick,bio").eq("id", user.id).single();
  const nick = data?.nick ?? "user";
  greeting.textContent = `Здравствуйте, ${nick}`;
  setAvatar(nick);
  $("nick").value = data?.nick ?? "";
  $("bio").value = data?.bio ?? "";
  authPanel.classList.add("hidden");
}
setAvatar(null);
refresh();
