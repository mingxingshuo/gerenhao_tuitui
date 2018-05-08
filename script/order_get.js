var schedule = require("node-schedule");
var UserOrderModel = require('../model/UserOrder.js');
var TaobaoOrderModel = require('../model/TaobaoOrder.js');
var UserModel = require('../model/User.js');
var AddFreeOrderModel = require('../model/AddFreeOrder.js');

var WechatAPI = require('wechat-api');
var weichat_conf = require('../conf/weichat.json');
var weichat_apis ={};
var async = require('async');
var MessageServer = require('../message_server.js');

function next_up(_id){
		if(_id){
			return update_order(_id,next_up);
		}else{
			console.log('end');
			return;
		}
}

function get_order(){
	update_order(null,next_up);
}


function update_order(_id,next){
	UserOrderModel.fetch(_id,function(err,user_orders){
		console.log('user_orders：'+user_orders.length);
		async.each(user_orders,
			function(order,cb){
                TaobaoOrderModel.findOne({order_id:order.order_number},function(error,taobao){
					if(!taobao){
						return cb(null,null);
					}
					async.waterfall([
							function(callback){
								if(order.status == 0 ){
									order.create_at = taobao.create_at;
									UserModel.findOne({openid:order.openid},function(err,user){
										if(!user){

										}else{
											var str = '恭喜您！订单【'+taobao.order_id+'】【'+taobao.goods_info+'】跟踪成功！\r\n'+
														'[须知]:商品确认收货后半小时返利会添加到个人账户\r\n\r\n一一一🍉常用指令一一一\r\n'+
														'账户信息请回复：个人信息\r\n订单查询请回复：订单\r\n余额提现请回复：提现\r\n详细教程请回复：帮助';
                                            MessageServer.getInstance(null).update_order(user.openid,str,function (result) {
                                                callback(null)
                                            });
                                        }
									});
								}else{
									callback(null);
								}
							},
							function(callback){
								order.status = getOrderStatus(taobao.order_status);
								if( order.status == 3){
                                    var add_cash = parseFloat((parseFloat(taobao.order_tkCommFee)*0.2).toFixed(2));
                                    AddFreeOrderModel.findOne({order_number:order.order_number},function(err,addOrder){
										if(!addOrder){
											order.tk_comm_fee = add_cash;
											AddFreeOrderModel.create({openid:order.openid,type:1,cash:add_cash,order_number:order.order_number});
											UserModel.findOneAndUpdate({openid:order.openid},{$inc:{current_balance:add_cash}},function(error,u){
												console.log(error);
											});
                                            var str = "淘宝订单【"+taobao.order_id+"】【"+taobao.goods_info+"】" +
                                                "已结算，返利【"+add_cash+"】元已添加到您的帐户！\r\n回复【个人信息】可以查看帐户情况！"
                                            MessageServer.getInstance(null).rebate_msg(order.openid,str,function (result) {

                                            });
										}
									});
								}
								order.save();
								callback(null);
							},
                            function (callback) {
                                if(order.states == -1 && (new Date().getTime() - order.createAt.getTime()) > 15*60*1000){
                                    order.states = -2
                                    order.save();
                                    console.log(order)
									var str = "【订单号】未找到，可能是以下原因：\r\n————绑定失败————\r\n亲请稍后重试\r\n再次失败请先取消订单\r\n重新复制信息下单！\r\n"
									+ "————温馨提醒————\r\n下面三种情况会导致找不到订单：\r\n"
									+"1.该商品在分享前已加入购物车\r\n2.该商品享受了店铺其他优惠\r\n3.下单前您没有复制我的信息"

                                    MessageServer.getInstance(null).update_order(order.openid,str,function (result) {

                                    });
                                }
                                callback(null,null)
                            }
						],function(error,result){
							return cb(null,null);
					});
					
				});
			},
			function(error,result){
				console.log('next');
				if(user_orders.length==50){
					return next(user_orders[49]._id);
				}else{
					return next(null);
				}
				
		});


	});
}

function getOrderStatus(status){
	if(status == '订单失效'){
		return -1;
	}else if(status == '订单付款'){
		return 1;
	}else if(status == '订单成功'){
		return 2;
	}else if(status == '订单结算'){
		return 3;
	}
}


var rule    = new schedule.RecurrenceRule();  
var times   = [1,6,11,16,21,26,31,36,41,46,51,56];  
rule.minute  = times; 
var j = schedule.scheduleJob(rule, function(){
  console.log('匹配订单');
  get_order();
});
