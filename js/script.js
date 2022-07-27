// declaraction of document.ready() function.
!function(){var e=!(!window.attachEvent||window.opera),t=/webkit\/(\d+)/i.test(navigator.userAgent)&&RegExp.$1<525,n=[],o=function(){for(var e=0;e<n.length;e++)n[e]()},a=document;a.ready=function(d){if(!e&&!t&&a.addEventListener)return a.addEventListener("DOMContentLoaded",d,!1);if(!(n.push(d)>1))if(e)!function(){try{a.documentElement.doScroll("left"),o()}catch(e){setTimeout(arguments.callee,0)}}();else if(t)var l=setInterval((function(){/^(loaded|complete)$/.test(a.readyState)&&(clearInterval(l),o())}),0)}}(),document.ready(
// toggleTheme function.
// this script shouldn't be changed.
()=>{var e=window._Blog||{},t=window.localStorage&&window.localStorage.getItem("theme");console.log("触发",t);var n="dark"===t,o=document.getElementsByTagName("body")[0];n?(document.getElementById("switch_default").checked=!0,
// mobile
document.getElementById("mobile-toggle-theme").innerText="· Dark"):(document.getElementById("switch_default").checked=!1,
// mobile
document.getElementById("mobile-toggle-theme").innerText="· Dark"),e.toggleTheme=function(){n?(o.classList.add("dark-theme"),
// mobile
document.getElementById("mobile-toggle-theme").innerText="· Dark"):(o.classList.remove("dark-theme"),
// mobile
document.getElementById("mobile-toggle-theme").innerText="· Light"),document.getElementsByClassName("toggleBtn")[0].addEventListener("click",()=>{o.classList.contains("dark-theme")?o.classList.remove("dark-theme"):o.classList.add("dark-theme"),window.localStorage&&window.localStorage.setItem("theme",document.body.classList.contains("dark-theme")?"dark":"light")}),
// moblie
document.getElementById("mobile-toggle-theme").addEventListener("click",()=>{o.classList.contains("dark-theme")?(o.classList.remove("dark-theme"),
// mobile
document.getElementById("mobile-toggle-theme").innerText="· Light"):(o.classList.add("dark-theme"),
// mobile
document.getElementById("mobile-toggle-theme").innerText="· Dark"),window.localStorage&&window.localStorage.setItem("theme",document.body.classList.contains("dark-theme")?"dark":"light")})},e.toggleTheme()}
// ready function.
);