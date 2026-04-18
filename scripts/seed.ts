import { initializeApp } from 'firebase/app';
import { addDoc, collection, getDocs, limit, query } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

if (!firebaseConfig.projectId) {
  throw new Error('Faltan variables de Firebase. Carga un .env antes de correr el seed.');
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const now = new Date().toISOString();

const players = [
  { firstName: 'Juan', lastName: 'Pérez', nickname: 'JP', dominantHand: 'derecha', preferredSide: 'drive', active: true },
  { firstName: 'Martín', lastName: 'Gómez', nickname: 'Tino', dominantHand: 'izquierda', preferredSide: 'reves', active: true },
  { firstName: 'Lucas', lastName: 'Fernández', nickname: 'Lucho', dominantHand: 'derecha', preferredSide: 'indistinto', active: true },
  { firstName: 'Santiago', lastName: 'Ruiz', nickname: 'Santi', dominantHand: 'derecha', preferredSide: 'drive', active: true },
  { firstName: 'Franco', lastName: 'Alvarez', nickname: 'Fran', dominantHand: 'izquierda', preferredSide: 'reves', active: true },
  { firstName: 'Nicolás', lastName: 'Molina', nickname: 'Nico', dominantHand: 'derecha', preferredSide: 'indistinto', active: true }
];

const bootstrap = async () => {
  const playersSnapshot = await getDocs(query(collection(db, 'players'), limit(1)));
  if (!playersSnapshot.empty) {
    console.log('Seed omitido: ya existen datos en players.');
    return;
  }

  const playerIds: string[] = [];
  for (const player of players) {
    const ref = await addDoc(collection(db, 'players'), { ...player, createdAt: now, updatedAt: now });
    playerIds.push(ref.id);
  }

  const matches = [
    {
      date: '2026-03-20',
      location: 'Club Norte',
      format: 'amistoso',
      teamA: [playerIds[0], playerIds[1]],
      teamB: [playerIds[2], playerIds[3]],
      notes: 'Buen ritmo',
      status: 'finalizado',
      setsWonTeamA: 2,
      setsWonTeamB: 1,
      winner: 'equipoA'
    },
    {
      date: '2026-03-27',
      location: 'Arena Sur',
      format: 'entrenamiento',
      teamA: [playerIds[4], playerIds[5]],
      teamB: [playerIds[0], playerIds[2]],
      notes: 'Trabajo de definición',
      status: 'finalizado',
      setsWonTeamA: 1,
      setsWonTeamB: 2,
      winner: 'equipoB'
    },
    {
      date: '2026-04-10',
      location: 'Padel Center',
      format: 'torneo',
      teamA: [playerIds[1], playerIds[3]],
      teamB: [playerIds[4], playerIds[5]],
      notes: 'Semifinal',
      status: 'en_curso',
      setsWonTeamA: 1,
      setsWonTeamB: 1,
      winner: null
    }
  ];

  const matchIds: string[] = [];
  for (const match of matches) {
    const ref = await addDoc(collection(db, 'matches'), { ...match, createdAt: now, updatedAt: now });
    matchIds.push(ref.id);
  }

  const eventTypes = ['winner', 'error_no_forzado', 'error_forzado', 'ace', 'doble_falta'] as const;
  const shotTypes = ['saque', 'resto', 'drive', 'reves', 'volea_drive', 'smash'] as const;

  for (const [index, matchId] of matchIds.entries()) {
    const basePlayers = matches[index].teamA.concat(matches[index].teamB);
    for (let i = 1; i <= 18; i += 1) {
      await addDoc(collection(db, 'match_events'), {
        matchId,
        timestamp: new Date(Date.now() - i * 1000 * 60).toISOString(),
        setNumber: i <= 6 ? 1 : i <= 12 ? 2 : 3,
        gameNumber: Math.ceil(i / 3),
        pointNumber: i,
        winningTeam: i % 2 === 0 ? 'equipoA' : 'equipoB',
        playerId: basePlayers[i % 4],
        eventType: eventTypes[i % eventTypes.length],
        shotType: shotTypes[i % shotTypes.length],
        zone: i % 3 === 0 ? 'red' : i % 3 === 1 ? 'fondo' : 'transicion',
        notes: '',
        createdAt: new Date().toISOString()
      });
    }
  }

  console.log('Seed completado: 6 jugadores, 3 partidos y eventos de ejemplo.');
};

bootstrap().catch((error) => {
  console.error('Error ejecutando seed:', error);
  process.exit(1);
});
