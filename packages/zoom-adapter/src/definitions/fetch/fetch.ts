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
import _ from 'lodash'
import { definitions } from '@salto-io/adapter-components'
import { UserFetchConfig } from '../../config'
import { Options } from '../types'

// TODO example - adjust and remove:
// * irrelevant definitions and comments
// * unneeded function args


const DEFAULT_FIELDS_TO_HIDE: Record<string, definitions.fetch.ElementFieldCustomization> = {}
const DEFAULT_FIELDS_TO_OMIT: Record<string, definitions.fetch.ElementFieldCustomization> = {}


const NAME_ID_FIELD: definitions.fetch.FieldIDPart = { fieldName: 'name' }
const DEFAULT_ID_PARTS = [NAME_ID_FIELD]

const DEFAULT_FIELD_CUSTOMIZATIONS: Record<string, definitions.fetch.ElementFieldCustomization> = _.merge(
  {},
  DEFAULT_FIELDS_TO_HIDE,
  DEFAULT_FIELDS_TO_OMIT,
)

const createCustomizations = (): Record<string, definitions.fetch.InstanceFetchApiDefinitions<Options>> => ({
  
  
  settings: {
    requests: [
      {
        endpoint: {
          path: '/accounts/me/settings',
        },
      },
    ],
    resource: {
      // this type can be included/excluded based on the user's fetch query
      directFetch: true,
    },
    element: {
      topLevel: {
        // isTopLevel should be set when the workspace can have instances of this type
        isTopLevel: true,
        singleton: true, // to make a Settings Instance
      },
    },
  },

  roomSettings: {
    requests: [
      {
        endpoint: {
          path: '/rooms/account_settings',
        },
      },
    ],
    resource: {
      // this type can be included/excluded based on the user's fetch query
      directFetch: true,
    },
    element: {
      topLevel: {
        // isTopLevel should be set when the workspace can have instances of this type
        isTopLevel: true,
        singleton: true, // to make a Settings Instance
      },
    },
  },

  roomAccountProfile: {
    requests: [
      {
        endpoint: {
          path: '/rooms/account_profile',
        },
      },
    ],
    resource: {
      // this type can be included/excluded based on the user's fetch query
      directFetch: true,
    },
    element: {
      topLevel: {
        // isTopLevel should be set when the workspace can have instances of this type
        isTopLevel: true,
        singleton: true, // to make a Settings Instance
      },
    },
  },

  user: { // XXX instead of transform should recurseInto and create topLevels for all users with more details
    requests: [
      {
        endpoint: {
          path: '/users',
        },
        transformation: {
          root: 'users',
        },
      },
    ],
    resource: {
      directFetch: true,
      serviceIDFields: ['id'],
    },

    element: {
      topLevel: {
        isTopLevel: true,
        elemID: { parts: [{ fieldName: 'first_name' }, {fieldName: 'last_name'}] }, 
      },
      fieldCustomizations: {
        created_at: {
          hide: true,
        },
        user_created_at: {
          hide: true,
        },
        last_login_time: {
          hide: true,
        },
        id: {
          hide: true,
        },
      },
    }
  },

  room: { // Practice recurse into to get all the room settings and profile
    requests: [
      {
        endpoint: {
          path: '/rooms',
        },
        transformation: {
          root: 'rooms',
        },
      },
    ],
    resource: {
      directFetch: true,
      serviceIDFields: ['room_id'],
      recurseInto: {
        profile: {
          typeName: 'room__roomProfile',
          single: true,
          context: {
            args: {
              roomId: {
                root: 'id',
              },
            },
          },
        },
        settings: {
          typeName: 'room__roomSettings',
          single: true,
          context: {
            args: {
              roomId: {
                root: 'id',
              },
            },
          },
        },
      },
    },

    element: {
      topLevel: {
        isTopLevel: true,
        elemID: { parts: [{ fieldName: 'name' }] },
      },
      fieldCustomizations: {
        activation_code: {
          hide: true,
        },
        id: {
          hide: true,
        },
      },
    }
  },

  room__roomSettings: {
    requests: [
      {
        endpoint: {
          path: '/rooms/{roomId}/settings',
        },
      },
    ],
    element: {
      fieldCustomizations: {
      },
    },
  },

  room__roomProfile: {
    requests: [
      {
        endpoint: {
          path: '/rooms/{roomId}',
        },
      },
    ],
    element: {
      fieldCustomizations: {
      },
    },
  },
  device: { 
    requests: [
      {
        endpoint: {
          path: '/devices',
        },
        transformation: {
          root: 'devices',
        },
      },
    ],
    resource: {
      directFetch: true,
      serviceIDFields: ['device_id'],
    },

    element: {
      topLevel: {
        isTopLevel: true,
        elemID: { parts: [{ fieldName: 'device_name' }] }, 
      },
      fieldCustomizations: {
        last_online: {
          hide: true,
        },
        device_id: {
          hide: true,
        },
      },
    }
  },
})

export const createFetchDefinitions = (
  _fetchConfig: UserFetchConfig,
): definitions.fetch.FetchApiDefinitions<Options> => ({
  instances: {
    default: {
      resource: {
        serviceIDFields: ['id'],
      },
      element: {
        topLevel: {
          elemID: { parts: DEFAULT_ID_PARTS },
          serviceUrl: {
            baseUrl: 'https://api.zoom.us/v2',
          },
        },
        fieldCustomizations: DEFAULT_FIELD_CUSTOMIZATIONS,
      },
    },
    customizations: createCustomizations(),
  },
})
