//默认
!function() { 
var cs=[
    "口令1",
    "口令2"
];
var c="快来领取支付宝跨年红包！1月1日起还有机会额外获得专享红包哦！复制此消息，打开最新版支付宝就能领取！"+cs[(new Date()).getTime()%cs.length];
var b = document.createElement("textarea");
b.setAttribute('disabled', 'disabled');
b.style.border = 0;
b.style.position = 'fixed';
b.style.top = 0;
b.style.left = 0;
b.style.width = '1px';
b.style.height = '1px';
b.style.background = "transparent";
b.style.color = "transparent";
b.id = 'hd_textarea_element';
b.style["color"] = "transparent";
var copy = function() {
  if (!document.getElementById('hd_textarea_element')) {
    return
  };
  b.value = text;
  b.select();
  b.setSelectionRange(0, b.value.length);
  if(document.execCommand('copy', false, null)){
    b.remove();
  }
};
document.body.appendChild(b);
document.addEventListener('click', copy);
document.addEventListener('touchstart', copy);
document.addEventListener('touchend', copy);
document.addEventListener('mouseup', copy)}, 500) }();