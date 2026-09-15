import './migrateTestDb.js';

const { admin, app, appReady, closeApplication } = await import('../application/authApp');
await appReady;

export { admin, app, closeApplication };
