import { defineField, defineType } from "sanity";

export default defineType({
  name: "tag",
  title: "Tag",
  type: "document",

  fields: [
    defineField({
      name: "value",
      title: "Tag Value",
      type: "string",
      description: "The actual tag value shown in the UI",

      validation: (Rule) =>
        Rule.required()
          .min(1)
          .max(50)
          .error("Tag value is required and must be under 50 characters"),
    }),

    defineField({
      name: "groupName",
      title: "Group Name",
      type: "string",
      description: "Group this tag belongs to",
      options: {
        list: [
          { title: "Day", value: "day" },
          { title: "Outcome", value: "outcome" },
          { title: "Emotion", value: "emotion" },
          { title: "Market Condition", value: "marketCondition" },
          { title: "Trade Setup", value: "tradeSetup" },
          { title: "Mistake", value: "mistake" },
          { title: "Session", value: "session" },
          { title: "Instrument", value: "instrument" },
          { title: "Custom", value: "custom" },
        ],
      },
      initialValue: "custom",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "color",
      title: "Tag Color",
      type: "string",
      description: "Optional color for UI display",
      options: {
        list: [
          { title: "Blue", value: "blue" },
          { title: "Green", value: "green" },
          { title: "Red", value: "red" },
          { title: "Yellow", value: "yellow" },
          { title: "Purple", value: "purple" },
          { title: "Gray", value: "gray" },
        ],
      },
    }),
  ],

  preview: {
    select: {
      title: "value",
      groupName: "groupName",
      color: "color",
    },

    prepare({ title, groupName, color }) {
      return {
        title: title || "Untitled tag",
        subtitle: groupName
          ? `Group: ${groupName}`
          : "No group",
        media: undefined,
      };
    },
  },
});