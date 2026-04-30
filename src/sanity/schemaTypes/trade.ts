import { defineField, defineType } from 'sanity'

export const trade = defineType({
  name: 'trade',
  title: 'Trade',
  type: 'document',

  fields: [
    // 📅 Date
    defineField({
      name: 'date',
      title: 'Trade Date',
      type: 'date',
      initialValue: () => new Date().toISOString().split('T')[0],
      validation: (Rule) => Rule.required(),
    }),

    // 🏦 Broker
    defineField({
      name: 'broker',
      title: 'Broker',
      type: 'string',
      initialValue: 'FYERS',
    }),

    // 🔗 FYERS Trade ID (IMPORTANT for deduplication)
    defineField({
      name: 'tradeId',
      title: 'Trade ID',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    // 📊 Symbol
    defineField({
      name: 'symbol',
      title: 'Symbol',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    // 🔁 Side
    defineField({
      name: 'side',
      title: 'Trade Side',
      type: 'string',
      options: {
        list: [
          { title: 'LONG', value: 'LONG' },
          { title: 'SHORT', value: 'SHORT' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),

    // ⏰ Entry Time
    defineField({
      name: 'entryTime',
      title: 'Entry Time',
      type: 'datetime',
    }),

    // ⏰ Exit Time
    defineField({
      name: 'exitTime',
      title: 'Exit Time',
      type: 'datetime',
    }),

    // 💰 Entry Price
    defineField({
      name: 'entryPrice',
      title: 'Entry Price',
      type: 'number',
    }),

    // 💰 Exit Price
    defineField({
      name: 'exitPrice',
      title: 'Exit Price',
      type: 'number',
    }),

    // 📦 Quantity
    defineField({
      name: 'qty',
      title: 'Quantity',
      type: 'number',
    }),

    // 📈 PnL
    defineField({
      name: 'pnl',
      title: 'Profit / Loss',
      type: 'number',
    }),

    // 📊 % Return (VERY useful for your 3% goal)
    defineField({
      name: 'returnPercent',
      title: 'Return (%)',
      type: 'number',
    }),

    // ❌ Mistakes (Checkbox style)
    defineField({
      name: 'mistakes',
      title: 'Trade Mistakes',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Over-trading', value: 'over-trading' },
          { title: 'Revenge trading', value: 'revenge-trading' },
          { title: 'Risked too much', value: 'risked-too-much' },
          { title: 'Exit early', value: 'exit-early' },
          { title: 'FOMO entry', value: 'fomo-entry' },
          { title: 'Ignored SL', value: 'ignored-sl' },
          { title: 'No mistakes', value: 'no-mistakes' },
        ],
      },
    }),

    // 🧠 Emotional State
    defineField({
      name: 'emotion',
      title: 'Emotional State',
      type: 'string',
      options: {
        list: [
          { title: 'Calm', value: 'calm' },
          { title: 'Frustrated', value: 'frustrated' },
          { title: 'Impatient', value: 'impatient' },
          { title: 'Overconfident', value: 'overconfident' },
          { title: 'Anxious', value: 'anxious' },
        ],
      },
    }),

    // 📘 Lessons
    defineField({
      name: 'lessons',
      title: 'Lessons Learned',
      type: 'text',
    }),
  ],

  // 🔥 Optional: Preview in Sanity Studio
  preview: {
    select: {
      title: 'symbol',
      subtitle: 'pnl',
    },
    prepare({ title, subtitle }) {
      return {
        title: title,
        subtitle: `PnL: ₹${subtitle ?? 0}`,
      }
    },
  },
})