/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Form, Button, Upload } from 'antd'
import 'antd/dist/antd.css'
import debug from 'debug'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { FieldInputBuilderType } from '../field.input.builder.type'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const axios = require('axios').default;

const logger = debug('file.input')

const filesMap = []

export const builder: FieldInputBuilderType = ({
  parseUrlValue,
  parseValue,
}) => function FileInput ({
  field,
  design,
  urlValue,
  focus,
}) {
  const { t } = useTranslation()

  console.log('filesMap--', filesMap)

  let initialValue = null

  if (field.defaultValue) {
    try {
      initialValue = parseValue(field.defaultValue)
    } catch (e) {
      logger('invalid default value %O', e)
    }
  }

  if (urlValue) {
    initialValue = parseUrlValue(urlValue)
  }

  const maxCount = field.multiple === true ? 4 : 1

  return (
    <div>
      <Form.Item
        name={[field.id]}
        rules={[{ required: field.required, message: t('validation:valueRequired') }]}
        initialValue={initialValue}
      >
        <Upload.Dragger
          multiple={field.multiple}
          showUploadList={{showRemoveIcon: true, showPreviewIcon: false}}
          maxCount={maxCount}
          listType='picture'
          defaultFileList={
            filesMap
              .filter((element) => element.fieldId == field.id && element.deleted === false)
              .map((element) => element.file)
          }
          onRemove={ (file) => {
            console.log('onRemove: ', file);
            console.log('filesMap: ', filesMap);
            //delete corresponding file from filesMap and the database
            const fileIndex = filesMap.findIndex((element, index) => element.uid == file.uid
                                                        && filesMap[index].deleted === false)
            axios.delete(`http://localhost:3000/upload/${filesMap[fileIndex].filename}`)
            filesMap[fileIndex].deleted = true

            return true
          }}
          beforeUpload={ (file) => {
            console.log('FIELD: ', field)
            if(field.multiple === true){
              console.log('MULTIPLE = TRUE', field.multiple)
              let cpt = 0
              for(let i = 0; i < filesMap.length; i++){
                if(filesMap[i].deleted === false && filesMap[i].fieldId === field.id){
                  cpt++
                  if(cpt >= maxCount){
                    alert(`${maxCount} fichiers autorisés`)
                    return false
                  }
                }
              }
              // if(filesMap.length >= maxCount){
              //   return false
              // }
            } else {
              console.log('MULTIPLE != TRUE', field.multiple)
              if(filesMap.filter(element =>  element.fieldId === field.id 
                && element.deleted === false).length >= 1){
                //delete the previously uploaded file
                //const fileIndex = filesMap.length - 1
                const fileIndex = filesMap.findIndex((element) =>
                  element.deleted === false && element.fieldId === field.id)
                axios.delete(`http://localhost:3000/upload/${filesMap[fileIndex].filename}`)
                filesMap[fileIndex].deleted = true
                //filesMap.slice(fileIndex, 1)
                alert('Un seul fichier autorisé')
              }
            }

            const element = {}
            const data = new FormData();
            data.append('file', file);

            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            axios.post(`http://localhost:3000/upload/single/${field.id}`, data)
              .then(function (response) {
                console.log('response.data: ', response.data);
                element['uid'] = file.uid
                element['filename'] = response.data.filename
                element['fieldId'] = field.id
                element['file'] = file
                element['response'] = response
                element['deleted'] = false
                filesMap.push(element)

                let displayAlert = false
                let cpt = 0
                for(let i = 0; i < filesMap.length; i++){
                  if(cpt >= maxCount && filesMap[i].deleted === false 
                    && filesMap[i].fieldId === field.id){
                    //delete the previously uploaded files
                    axios.delete(`http://localhost:3000/upload/${filesMap[i].filename}`)
                    filesMap[i].deleted = true
                    //filesMap.slice(i, 1)
                    displayAlert = true
                  }
                  if(filesMap[i].deleted === false && filesMap[i].fieldId === field.id){
                    cpt++
                  }
                }
                if(displayAlert === true){
                  alert(`${maxCount} fichiers autorisés`)
                }
              })
              .catch(function (error) {
                console.log(error);
              });

            console.log('file ', file);

            return false;
          }}
          iconRender={(file) => {
            const fileIndex = filesMap.findIndex((element) => element.uid == file.uid)
            if (typeof file.thumbUrl !== 'undefined') {
              filesMap[fileIndex] = {...filesMap[fileIndex], 'thumbUrl': file.thumbUrl}
              return <img src={require('../../../../assets/images/validation.png')} alt='' height={48} width={48} />
            }
            console.log('iconRender - file : ', file)

            if(typeof filesMap[fileIndex] !== 'undefined'){
              if(typeof filesMap[fileIndex]['thumbUrl'] !== 'undefined'){
                console.log('filesMap[fileIndex][response]', filesMap[fileIndex]['response'])
                if(typeof filesMap[fileIndex]['response'] !== 'undefined'){
                  if(typeof filesMap[fileIndex]['response'].data !== 'undefined'){
                    if(filesMap[fileIndex]['response'].data.mimetype.includes('image')){
                      return <img src={ filesMap[fileIndex]['thumbUrl'] } alt='' height={48} width={48} />
                    }
                  }
                }
              }
            }
            return <img src={ require('../../../../assets/images/validation.png') } alt='' height={48} width={48} />

          }}
          isImageUrl={() => true}
        >
        Glisser les fichiers ici ou
          <br/>
          <Button>Téléverser</Button>
        </Upload.Dragger>
      </Form.Item>
    </div>
  )
}
