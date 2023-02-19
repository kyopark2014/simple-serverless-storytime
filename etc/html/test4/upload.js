const handleForm = async (event) => {
    event.preventDefault();
  
    if(!isFilesReady){
      console.log('files still getting processed')
      return
    }
   
    const formData = new FormData(formElement)
  
    let data = {
      'name': formData.get('name'),
      'message': formData.get('message')
    }
  
    Object.entries(myFiles).map(item => {
      const [key, file] = item
      // append the file to data object
      data[key] = file
    })
  
    fetch('http://localhost:3000/upload', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    })
    // convert response to json
    .then(r => r.json())
    .then(res => {
      console.log(res);
    });
  }