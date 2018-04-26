var express = require('express');
var router = express.Router();

var UserModel = require('../model/User.js');
var UserOrderModel = require('../model/UserOrder.js');
var TaobaoOrderModel = require('../model/TaobaoOrder.js');

var WechatAPI = require('wechat-api');
var weichat_conf = require('../conf/weichat.json');



router.use('/data', function(req, res, next) {
	console.log('上传订单');
	console.log(req.body.orders);
	var orders = req.body.orders;
	orders = JSON.parse(orders);
	for (var i = orders.length - 1; i >= 0; i--) {
		var order = orders[i];
		TaobaoOrderModel.findOneAndUpdate({order_id:order.order_id},{$set :order},{upsert:true,rawResult:true},function(err,order){
			//console.log('update');
		})
	}
	res.send('success');
});


router.use('/reset', function(req, res, next) {
	console.log('重置订单');
	var openid = req.query.openid;
	UserModel.findOneAndUpdate({openid:openid},{finished_count:0,unfinished_count:0,all_count:0},function(err,res){
		console.log(res);
	});
	res.send('success');
});

router.use('/create_menu',function(req, res, next){
	var code = req.query.code;
	if(code){
		createMenu(code);
		res.send('success');
	}else{
		res.send('need params code');
	}
});

function createMenu(code) {
	var menus = require('../conf/menu.json');
	var config = weichat_conf[code];
	var api = new WechatAPI(config.appid, config.appsecret);
	var menu = menus[code];
	//console.log(menu);
	api.removeMenu(function(err,res){
		api.createMenu(menu, function(err,res){
			api.getMenu(function(err,res_m){
				console.log(JSON.stringify(res_m));
			});
		});
	});
	
}


module.exports = router;
