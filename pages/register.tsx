import {useMutation} from '@apollo/react-hooks'
import {Button, Form, Input, message} from 'antd'
import {useForm} from 'antd/lib/form/Form'
import {AuthFooter} from 'components/auth/footer'
import {AuthLayout} from 'components/auth/layout'
import {setAuth} from 'components/with.auth'
import {REGISTER_MUTATION} from 'graphql/mutation/register.mutation'
import {NextPage} from 'next'
import Link from 'next/link'
import {useRouter} from 'next/router'
import React, {useState} from 'react'
import {useTranslation} from 'react-i18next'

const Register: NextPage = () => {
  const { t } = useTranslation()
  const [form] = useForm()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [register] = useMutation(REGISTER_MUTATION)

  const finish = async (data) => {
    setLoading(true)

    try {
      const result = await register({
        variables: {
          user: data
        },
      })

      await setAuth(
        result.data.tokens.access,
        result.data.tokens.refresh
      )

      message.success(t('register:welcome'))

      router.push('/')
    } catch (e) {
      message.error(t('register:credentialsAlreadyInUse'))
      setLoading(false)
    }
  }

  const failed = () => {
    message.error(t('validation:mandatoryFieldsMissing'))
  }

  return (
    <AuthLayout loading={loading}>
      <Form
        form={form}
        name="login"
        onFinish={finish}
        onFinishFailed={failed}
        style={{
          margin: 'auto',
          maxWidth: '95%',
          width: 400,
        }}
      >
        <img
          src={require('../assets/images/logo_white_small.png')}
          alt={'OhMyForm'}
          style={{
            display: 'block',
            width: '70%',
            marginLeft: 'auto',
            marginRight: 'auto',
            marginBottom: 16,
          }}
        />

        <Form.Item
          name="username"
          rules={[{ required: true, message: t('validation:usernameRequired') }]}
        >
          <Input
            size="large"
            placeholder={t('login:usernamePlaceholder')}
          />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: t('validation:emailRequired') },
            { type: 'email', message: t('validation:invalidEmail') }
          ]}
        >
          <Input
            size="large"
            placeholder="Email"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: t('validation:passwordRequired') },
            { min: 5, message: t('validation:passwordMinLength') },
          ]}
        >
          <Input.Password
            size="large"
            placeholder={t('login:passwordPlaceholder')}
          />
        </Form.Item>

        <Form.Item>
          <Button
            size="large"
            type="primary"
            htmlType="submit"
            block
          >
            {t('register:registerNow')}
          </Button>
        </Form.Item>

        <Button.Group
          style={{
            width: '100%',
            justifyContent: 'center',
            display: 'flex',
          }}
        >
          <Link href={'/login'}>
            <Button
              type={'link'}
              ghost
            >
              {t('register:gotoLogin')}
            </Button>
          </Link>
        </Button.Group>
      </Form>

      <AuthFooter />
    </AuthLayout>
  )
}

export default Register
