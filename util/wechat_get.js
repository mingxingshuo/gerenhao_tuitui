var TokenModel = require('../model/Token.js');
var weichat_conf = require('../conf/weichat.json');
var WechatAPI = require('wechat-api');
var Memcached = require('memcached');
var memcached = new Memcached('127.0.0.1:11211');
var weichat_apis ={};

function getClient(code) {
	var config=weichat_conf[code];
	var api = new WechatAPI(config.appid, config.appsecret);
	return api;
}


function getQr(code,openid,book_id,next){
	var content = JSON.stringify({openid:openid,book:book_id});
	memcached.get(content,function(err,ticket){
		if(err){
			console.log(err);
		}
		if(ticket){ 
			next(null,ticket);
		}else{
			var client = getClient(code);
			client.createTmpQRCode(content,2592000,function(err,reslut){
				if(err){
					console.log(err);
					return next(err);
				}
				memcached.set(content,reslut.ticket,2592000,function(err){});
				memcached.set(reslut.ticket,content,2592000,function(err){});
				next(null,reslut.ticket);
			});
		}
	});
}

function QRCode(){
	var client = getClient(['1']);
	client.createLimitQRCode('book_id:239',function(err,reslut){
		if(err){
			console.log(err);
		}
		var qr_url = 'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket='+reslut.ticket; 
		console.log(qr_url);
		
	});
}

//QRCode();

module.exports.getClient = getClient;
module.exports.getQr = getQr;