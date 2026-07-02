import { type SchemaTypeDefinition } from 'sanity'
import { tradeLog } from './tradeLog'
import { trade } from './trade'
import {intradayTrade} from './intradayTrade'
import {tag} from './tag'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [tradeLog, trade, intradayTrade, tag],
}
