import { Modal, Form } from 'antd'
import debug from 'debug'
import { useTranslation } from 'react-i18next'
import SwiperClass from 'swiper'
import { Swiper, SwiperProps, SwiperSlide } from 'swiper/react'
import { Omf } from '../../../omf'
import { useWindowSize } from '../../../use.window.size'
import { LayoutProps } from '../layout.props'
import { Field } from './field'
import { FormPage } from './page'
import React, { useCallback, useEffect, useState } from 'react'
import { fieldTypes } from '../../types'
import { useMath } from '../../../use.math'

const logger = debug('layout/slider')

export const SliderLayout: React.FC<LayoutProps> = (props) => {
  const { t } = useTranslation()
  const [swiper, setSwiper] = useState<SwiperClass>(null)
  const { height } = useWindowSize()
  const { design, startPage, endPage, fields } = props.form
  const { finish, setField } = props.submission
  const [visiblity, setVisibility] = useState({})
  const [form] = Form.useForm()
  const evaluator = useMath()

  const goNext = () => {
    if (!swiper) return

    logger('goNext')
    swiper.allowSlideNext = true
    swiper.slideNext()
    swiper.allowSlideNext = false
  }
  const goPrev = () => {
    if (!swiper) {
      return
    }

    logger('goPrevious')
    swiper.slidePrev()
  }

  const swiperConfig: SwiperProps = {
    direction: 'vertical',
    allowSlideNext: false,
    allowSlidePrev: true,
    noSwiping: true,
    updateOnWindowResize: true,
  }


  const updateValues = useCallback((data) => {
    let id = null
    let slug = null
    let value = null
    if(typeof data !== 'undefined' && data !== null){
      value = data.target.value
      // identify the corresponding field, get the corresponding id and slug
      fields.forEach(field => {
        const option = field.options.filter(option => option.value === value)
        if(option.length === 0){
          return
        } else {
          id= field.id
          slug = field.slug ? field.slug : null
        }
      })
    }


    const defaults = {}
    fields.forEach(field => {
      if( id !== null && field.id === id){
        defaults[`@${field.id}`] = value
        localStorage.setItem(`@${field.id}`, value);
        if (field.slug) {
          defaults[`$${field.slug}`] = value
          localStorage.setItem(`$${field.slug}`, value);
        }
      } else {
        const defaultValue = field.defaultValue
          ? fieldTypes[field.type].parseValue(field.defaultValue)
          : null

        defaults[`@${field.id}`] = form.getFieldValue([field.id]) ?? defaultValue

        if (field.slug) {
          defaults[`$${field.slug}`] = form.getFieldValue([field.id]) ?? defaultValue
        }
      }
      if (localStorage.getItem(`@${field.id}`) !== null) {
        defaults[`@${field.id}`] = localStorage.getItem(`@${field.id}`)
      }

      if (localStorage.getItem(`$${field.slug}`) !== null) {
        defaults[`$${field.slug}`] = localStorage.getItem(`$${field.slug}`)
      }

    })
    // now calculate visibility
    const nextVisibility = {}
    fields.forEach(field => {
      if (!field.logic) return
      const logic = field.logic
        .filter(logic => logic.action === 'visible')

      if (logic.length === 0) {
        return
      }

      nextVisibility[field.id] = logic
        .map(logic => {
          try {
            const r = evaluator(
              logic.formula,
              defaults
            )

            return Boolean(r)
          } catch {
            return true
          }
        })
        .reduce<boolean>((previous, current) => previous && current, true)
    })

    console.log('updatevalues nextVisibility: ', nextVisibility)
    // TODO improve logic of how we calculate new logic checks
    if (Object.values(nextVisibility).join(',') == Object.values(visiblity).join(',')) {
      return
    }

    setVisibility(nextVisibility)
  }, [
    fields, form, visiblity,
  ])

  useEffect(() => {
    updateValues(null)
  }, [updateValues])

  useEffect(() => {
    localStorage.clear()
  }, [])

  return (
    <div
      className={'swiper-container'}
      style={{
        background: design.colors.background,
      }}
    >
      <Omf />
      {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
      <Swiper
        height={height}
        {...swiperConfig}
        onSwiper={next => {
          logger('setSwiper')
          setSwiper(next)
        }}
      >
        {[
          startPage.show ? (
            <SwiperSlide key={'start'}>
              <FormPage page={startPage} design={design} next={goNext} prev={goPrev} />
            </SwiperSlide>
          ) : undefined,
          ...fields
            .map((field, i) => {
              if (field.type === 'hidden') {
                return null
              }

              return (
                <SwiperSlide key={field.id}
                  onChange={updateValues}>
                  <Field
                    field={field}
                    focus={swiper?.activeIndex === (startPage.show ? 1 : 0) + i}
                    design={design}
                    save={async (values: { [key: string]: unknown }) => {
                      await setField(field.id, values[field.id])

                      if (fields.length === i + 1) {
                        await finish()
                      }
                    }}
                    next={() => {
                      if (fields.length === i + 1) {
                      // prevent going back!
                        swiper.allowSlidePrev = true

                        if (!endPage.show) {
                          Modal.success({
                            content: t('form:submitted'),
                            okText: t('from:restart'),
                            onOk: () => {
                              window.location.reload()
                            },
                          })
                        }
                      }

                      goNext()
                    }}
                    prev={goPrev}
                  />
                </SwiperSlide>
              )
            })
            .filter((e) => e !== null),
          endPage.show ? (
            <SwiperSlide key={'end'}>
              <FormPage page={endPage} design={design} next={finish} prev={goPrev} />
            </SwiperSlide>
          ) : undefined,
        ].filter((e) => !!e)}
      </Swiper>
    </div>
  )
}
