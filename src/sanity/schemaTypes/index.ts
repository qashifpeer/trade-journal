import { type SchemaTypeDefinition } from 'sanity'
import {savedTrade} from './savedTrade'
import {tag} from './tag'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [savedTrade, tag],
}
