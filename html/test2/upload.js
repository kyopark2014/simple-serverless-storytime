const fileInput = document.getElementById("fileUpload");

const handleFiles = (e) => {
  const selectedFile = [...fileInput.files];
  const fileReader = new FileReader();

  fileReader.readAsDataURL(selectedFile[0]);

  fileReader.onload = function () {
    document.getElementById("previewImg").src = fileReader.result;

    FileUpload(fileReader, )
  };
};

fileInput.addEventListener("change", handleFiles);

function FileUpload(img, file) {
    const reader = new FileReader();
    this.ctrl = createThrobber(img);
    const xhr = new XMLHttpRequest();
    this.xhr = xhr;
  
    const self = this;
    this.xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percentage = Math.round((e.loaded * 100) / e.total);
            self.ctrl.update(percentage);
          }
        }, false);
  
    xhr.upload.addEventListener("load", (e) => {
            self.ctrl.update(100);
            const canvas = self.ctrl.ctx.canvas;
            canvas.parentNode.removeChild(canvas);
        }, false);
    xhr.open("POST", "http://demos.hacks.mozilla.org/paul/demos/resources/webservices/devnull.php");
    xhr.overrideMimeType('text/plain; charset=x-user-defined-binary');
    reader.onload = (evt) => {
      xhr.send(evt.target.result);
    };
    reader.readAsBinaryString(file);
  }
  
  function createThrobber(img) {
    const throbberWidth = 64;
    const throbberHeight = 6;
    const throbber = document.createElement('canvas');
    throbber.classList.add('upload-progress');
    throbber.setAttribute('width', throbberWidth);
    throbber.setAttribute('height', throbberHeight);
    img.parentNode.appendChild(throbber);
    throbber.ctx = throbber.getContext('2d');
    throbber.ctx.fillStyle = 'orange';
    throbber.update = (percent) => {
      throbber.ctx.fillRect(0, 0, throbberWidth * percent / 100, throbberHeight);
      if (percent === 100) {
        throbber.ctx.fillStyle = 'green';
      }
    }
    throbber.update(0);
    return throbber;
  }
  