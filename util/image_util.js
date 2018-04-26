var fs = require('fs')
  , gm = require('gm');
var request =require('request');
var Memcached = require('memcached');
var memcached = new Memcached('127.0.0.1:11211');
var exec = require('child_process').exec;
process.env.PATH+=":/usr/local/GraphicsMagick-1.3.28/bin";

function downloadFile(uri,filename,callback){
    var stream = fs.createWriteStream(filename);
    request(uri).pipe(stream).on('close', callback); 
}

function share_img(ticket,qr_name,callback) {
	/*gm(__dirname+'/qr_image/'+qr_name)
	.resize(300)
	.write(__dirname+'/qr_image/small_'+qr_name,function(err){
		if(err){
			console.log(err);
		}
		gm()
		 .in('-page', '+0+0')
		 .in(__dirname+'/qr_image/temp.jpeg')
		 .in('-page', '+270+500')
		 .in(__dirname+'/qr_image/small_'+qr_name)
		 .mosaic()
		 .write(__dirname+'/../public/qr_image/'+qr_name, function (err) {
		 	if(err){
				console.log(err);
			}
		 	memcached.set('qr_'+ticket,qr_name,7*24*60*60,function(err){});
		    callback(qr_name);
		 });
	});*/
	var resize_cmd ='gm "convert" "'+__dirname+'/qr_image/'+qr_name+'" "-resize" "164x" "'+__dirname+'/qr_image/small_'+qr_name+'"';
	exec(resize_cmd, function(error, stdout, stderr) {
	  if(error){
	  	console.log(error);
	  }
	  var mosaic_cmd = 'gm "convert" "-page" "+0+0" "'+__dirname+'/qr_image/tmp_bg.png" "-page" "+294+1119" "'+__dirname+'/qr_image/small_'+qr_name+'" "-mosaic" "'+__dirname+'/../public/qr_image/'+qr_name+'"'
	  exec(mosaic_cmd,function(error, stdout, stderr){
	  	if(error){
		  	console.log(error);
		}
		memcached.set('qr_'+ticket,qr_name,7*24*60*60,function(err){});
		callback(qr_name);
	  });
	});

}

function getQRImg(ticket,callback){
	memcached.get('qr_'+ticket,function(err,qr){
		if(qr){
			return callback(qr);
		}
		var qr_url = 'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket='+ticket;
		console.log(qr_url);
		var qr_name = Date.now()+''+parseInt(Math.random()*10000)+'.jpg';
		var qr_path = __dirname+'/qr_image/'+qr_name;
		downloadFile(qr_url,qr_path,function(err,res){
			share_img(ticket,qr_name,callback);
		});
	});
}

module.exports.getQRImg = getQRImg

/*
getQRImg('https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=gQEX8TwAAAAAAAAAAS5odHRwOi8vd2VpeGluLnFxLmNvbS9xLzAyRDBfa0p3dXdkYWgxMDAwMGcwN0QAAgSHZ69aAwQAAAAA',function(qr_name){
	console.log('生成宣传图：'+qr_name);
});*/