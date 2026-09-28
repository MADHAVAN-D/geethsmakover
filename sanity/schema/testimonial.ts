import { defineType, defineField } from 'sanity';

export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    defineField({
      name: 'customerName',
      title: 'Customer name',
      type: 'string',
      required: true,
      description: 'Use first name + initial if the client prefers privacy.',
    }),
    defineField({
      name: 'review',
      title: 'Review',
      type: 'text',
      rows: 4,
      required: true,
    }),
    defineField({
      name: 'rating',
      title: 'Rating (1–5)',
      type: 'number',
      initialValue: 5,
      validation: (Rule) => Rule.min(1).max(5),
    }),
    defineField({
      name: 'photo',
      title: 'Photo (optional)',
      type: 'image',
      description: 'Small circular portrait of the client.',
    }),
    defineField({
      name: 'featured',
      title: 'Featured on homepage',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'active',
      title: 'Active (visible)',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: 'customerName', media: 'photo' },
  },
});
