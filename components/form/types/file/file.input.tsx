import { Form, Button, Upload, Spin } from 'antd'
import 'antd/dist/antd.css'
import debug from 'debug'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { FieldInputBuilderType } from '../field.input.builder.type'

const logger = debug('file.input')

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
          showUploadList={{showRemoveIcon: true}}
          //accept='.png, .jpeg, .doc'
          beforeUpload={(file) => {
            console.log({file});
            return false;
          }}
          iconRender={() => {
            return <Spin></Spin>
          }}
          progress={{
            strokeWidth: 3,
            strokeColor: {
              '0%':'#f0f',
              '100%':'#ff0',
            },
            style: { top: 12},
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
