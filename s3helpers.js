const uuidv1 = require('uuid/v1')

async function createS3UUID(s3, bucketname, extension) {
  let uuid = ''

  while (uuid === '') {
    uuid = uuidv1() + extension
    await new Promise((resolve, reject) => {
      s3.headObject({ Bucket: bucketname, Key: uuid }, (err, data) => {
        if (!err) {
          // the object already exist, try again
          uuid = ''
          resolve()
        } else if (err.code === 'NotFound') {
          // the object doesn't already exist
          resolve()
        } else {
          console.log(err)
          reject(err)
        }
      })
    })
  }

  return uuid
}

function s3UploadPromise(s3, uploadParams) {
  return new Promise((resolve, reject) => {
    s3.upload(uploadParams, (err, data) => {
      if (err) {
        reject(err)
      }
      if (data) {
        resolve(data)
      }
    })
  })
}

async function pipeStreamToS3(s3, bucketName, stream, extension, userId) {
  // call S3 to retrieve upload file to specified bucket
  const uploadParams = {
    Bucket: bucketName,
    Key: '',
    Body: '',
    Metadata: { userId },
  }

  stream.on('error', (err) => {
    console.log('stream Error', err)
  })
  uploadParams.Body = stream

  uploadParams.Key = await createS3UUID(s3, bucketName, extension) // call S3 to retrieve upload file to specified bucket

  const newObject = await s3UploadPromise(s3, uploadParams)

  return newObject
}

function getObjectOwner(s3, getParams) {
  return new Promise((resolve, reject) => {
    s3.headObject(getParams, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data.Metadata.userid)
      }
    })
  })
}

module.exports = {
  pipeStreamToS3,
  getObjectOwner,
}
