import { createClient } from "@supabase/supabase-js";

const URL = "https://wxuynmtypruipghvsevh.supabase.co";
const KEY = "sb_publishable__WMXh65F0lV7k8I8yOjI6g_5m_8-Xv4";
const sb = createClient(URL, KEY);
const $ = (id) => document.getElementById(id);
const on = (id, fn) => { const el = $(id); if (el) fn(el); };

on("btn-auth-open", (b) => (b.onclick = () => $("auth-panel")?.classList.toggle("hidden")));
on("btn-logout", (b) => (b.onclick = async () => { await sb.auth.signOut(); await refresh(); }));
on("btn-signup", (b) => (b.onclick = async () => {
  const email = $("email").value.trim(), password = $("password").value;
  const { error } = await sb.auth.signUp({ email, password });
  if (error) { $("auth-msg").textContent = "Ошибка: " + error.message; return; }
  $("auth-panel").classList.add("hidden"); await refresh();
}));
on("btn-login", (b) => (b.onclick = async () => {
  const email = $("email").value.trim(), password = $("password").value;
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) { $("auth-msg").textContent = "Ошибка: " + error.message; return; }
  $("auth-panel").classList.add("hidden"); await refresh();
}));
on("btn-save", (b) => (b.onclick = async () => {
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
}));

async function refresh() {
  const g = $("greeting"); if (!g) return;
  const { data: { user } } = await sb.auth.getUser();
  $("btn-logout")?.classList.toggle("hidden", !user);
  $("btn-auth-open")?.classList.toggle("hidden", !!user);
  if (!user) { g.textContent = "Здравствуйте, гость"; return; }
  const { data } = await sb.from("profiles").select("nick,bio").eq("id", user.id).single();
  const nick = data?.nick ?? "user";
  g.textContent = `Здравствуйте, ${nick}`;
  if ($("nick")) $("nick").value = data?.nick ?? "";
  if ($("bio")) $("bio").value = data?.bio ?? "";
  $("auth-panel")?.classList.add("hidden");
}
refresh();
