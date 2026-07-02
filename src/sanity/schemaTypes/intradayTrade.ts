// sanity/schemas/intradayTrade.ts
import { defineField, defineType } from 'sanity'

export const intradayTrade = defineType({
  name: 'intradayTrade',
  title: 'Intraday Trade',
  type: 'document',
  fields: [
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'numberOfTrades',
      title: 'Number of trades',
      type: 'number',
    }),
    defineField({
      name: 'outcome',
      title: 'Outcome',
      type: 'number',
    }),
    defineField({
      name: 'charges',
      title: 'Charges',
      type: 'number',
    }),
    defineField({
      name: 'netPnl',
      title: 'Net PNL',
      type: 'number',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'tag' }],
        },
      ],
    }),
    defineField({
      name: 'notes',
      title: 'Trade Notes',
      type: 'text',
    }),
    defineField({
      name: 'indexImage',
      title: 'Index Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
     defineField({
      name: 'tradesImage',
      title: 'Trades Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
  ],
})