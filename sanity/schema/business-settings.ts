import { defineType, defineField } from 'sanity';

/**
 * Singleton: create exactly ONE document of this type.
 * It drives the contact info shown across the website.
 *
 * Geeths Makeover is a HOME-SERVICE business — there is deliberately no
 * address / map field. Do not add one.
 */
export const businessSettings = defineType({
  name: 'businessSettings',
  title: 'Business settings',
  type: 'document',
  fields: [
    defineField({
      name: 'businessName',
      title: 'Business name',
      type: 'string',
      initialValue: 'Geeths Makeover',
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description:
        'Short line shown on the site, e.g. "Professional beauty services, at your doorstep".',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      description: 'Used on the About page and search results.',
    }),
    defineField({
      name: 'phone',
      title: 'Phone (display)',
      type: 'string',
      initialValue: '9035462874',
    }),
    defineField({
      name: 'whatsapp',
      title: 'WhatsApp number',
      type: 'string',
      initialValue: '919035462874',
      description: 'International digits only, e.g. 919035462874',
    }),
    defineField({
      name: 'email',
      title: 'Email (optional)',
      type: 'string',
    }),
    defineField({
      name: 'serviceType',
      title: 'Service type',
      type: 'string',
      initialValue: 'Home Service',
    }),
    defineField({
      name: 'serviceArea',
      title: 'Service area (optional)',
      type: 'string',
      description:
        'Only fill this if it is real, provided business info — e.g. a city/region you actually serve. Leave empty otherwise.',
    }),
    defineField({
      name: 'businessHours',
      title: 'Business hours (optional)',
      type: 'string',
      description: 'e.g. "Tue – Sun, 10:00 AM – 7:00 PM". Leave empty if not confirmed.',
    }),
    defineField({
      name: 'instagramUrl',
      title: 'Instagram URL (optional)',
      type: 'url',
    }),
    defineField({
      name: 'bookingSettings',
      title: 'Booking note (optional)',
      type: 'text',
      rows: 3,
      description:
        'Short note shown during booking, e.g. "Home service availability may depend on your location."',
    }),
  ],
  preview: {
    select: { title: 'businessName' },
  },
});
