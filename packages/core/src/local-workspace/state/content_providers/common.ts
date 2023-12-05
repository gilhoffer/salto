/*
*                      Copyright 2023 Salto Labs Ltd.
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
import { safeJsonStringify } from '@salto-io/adapter-utils'
import { hash } from '@salto-io/lowerdash'
import { Readable } from 'stream'

const { toMD5 } = hash

export type ContentAndHash = {
  account: string
  content: Buffer
  contentHash: string
}

export type NamedStream = {
  name: string
  stream: Readable
}

export type StateContentProvider = {
  findStateFiles: (prefix: string) => Promise<string[]>
  clear: (prefix: string) => Promise<void>
  rename: (oldPrefix: string, newPrefix: string) => Promise<void>
  getHash: (filePaths: string[]) => Promise<string>
  readContents: (filePaths: string[]) => AsyncIterable<NamedStream>
  writeContents: (prefix: string, contents: ContentAndHash[]) => Promise<void>
}


export const getHashFromHashes = (hashes: string[]): string => (
  toMD5(safeJsonStringify(hashes.sort()))
)