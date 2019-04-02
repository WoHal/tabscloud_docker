const program = require("commander");
const redis = require('./redis');
const helper = require('helper');

program
  .version("0.0.1")
  .option("-p, --port", "server port")
  .parse(process.argv);

const PORT = program.port || 8033;

module.exports = {
  start: function() {
    const Koa = require('koa');
    const Router = require('koa-router');
    const bodyparser = require('koa-bodyparser');
    const app = new Koa();
    const router = new Router({
      prefix: '/url'
    });

    app.use(bodyparser());

    app.use(router.routes());
    app.use(router.allowedMethods());

    router
      .param('urlId', (id, ctx, next) => {
        ctx.urlId = id || '';
        return next();
      })
      .get('/', async ctx => {
        const list = await redis.smembers('urls');
        ctx.body = helper.resultJson({
          status: 0,
          list: list.map(item => {
            try {
              return JSON.parse(item);
            } catch(e) {
              console.log(e);
              return item;
            }
          })
        });
      })
      .post('/', async ctx => {
        try {
          await redis.sadd('urls', JSON.stringify(ctx.request.body));
          ctx.body = helper.resultTrue();
        } catch(e) {
          ctx.body = helper.resultFalse();
        }
      })
      .delete('/:urlId', ctx => {
        if (!ctx.urlId) {
          ctx.body = helper.resultJson({
            status: 1,
            msg: 'invalid url id'
          });
          return;
        }
        ctx.body = helper.resultTrue();
      });

    app.listen(PORT);
  }
}