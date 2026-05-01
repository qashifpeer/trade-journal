import { defineField, defineType } from 'sanity'

export const trade = defineType({
  name: 'trade',
  title: 'Trade',
  type: 'document',

  fields: [
    defineField({
      name: 'tradeDate',
      title: 'Trade Date',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'fyersTradeId',
      title: 'FYERS Trade ID',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'symbol',
      title: 'Symbol',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'direction',
      title: 'Direction',
      type: 'string',
      options: {
        list: [
          { title: 'Long', value: 'Long' },
          { title: 'Short', value: 'Short' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'quantity',
      title: 'Quantity',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    }),

    defineField({
      name: 'entryPrice',
      title: 'Entry Price',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
    }),

    defineField({
      name: 'exitPrice',
      title: 'Exit Price',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
    }),

    defineField({
      name: 'entryTime',
      title: 'Entry Time',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'exitTime',
      title: 'Exit Time',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'pnl',
      title: 'Total P&L',
      type: 'number',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'setup',
      title: 'Setup / Strategy',
      type: 'string',
      options: {
        list: [
          { title: 'Breakout', value: 'Breakout' },
          { title: 'FIB Retracement', value: 'FIB Retracement' },
          { title: 'Reversal', value: 'Reversal' },
          { title: 'Pullback', value: 'Pullback' },
          { title: 'News Based', value: 'News Based' },
          { title: 'Trend', value: 'Trend' },
          { title: 'Other', value: 'Other' },
        ],
      },
    }),

    defineField({
      name: 'outcome',
      title: 'Outcome',
      type: 'string',
      options: {
        list: [
          { title: 'Mistake', value: 'mistake' },
          { title: 'Followed Plan', value: 'followed plan' },
          { title: 'Full Success', value: 'full success' },
          { title: 'Partial Success', value: 'partial success' },
        ],
      },
    }),

    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
    }),

    defineField({
      name: 'marketCondition',
      title: 'Market Condition',
      type: 'string',
      options: {
        list: [
          { title: 'Trending', value: 'trending' },
          { title: 'Ranging', value: 'ranging' },
          { title: 'Volatile', value: 'volatile' },
          { title: 'Calm', value: 'calm' },
        ],
      },
    }),

    defineField({
      name: 'emotionalState',
      title: 'Emotional State',
      type: 'string',
      options: {
        list: [
          { title: 'Confident', value: 'confident' },
          { title: 'Calm', value: 'calm' },
          { title: 'Anxious', value: 'anxious' },
          { title: 'Fearful', value: 'fearful' },
          { title: 'Greedy', value: 'greedy' },
        ],
      },
    }),

    defineField({
      name: 'notes',
      title: 'Trade Notes',
      type: 'text',
      rows: 4,
    }),

    defineField({
      name: 'mistakes',
      title: 'Mistakes',
      type: 'text',
      rows: 4,
    }),

    defineField({
      name: 'lessons',
      title: 'Lessons Learned',
      type: 'text',
      rows: 4,
    }),

    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
  ],

  preview: {
    select: {
      title: 'symbol',
      subtitle: 'direction',
      pnl: 'pnl',
      date: 'tradeDate',
      outcome: 'outcome',
    },
    prepare({ title, subtitle, pnl, date, outcome }) {
      const pnlText =
        typeof pnl === 'number'
          ? `${pnl >= 0 ? '+' : '-'}₹${Math.abs(pnl).toFixed(2)}`
          : 'No P&L'

      return {
        title: title || 'Untitled Trade',
        subtitle: [
          subtitle || 'No direction',
          pnlText,
          date || 'No date',
          outcome || 'No outcome',
        ].join(' • '),
      }
    },
  },
})