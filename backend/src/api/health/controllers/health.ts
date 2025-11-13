export default {
  async index(ctx) {
    try {
      // Check database connection
      await strapi.db.connection.raw('SELECT 1');

      ctx.status = 200;
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    } catch (error) {
      ctx.status = 503;
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify({
        status: 'error',
        error: error.message,
      });
    }
  },
};
