const Koa = require('koa');
const Router = require('koa-router');
const bodyparser = require('koa-bodyparser');
const app = new Koa();
const program = require("commander");
const redis = require('./redis');
const helper = require('./helper');

program
  .version("0.0.1")
  .option("-p, --port", "server port")
  .parse(process.argv);

const PORT = program.port || 8033;
const router_url = new Router({
  prefix: '/url'
});
const route_record = new Router({
  prefix: '/record'
});

module.exports = {
  start: function() {

    app.use(bodyparser());

    app.use(router_url.routes());
    app.use(router_url.allowedMethods());

    app.use(route_record.routes());
    app.use(route_record.allowedMethods());

    router_url
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

    route_record
      .param('year', (year, ctx, next) => {
        ctx.year = year;
        return next();
      })
      .param('month', (month, ctx, next) => {
        ctx.month = month;
        return next();
      })
      .param('day', (day, ctx, next) => {
        ctx.day = day;
        return next();
      })
      .get('/:year/:month', async ctx => {
        try {
          const name = 'record_' + ctx.year + ctx.month;
          const data = await redis.hgetall(name);
          for (let key in data) {
            if (data.hasOwnProperty(key)) {
              data[key] = JSON.parse(data[key]);
            }
          }
          ctx.append('Access-Control-Allow-Origin', '*');
          ctx.body = helper.resultJson({
            status: 0,
            data
          });
        } catch(e) {
          ctx.body = helper.resultFalse();
        }
      })
      .options('/:year/:month/:day', (ctx, next) => {
        ctx.append('Access-Control-Allow-Origin', '*');
        ctx.append('Access-Control-Allow-Headers', '*');
        return next();
      })
      .post('/:year/:month/:day', async ctx => {
        try {
          const {body} = ctx.request;
          const name = 'record_' + ctx.year + ctx.month;
          const key = ctx.day;

          if (!body || !body.length) {
            await redis.hdel(name, key);
          } else {
            await redis.hmset(name, key, JSON.stringify(ctx.request.body));
          }
          ctx.append('Access-Control-Allow-Origin', '*');
          ctx.body = helper.resultTrue();
        } catch(e) {
          console.log(e);
          ctx.body = helper.resultFalse();
        }
      });

    app.listen(PORT);
  }
}