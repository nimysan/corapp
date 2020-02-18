const Koa = require('koa');
const app = new Koa();
const path = require('path'); //系统路径模块
const fs = require('fs'); //文件模块
const Router = require('koa-router');

const staticFiles = require('koa-static');
// 指定 public目录为静态资源目录，用来存放 js css images 等
app.use(staticFiles(path.resolve(__dirname, "./public")))

let fullList = [];
let cacheTime = null;



// logger
app.use(async (ctx, next) => {
    await next();
    const rt = ctx.response.get('X-Response-Time');
    console.log(`${ctx.method} ${ctx.url} - ${rt}`);
});

// x-response-time
app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.set('X-Response-Time', `${ms}ms`);
});

let home = new Router();
home.get('data/', async (ctx) => {
    composeAllData();
    ctx.body = fullList;
});
// 装载所有子路由
let router = new Router()
router.use('/', home.routes(), home.allowedMethods())
//router.use('/page', page.routes(), page.allowedMethods())

// 加载路由中间件
app.use(router.routes()).use(router.allowedMethods())

function composeAllData() {
    let nowTime = (new Date()).getTime();
    if (fullList.length>0 && cacheTime && (nowTime - cacheTime) < 1000 * 60 * 60 * 12) {
        return;
    } //12个小时一次
    cacheTime = nowTime;
    fullList = [];
    console.log("READ again");
    var coronavirus = path.join(__dirname, 'coronavirus');
    fs.readdir(coronavirus, function(err, files) {
        files.forEach(function(filename) {
            fs.stat(path.join(coronavirus, filename), function(err, stats) {
                if (stats.isFile() && gettype(filename) == 'json') {
                    if (filename != "GaoDeYiQin.json") {
                        console.log("--- filename ---" + filename);
                        fs.readFile(path.join(coronavirus, filename), "UTF-8", function(err, jsonData) {
                            try {
                                let tempData = JSON.parse(jsonData);
                                for (var i = 0; i < tempData.length; i++) {
                                    var dist = tempData[i];
                                    if (dist.pois) {
                                        for (var p = 0; p < dist.pois.length; p++) {
                                            fullList.push(dist.pois[p]);
                                        }
                                    }
                                }
                            } catch (e) {
                                console.log("exception --- filename ---" + filename);
                            }


                        });

                    }

                }
            });
        })
    });
    console.log("--- fullList--- size:" + fullList.length);
}

//获取后缀名
function gettype(url) {
    var arr = url.split('.');
    var len = arr.length;
    return arr[len - 1];
}

app.listen(3000);