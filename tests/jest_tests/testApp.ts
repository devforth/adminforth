import request from 'supertest';
import './migrateTestDb.js';

const { admin, app, appReady, closeApplication, Filters } = await import('../application/index');
await appReady;

const agent = request.agent(app);

export { admin, agent, app, closeApplication, Filters };
