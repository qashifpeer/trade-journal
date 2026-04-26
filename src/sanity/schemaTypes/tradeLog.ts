import { defineField, defineType } from 'sanity'

export const tradeLog = defineType({
  name: 'tradeLog',
  title: 'Trade Log',
  type: 'document',
  fields: [
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tradeType',
      title: 'Trade Type',
      type: 'string',
      options: {
        list: [
          { title: 'Call', value: 'Call' },
          { title: 'Put', value: 'Put' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'entryTime',
      title: 'Trade Enter Time',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'exitTime',
      title: 'Trade Exit Time',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'exitReason',
      title: 'Exit Reason',
      type: 'string',
      options: {
        list: [
          { title: 'Target', value: 'Target' },
          { title: 'SL', value: 'SL' },
          { title: 'Other', value: 'Other' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'quantity',
      title: 'Quantity',
      type: 'number',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'result',
      title: 'Result',
      type: 'number',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'mistakes',
      title: 'Mistakes',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Overtrading', value: 'Overtrading' },
          { title: 'Revenge Trading', value: 'Revenge Trading' },
          { title: 'Risked Too Much', value: 'Risked Too Much' },
          { title: 'Exit Early', value: 'Exit Early' },
          { title: 'Exit Too Late', value: 'Exit Too Late' },
          { title: 'FOMO Entry', value: 'FOMO Entry' },
          { title: 'No Clear Plan', value: 'No Clear Plan' },
          { title: 'Ignored SL', value: 'Ignored SL' },
          { title: 'No Mistakes', value: 'No Mistakes' },
        ],
      },
    }),
    defineField({
      name: 'emotionalState',
      title: 'Emotional State',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Calm', value: 'Calm' },
          { title: 'Frustrated', value: 'Frustrated' },
          { title: 'Over Confidence', value: 'Over Confidence' },
          { title: 'Anxious', value: 'Anxious' },
          { title: 'Impatient', value: 'Impatient' },
        ],
      },
    }),
    defineField({
      name: 'learnedLessons',
      title: 'Learned Lessons',
      type: 'text',
      rows: 5,
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'tradeType',
      subtitle: 'date',
    },
  },
})