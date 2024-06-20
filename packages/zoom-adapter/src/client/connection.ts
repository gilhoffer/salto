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
import { AccountInfo } from '@salto-io/adapter-api'
import { client as clientUtils } from '@salto-io/adapter-components'
import { logger } from '@salto-io/logging'
import { BASE_OAUTH_URL, Credentials } from './oauth'

const log = logger(module)

export const validateCredentials = async ({
  connection,
}: {
  credentials: Credentials
  connection: clientUtils.APIConnection
}): Promise<AccountInfo> => {
  try {
    // TODO replace with some valid endpoint, identify production accounts
    const res = await connection.get('/users/me')
    const accountId = res.data.account_id // TODO replace with something global for the account
    return { accountId }
  } catch (e) {
    log.error('Failed to validate credentials: %s', e)
    throw new clientUtils.UnauthorizedError(e)
  }
}

const getAccessToken = async ({ clientId, clientSecret, refreshToken }: Credentials): Promise<string> => {
  const httpClient = axios.create({
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
  const data = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })
  const res = await httpClient.post(`${BASE_OAUTH_URL}/token`, data)
  return res.data.access_token
}

export const createConnection: clientUtils.ConnectionCreator<Credentials> = retryOptions =>
  clientUtils.axiosConnection({
    retryOptions,
    baseURLFunc: async () => 'https://api.zoom.us/v2',
    authParamsFunc: async (credentials: Credentials) => {
      const accessToken = await getAccessToken(credentials)
      return {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    },
    credValidateFunc: validateCredentials,
  })
