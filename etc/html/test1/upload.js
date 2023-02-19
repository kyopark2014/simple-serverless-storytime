const fileInput = document.getElementById("fileUpload");

const handleFiles = (e) => {
  const selectedFile = [...fileInput.files];
  const fileReader = new FileReader();

  fileReader.readAsDataURL(selectedFile[0]);

  fileReader.onload = function () {
    document.getElementById("previewImg").src = fileReader.result;
  };
};

fileInput.addEventListener("change", handleFiles);