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

home.get('list/', async (ctx) => {
    let query = ctx.request.query;
    let inMiles = [];
    fullList.forEach(ele => {
        let dis = calculateLineDistance(query,{
            longitude : ele.point.coordinates[0],
            latitude: ele.point.coordinates[1]
        });
        //console.log("--- "+JSON.stringify(query) + " dis " + dis);
        if( dis <= 3 *1000){
            inMiles.push(ele);
        }
    });
    ctx.body = inMiles;
});

// 装载所有子路由
let router = new Router()
router.use('/', home.routes(), home.allowedMethods())
//router.use('/page', page.routes(), page.allowedMethods())

// 加载路由中间件
app.use(router.routes()).use(router.allowedMethods())

function composeAllData() {
    let nowTime = (new Date()).getTime();
    if (fullList.length > 0 && cacheTime && (nowTime - cacheTime) < 1000 * 60 * 60 * 12) {
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

function LngLat(longitude, latitude) {
    this.longitude = longitude;
    this.latitude = latitude;
}

function calculateLineDistance(start, end) {
    var d1 = 0.01745329251994329;
    var d2 = start.longitude;
    var d3 = start.latitude;
    var d4 = end.longitude;
    var d5 = end.latitude;
    d2 *= d1;
    d3 *= d1;
    d4 *= d1;
    d5 *= d1;
    var d6 = Math.sin(d2);
    var d7 = Math.sin(d3);
    var d8 = Math.cos(d2);
    var d9 = Math.cos(d3);
    var d10 = Math.sin(d4);
    var d11 = Math.sin(d5);
    var d12 = Math.cos(d4);
    var d13 = Math.cos(d5);
    var arrayOfDouble1 = [];
    var arrayOfDouble2 = [];
    arrayOfDouble1.push(d9 * d8);
    arrayOfDouble1.push(d9 * d6);
    arrayOfDouble1.push(d7);
    arrayOfDouble2.push(d13 * d12);
    arrayOfDouble2.push(d13 * d10);
    arrayOfDouble2.push(d11);
    var d14 = Math.sqrt((arrayOfDouble1[0] - arrayOfDouble2[0]) * (arrayOfDouble1[0] - arrayOfDouble2[0]) +
        (arrayOfDouble1[1] - arrayOfDouble2[1]) * (arrayOfDouble1[1] - arrayOfDouble2[1]) +
        (arrayOfDouble1[2] - arrayOfDouble2[2]) * (arrayOfDouble1[2] - arrayOfDouble2[2]));

    return (Math.asin(d14 / 2.0) * 12742001.579854401);
}




app.listen(3000);