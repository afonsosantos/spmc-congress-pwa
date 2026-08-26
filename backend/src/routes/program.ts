import { Router } from 'express';
import { PretalxService } from '../services/pretalxService.js';

export const programRouter = Router();

programRouter.get('/', async (_req, res) => {
  const [sessions, rooms, speakers, tracks] = await Promise.all([
    PretalxService.getSessions(),
    PretalxService.getRooms(),
    PretalxService.getSpeakers(),
    PretalxService.getTracks(),
  ]);
  res.json({ sessions, rooms, speakers, tracks });
});

programRouter.get('/sessions', async (_req, res) => {
  res.json({ sessions: await PretalxService.getSessions() });
});

programRouter.get('/sessions/:id', async (req, res) => {
  const session = await PretalxService.getSession(req.params.id);
  if (!session) {
    res.status(404).json({ error: 'Sessão não encontrada.' });
    return;
  }
  res.json({ session });
});

programRouter.get('/speakers', async (_req, res) => {
  res.json({ speakers: await PretalxService.getSpeakers() });
});

programRouter.get('/rooms', async (_req, res) => {
  res.json({ rooms: await PretalxService.getRooms() });
});

programRouter.get('/tracks', async (_req, res) => {
  res.json({ tracks: await PretalxService.getTracks() });
});
