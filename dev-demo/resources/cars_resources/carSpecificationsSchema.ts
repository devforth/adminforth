import type { JsonFormSchema } from '../../../plugins/adminforth-json-form/types.js';

/**
 * JSON Schema for the `specifications` JSON column of the Car resource,
 * rendered by the json-form plugin. Kept in its own file to keep the
 * resource config readable.
 */
const carSpecificationsSchema: JsonFormSchema = {
  title: 'Car Specifications',
  description: 'Detailed technical specification sheet',
  type: 'object',
  'x-format': 'nav-vertical',
  properties: {
    general: {
      title: 'General',
      type: 'object',
      'x-format': 'grid',
      required: ['trim'],
      properties: {
        trim: {
          title: 'Trim',
          type: 'string',
          description: 'Trim / edition name',
          minLength: 2,
          'x-grid': { columns: 6 },
          'x-messages': {
            required: 'Trim is required.',
            minLength: 'Trim must be at least 2 characters long.',
          },
          default: 'Base',
        },
        segment: {
          title: 'Segment',
          type: 'string',
          enum: ['a', 'b', 'c', 'd', 'suv', 'sport'],
          'x-enumTitles': ['A - City', 'B - Small', 'C - Compact', 'D - Mid', 'SUV', 'Sport'],
          'x-grid': { columns: 6 },
          default: 'c',
        },
        doors: {
          title: 'Doors',
          type: 'integer',
          minimum: 2,
          maximum: 6,
          'x-format': 'range',
          'x-grid': { columns: 6 },
          default: 4,
        },
        condition: {
          title: 'Condition',
          type: 'string',
          enum: ['new', 'used', 'damaged'],
          'x-enumTitles': ['New', 'Used', 'Damaged'],
          'x-format': 'radios',
          'x-grid': { columns: 6 },
          default: 'used',
        },
        exteriorColor: {
          title: 'Exterior Color',
          type: 'string',
          'x-format': 'color',
          'x-grid': { columns: 6 },
          default: '#1f6feb',
        },
        certified: {
          title: 'Certified Pre-Owned',
          type: 'boolean',
          description: 'Passed the manufacturer certification',
          'x-grid': { columns: 6 },
          default: false,
        },
        notes: {
          title: 'Notes',
          type: 'string',
          'x-format': 'textarea',
          'x-grid': { columns: 12 },
          default: '',
        },
      },
    },
    engine: {
      title: 'Engine',
      type: 'object',
      'x-format': 'grid',
      properties: {
        fuel: {
          title: 'Fuel',
          type: 'string',
          enum: ['petrol', 'diesel', 'hybrid', 'electric'],
          'x-enumTitles': ['Petrol', 'Diesel', 'Hybrid', 'Electric'],
          'x-format': 'radios-inline',
          'x-grid': { columns: 12 },
          default: 'petrol',
        },
        horsepower: {
          title: 'Horsepower',
          type: 'integer',
          minimum: 0,
          maximum: 2000,
          'x-grid': { columns: 6 },
          'x-messages': { maximum: 'Even hypercars stay under 2000 hp.' },
          default: 150,
        },
        torque: {
          title: 'Torque (Nm)',
          type: 'integer',
          minimum: 0,
          'x-grid': { columns: 6 },
          default: 200,
        },
      },
    },
    features: {
      title: 'Features',
      type: 'object',
      properties: {
        comfort: {
          title: 'Comfort',
          type: 'array',
          uniqueItems: true,
          'x-format': 'checkboxes-inline',
          items: { type: 'string', enum: ['ac', 'heated-seats', 'sunroof', 'leather'] },
          'x-enumTitles': ['A/C', 'Heated Seats', 'Sunroof', 'Leather'],
          default: ['ac'],
        },
        safety: {
          title: 'Safety',
          type: 'array',
          uniqueItems: true,
          items: { type: 'string', enum: ['abs', 'airbags', 'lane-assist', 'blind-spot'] },
          'x-enumTitles': ['ABS', 'Airbags', 'Lane Assist', 'Blind Spot'],
          'x-messages': { uniqueItems: 'Each safety feature can only be listed once.' },
          default: ['abs', 'airbags'],
        },
      },
    },
    serviceHistory: {
      title: 'Service History',
      type: 'array',
      'x-format': 'table-object',
      'x-sortable': true,
      default: [],
      items: {
        type: 'object',
        title: 'Service Entry',
        properties: {
          date: { title: 'Date', type: 'string', default: '' },
          mileage: { title: 'Mileage (km)', type: 'integer', minimum: 0, default: 0 },
          service: {
            title: 'Service',
            type: 'string',
            enum: ['oil', 'brakes', 'tires', 'general'],
            'x-enumTitles': ['Oil', 'Brakes', 'Tires', 'General'],
            default: 'general',
          },
          done: { title: 'Done', type: 'boolean', 'x-format': 'checkbox', default: false },
        },
      },
    },
    owners: {
      title: 'Owners',
      type: 'array',
      'x-format': 'nav-horizontal',
      'x-titleTemplate': '{{ i1 }}) {{ value.name }}',
      default: [],
      items: {
        type: 'object',
        title: 'Owner',
        'x-format': 'grid',
        properties: {
          name: { title: 'Name', type: 'string', 'x-grid': { columns: 6 }, default: 'New Owner' },
          years: { title: 'Years Owned', type: 'integer', minimum: 0, 'x-grid': { columns: 6 }, default: 1 },
          seller: {
            title: 'Seller Type',
            type: 'object',
            'x-grid': { columns: 12 },
            'x-discriminator': 'kind',
            oneOf: [
              {
                title: 'Dealer',
                'x-switcherTitle': 'Dealer',
                type: 'object',
                required: ['kind'],
                properties: {
                  kind: { type: 'string', const: 'dealer', default: 'dealer', readOnly: true, 'x-enforceConst': true },
                  dealership: { title: 'Dealership', type: 'string', default: 'AutoHouse' },
                },
              },
              {
                title: 'Private',
                'x-switcherTitle': 'Private',
                type: 'object',
                required: ['kind'],
                properties: {
                  kind: { type: 'string', const: 'private', default: 'private', readOnly: true, 'x-enforceConst': true },
                  city: { title: 'City', type: 'string', default: 'Berlin' },
                },
              },
            ],
            default: { kind: 'dealer', dealership: 'AutoHouse' },
          },
        },
      },
    },
  },
};

export default carSpecificationsSchema;
