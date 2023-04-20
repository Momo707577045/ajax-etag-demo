const url = require('url')
const http = require('http')
const crypto = require('crypto');
const querystring = require('querystring')
const port = 14302;

// Etag 处理的中间层
function responseWithEtag(request, response, responseData) {
    const etag = crypto.createHash('md5').update(responseData).digest('hex') // 获取返回参数的 hash 值
    response.setHeader("ETag", etag); // 设置 ETag，标识本次响应信息的 hash 信息，以对比信息是否
    if (request.headers['if-none-match'] === etag) { // 若本次返回值的 hash 信息，与请求头的 if-none-match hash 值一致，则直接返回 304，复用浏览器缓存的数据，无需要额外返回数据，节省带宽
        console.log('ETag hash match')
        response.writeHead(304, "Not Modified");
        response.end();
        return
    } else { // 无 if-none-match 请求头，或者返回值内容发生变化，hash 匹配不上
        console.log('ETag hash mismatching')
        response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        response.end(responseData); // 返回业务数据
    }
}

http.createServer(function (request, response) {
    console.log('createServer', request.method)
    try {
        response.setHeader("Access-Control-Allow-Origin", "*"); // 允许所有域名
        response.setHeader("Access-Control-Allow-Headers", "*"); // 允许额外添加所有请求头
        response.setHeader("Access-Control-Expose-Headers", "*"); // 允许暴露所有响应头，否则前端无法用 JS 获取 ETag 头
        response.setHeader("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS"); // 允许常规请求方式
        if (request.method === 'GET') {
            const data = JSON.stringify(querystring.parse(url.parse(request.url))); // 提取请求参数
            // todo 添加业务逻辑，这里仅做展示，简单将请求参数原封不动返回
            responseWithEtag(request, response, data)
        } else if (request.method === 'POST') {
            let postData = '';
            request.on('data', chunk => postData += chunk.toString());
            request.on('end', () => {
                // todo 添加业务逻辑，这里仅做展示，简单将请求参数原封不动返回
                responseWithEtag(request, response, postData)
            });
        } else {
            response.end();
        }
    } catch (error) {
        console.log(error)
        response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        response.end(JSON.stringify({ data: '参数错误，请检查' }));
    }
})
    .listen(port);