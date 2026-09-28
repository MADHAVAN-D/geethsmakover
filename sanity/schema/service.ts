import { defineType, defineField } from 'sanity';

export const service = defineType({
  name: 'service',
  title: 'Service',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      required: true,
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      required: true,
      options: { source: 'name', maxLength: 80 },
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      description:
        'Shown on the service page and cards. Keep it under ~300 characters for cards.',
    }),
    defineField({
      name: 'price',
      title: 'Price (₹)',
      type: 'number',
      required: true,
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'startingPrice',
      title: 'Starting price (₹) — optional',
      type: 'number',
      description:
        'If the service starts lower (add-ons included), set this. The site shows "From ₹X".',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'durationMin',
      title: 'Duration (minutes)',
      type: 'number',
      required: true,
      description:
        'Used to reserve real time on the booking calendar. 240 = 4 hours.',
      validation: (Rule) => Rule.min(15).max(720),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description: 'Describe the photo for screen readers and SEO.',
        }),
      ],
    }),
    defineField({
      name: 'featured',
      title: 'Featured on homepage',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'active',
      title: 'Active (bookable & visible)',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display order',
      type: 'number',
      initialValue: 0,
      description: 'Lower numbers appear first.',
    }),
  ],
  preview: {
    select: { title: 'name', media: 'image' },
  },
});
