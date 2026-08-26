const supabaseUrl = "https://tqkbehwjylktpfrguvlr.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxa2JlaHdqeWxrdHBmcmd1dmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MDM3OTMsImV4cCI6MjA4NzI3OTc5M30.y3_oPDjhM-u2Bq-R5YfOhonyfv8lChjfP2_zlAlu4Wg";

if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) throw new Error("Credenciais administrativas indisponíveis.");

const loginResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: anonKey, "Content-Type": "application/json" },
  body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
});
if (!loginResponse.ok) throw new Error(`Falha de autenticação: ${loginResponse.status}`);
const { access_token: token } = await loginResponse.json();

const response = await fetch(`${supabaseUrl}/rest/v1/sponsors?name=eq.Panificadora%20Marques`, {
  method: "PATCH",
  headers: {
    apikey: anonKey,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  },
  body: JSON.stringify({
    logoUrl: "https://github.com/GabrielM027/Cursomestria/releases/download/sponsor-assets-2026/sponsor-panificadora-marques-legible.png",
    displayScale: 1.32,
  }),
});
if (!response.ok) throw new Error(`Falha ao atualizar Panificadora Marques: ${response.status}`);
console.log("Panificadora Marques atualizada com escala ampliada.");
