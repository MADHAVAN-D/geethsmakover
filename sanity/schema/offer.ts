import { defineType, defineField } from 'sanity';

export const offer = defineType({
  name: 'offer',
  title: 'Offer',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      required: true,
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'image',
      title: 'Image (optional)',
      type: 'image',
    }),
    defineField({
      name: 'validFrom',
      title: 'Valid from',
      type: 'date',
    }),
    defineField({
      name: 'validUntil',
      title: 'Valid until',
      type: 'date',
    }),
    defineField({
      name: 'active',
      title: 'Active (shown on homepage)',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: 'title', media: 'image' },
  },
});
