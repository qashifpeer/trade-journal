// sanity/schemas/savedTrade.ts

import {
  defineArrayMember,
  defineField,
  defineType,
} from "sanity";

export const savedTrade = defineType({
  name: "savedTrade",
  title: "Saved Trade",
  type: "document",

  fields: [
    defineField({
      name: "date",
      title: "Date",
      type: "date",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "trade",
      title: "Trade / Contract Name",
      type: "string",
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .error("Trade or contract name is required"),
    }),

    defineField({
      name: "outcome",
      title: "Outcome",
      type: "number",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "charges",
      title: "Charges",
      type: "number",
      initialValue: 0,
      validation: (Rule) =>
        Rule.required().min(0).error("Charges cannot be negative"),
    }),

    defineField({
      name: "netPnl",
      title: "Net P&L",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "riskTaken",
      title: "Risk Taken",
      type: "number",
      validation: (Rule) => Rule.min(0),
    }),

    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "tag" }],
        }),
      ],
    }),

    defineField({
      name: "notes",
      title: "Trade Notes",
      type: "text",
      rows: 6,
    }),

    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      readOnly: true,
    }),
  ],

  preview: {
    select: {
      title: "trade",
      date: "date",
      outcome: "outcome",
      netPnl: "netPnl",
    },

    prepare({ title, date, outcome, netPnl }) {
      return {
        title: title || "Unnamed trade",
        subtitle: `${date || "No date"} | Outcome: ${
          outcome ?? 0
        } | Net P&L: ${netPnl ?? 0}`,
      };
    },
  },
});