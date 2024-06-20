/*
 *                      Copyright 2024 Salto Labs Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import axios from 'axios'
import {
  BuiltinTypes,
  ElemID,
  InstanceElement,
  OAuthMethod,
  OAuthRequestParameters,
  OauthAccessTokenResponse,
  Values,
} from '@salto-io/adapter-api'
import { createMatchingObjectType } from '@salto-io/adapter-utils'
import { ADAPTER_NAME } from '../constants'

// TODO adjust
export const OAUTH_REQUIRED_SCOPES = [
]

export type OauthRequestParameters = {
  clientId: string
  clientSecret: string
  port: number
}

export const oauthRequestParameters = createMatchingObjectType<OauthRequestParameters>({
  elemID: new ElemID(ADAPTER_NAME),
  fields: {
    clientId: {
      refType: BuiltinTypes.STRING,
      annotations: {
        message: 'Client ID',
        _required: true,
      },
    },
    clientSecret: {
      refType: BuiltinTypes.STRING,
      annotations: {
        message: 'Client Secret',
        _required: true,
      },
    },
    port: {
      refType: BuiltinTypes.NUMBER,
      annotations: {
        message: 'Port',
        _required: true,
      },
    },
  },
})

export type Credentials = Omit<OauthRequestParameters, 'port'> & {
  refreshToken: string
}

export const credentialsType = createMatchingObjectType<Credentials>({
  elemID: new ElemID(ADAPTER_NAME),
  fields: {
    clientId: {
      refType: BuiltinTypes.STRING,
      annotations: { _required: true, message: 'Client ID' },
    },
    clientSecret: {
      refType: BuiltinTypes.STRING,
      annotations: { _required: true, message: 'Client Secret' },
    },
    refreshToken: {
      refType: BuiltinTypes.STRING,
      annotations: { _required: true, message: 'Refresh Token' },
    },
  },
})

const getRedirectUri = (port: number): string => `http://localhost:${port}/extract`
export const BASE_OAUTH_URL = 'https://zoom.us/oauth'

export const createOAuthRequest = (userInput: InstanceElement): OAuthRequestParameters => {
  const { clientId, port } = userInput.value
  const redirectUri = getRedirectUri(port)
  // const scope = OAUTH_REQUIRED_SCOPES.join(' ')
  // can also add &optional_scope=${optionalScope}
  const url = `${BASE_OAUTH_URL}/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}`

  return {
    url,
    oauthRequiredFields: ['code'],
  }
}

export const createFromOauthResponse: OAuthMethod['createFromOauthResponse'] = async (
  input: Values,
  response: OauthAccessTokenResponse,
): Promise<Credentials> => {
  const { clientId, clientSecret, port } = input
  const { code } = response.fields
  const httpClient = axios.create({
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
  const data = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: getRedirectUri(port),
    scope: OAUTH_REQUIRED_SCOPES.join(' '),
    grant_type: 'authorization_code',
    code,
  })
  const res = await httpClient.post(`${BASE_OAUTH_URL}/token`, data)
  const { refresh_token: refreshToken } = res.data
  return {
    clientId,
    clientSecret,
    refreshToken,
  }
}
