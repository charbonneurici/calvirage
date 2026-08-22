// Les dates des matchs sont stockées en heure de Paris ("2026-09-05").
// toISOString() renvoie de l'UTC : passé 22h l'été, il donne déjà le lendemain
// et ferait disparaître le match du soir de la liste "à venir".
export function todayISO(offsetDays = 0) {
  const now = new Date();
  const paris = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
  paris.setDate(paris.getDate() + offsetDays);
  const pad = n => String(n).padStart(2, '0');
  return `${paris.getFullYear()}-${pad(paris.getMonth() + 1)}-${pad(paris.getDate())}`;
}
