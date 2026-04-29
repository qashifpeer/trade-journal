import { defineField, defineType } from 'sanity'

export const tradeLog = defineType({
  name: 'tradeLog',
  title: 'Trade Log',
  type: 'document',
  fields: [
    defineField({
      name: 'date',
      title: 'Trade Date',
      type: 'date',
      initialValue: () => new Date().toISOString().split('T')[0],
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'broker',
      title: 'Broker',
      type: 'string',
      initialValue: 'FYERS',
    }),
    defineField({
      name: 'brokerTradeId',
      title: 'Broker Trade ID',
      type: 'string',
    }),
    defineField({
      name: 'fyersOrderId',
      title: 'FYERS Order ID',
      type: 'string',
    }),
    defineField({
      name: 'exchangeOrderId',
      title: 'Exchange Order ID',
      type: 'string',
    }),
    defineField({
      name: 'importStatus',
      title: 'Import Status',
      type: 'string',
      initialValue: 'draft',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Reviewed', value: 'reviewed' },
          { title: 'Final', value: 'final' },
        ],
      },
    }),

    defineField({
      name: 'symbol',
      title: 'Symbol Traded',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'instrumentName',
      title: 'Instrument Name',
      type: 'string',
    }),
    defineField({
      name: 'tradeType',
      title: 'Trade Type',
      type: 'string',
      options: {
        list: [
          { title: 'Call', value: 'Call' },
          { title: 'Put', value: 'Put' },
          { title: 'Buy', value: 'Buy' },
          { title: 'Sell', value: 'Sell' },
        ],
      },
    }),
    defineField({
      name: 'side',
      title: 'Side',
      type: 'string',
      options: {
        list: [
          { title: 'Buy', value: 'Buy' },
          { title: 'Sell', value: 'Sell' },
        ],
      },
    }),
    defineField({
      name: 'productType',
      title: 'Product Type',
      type: 'string',
    }),
    defineField({
      name: 'segment',
      title: 'Segment',
      type: 'string',
    }),
    defineField({
      name: 'exchange',
      title: 'Exchange',
      type: 'string',
    }),

    defineField({
      name: 'entryDateTime',
      title: 'Entry Date Time',
      type: 'datetime',
    }),
    defineField({
      name: 'exitDateTime',
      title: 'Exit Date Time',
      type: 'datetime',
    }),
    defineField({
      name: 'entryTime',
      title: 'Entry Time',
      type: 'string',
    }),
    defineField({
      name: 'exitTime',
      title: 'Exit Time',
      type: 'string',
    }),

    defineField({
      name: 'quantity',
      title: 'Quantity',
      type: 'number',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'filledQuantity',
      title: 'Filled Quantity',
      type: 'number',
    }),
    defineField({
      name: 'entryPrice',
      title: 'Entry Price',
      type: 'number',
    }),
    defineField({
      name: 'exitPrice',
      title: 'Exit Price',
      type: 'number',
    }),
    defineField({
      name: 'averagePrice',
      title: 'Average Price',
      type: 'number',
    }),
    defineField({
      name: 'tradedPrice',
      title: 'Traded Price',
      type: 'number',
    }),
    defineField({
      name: 'grossAmount',
      title: 'Gross Amount Traded',
      type: 'number',
    }),
    defineField({
      name: 'brokerage',
      title: 'Brokerage',
      type: 'number',
    }),
    defineField({
      name: 'charges',
      title: 'Other Charges',
      type: 'number',
    }),
    defineField({
      name: 'netAmount',
      title: 'Net Amount',
      type: 'number',
    }),
    defineField({
      name: 'result',
      title: 'PnL Result',
      type: 'number',
    }),

    defineField({
      name: 'status',
      title: 'Order Status',
      type: 'string',
    }),
    defineField({
      name: 'orderType',
      title: 'Order Type',
      type: 'string',
    }),
    defineField({
      name: 'validity',
      title: 'Order Validity',
      type: 'string',
    }),

    defineField({
      name: 'exitReason',
      title: 'Exit Reason',
      type: 'string',
      options: {
        list: [
          { title: 'Target', value: 'Target' },
          { title: 'SL', value: 'SL' },
          { title: 'Trailing SL', value: 'Trailing SL' },
          { title: 'Manual Exit', value: 'Manual Exit' },
          { title: 'Other', value: 'Other' },
        ],
      },
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
      name: 'setupType',
      title: 'Setup Type',
      type: 'string',
    }),
    defineField({
      name: 'strategyTag',
      title: 'Strategy Tag',
      type: 'string',
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'learnedLessons',
      title: 'Learned Lessons',
      type: 'text',
      rows: 5,
    }),
  ],

  preview: {
    select: {
      title: 'symbol',
      subtitle: 'date',
      side: 'side',
      result: 'result',
    },
    prepare({ title, subtitle, side, result }) {
      return {
        title: `${title || 'Trade'}${side ? ` • ${side}` : ''}`,
        subtitle: `${subtitle || ''}${typeof result === 'number' ? ` • PnL: ${result}` : ''}`,
      }
    },
  },
})