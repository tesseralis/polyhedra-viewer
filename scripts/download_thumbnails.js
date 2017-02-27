// Script to run in the browser to download all thumbnails
var filename = 'placeholder.png';
var link = document.createElement('a');
link.innerHTML = 'download image';
link.addEventListener('click', function(ev) {
  link.href = document.getElementsByTagName('canvas')[0].toDataURL();
  link.download = filename;
}, false);
var links = $$('.Sidebar-listItem a');
function download(i) {
  if (i > links.length) return;
  filename = 's-' + links[i].getAttribute('href') + '.png';
  links[i].click();
  setTimeout(function() {
    link.click();
    download(i+1);
  }, 500);
}
download(0);
