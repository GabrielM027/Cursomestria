const supabaseUrl = "https://tqkbehwjylktpfrguvlr.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxa2JlaHdqeWxrdHBmcmd1dmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MDM3OTMsImV4cCI6MjA4NzI3OTc5M30.y3_oPDjhM-u2Bq-R5YfOhonyfv8lChjfP2_zlAlu4Wg";

const sponsors = [
  { name: "Rota 27", logoUrl: "https://github.com/GabrielM027/Cursomestria/releases/download/sponsor-assets-2026/sponsor-rota-27-black-card.png", displayScale: 1, offsetX: 0, offsetY: 0, fitMode: "cover", sortOrder: 20 },
  { name: "Elloskar Seminovos", logoUrl: "https://github.com/GabrielM027/Cursomestria/releases/download/sponsor-assets-2026/sponsor-elloskar-black-card.png", displayScale: 1, offsetX: 0, offsetY: 0, fitMode: "cover", sortOrder: 30 },
  { name: "Point Restaurante", logoUrl: "https://github.com/GabrielM027/Cursomestria/releases/download/sponsor-assets-2026/sponsor-point-restaurante-black-card.png", displayScale: 1, offsetX: 0, offsetY: 0, fitMode: "cover", sortOrder: 40 },
  { name: "FormaFit Academia", logoUrl: "https://github.com/GabrielM027/Cursomestria/releases/download/sponsor-assets-2026/sponsor-formafit-black-card.png", displayScale: 1, offsetX: 0, offsetY: 0, fitMode: "cover", sortOrder: 50 },
  { name: "Panificadora Marques", logoUrl: "https://github.com/GabrielM027/Cursomestria/releases/download/sponsor-assets-2026/sponsor-panificadora-marques-black-card.png", displayScale: 1, offsetX: 0, offsetY: 0, fitMode: "cover", sortOrder: 60 },
  { name: "Goldcar Automóveis", logoUrl: "https://github.com/GabrielM027/Cursomestria/releases/download/sponsor-assets-2026/sponsor-goldcar-black-card.png", displayScale: 1, offsetX: 0, offsetY: 0, fitMode: "cover", sortOrder: 70 },
];

function headers(token, extra = {}) {
  return {
    apikey: anonKey,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function request(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Supabase retornou ${response.status}`);
  const body = await response.text();
  return body ? JSON.parse(body) : null;
}

if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  throw new Error("Credenciais administrativas indisponíveis para cadastrar patrocinadores.");
}

const login = await request(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: anonKey, "Content-Type": "application/json" },
  body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
});

const token = login.access_token;
const existing = await request(`${supabaseUrl}/rest/v1/sponsors?select=id,name`, { headers: headers(token) });
const existingByName = new Map(existing.map((sponsor) => [sponsor.name.trim().toLocaleLowerCase("pt-BR"), sponsor.id]));

const gmId = existingByName.get("g&m construções e reformas");
if (gmId) {
  await request(`${supabaseUrl}/rest/v1/sponsors?id=eq.${gmId}`, {
    method: "DELETE",
    headers: headers(token, { Prefer: "return=minimal" }),
  });
}

for (const sponsor of sponsors) {
  const payload = { ...sponsor, isActive: true };
  const knownId = existingByName.get(sponsor.name.toLocaleLowerCase("pt-BR"));
  if (knownId) {
    await request(`${supabaseUrl}/rest/v1/sponsors?id=eq.${knownId}`, {
      method: "PATCH",
      headers: headers(token, { Prefer: "return=minimal" }),
      body: JSON.stringify(payload),
    });
  } else {
    await request(`${supabaseUrl}/rest/v1/sponsors`, {
      method: "POST",
      headers: headers(token, { Prefer: "return=minimal" }),
      body: JSON.stringify(payload),
    });
  }
}

console.log(`Patrocinadores cadastrados ou atualizados: ${sponsors.length}`);
