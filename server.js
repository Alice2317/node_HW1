const http = require('http');
const { v4: uuidv4 } = require('uuid');

// 資料
let data = {
  result: null,
  datas: [],
  msg: null,
};

const response= function (res,status,data) {
  let headers = {
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-Length, X-Requested-With',
    'Access-Control-Allow-host': '*',
    'Access-Control-Allow-Methods': 'PATCH, POST, GET,OPTIONS,DELETE',
    'Content-Type': 'application/json'
  }

  res.writeHead(status, headers);
  res.end(JSON.stringify(data)); //有 response 回寫及回傳
}

const resetResult = function (data){
  return {
    result: null,
    datas: data.datas,
    msg: null,
  }
}

const requestListener = function (req, res) {
  const [host,url,id] = req.url.split('/');
  let isMainPath = true;
  let hasId = false;
  let status = 200;
  console.log('req=>', host, url, id);
  
  if (url !== 'todos'){
    isMainPath = false;
  }
  
  if (id) {
    hasId = true;
  }

  data = resetResult(data);

  let body = '';
  req.on('data', chunk => { // 每來一段資料就觸發
    body += chunk
  })

  if (isMainPath && req.method === 'GET') { //得到所有資料
    data.result = 'success';
    response(res, status, data);
  } else if (isMainPath && req.method === 'OPTIONS') {// preflight options API 檢查機制: https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Guides/CORS
    data.result = 'success';
    data.msg = '出現 preflight options API 檢查機制';
    response(res, status, data);
  } else if (isMainPath && req.method === 'POST') { // 新增資料
    req.on('end', () => { // 全部資料收完才觸發
      try {
        const item = JSON.parse(body).title;
        if (!item) throw new Error('未取到正確屬性');
        data.datas.push({ id: uuidv4(), title: item });
        data.result = 'success';
        data.msg = '已新增一筆資料';
        response(res, status, data);
      } catch (error) {
        status = 400;
        data.result = 'fail';
        data.msg = typeof error === 'string' ? error.message :'請提供 title 屬性';

        response(res, status, data);
      }
    })

  } else if (isMainPath && req.method === 'PATCH' && hasId){ //編輯資料
    req.on('end',()=>{
      try {
        const item = JSON.parse(body).title;
        if (!item) throw new Error('未取到正確屬性');

        const editIndex = data.datas.findIndex(item => item.id === id);
        data.result = 'success';
        data.datas[editIndex].title = item;
        data.msg = '已成功編輯資料';
        response(res, status, data);
      } catch (error) {
        status = 400;
        data.result = 'fail';
        data.msg = typeof error === 'string' ? error.message : '請提供 title 屬性';

        response(res, status, data);
      }
    })
  } else if (isMainPath && req.method === 'DELETE' && hasId) { //刪除指定資料
    const delIndex = data.datas.findIndex(item=>item.id === id);
    if(delIndex !== -1){
      data.datas.splice(delIndex, 1);
      data.result = 'success';
      data.msg = '已刪除一筆資料';
    }else{
      data.result = 'fail';
      data.msg = '捕捉到未存在的id';
    }
    
    response(res, status, data);
  } else if (isMainPath && req.method === 'DELETE') { //刪除全部資料
    if (data.datas.length === 0){
      data.result = 'fail';
      data.msg = '尚未有資料，無法進行刪除';
    }else{
      data.result = 'success';
      data.datas = [];
      data.msg = '已刪除全部資料';
    }
    response(res, status, data);
  }

  // 沒有找到此頁面
  if (!isMainPath) {
    status = 404;
    data.result = 'fail';
    data.datas = [];
    data.msg = '沒有找到此頁面';
    response(res, status, data);
  }
};



http.createServer(requestListener).listen(8080);