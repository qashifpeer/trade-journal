import { type SchemaTypeDefinition } from 'sanity'
import { tradeLog } from './tradeLog'
import { trade } from './trade'
import {savedTrade} from './savedTrade'
import {tag} from './tag'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [tradeLog, trade, savedTrade, tag],
}
