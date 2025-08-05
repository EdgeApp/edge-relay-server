import { makeConfig } from 'cleaner-config'
import { asObject, asOptional, asString } from 'cleaners'

export const asConfig = asObject({
  couchDbFullpath: asOptional(asString, 'http://admin:admin@127.0.0.1:5984')
})

export const config = makeConfig(asConfig, 'serverConfig.json')
