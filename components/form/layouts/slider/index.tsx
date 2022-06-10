/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
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
import { useMath } from '../../../use.math'

const logger = debug('layout/slider')
const path = [0]
const defaults = {}

export const SliderLayout: React.FC<LayoutProps> = (props) => {
  const { t } = useTranslation()
  const [swiper, setSwiper] = useState<SwiperClass>(null)
  const { height } = useWindowSize()
  const { design, startPage, endPage, fields } = props.form
  const { finish, setField } = props.submission
  const [form] = Form.useForm()
  const evaluator = useMath()


  const evaluate = (formula, defaults, errorFeedback) => {
    try{
      const r = evaluator(
        formula,
        defaults
      )
      return Boolean(r)
    } catch (error){
      console.log('ERROR: ', error)
      return errorFeedback
    }
  }

  const goNext = () => {
    if (!swiper) return
    logger('goNext')
    if(swiper.activeIndex === fields.length - 1){
      swiper.allowSlideNext = true
      swiper.slideNext()
      swiper.allowSlideNext = false
      return
    }
    swiper.allowSlideNext = true
    let nextIndex = swiper.activeIndex >= fields.length - 1 ?
      fields.length - 1 : swiper.activeIndex + 1

    //determine next slide index
    //check jumpTo action
    const logic = fields[swiper.activeIndex].logic
      .filter(logic => logic.action === 'jumpTo')
    if (logic.length !== 0) {
      logic.map(logic => {
        if(evaluate(logic.formula, defaults, true) === true){
          const jumpTo = logic.jumpTo
          const [nextField] = fields.filter(field => field.id === jumpTo)
          nextIndex = fields.indexOf(nextField)
          console.log('nextIndex: ', nextIndex)
        }
        return evaluate(logic.formula, defaults, true)
      })
    }

    swiper.slideTo(nextIndex)
    if(!path.includes(swiper.activeIndex)){
      path.push(swiper.activeIndex)
    }
    swiper.allowSlideNext = false
    console.log('goNext path', path)
  }
  const goPrev = () => {
    if (!swiper) {
      return
    }
    if(swiper.activeIndex === 0){
      return
    }
    if (swiper.activeIndex === fields.length){
      swiper.slidePrev()
      return
    }
    logger('goPrevious')

    const activePosition = path.lastIndexOf(swiper.activeIndex)
    swiper.slideTo(Math.max(path[activePosition - 1], 0))
    path.splice(Math.max(path[activePosition - 1], 0)+1)
    console.log('goPrev path', path)
  }

  const swiperConfig: SwiperProps = {
    direction: 'vertical',
    allowSlideNext: false,
    allowSlidePrev: true,
    noSwiping: true,
    updateOnWindowResize: true,
  }


  const updateValues = useCallback((data) => {
    if(typeof data !== 'undefined' && data !== null){
      const value = data.target.value
      // identify the corresponding field, get the corresponding id and slug
      const activeIndex = path[path.length - 1]
      const id= fields[activeIndex].id
      const slug = fields[activeIndex].slug ? fields[activeIndex].slug : null

      defaults[`@${id}`] = value
      if (slug) {
        defaults[`$${slug}`] = value
      }
    }
  }, [fields, form])

  useEffect(() => {
    updateValues(null)
  }, [updateValues])


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
