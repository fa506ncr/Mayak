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
  $("auth-msg").textContent = error ? "Ошибка: " + error.message : "Аккаунт создан. Если вход не произошёл — нажми Войти.";
  await refresh();
};
$("btn-login").onclick = async () => {
  const email = $("email").value.trim(), password = $("password").value;
  const { error } = await sb.auth.signInWithPassword({ email, password });
  $("auth-msg").textContent = error ? "Ошибка: " + error.message : "Вход выполнен.";
  await refresh();
};

$("btn-save").onclick = async () => {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;
  const nick = $("nick").value.trim(), bio = $("bio").value.trim();
  const { error } = await sb.from("profiles").update({ nick, bio }).eq("id", user.id);
  $("acc-msg").textContent = error ? "Ошибка: " + error.message : "Сохранено.";
  await refresh(false);
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

async function refresh(resetInputs = true) {
  const { data: { user } } = await sb.auth.getUser();
  $("btn-logout").classList.toggle("hidden", !user);
  $("btn-auth-open").classList.toggle("hidden", !!user);
  if (!user) {
    greeting.textContent = "Здравствуйте, гость";
    if (resetInputs) { authPanel.classList.remove("hidden"); }
    return;
  }
  const { data } = await sb.from("profiles").select("nick,bio").eq("id", user.id).single();
  const nick = data?.nick ?? "user";
  greeting.textContent = `Здравствуйте, ${nick}`;
  $("nick").value = data?.nick ?? "";
  $("bio").value = data?.bio ?? "";
  authPanel.classList.add("hidden");
}
refresh();
