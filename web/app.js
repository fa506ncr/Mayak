import { createClient } from "@supabase/supabase-js";

const URL = "https://wxuynmtypruipghvsevh.supabase.co";
const KEY = "sb_publishable__WMXh65F0lV7k8I8yOjI6g_5m_8-Xv4";
const sb = createClient(URL, KEY);
const $ = (id) => document.getElementById(id);

$("btn-auth-open").onclick = () => $("auth-panel").classList.toggle("hidden");
$("btn-logout").onclick = async () => { await sb.auth.signOut(); await refresh(); };

$("btn-signup").onclick = async () => {
  const email = $("email").value.trim(), password = $("password").value;
  const { error } = await sb.auth.signUp({ email, password });
  if (error) { $("auth-msg").textContent = "Ошибка: " + error.message; return; }
  $("auth-panel").classList.add("hidden"); await refresh();
};
$("btn-login").onclick = async () => {
  const email = $("email").value.trim(), password = $("password").value;
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) { $("auth-msg").textContent = "Ошибка: " + error.message; return; }
  $("auth-panel").classList.add("hidden"); await refresh();
};

$("btn-save").onclick = async () => {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;
  const nick = $("nick").value.trim(), bio = $("bio").value.trim();
  $("acc-msg").textContent = ""; $("nick-status").textContent = "";
  if (!/^[A-Za-z0-9_]{3,20}$/.test(nick)) { $("nick-status").textContent = "Ник 3-20: a-z 0-9 _"; return; }
  const { data: taken } = await sb.from("profiles").select("id").ilike("nick", nick).neq("id", user.id).limit(1);
  if (taken?.length) { $("nick-status").textContent = "Ник уже занят."; return; }
  const { error } = await sb.from("profiles").update({ nick, bio }).eq("id", user.id);
  if (error) { $("acc-msg").textContent = "Ошибка: " + error.message; return; }
  $("acc-msg").textContent = "Сохранено."; await refresh();
};

document.querySelectorAll(".tile").forEach((t) => {
  t.onclick = () => {
    const go = t.dataset.go, stub = $("stub"), acc = $("account-panel");
    stub.classList.add("hidden"); acc.classList.add("hidden");
    if (go === "account") acc.classList.remove("hidden");
    else {
      const names = { chats: "Чаты", feed: "Лента", communities: "Сообщества", settings: "Настройки", safety: "Безопасность" };
      stub.innerHTML = `<div class="auth-title">${names[go] ?? go}</div><div class="auth-sub">Раздел в разработке.</div>`;
      stub.classList.remove("hidden");
    }
  };
});

async function refresh() {
  const { data: { user } } = await sb.auth.getUser();
  $("btn-logout").classList.toggle("hidden", !user);
  $("btn-auth-open").classList.toggle("hidden", !!user);
  if (!user) { $("greeting").textContent = "Здравствуйте, гость"; return; }
  const { data } = await sb.from("profiles").select("nick,bio").eq("id", user.id).single();
  const nick = data?.nick ?? "user";
  $("greeting").textContent = `Здравствуйте, ${nick}`;
  $("nick").value = data?.nick ?? "";
  $("bio").value = data?.bio ?? "";
  $("auth-panel").classList.add("hidden");
}
refresh();
