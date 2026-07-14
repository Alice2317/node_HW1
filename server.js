const http = require('http');
const { v4: uuidv4 } = require('uuid');
const headers = {
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-Length, X-Requested-With',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH, POST, GET,OPTIONS,DELETE',
  'Content-Type': 'application/json'
}
let data = [];

const requestListener = function (req, res) {
  const [host,url, id] = req.url.split('/');
  let isMainPath = false;
  let body = '';

  console.log('method=>', req.method);
  console.log('req=>', req.url);
  console.log('url=>', req.url.split('/'), url == 'todos');
  console.log('id=>',id);

  // 沒有找到此頁面
  if (url == 'todos') {
    isMainPath = true;
  }

  req.on('data', chunk => { // 每來一段資料就觸發
    body += chunk
  })

  if (isMainPath && req.method === 'GET') { //得到所有資料
    res.writeHead(200, headers);
    return res.end(JSON.stringify({
      result: 'success',
      datas: data,
    }))
  } else if (isMainPath && req.method === 'OPTIONS') {// CORS預檢
    res.writeHead(204, headers);
    return res.end();
  } else if (isMainPath && req.method === 'POST') { // 新增資料
    req.on('end', () => { // 全部資料收完才觸發
      try {
        const item = JSON.parse(body)?.title?.trim();
        console.log('item', item, !item);
        
        if (!item) throw new Error('未取到title屬性或值');
        console.log('sss');
        
        data.push({ id: uuidv4(), title: item });
        res.writeHead(200, headers);
        return res.end(JSON.stringify({
          result: 'success',
          datas: { id: uuidv4(), title: item },
        }))
      } catch (error) {
        res.writeHead(400, headers);
        return res.end(JSON.stringify({
          result: 'fail',
          msg: error.message,
        }))
      }
    })
    return;
  } else if (isMainPath && req.method === 'PATCH') { //編輯資料
    req.on('end', () => {
      try {
        const item = JSON.parse(body)?.title?.trim();
        if (!item) throw new Error('未取到title屬性或值');
        const editIndex = data.findIndex(item => item.id === id);
        console.log('editIndex', editIndex,data);
        if (editIndex === -1) throw new Error('查無此id');
        data[editIndex].title = item;
        res.writeHead(200, headers);
        return res.end(JSON.stringify({
          result: 'success',
          datas: data[editIndex],
        }))
      } catch (error) {
        res.writeHead(400, headers);
        return res.end(JSON.stringify({
          result: 'fail',
          msg: error.message,
        }))
      }
    })
    return;
  } else if (isMainPath && req.method === 'DELETE') { //刪除指定與全部資料
    const delIndex = data.findIndex(item => item.id === id);
    if (delIndex !== -1) {//刪除指定
      data.splice(delIndex, 1);
      res.writeHead(200, headers);
      return res.end(JSON.stringify({
        result: 'success',
        datas: data,
      }))
    } else {//刪除全部
      if (data.length === 0) {
        res.writeHead(400, headers);
        return res.end(JSON.stringify({
          result: 'fail',
          msg: '尚未有資料，無法進行刪除',
        }))
      } else {
        data = [];
        res.writeHead(200, headers);
        return res.end(JSON.stringify({
          result: 'success',
          datas: data,
        }))
      }
    }
  }

  res.writeHead(404, headers);
  return res.end(JSON.stringify({
    result: 'fail',
    msg: '沒有找到此頁面',
  }))
};



http.createServer(requestListener).listen(8080, () => {
  console.log('Server: http://localhost:8080');
});