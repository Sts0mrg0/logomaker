$('a').click(function (e) {
    e.preventDefault();
    var goTo = this.getAttribute("href");
    setTimeout(function(){
         window.location = goTo;
    },500);
});