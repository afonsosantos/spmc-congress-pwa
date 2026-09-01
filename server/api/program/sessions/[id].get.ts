import { PretalxService } from '../../../services/pretalxService';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!;
  const session = await PretalxService.getSession(id);
  if (!session) {
    throw createError({ statusCode: 404, message: 'Sessão não encontrada.' });
  }
  return { session };
});
