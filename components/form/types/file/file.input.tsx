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

  return (
    <div>
      <Form.Item
        name={[field.id]}
        rules={[
          { required: field.required, message: t('validation:valueRequired') },
          //{ type: 'email', message: t('validation:invalidEmail') },
        ]}
        initialValue={initialValue}
      >

        <Upload.Dragger
          multiple
          listType='picture'
          action={'http://localhost:3000/'}
          showUploadList={{showRemoveIcon: true, showPreviewIcon: false}}
          // iconRender={() => {
          //   //return '+++'
          // }}
          defaultFileList={
            filesMap
              .filter((element) => element.fieldId == field.id)
              .map((element) => element.file)
          }
          //accept='.png, .jpeg, .doc'
          onRemove={ (file) => {
            console.log('onRemove: ', file);
            console.log('filesMap: ', filesMap);
            //delete corresponding file from filesMap and the database
            const fileIndex = filesMap.findIndex((element) => element.uid == file.uid)
            axios.delete(`http://localhost:3000/upload/${filesMap[fileIndex].filename}`)
            filesMap.slice(fileIndex, 1)

            return true
          }}
          beforeUpload={ (file) => {
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
                filesMap.push(element)
              })
              .catch(function (error) {
                console.log(error);
              });

            console.log('file ', file);

            return false;
          }}
          iconRender={() => {
            return <img src={require('../../../../assets/images/validation.png')} alt='' height={48} width={48} />

          }}
        >
        Glisser les fichiers ici ou
          <br/>
          <Button>Téléverser</Button>
        </Upload.Dragger>
      </Form.Item>
    </div>
  )
}
