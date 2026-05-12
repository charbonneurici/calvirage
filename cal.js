export default async function handler(req, res) {
    const { teams } = req.query;
    if (!teams) return res.status(400).send("No teams selected");
    const decodedTeams = Buffer.from(teams, 'base64').toString().split(',');
    
    // BASE DE DONNÉES (Dates sans le "Z" pour forcer l'heure locale)
    const matchDatabase = [
        { team: "stade-toulousain", summary: "Toulouse vs La Rochelle", date: "2026-03-28T21:05:00" },
        { team: "stade-toulousain", summary: "Bordeaux vs Toulouse", date: "2026-04-04T15:00:00" },
        { team: "stade-toulousain", summary: "Toulouse vs Racing 92", date: "2026-04-11T21:05:00" }
    ];

    const filteredMatches = matchDatabase.filter(m => decodedTeams.includes(m.team));

    let ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'X-WR-CALNAME:Top 14 Rugby',
        'METHOD:PUBLISH'
    ];

    filteredMatches.forEach(event => {
        const startDate = new Date(event.date);
        const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000));

        // Format AAAAMMDDTHHMMSS (sans Z à la fin)
        const formatLocal = (d) => {
            const pad = (n) => n.toString().padStart(2, '0');
            return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
        };

        ics.push('BEGIN:VEVENT');
        ics.push(`SUMMARY:🏉 ${event.summary}`);
        ics.push(`DTSTART:${formatLocal(startDate)}`);
        ics.push(`DTEND:${formatLocal(endDate)}`);
        ics.push(`UID:${event.team}-${formatLocal(startDate)}@sportcal.com`);
        ics.push('END:VEVENT');
    });

    ics.push('END:VCALENDAR');
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.status(200).send(ics.join('\r\n'));
}
