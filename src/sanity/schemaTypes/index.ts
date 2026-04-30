import { type SchemaTypeDefinition } from 'sanity'
import { tradeLog } from './tradeLog'
import { trade } from './trade'
export const schema: { types: SchemaTypeDefinition[] } = {
  types: [tradeLog, trade],
}
